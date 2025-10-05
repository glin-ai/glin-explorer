//! Database layer for glinscan
//!
//! Provides database models, migrations, and connection utilities.

pub mod models;

pub use models::*;
pub use sqlx::{self, PgPool, Postgres};

use anyhow::Result;

/// Run database migrations
pub async fn run_migrations(pool: &PgPool) -> Result<()> {
    sqlx::migrate!("./migrations")
        .run(pool)
        .await
        .map_err(|e| anyhow::anyhow!("Migration failed: {}", e))?;

    Ok(())
}

/// Create database connection pool
pub async fn create_pool(database_url: &str) -> Result<PgPool> {
    let pool = PgPool::connect(database_url)
        .await
        .map_err(|e| anyhow::anyhow!("Failed to connect to database: {}", e))?;

    Ok(pool)
}
