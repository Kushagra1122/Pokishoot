# PokeWars

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

**A real-time multiplayer battle arena game built on the Moonbeam blockchain**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**PokeWars** is a Web3 gaming platform that combines real-time multiplayer battles with true digital asset ownership. Players battle with Pokemon NFTs in fast-paced shooting matches, stake tokens for winner-takes-all competitions, and trade assets across the Polkadot ecosystem via XCM cross-chain messaging.

### Key Highlights

- 🎮 **Real-time multiplayer battles** using Phaser.js game engine
- 🪙 **ERC-721 NFTs** on Moonbeam Network with true ownership
- 💰 **Smart contract escrow** for staking and automatic payouts
- 🏆 **ELO ranking system** with competitive tiers
- 🌉 **Cross-chain interoperability** via XCM (Polkadot ecosystem)
- 🗳️ **DAO governance** for community-driven decisions
- 🏪 **On-chain marketplace** for NFT trading
- 📊 **On-chain leaderboards** for verifiable rankings

## ✨ Features

### Core Gameplay
- **Real-time Multiplayer Battles**: Fast-paced shooting combat with multiple players
- **Multiple Maps**: Desert, Forest, Snow, and Volcano arenas
- **Character Selection**: 6 unique Pokemon (Charizard, Blastoise, Venusaur, Gengar, Alakazam, Snorlax)
- **Live Combat**: Real-time shooting, movement, and damage calculation
- **ELO Ranking System**: Track skill level with ratings, tiers, and ranks (Bronze → Master)

### Blockchain Integration
- **ERC-721 NFTs**: Pokemon stored as non-fungible tokens on Moonbeam
- **Match Escrow**: Smart contract-based staking and automatic winner payouts
- **Web3 Wallet Integration**: MetaMask (EVM) and Polkadot.js (Substrate) support
- **Level System**: Upgrade Pokemon levels (1-100) with stat multipliers
- **IPFS Storage**: Decentralized NFT metadata storage
- **Wallet Authentication**: Sign-In With Ethereum (SIWE) for Web3-native auth
- **On-Chain Marketplace**: Fully decentralized NFT trading
- **On-Chain Leaderboard**: Immutable, verifiable player rankings
- **DAO Governance**: Community-driven decision making with governance token
- **Data Export**: User data portability and ownership

### Cross-Chain Features
- **XCM Integration**: Transfer NFTs and aggregate data across Polkadot parachains
- **Multi-Chain Marketplace**: View and purchase NFTs from listings across multiple chains
- **Aggregated Leaderboards**: Unified rankings combining stats from all chains
- **Supported Chains**: Moonbase Alpha, Moonbeam, Astar, Asset Hub

### Social Features
- **Lobby System**: Create or join battle lobbies with custom codes
- **Real-time Communication**: Socket.io-based multiplayer synchronization
- **Player Profiles**: Track stats, wins, losses, and experience
- **Marketplace**: Buy and sell Pokemon NFTs

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Phaser 3** - Game engine for real-time battles
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Socket.io Client** - Real-time communication
- **Ethers.js** - Blockchain interactions (EVM)
- **@polkadot/api** - Polkadot/Substrate interactions
- **React Router** - Navigation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - REST API server
- **Socket.io** - WebSocket server for real-time gameplay
- **MongoDB** - Database (with Mongoose ODM)
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Smart Contracts
- **Solidity** - Smart contract language
- **Hardhat** - Development environment
- **OpenZeppelin** - Security-focused contract libraries
- **Moonbeam Network** - EVM-compatible blockchain

## 📁 Project Structure

```
PokeWars/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Game/       # Game-related components
│   │   │   ├── Layout/     # Layout components
│   │   │   ├── UI/         # UI components
│   │   │   └── Waiting/    # Lobby waiting room
│   │   ├── context/        # React contexts (Auth, Web3)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── managers/       # Game managers (Input, Player, Shooting, etc.)
│   │   ├── pages/          # Route pages
│   │   ├── scenes/         # Phaser game scenes
│   │   └── services/       # Blockchain services
│   ├── public/             # Static assets (maps, characters)
│   └── package.json
│
├── server/                 # Node.js backend server
│   ├── controllers/        # Route controllers
│   ├── managers/           # Game logic managers
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── services/           # Business logic services
│   ├── scripts/            # Utility scripts
│   └── server.js           # Entry point
│
└── contracts/             # Smart contracts
    ├── contracts/          # Solidity contracts
    │   ├── PokemonNFT.sol  # ERC-721 NFT contract
    │   ├── MatchEscrow.sol # Staking escrow contract
    │   ├── Marketplace.sol # On-chain marketplace
    │   ├── Leaderboard.sol # On-chain leaderboard
    │   ├── GovernanceToken.sol # DAO governance token
    │   └── PokeWarsDAO.sol # DAO contract
    ├── scripts/            # Deployment scripts
    └── hardhat.config.js   # Hardhat configuration
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **MetaMask** browser extension (for Web3 features)
- **Polkadot.js** browser extension (optional, for Substrate wallet support)
- **Git** (if cloning the repository)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd PokeWars
```

2. **Install dependencies**
```bash
# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..

# Install contract dependencies
cd contracts && npm install && cd ..
```

3. **Set up MongoDB**

Start MongoDB (if running locally):
```bash
# On macOS (if installed via Homebrew)
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# Or run directly
mongod
```

MongoDB should be running on `mongodb://127.0.0.1:27017`

4. **Configure environment variables**

Create `.env` files in each directory:

**`client/.env`**
```env
VITE_API_URL=http://localhost:4000
VITE_NFT_CONTRACT_ADDRESS=your_nft_contract_address
VITE_MATCH_ESCROW_CONTRACT_ADDRESS=your_escrow_contract_address
VITE_RPC_URL=https://rpc.api.moonbase.moonbeam.network
```

**`server/.env`**
```env
# Server Configuration
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/pokewars

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_change_this

# API Base URL
API_BASE_URL=http://localhost:4000

# Blockchain Configuration
MOONBASE_RPC_URL=https://rpc.api.moonbase.moonbeam.network
PRIVATE_KEY=your_private_key_here

# Contract Addresses (set after deployment)
NFT_CONTRACT_ADDRESS=
MATCH_ESCROW_CONTRACT_ADDRESS=
MARKETPLACE_CONTRACT_ADDRESS=
LEADERBOARD_CONTRACT_ADDRESS=
GOVERNANCE_TOKEN_ADDRESS=
DAO_CONTRACT_ADDRESS=

# IPFS Configuration (optional - uses public gateway if not set)
IPFS_API_URL=https://ipfs.infura.io:5001/api/v0
IPFS_PROJECT_ID=your_project_id
IPFS_PROJECT_SECRET=your_project_secret
IPFS_GATEWAY=https://ipfs.io/ipfs/

# SIWE Configuration
DOMAIN=localhost:4000
ORIGIN=http://localhost:5173

# Cross-Chain Configuration (optional)
MOONBEAM_NFT_CONTRACT_ADDRESS=
MOONBEAM_MARKETPLACE_CONTRACT_ADDRESS=
MOONBEAM_LEADERBOARD_CONTRACT_ADDRESS=
```

**`contracts/.env`**
```env
PRIVATE_KEY=your_deployment_private_key
MOONBASE_RPC_URL=https://rpc.api.moonbase.moonbeam.network
NFT_CONTRACT_ADDRESS=  # Set after deployment
MATCH_ESCROW_CONTRACT_ADDRESS=  # Set after deployment
```

5. **Seed Database (Optional)**
```bash
cd server
node seed.js
```

This creates 6 base Pokemon (Charizard, Blastoise, Venusaur, Gengar, Alakazam, Snorlax).

6. **Deploy Smart Contracts (Optional - for full Web3 features)**
```bash
cd contracts

# Compile contracts
npm run compile

# Deploy to Moonbase Alpha (Testnet)
npm run deploy:moonbase

# Or deploy all contracts
npm run deploy:all
```

**Important:** After deployment, copy the contract addresses and update:
- `server/.env` - Add all contract addresses
- `client/.env` - Add NFT and MatchEscrow addresses

7. **Fix database indexes (if needed)**
```bash
cd server
npm run fix-indexes
```

## 🎯 Running the Application

### Development Mode

1. **Start the backend server**
```bash
cd server
npm run dev
```
Server runs on `http://localhost:4000`

2. **Start the frontend client** (in a new terminal)
```bash
cd client
npm run dev
```
Client runs on `http://localhost:5173` (or another port if 5173 is taken)

3. **Open your browser** and navigate to the client URL

### Production Build

1. **Build the client**
```bash
cd client
npm run build
```

2. **Start the server** (serves the built client)
```bash
cd server
npm start
```

## 🎮 Game Mechanics

### Pokemon Stats
Each Pokemon has base stats that scale with level:
- **Shoot Range**: Attack distance
- **Shoot Per Minute**: Attack speed
- **Hit Points**: Health points
- **Speed**: Movement speed

Stats increase by 1% per level (up to level 100).

### Battle System
- Players spawn in valid positions on the selected map
- Real-time shooting with damage calculation
- Last player standing wins
- Time limit with automatic winner selection
- ELO rating adjustments for rated matches

### Staking & Rewards
- Players can stake tokens before matches
- Winner takes the entire stake pool
- Automatic payout via MatchEscrow smart contract
- Points system for tracking player achievements

### Maps
- **Lobby**: Starting area
- **Desert**: Arid wasteland arena
- **Forest**: Dense woodland battlefield
- **Snow**: Icy tundra map
- **Volcano**: Lava-filled terrain

## 📡 API Documentation

### Authentication
- `POST /api/auth/signup` - Register new user (legacy)
- `POST /api/auth/login` - User login (legacy)
- `POST /api/auth/wallet/nonce` - Get nonce for wallet signing
- `POST /api/auth/wallet/login` - Wallet-based login (SIWE)
- `PUT /api/auth/wallet/set-name` - Set/update user name
- `GET /api/dashboard` - Protected dashboard route

### Pokemon
- `GET /api/pokemon` - Get all available Pokemon
- `GET /api/pokemon/:id` - Get specific Pokemon details
- `POST /api/pokemon/mint` - Mint new Pokemon NFT

### Lobby
- `POST /api/lobby/create` - Create new battle lobby
- `POST /api/lobby/join` - Join existing lobby
- `GET /api/lobby/:code` - Get lobby details

### Matches
- `GET /api/matches` - Get match history
- `GET /api/matches/:id` - Get specific match details
- `POST /api/matches/result` - Submit match result

### Cross-Chain
- `GET /api/crosschain/chains` - Get supported chains
- `GET /api/crosschain/nft/:tokenId` - Query NFT across chains
- `GET /api/crosschain/nfts/:address` - Get NFTs by owner across chains
- `GET /api/crosschain/marketplace/listings` - Get cross-chain listings
- `GET /api/crosschain/leaderboard` - Get cross-chain leaderboard
- `POST /api/crosschain/transfer/prepare` - Prepare XCM transfer

### Data Export
- `GET /api/data/export` - Export all user data (JSON)

## 🔌 Socket.io Events

### Client → Server
- `joinLobby` - Join a lobby
- `leaveLobby` - Leave current lobby
- `updateGameSettings` - Update lobby settings
- `startGame` - Start the game
- `playerStake` - Submit staking transaction
- `playerMove` - Update player position
- `playerShoot` - Player shooting action
- `playerHit` - Register hit on opponent

### Server → Client
- `lobbyData` - Lobby information
- `lobbyUpdate` - Lobby state update
- `stakeRequired` - Staking notification
- `stakingProgress` - Staking status update
- `gameStarting` - Game initialization
- `gameStarted` - Game state
- `playerUpdate` - Player state update
- `gameEnded` - Match completion
- `leaderboardUpdate` - Leaderboard data

## 🌉 Cross-Chain Features (XCM Integration)

PokeWars features full XCM (Cross-Consensus Message Format) integration:

- **Cross-Chain NFT Transfers**: Move Pokemon NFTs between Moonbeam and other parachains
- **Multi-Chain Marketplace**: View and purchase NFTs from listings across multiple chains
- **Aggregated Leaderboards**: Unified rankings combining stats from all chains
- **True Interoperability**: Leverage Polkadot's shared security and cross-chain messaging

### Supported Chains
- **Moonbase Alpha** (Testnet) - EVM-compatible
- **Moonbeam** (Mainnet) - EVM-compatible
- **Astar** - Substrate-based
- **Asset Hub** - Substrate-based

## 🔐 Web3 Authentication

PokeWars uses **Web3-native authentication** with wallet-based sign-in:

1. **User connects wallet** (MetaMask or Polkadot.js)
2. **Server generates a nonce** (random challenge)
3. **User signs a message** with their wallet
4. **Server verifies signature** and creates/logs in user
5. **User optionally sets a name** (or uses auto-generated one)

### Benefits
- ✅ **No passwords** - Users control their identity
- ✅ **True Web3** - Wallet is your identity
- ✅ **Secure** - Cryptographic signatures
- ✅ **Decentralized** - No centralized auth server

## 🌐 IPFS Integration

NFT metadata is stored on IPFS for decentralized storage:

### Setup IPFS (Optional)

1. **Sign up for Infura IPFS** (free tier available)
   - Go to [https://infura.io](https://infura.io)
   - Create an IPFS project
   - Get Project ID and Secret

2. **Add to `server/.env`**:
```env
IPFS_API_URL=https://ipfs.infura.io:5001/api/v0
IPFS_PROJECT_ID=your_project_id
IPFS_PROJECT_SECRET=your_project_secret
IPFS_GATEWAY=https://ipfs.io/ipfs/
```

**Note**: The app works fine without IPFS (uses server endpoints as fallback).

## 🧪 Testing

### Run Tests
```bash
# Run all tests
./test-all.sh

# Or run server tests
cd server
npm test
```

### Test Checklist
- ✅ Polkadot.js extension authentication
- ✅ MetaMask wallet authentication
- ✅ Cross-chain NFT queries
- ✅ Cross-chain marketplace listings
- ✅ Cross-chain leaderboard aggregation
- ✅ XCM transfer preparation

## 🔒 Security Features

- ✅ **Input Validation**: Comprehensive validation middleware
- ✅ **Security Headers**: X-Frame-Options, CSP, HSTS, etc.
- ✅ **Rate Limiting**: Protection against brute force attacks
- ✅ **Request Size Limits**: Prevents DoS attacks
- ✅ **Error Handling**: Centralized error handling with proper responses
- ✅ **SIWE Authentication**: Secure wallet-based authentication
- ✅ **Address Validation**: EIP-55 checksum format validation

## 📜 Scripts

### Server Scripts
```bash
npm run start          # Start production server
npm run dev            # Start development server with nodemon
npm run clear-db       # Clear database (use with caution)
npm run fix-indexes    # Fix MongoDB indexes
npm run test-nft       # Test NFT service
npm test               # Run test suite
```

### Client Scripts
```bash
npm run dev            # Start Vite dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

### Contract Scripts
```bash
npm run compile        # Compile Solidity contracts
npm run deploy:moonbase # Deploy to Moonbase testnet
npm run deploy:moonbeam # Deploy to Moonbeam mainnet
npm run deploy:all     # Deploy all contracts
```

## 🔧 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# If not running, start it
mongod
```

### Port Already in Use
```bash
# Change PORT in server/.env
PORT=4001

# Or kill the process using port 4000
# macOS/Linux:
lsof -ti:4000 | xargs kill
```

### Contract Deployment Issues
- Make sure you have testnet tokens (DEV tokens for Moonbase)
- Check your private key is correct in `contracts/.env`
- Verify RPC URL is accessible
- Get testnet tokens: [Moonbase Alpha Faucet](https://apps.moonbeam.network/moonbase-alpha/faucet/)

### IPFS Issues
- IPFS is optional - the app will fallback to server endpoints
- If you want IPFS, sign up for Infura IPFS or use a public gateway
- Check credentials are correct in `server/.env`

### Wallet Connection Issues
- Ensure MetaMask or Polkadot.js extension is installed
- Check browser console for errors
- Verify RPC endpoints are correct
- For Polkadot.js, ensure accounts are imported

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Phaser.js** - Game engine
- **OpenZeppelin** - Secure smart contract libraries
- **Moonbeam Network** - EVM-compatible blockchain
- **Polkadot** - Cross-chain infrastructure
- **Pokemon** - Original concept by Game Freak / Nintendo

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

<div align="center">

**Built with ❤️ for the Web3 gaming community**

</div>
