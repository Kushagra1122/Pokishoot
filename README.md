# PokeWars (PokeShoot)

A real-time multiplayer battle arena game built on the Moonbeam blockchain, where players battle with Pokemon NFTs in fast-paced shooting matches.

![PokeWars](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🎮 Overview

PokeWars is a Web3 gaming platform that combines:
- **Real-time multiplayer battles** using Phaser.js game engine
- **NFT-based Pokemon** as ERC-721 tokens on Moonbeam Network
- **Staking and rewards** through smart contract escrow system
- **ELO ranking system** for competitive matchmaking
- **Marketplace** for trading Pokemon NFTs

Players can collect, battle, and trade Pokemon NFTs while competing in live multiplayer arenas with real-time combat mechanics.

## ✨ Features

### Core Gameplay
- 🎯 **Real-time Multiplayer Battles**: Fast-paced shooting combat with multiple players
- 🗺️ **Multiple Maps**: Desert, Forest, Snow, and Volcano arenas
- 🎨 **Character Selection**: Choose from 6 unique Pokemon (Charizard, Blastoise, Venusaur, Gengar, Alakazam, Snorlax)
- ⚡ **Live Combat**: Real-time shooting, movement, and damage calculation
- 🏆 **ELO Ranking System**: Competitive matchmaking based on skill level

### Blockchain Integration
- 🪙 **ERC-721 NFTs**: Pokemon stored as non-fungible tokens on Moonbeam
- 💰 **Match Escrow**: Smart contract-based staking and automatic payouts
- 🔐 **Web3 Wallet Integration**: Connect with MetaMask or Polkadot wallets
- 📈 **Level System**: Upgrade Pokemon levels (1-100) with stat multipliers

### Social Features
- 👥 **Lobby System**: Create or join battle lobbies with custom codes
- 💬 **Real-time Communication**: Socket.io-based multiplayer synchronization
- 📊 **Player Profiles**: Track stats, wins, losses, and experience
- 🛒 **Marketplace**: Buy and sell Pokemon NFTs

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Phaser 3** - Game engine for real-time battles
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Socket.io Client** - Real-time communication
- **Ethers.js / Web3.js** - Blockchain interactions
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
    │   └── MatchEscrow.sol # Staking escrow contract
    ├── scripts/            # Deployment scripts
    └── hardhat.config.js   # Hardhat configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher) - running locally or connection string
- **MetaMask** or compatible Web3 wallet
- **Git**

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd PokeWars
```

2. **Install dependencies for all three parts**

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install

# Install contract dependencies
cd ../contracts
npm install
```

3. **Set up environment variables**

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
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/pokewars
JWT_SECRET=your_jwt_secret_key_here
NFT_CONTRACT_ADDRESS=your_nft_contract_address
MATCH_ESCROW_CONTRACT_ADDRESS=your_escrow_contract_address
MOONBASE_RPC_URL=https://rpc.api.moonbase.moonbeam.network
PRIVATE_KEY=your_server_private_key
```

**`contracts/.env`**
```env
PRIVATE_KEY=your_deployment_private_key
MOONBASE_RPC_URL=https://rpc.api.moonbase.moonbeam.network
NFT_CONTRACT_ADDRESS=  # Set after deployment
MATCH_ESCROW_CONTRACT_ADDRESS=  # Set after deployment
```

### Smart Contract Deployment

1. **Compile contracts**
```bash
cd contracts
npm run compile
```

2. **Deploy to Moonbase Alpha (Testnet)**
```bash
npm run deploy:moonbase
```

3. **Update environment variables** with the deployed contract addresses in:
   - `client/.env`
   - `server/.env`
   - `contracts/.env`

For more details, see [contracts/README.md](./contracts/README.md)

### Database Setup

1. **Start MongoDB** (if running locally)
```bash
mongod
```

2. **Seed initial Pokemon data** (optional)
```bash
cd server
node seed.js
```

3. **Fix database indexes** (if needed)
```bash
npm run fix-indexes
```

## 🎯 Running the Application

### Development Mode

1. **Start the backend server**
```bash
cd server
npm run dev
```
Server will run on `http://localhost:4000`

2. **Start the frontend client** (in a new terminal)
```bash
cd client
npm run dev
```
Client will run on `http://localhost:5173` (or another port if 5173 is taken)

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
- ELO rating adjustments based on match results

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

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
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

## 🔌 Socket.io Events

### Client → Server
- `joinLobby` - Join a lobby
- `leaveLobby` - Leave current lobby
- `playerMove` - Update player position
- `playerShoot` - Player shooting action
- `playerHit` - Register hit on opponent

### Server → Client
- `lobbyJoined` - Confirmation of lobby join
- `gameStarted` - Game initialization
- `playerUpdate` - Player state update
- `gameEnded` - Match completion
- `matchResult` - Final match statistics

## 🧪 Scripts

### Server Scripts
```bash
npm run start          # Start production server
npm run dev            # Start development server with nodemon
npm run clear-db       # Clear database (use with caution)
npm run fix-indexes    # Fix MongoDB indexes
npm run test-nft       # Test NFT service
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
```

## 🔒 Security Considerations

- **Private Keys**: Never commit private keys to version control
- **JWT Secrets**: Use strong, random JWT secrets in production
- **CORS**: Configure CORS properly for production
- **Rate Limiting**: Consider adding rate limiting for API endpoints
- **Input Validation**: Validate all user inputs on both client and server
- **Smart Contract Audits**: Audit smart contracts before mainnet deployment

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
- **Pokemon** - Original concept by Game Freak / Nintendo

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**Built with ❤️ for the Web3 gaming community**

