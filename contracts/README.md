# PokemonNFT Smart Contract

ERC-721 NFT contract for PokeWars Pokemon on Moonbeam Network.

## Setup

1. Install dependencies:
```bash
cd contracts
npm install
```

2. Create `.env` file:
```env
PRIVATE_KEY=your_private_key_here
MOONBASE_RPC_URL=https://rpc.api.moonbase.moonbeam.network
NFT_CONTRACT_ADDRESS=  # Will be set after deployment
```

3. Install OpenZeppelin contracts:
```bash
npm install @openzeppelin/contracts
```

## Compile

```bash
npm run compile
```

## Deploy

Deploy to Moonbase Alpha (Testnet):
```bash
npm run deploy:moonbase
```

Deploy to Moonbeam Mainnet:
```bash
npm run deploy:moonbeam
```

After deployment:
1. Copy the contract address from the output
2. Add it to your `.env` file as `NFT_CONTRACT_ADDRESS`
3. Add it to `client/.env` as `VITE_NFT_CONTRACT_ADDRESS`
4. Add it to `server/.env` as `NFT_CONTRACT_ADDRESS`

## Contract Features

- **ERC-721 Compliant**: Standard NFT interface
- **Metadata Storage**: Pokemon name, type, stats, sprite URI
- **Level System**: Upgradeable levels (1-100)
- **Batch Minting**: Support for bulk operations
- **Level Multipliers**: Stats scale with level (1% per level)

## Functions

- `mintPokemon()`: Mint a new Pokemon NFT
- `batchMintPokemon()`: Batch mint multiple NFTs
- `upgradeLevel()`: Upgrade Pokemon level
- `getPokemonData()`: Get full Pokemon metadata
- `getPokemonStats()`: Get stats with level multipliers

## Events

- `PokemonMinted`: Emitted when a Pokemon is minted
- `PokemonLevelUpgraded`: Emitted when level is upgraded

