//! GLIN Network Blockchain Indexer
//!
//! Subscribes to blocks and indexes all blockchain data into PostgreSQL.

use anyhow::Result;
use futures::StreamExt;
use glin_client::create_client;
use glin_indexer::{BlockStream, EventDecoder, ExtrinsicParser};
use glinscan_db::{create_pool, run_migrations};
use sqlx::PgPool;
use tracing::{error, info};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load environment variables
    dotenvy::dotenv().ok();

    let rpc_url = std::env::var("RPC_URL").expect("RPC_URL must be set");
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    info!("Starting GLIN Network Indexer");
    info!("RPC: {}", rpc_url);

    // Connect to database
    info!("Connecting to database...");
    let db = create_pool(&database_url).await?;

    // Run migrations
    info!("Running database migrations...");
    run_migrations(&db).await?;

    // Connect to blockchain
    info!("Connecting to GLIN Network...");
    let client = create_client(&rpc_url).await?;
    info!("✓ Connected to blockchain");

    // Create utilities
    let decoder = EventDecoder::new(&client)?;
    let parser = ExtrinsicParser::new();

    // Subscribe to finalized blocks
    info!("Subscribing to finalized blocks...");
    let mut stream = BlockStream::subscribe_finalized(&client).await?;

    info!("🚀 Indexer running - listening for blocks...\n");

    // Index blocks
    while let Some(block_result) = stream.next().await {
        match block_result {
            Ok(block) => {
                let block_number = block.number();

                if let Err(e) = index_block(&db, &block, &decoder, &parser).await {
                    error!("Error indexing block #{}: {}", block_number, e);
                } else {
                    info!("✓ Indexed block #{}", block_number);
                }
            }
            Err(e) => {
                error!("Error receiving block: {}", e);
            }
        }
    }

    Ok(())
}

async fn index_block(
    db: &PgPool,
    block: &subxt::blocks::Block<subxt::PolkadotConfig, glin_client::GlinClient>,
    decoder: &EventDecoder,
    parser: &ExtrinsicParser,
) -> Result<()> {
    let block_number = block.number() as i64;
    let block_hash = format!("0x{}", hex::encode(block.hash()));
    let parent_hash = format!("0x{}", hex::encode(block.header().parent_hash));

    // Get timestamp from block (simplified - real implementation would extract from extrinsics)
    let timestamp = chrono::Utc::now();

    // Get extrinsics and events
    let extrinsics = block.extrinsics().await?;
    let events = block.events().await?;

    let extrinsics_count = extrinsics.len() as i32;
    let events_count = events.iter().count() as i32;

    // Insert block
    sqlx::query!(
        r#"
        INSERT INTO blocks (number, hash, parent_hash, timestamp, extrinsics_count, events_count)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (number) DO NOTHING
        "#,
        block_number,
        block_hash,
        parent_hash,
        timestamp,
        extrinsics_count,
        events_count
    )
    .execute(db)
    .await?;

    // Index extrinsics
    for ext in extrinsics.iter() {
        let info = parser.parse(&ext, block_number as u64)?;

        let extrinsic_id = sqlx::query_scalar!(
            r#"
            INSERT INTO extrinsics (block_number, index, hash, signer, pallet, call, args, success)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (block_number, index) DO NOTHING
            RETURNING id
            "#,
            block_number,
            info.index as i32,
            info.hash,
            info.signer,
            info.pallet,
            info.call,
            info.args,
            info.success
        )
        .fetch_optional(db)
        .await?;

        // Track contract deployments
        if info.pallet == "Contracts" && info.call == "instantiate" {
            // Extract contract address from events (simplified)
            // Real implementation would parse from Instantiated event
        }
    }

    // Index events
    for (idx, event) in events.iter().enumerate() {
        let event = event?;
        let mut decoded = decoder.decode(&event)?;
        decoded.block_number = block_number as u64;
        decoded.event_index = idx as u32;

        sqlx::query!(
            r#"
            INSERT INTO events (block_number, index, pallet, method, data)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (block_number, index) DO NOTHING
            "#,
            block_number,
            idx as i32,
            decoded.pallet,
            decoded.method,
            decoded.data
        )
        .execute(db)
        .await?;
    }

    Ok(())
}
