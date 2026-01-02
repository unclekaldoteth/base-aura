# Base Aura

A dynamic NFT application built on Base that tracks transaction history and assigns unique "Aura" tiers based on on-chain activity.

Base Aura allows users to scan any Base address, discover their transaction-based aura tier, and mint dynamic ERC-721 NFTs. NFTs can be upgraded as users increase their on-chain activity.

---

## Key Features

### For Users
- Scan any Base address to discover its aura
- Mint unique NFTs representing on-chain identity
- Upgrade NFTs as transaction count increases
- One NFT per target address (prevents duplicates)

### For Developers
- ERC-721 with on-chain metadata
- Dynamic image URIs via Supabase
- Aura update functionality

---

## Architecture Overview

### Smart Contract (Solidity)
- **BaseAuraV2** - ERC-721 with target address tracking and aura upgrades

```
base-aura/
├── contracts/
│   ├── BaseAura.sol          # V1 contract
│   └── BaseAuraV2.sol        # V2 with target address tracking
├── src/
│   ├── App.jsx               # React application
│   ├── main.jsx              # Entry point with wagmi/RainbowKit
│   └── index.css             # Styling
├── api/
│   └── txcount.js            # Vercel serverless for Basescan API
├── scripts/
│   └── deploy.cjs            # Hardhat deployment script
└── public/                   # NFT images
```

---

## Aura Tiers

| Tier | Transactions | Description |
|------|--------------|-------------|
| Fire Whale | 500+ | DeFi Power User |
| Wave Rider | 100-499 | Active Explorer |
| Tide Watcher | 10-99 | Getting Started |
| Rock Holder | 1-9 | Diamond Hands HODLer |

---

## Testnet Deployment

### Smart Contract on Base Sepolia

**Contract Address:** `0xF105DAeF021Ce4613e0A4599D001a6767A4018DF`

| Contract | Description |
|----------|-------------|
| BaseAuraV2 | Dynamic ERC-721 with aura upgrades |

### Deployment Details
- **Network:** Base Sepolia Testnet
- **Chain ID:** 84532
- **Solidity Version:** 0.8.20
- **Dependencies:** OpenZeppelin Contracts 5.x

### Explorer Link
https://sepolia.basescan.org/address/0xF105DAeF021Ce4613e0A4599D001a6767A4018DF

---

## Smart Contract Functions

### BaseAuraV2

| Function | Description |
|----------|-------------|
| `mint(address targetAddress, string auraType)` | Mint NFT for a target address |
| `updateAura(uint256 tokenId, string newAura)` | Upgrade NFT to new aura tier |
| `hasMinted(address targetAddress)` | Check if address has NFT |
| `getTokenByTargetAddress(address)` | Get token ID for an address |
| `getAura(uint256 tokenId)` | Get current aura type |

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/unclekaldoteth/base-aura.git
cd base-aura
npm install
```

### Development

```bash
npm run dev
```

### Contract Deployment

```bash
# Compile
npm run compile

# Deploy to Base Sepolia
npm run deploy
```

---

## Environment Variables

Create a `.env` file based on `.env.example`:

```
BASESCAN_API_KEY=           # Basescan API key
VITE_WALLETCONNECT_PROJECT_ID=  # WalletConnect project ID
PRIVATE_KEY=                # Wallet private key (use Hardhat vars for security)
```

For secure private key storage:
```bash
npx hardhat vars set PRIVATE_KEY
```

---

## Tech Stack

### Frontend
- React 18
- Vite
- wagmi + viem
- RainbowKit

### Smart Contract
- Solidity 0.8.20
- OpenZeppelin Contracts
- Hardhat

### Infrastructure
- Vercel (hosting + serverless)
- Supabase (image storage)
- Basescan API (transaction data)

---

## License

MIT

---

## Acknowledgments

- Base for the L2 infrastructure
- OpenZeppelin for secure contract patterns
- RainbowKit for wallet integration
- Inspired by Bitcoin Aura
