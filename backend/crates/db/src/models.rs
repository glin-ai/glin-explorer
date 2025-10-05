//! Database models

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Block {
    pub number: i64,
    pub hash: String,
    pub parent_hash: String,
    pub timestamp: DateTime<Utc>,
    pub extrinsics_count: i32,
    pub events_count: i32,
    pub finalized: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Extrinsic {
    pub id: i64,
    pub block_number: i64,
    pub index: i32,
    pub hash: String,
    pub signer: Option<String>,
    pub pallet: String,
    pub call: String,
    pub args: serde_json::Value,
    pub success: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Event {
    pub id: i64,
    pub block_number: i64,
    pub extrinsic_id: Option<i64>,
    pub index: i32,
    pub pallet: String,
    pub method: String,
    pub data: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Contract {
    pub address: String,
    pub code_hash: String,
    pub deployer: String,
    pub deploy_block: Option<i64>,
    pub deploy_tx_hash: Option<String>,
    pub verified: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ContractVerification {
    pub id: i32,
    pub contract_address: String,
    pub wasm_hash: String,
    pub metadata: serde_json::Value,
    pub source_files: serde_json::Value,
    pub compiler_version: Option<String>,
    pub status: String,
    pub error_message: Option<String>,
    pub verified_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Account {
    pub address: String,
    pub balance: String, // Stored as string to avoid BigDecimal serde issues
    pub nonce: i64,
    pub last_updated_block: Option<i64>,
    pub last_updated_at: DateTime<Utc>,
}
