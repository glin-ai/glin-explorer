# GLIN Explorer

Production-grade blockchain explorer and indexer for GLIN Network. Built with **Next.js** (frontend) and **Rust + Axum** (backend), following the Ethereum architecture pattern (like Etherscan/Blockscout).

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Rust](https://img.shields.io/badge/Rust-1.75%2B-orange)](https://www.rust-lang.org/)

## 🏗️ Architecture

This is a **monorepo** containing both frontend and backend:

```
glin-explorer/
├── frontend/          # Next.js explorer UI
├── backend/           # Rust workspace (indexer, API, verifier)
└── docker-compose.yml # Run all services
```

### Backend Services (Rust)

Following the **Ethereum pattern** (Etherscan uses web3.js, we use glin-sdk-rust):

1. **Indexer** - Real-time blockchain indexing using `glin-indexer` SDK
2. **API** - REST API with Axum reading from PostgreSQL
3. **Verifier** - Contract source code verification using `glin-contracts` SDK
4. **DB** - Shared database layer (models, migrations)

### Frontend (Next.js)

- Blockchain explorer UI
- Direct RPC queries (via Polkadot.js)
- Enhanced data from backend API

## 🚀 Quick Start

### Using Docker Compose (Backend Only)

```bash
# Copy environment file and configure
cp .env.example .env
# Edit .env with your settings (RPC_URL, passwords, etc.)

# Start backend services (postgres, redis, indexer, api, verifier)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Backend services will be available at:
- API: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

Then run the frontend separately:

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:3000

### Manual Setup

#### Prerequisites

Install required tools:

```bash
# Install sqlx-cli for database migrations
cargo install sqlx-cli --no-default-features --features postgres

# Ensure PostgreSQL and Redis are running
# On Ubuntu/Debian:
sudo apt install postgresql postgresql-contrib redis-server
sudo systemctl start postgresql redis-server

# On macOS (with Homebrew):
brew install postgresql redis
brew services start postgresql redis
```

#### Backend

```bash
cd backend

# Copy environment
cp .env.example .env
# Edit .env with your settings

# Run database migrations
cargo sqlx migrate run

# Run services (in separate terminals)
cargo run --bin indexer    # Start indexer
cargo run --bin api        # Start API server
cargo run --bin verifier   # Start verifier
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment
cp .env.example .env.local
# Edit .env.local

# Run development server
npm run dev
```

## 📦 Backend Architecture

### Services

```
backend/
├── Cargo.toml              # Workspace root
├── crates/
│   ├── db/                 # Database layer
│   │   ├── migrations/     # SQL migrations
│   │   └── src/
│   │       ├── models.rs   # sqlx models
│   │       └── lib.rs
│   │
│   ├── indexer/            # Block indexer (binary)
│   │   └── src/main.rs     # Uses BlockStream, EventDecoder
│   │
│   ├── api/                # REST API (binary)
│   │   └── src/main.rs     # Axum server
│   │
│   └── verifier/           # Contract verifier (binary)
│       └── src/main.rs     # Uses ContractVerifier SDK
```

### SDK Integration

Uses [glin-sdk-rust](https://github.com/glin-ai/glin-sdk-rust) v0.2.0:

```rust
// Indexer uses SDK utilities
use glin_indexer::{BlockStream, EventDecoder, ExtrinsicParser};
use glin_client::create_client;

let client = create_client("wss://testnet.glin.ai").await?;
let decoder = EventDecoder::new(&client)?;
let parser = ExtrinsicParser::new();

let mut stream = BlockStream::subscribe_finalized(&client).await?;

while let Some(block) = stream.next().await {
    // Index to PostgreSQL...
}
```

### Database Schema

**PostgreSQL tables:**
- `blocks` - Indexed blocks
- `extrinsics` - Transactions
- `events` - Blockchain events
- `contracts` - Deployed contracts
- `contract_verifications` - Verification requests
- `accounts` - Cached account balances

**Migrations:** `backend/crates/db/migrations/`

### API Endpoints

```
GET /api/health
GET /api/blocks/latest
GET /api/blocks/:number
GET /api/extrinsics/:hash
GET /api/accounts/:address
GET /api/accounts/:address/extrinsics
GET /api/contracts/:address
```

## 🎨 Frontend Features

### Core Explorer
- 🔍 Global search (blocks, transactions, accounts)
- 📦 Block explorer with extrinsics and events
- 💳 Transaction details with event decoding
- 👤 Account explorer with balance and history
- ⚡ Real-time updates via WebSocket

### Custom Pallets
- 📋 **Tasks** - TaskRegistry pallet integration
- 🖥️ **Providers** - ProviderStaking pallet
- 🏆 **Leaderboard** - TestnetPoints tracking
- 💰 **Rewards** - RewardDistribution pallet

## 🔧 Development

### Backend

```bash
cd backend

# Run tests
cargo test

# Run specific service
cargo run --bin indexer
cargo run --bin api
cargo run --bin verifier

# Check code
cargo clippy
cargo fmt
```

### Frontend

```bash
cd frontend

# Development
npm run dev

# Build
npm run build
npm start

# Lint
npm run lint
```

## 🐳 Docker

### Build Images

```bash
# Backend
docker build -t glinscan-backend ./backend

# Frontend
docker build -t glinscan-frontend ./frontend
```

### Production Deployment

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📊 Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgres://glin:password@localhost:5432/glinscan
REDIS_URL=redis://localhost:6379
RPC_URL=wss://testnet.glin.ai
API_HOST=0.0.0.0
API_PORT=3001
RUST_LOG=info,glinscan=debug
VERIFIER_WORKSPACE=/tmp/glin-verifier
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_RPC_ENDPOINT=wss://testnet.glin.ai
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CHAIN_NAME=GLIN Testnet
NEXT_PUBLIC_TOKEN_SYMBOL=tGLIN
NEXT_PUBLIC_TOKEN_DECIMALS=18
```

## 🚢 Deployment

### Backend (Railway)

Deploy 3 services:
1. Indexer service
2. API service
3. Verifier service

Plus PostgreSQL and Redis add-ons.

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

Or connect GitHub repo to Vercel dashboard.

## 📚 Related Projects

- **[glin-sdk-rust](https://github.com/glin-ai/glin-sdk-rust)** - Rust SDK (utilities library)
- **[glin-chain](https://github.com/glin-ai/glin-chain)** - Substrate blockchain
- **[glin-forge](https://github.com/glin-ai/glin-forge)** - Smart contract CLI

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md).

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

Apache 2.0 - see [LICENSE](LICENSE) for details.

## 🔗 Links

- 🌐 Website: [glin.ai](https://glin.ai)
- 📖 Docs: [docs.glin.ai](https://docs.glin.ai)
- 💬 Discord: [discord.gg/glin-ai](https://discord.gg/glin-ai)
- 🐦 Twitter: [@glin_ai](https://twitter.com/glin_ai)
