# Build stage
FROM rustlang/rust:nightly as builder

WORKDIR /app

# Copy SDK first (from parent context)
COPY glin-sdk-rust/ /glin-sdk-rust/

# Copy backend manifests
COPY glin-explorer/backend/Cargo.toml Cargo.toml
COPY glin-explorer/backend/crates/ crates/
COPY glin-explorer/backend/.sqlx/ .sqlx/

# Build dependencies separately for caching (offline mode)
ENV SQLX_OFFLINE=true
RUN cargo build --release

# Runtime stage
FROM ubuntu:24.04

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binaries from builder
COPY --from=builder /app/target/release/indexer /usr/local/bin/indexer
COPY --from=builder /app/target/release/api /usr/local/bin/api
COPY --from=builder /app/target/release/verifier /usr/local/bin/verifier

# Copy migrations
COPY glin-explorer/backend/crates/db/migrations /app/migrations

# Default command (override in docker-compose)
CMD ["api"]
