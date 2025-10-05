//! GLIN Network Contract Verifier
//!
//! Polls for pending contract verifications and verifies source code.

use anyhow::Result;
use glin_contracts::{ContractVerifier, VerificationResult};
use glinscan_db::{create_pool, ContractVerification, PgPool};
use std::time::Duration;
use tracing::{error, info};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load environment
    dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let workspace = std::env::var("VERIFIER_WORKSPACE")
        .unwrap_or_else(|_| "/tmp/glin-verifier".to_string());

    info!("Starting GLIN Contract Verifier");
    info!("Workspace: {}", workspace);

    // Connect to database
    let db = create_pool(&database_url).await?;

    // Create verifier
    let verifier = ContractVerifier::new(&workspace)?;

    info!("🚀 Verifier running - polling for pending verifications...\n");

    // Poll for pending verifications
    loop {
        if let Err(e) = process_pending_verifications(&db, &verifier).await {
            error!("Error processing verifications: {}", e);
        }

        tokio::time::sleep(Duration::from_secs(5)).await;
    }
}

async fn process_pending_verifications(
    db: &PgPool,
    verifier: &ContractVerifier,
) -> Result<()> {
    // Get pending verifications
    let pending = sqlx::query_as!(
        ContractVerification,
        r#"
        SELECT * FROM contract_verifications
        WHERE status = 'pending'
        ORDER BY created_at
        LIMIT 10
        "#
    )
    .fetch_all(db)
    .await?;

    for verification in pending {
        info!("Processing verification #{}", verification.id);

        // Update status to building
        sqlx::query!(
            "UPDATE contract_verifications SET status = 'building' WHERE id = $1",
            verification.id
        )
        .execute(db)
        .await?;

        // Extract source files (from JSONB)
        let source_files: Vec<SourceFile> = serde_json::from_value(verification.source_files)?;

        // Find main source file (lib.rs or main.rs)
        let main_source = source_files
            .iter()
            .find(|f| f.path == "lib.rs" || f.path == "src/lib.rs")
            .map(|f| f.content.as_str())
            .unwrap_or("");

        // Find Cargo.toml
        let cargo_toml = source_files
            .iter()
            .find(|f| f.path == "Cargo.toml")
            .map(|f| f.content.as_str())
            .unwrap_or("");

        // Parse deployed code hash
        let deployed_hash = hex::decode(verification.wasm_hash.trim_start_matches("0x"))?;
        let deployed_hash: [u8; 32] = deployed_hash
            .try_into()
            .map_err(|_| anyhow::anyhow!("Invalid hash length"))?;

        // Verify
        match verifier.verify(main_source, cargo_toml, &deployed_hash).await {
            Ok(VerificationResult::Verified { code_hash, metadata }) => {
                info!("✓ Verification #{} succeeded", verification.id);

                // Update verification status
                sqlx::query!(
                    r#"
                    UPDATE contract_verifications
                    SET status = 'success', verified_at = NOW()
                    WHERE id = $1
                    "#,
                    verification.id
                )
                .execute(db)
                .await?;

                // Mark contract as verified
                sqlx::query!(
                    "UPDATE contracts SET verified = true WHERE address = $1",
                    verification.contract_address
                )
                .execute(db)
                .await?;
            }
            Ok(VerificationResult::HashMismatch { expected, actual }) => {
                error!(
                    "✗ Verification #{} failed: hash mismatch ({} != {})",
                    verification.id, expected, actual
                );

                sqlx::query!(
                    r#"
                    UPDATE contract_verifications
                    SET status = 'failed', error_message = $1
                    WHERE id = $2
                    "#,
                    format!("Hash mismatch: expected {}, got {}", expected, actual),
                    verification.id
                )
                .execute(db)
                .await?;
            }
            Ok(VerificationResult::CompilationFailed(err)) => {
                error!("✗ Verification #{} compilation failed: {}", verification.id, err);

                sqlx::query!(
                    r#"
                    UPDATE contract_verifications
                    SET status = 'failed', error_message = $1
                    WHERE id = $2
                    "#,
                    format!("Compilation failed: {}", err),
                    verification.id
                )
                .execute(db)
                .await?;
            }
            Err(e) => {
                error!("✗ Verification #{} error: {}", verification.id, e);

                sqlx::query!(
                    r#"
                    UPDATE contract_verifications
                    SET status = 'failed', error_message = $1
                    WHERE id = $2
                    "#,
                    e.to_string(),
                    verification.id
                )
                .execute(db)
                .await?;
            }
        }
    }

    Ok(())
}

#[derive(serde::Deserialize)]
struct SourceFile {
    path: String,
    content: String,
}
