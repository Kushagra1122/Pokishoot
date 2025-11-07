# How to Get Private Key for Contract Deployment

## ⚠️ SECURITY WARNING
**NEVER share your private key or commit it to git!**

## Method 1: From Your Connected MetaMask Wallet

1. Open MetaMask extension
2. Click the **three dots (⋮)** menu next to your account name
3. Select **"Account details"**
4. Click **"Export Private Key"**
5. Enter your MetaMask password
6. Copy the private key (starts with `0x...`)
7. **IMPORTANT**: This key has full access to your wallet!

## Method 2: Create a New Deployment Account (Recommended)

1. Create a **NEW** MetaMask account (not your main one)
2. Switch to that account
3. Get testnet tokens from faucet: https://faucet.moonbeam.network/
4. Export that account's private key
5. Use only for deployment - never for other transactions

## After Getting Your Private Key

1. Open `contracts/.env` file
2. Add your private key:
   ```env
   PRIVATE_KEY=0xYourPrivateKeyHere
   ```
3. **DO NOT** commit this file to git (already in .gitignore)

## For Server Backend (Optional)

If you want the server to auto-mint NFTs:

1. Copy the same private key
2. Add to `server/.env`:
   ```env
   PRIVATE_KEY=0xYourPrivateKeyHere
   NFT_CONTRACT_ADDRESS=  # Set after deployment
   ```

## Security Best Practices

✅ **DO:**
- Use testnet private keys only
- Create separate account for deployment
- Keep `.env` files private
- Use different keys for testnet vs mainnet

❌ **DON'T:**
- Share private keys
- Commit `.env` to git
- Use main wallet's private key
- Send private keys via email/chat

## Next Steps

After setting up your private key:
1. Make sure you have testnet DEV tokens (for gas fees)
2. Run: `npm run deploy:moonbase`
3. Copy the contract address to your `.env` files

