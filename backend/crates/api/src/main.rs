//! GLIN Network Explorer API
//!
//! REST API for querying indexed blockchain data.

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use glinscan_db::{create_pool, Block, Contract, Extrinsic, PgPool};
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};
use tracing::{info, warn};

#[derive(Clone)]
struct AppState {
    db: PgPool,
}

#[derive(Deserialize)]
struct PaginationParams {
    #[serde(default = "default_page")]
    page: i64,
    #[serde(default = "default_limit")]
    limit: i64,
}

fn default_page() -> i64 {
    1
}

fn default_limit() -> i64 {
    20
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load environment
    dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let api_host = std::env::var("API_HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let api_port = std::env::var("API_PORT").unwrap_or_else(|_| "3001".to_string());

    info!("Starting GLIN Explorer API");

    // Connect to database
    let db = create_pool(&database_url).await?;

    let state = AppState { db };

    // CORS layer
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        .route("/api/health", get(health_check))
        .route("/api/blocks/latest", get(get_latest_blocks))
        .route("/api/blocks/:number", get(get_block))
        .route("/api/extrinsics/:hash", get(get_extrinsic))
        .route("/api/accounts/:address", get(get_account))
        .route("/api/accounts/:address/extrinsics", get(get_account_extrinsics))
        .route("/api/contracts/:address", get(get_contract))
        .layer(cors)
        .with_state(state);

    let addr = format!("{}:{}", api_host, api_port);
    info!("🚀 API server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> &'static str {
    "OK"
}

async fn get_latest_blocks(
    Query(params): Query<PaginationParams>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Block>>, StatusCode> {
    let offset = (params.page - 1) * params.limit;

    let blocks = sqlx::query_as!(
        Block,
        r#"
        SELECT * FROM blocks
        ORDER BY number DESC
        LIMIT $1 OFFSET $2
        "#,
        params.limit,
        offset
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        warn!("Database error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(blocks))
}

async fn get_block(
    Path(number): Path<i64>,
    State(state): State<AppState>,
) -> Result<Json<BlockWithDetails>, StatusCode> {
    let block = sqlx::query_as!(
        Block,
        "SELECT * FROM blocks WHERE number = $1",
        number
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    let extrinsics = sqlx::query_as!(
        Extrinsic,
        "SELECT * FROM extrinsics WHERE block_number = $1 ORDER BY index",
        number
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(BlockWithDetails { block, extrinsics }))
}

async fn get_extrinsic(
    Path(hash): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Extrinsic>, StatusCode> {
    let extrinsic = sqlx::query_as!(
        Extrinsic,
        "SELECT * FROM extrinsics WHERE hash = $1",
        hash
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(extrinsic))
}

async fn get_account(
    Path(address): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<AccountInfo>, StatusCode> {
    let account = sqlx::query!(
        "SELECT balance, nonce FROM accounts WHERE address = $1",
        address
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let extrinsics_count = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM extrinsics WHERE signer = $1",
        address
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .unwrap_or(0);

    Ok(Json(AccountInfo {
        address,
        balance: account.as_ref().map(|a| a.balance.clone()),
        nonce: account.as_ref().map(|a| a.nonce),
        extrinsics_count,
    }))
}

async fn get_account_extrinsics(
    Path(address): Path<String>,
    Query(params): Query<PaginationParams>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Extrinsic>>, StatusCode> {
    let offset = (params.page - 1) * params.limit;

    let extrinsics = sqlx::query_as!(
        Extrinsic,
        r#"
        SELECT * FROM extrinsics
        WHERE signer = $1
        ORDER BY block_number DESC, index DESC
        LIMIT $2 OFFSET $3
        "#,
        address,
        params.limit,
        offset
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(extrinsics))
}

async fn get_contract(
    Path(address): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Contract>, StatusCode> {
    let contract = sqlx::query_as!(
        Contract,
        "SELECT * FROM contracts WHERE address = $1",
        address
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(contract))
}

#[derive(Serialize)]
struct BlockWithDetails {
    #[serde(flatten)]
    block: Block,
    extrinsics: Vec<Extrinsic>,
}

#[derive(Serialize)]
struct AccountInfo {
    address: String,
    balance: Option<String>,
    nonce: Option<i64>,
    extrinsics_count: i64,
}
