const nftService = require('../services/nftService');
require('dotenv').config();

async function testNFTService() {
  console.log('🧪 Testing NFT Service...\n');

  // Test 1: Check environment variables
  console.log('1️⃣ Checking Environment Variables:');
  console.log('   NFT_CONTRACT_ADDRESS:', process.env.NFT_CONTRACT_ADDRESS || '❌ NOT SET');
  console.log('   PRIVATE_KEY:', process.env.PRIVATE_KEY ? '✅ SET' : '❌ NOT SET');
  console.log('   MOONBASE_RPC_URL:', process.env.MOONBASE_RPC_URL || 'Using default');
  console.log('');

  // Test 2: Check NFT Service initialization
  console.log('2️⃣ Checking NFT Service Status:');
  console.log('   Service Ready:', nftService.isReady() ? '✅ YES' : '❌ NO');
  console.log('   Contract Address:', nftService.contractAddress || '❌ NOT SET');
  console.log('   Has Signer:', !!nftService.signer);
  if (nftService.signer) {
    console.log('   Signer Address:', nftService.signer.address);
  }
  console.log('');

  // Test 3: Test contract connection
  if (nftService.contract && nftService.contractAddress) {
    console.log('3️⃣ Testing Contract Connection:');
    try {
      // Try to call a view function
      const code = await nftService.provider.getCode(nftService.contractAddress);
      if (code === '0x') {
        console.log('   ❌ No contract code at address - contract may not be deployed');
      } else {
        console.log('   ✅ Contract code found at address');
        try {
          const totalSupply = await nftService.contract.totalSupply();
          console.log('   Total NFTs minted:', totalSupply.toString());
        } catch (e) {
          console.log('   ℹ️  Could not call totalSupply (may need signer):', e.message);
        }
      }
    } catch (error) {
      console.log('   ❌ Contract connection failed:', error.message);
    }
    console.log('');
  } else {
    console.log('3️⃣ Skipping contract test (not initialized)');
    console.log('');
  }

  // Test 4: Check network
  if (nftService.provider) {
    console.log('4️⃣ Checking Network:');
    try {
      const network = await nftService.provider.getNetwork();
      const blockNumber = await nftService.provider.getBlockNumber();
      console.log('   Network:', network.name);
      console.log('   Chain ID:', network.chainId.toString());
      console.log('   Current Block:', blockNumber);
      console.log('   ✅ Network connection successful');
    } catch (error) {
      console.log('   ❌ Network connection failed:', error.message);
    }
    console.log('');
  }

  // Summary
  console.log('📋 Summary:');
  if (nftService.isReady()) {
    console.log('   ✅ NFT Service is READY for minting');
    console.log('   ✅ All components initialized correctly');
  } else {
    console.log('   ⚠️  NFT Service is NOT ready');
    if (!process.env.PRIVATE_KEY) {
      console.log('   ❌ Missing: PRIVATE_KEY in server/.env');
    }
    if (!process.env.NFT_CONTRACT_ADDRESS) {
      console.log('   ❌ Missing: NFT_CONTRACT_ADDRESS in server/.env');
    }
  }

  process.exit(0);
}

testNFTService().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

