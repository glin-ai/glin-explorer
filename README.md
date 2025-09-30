# GLIN Explorer

Production-grade blockchain explorer for the GLIN network. Built with Next.js 15, Polkadot.js, and a hybrid architecture connecting to both the blockchain and backend APIs.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

## Features

### Core Blockchain Explorer
- 🔍 **Global Search** - Search by block number, hash, address, or task ID
- 📦 **Block Explorer** - View block details, extrinsics, and events
- 💳 **Transaction Details** - Full transaction information with event decoding
- 👤 **Account Explorer** - Balance, nonce, provider status, and testnet points
- ⚡ **Real-time Updates** - WebSocket subscriptions for new blocks

### Custom Pallets Integration
- 📋 **Tasks Explorer** - Browse federated learning tasks from TaskRegistry pallet
- 🖥️ **Providers List** - View GPU providers from ProviderStaking pallet
- 🏆 **Points Leaderboard** - Testnet points from TestnetPoints pallet + backend
- 💰 **Reward Tracking** - RewardDistribution pallet integration

### Network Features
- 🔗 **Validators** - Active validator nodes and consensus info
- 📊 **Network Stats** - Real-time blockchain statistics
- 🎯 **Hybrid Data** - On-chain + off-chain enhanced data

## Architecture

### Hybrid Approach
The explorer uses a **hybrid architecture** combining:

1. **Direct RPC Queries** (via Polkadot.js API)
   - Blocks, transactions, extrinsics
   - Account balances and nonces
   - Custom pallet storage queries
   - Real-time subscriptions

2. **Backend API** (via glin-backend)
   - Cached leaderboard data
   - Enhanced task metadata
   - Faucet statistics
   - Provider GPU specifications

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Blockchain**: Polkadot.js API (@polkadot/api)
- **UI**: Tailwind CSS 4
- **State**: Zustand
- **Icons**: Lucide React
- **Charts**: Recharts (for future analytics)
- **Utils**: date-fns, clsx, tailwind-merge

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Access to GLIN RPC endpoint
- (Optional) Access to glin-backend API

### Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local
# Edit .env.local with your settings

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the explorer.

### Environment Variables

Create a `.env.local` file:

```env
# Blockchain RPC Endpoint (WebSocket)
NEXT_PUBLIC_RPC_ENDPOINT=wss://glin-rpc-production.up.railway.app

# Backend API URL
NEXT_PUBLIC_BACKEND_API=https://glin-backend-production.up.railway.app

# Explorer Configuration
NEXT_PUBLIC_EXPLORER_URL=http://localhost:3000
NEXT_PUBLIC_CHAIN_NAME=GLIN Incentivized Testnet
NEXT_PUBLIC_TOKEN_SYMBOL=tGLIN
NEXT_PUBLIC_TOKEN_DECIMALS=18
```

## Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── account/[address]/    # Account details
│   ├── block/[id]/           # Block details
│   ├── tx/[blockHash]/[index]/ # Transaction details
│   ├── blocks/               # Blocks listing
│   ├── validators/           # Validators page
│   ├── tasks/                # Tasks explorer
│   ├── providers/            # Providers list
│   ├── leaderboard/          # Points leaderboard
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home dashboard
│
├── components/
│   ├── layout/               # Header, footer, etc.
│   ├── search/               # Global search
│   ├── cards/                # Reusable card components
│   └── blocks/               # Block components
│
├── lib/
│   ├── api/                  # Backend API client
│   ├── substrate/            # Blockchain client
│   ├── utils.ts              # Utility functions
│   └── ...
│
└── store/
    └── explorer-store.ts     # Global state management
```

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Custom Pallets Integration

### TaskRegistry
```typescript
// Query specific task
const task = await substrateClient.getTask(taskId);

// Get all tasks
const tasks = await substrateClient.getAllTasks();
```

### ProviderStaking
```typescript
// Query provider stake
const provider = await substrateClient.getProviderStake(address);

// Get all providers
const providers = await substrateClient.getAllProviders();
```

### TestnetPoints
```typescript
// Query user points
const points = await substrateClient.getTestnetPoints(address);
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main

### Railway

```bash
railway init
railway env set NEXT_PUBLIC_RPC_ENDPOINT=wss://...
railway up
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Related Repositories

- [glin-chain](https://github.com/glin-ai/glin-chain) - GLIN Substrate blockchain
- [glin-wallet](https://github.com/glin-ai/glin-wallet) - Web3 wallet for GLIN tokens
- [glin-backend](https://github.com/glin-ai/glin-backend) - Backend API services (Private)

## Support

- 🌐 Website: [glin.ai](https://glin.ai)
- 📖 Documentation: [docs.glin.ai](https://docs.glin.ai)
- 💬 Discord: [discord.gg/glin-ai](https://discord.gg/glin-ai)
- 🐦 Twitter: [@glin_ai](https://twitter.com/glin_ai)

## License

Apache 2.0 - see [LICENSE](LICENSE) for details.