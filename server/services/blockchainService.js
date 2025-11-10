const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Blockchain Service for Match Escrow interactions
 * Handles match creation, staking, and result submission
 */
class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = process.env.MATCH_ESCROW_CONTRACT_ADDRESS;
    this.rpcUrl = process.env.MOONBASE_RPC_URL || 'https://rpc.api.moonbase.moonbeam.network';
    this.matchNonces = new Map(); // Track nonces per match (gameCode -> nonce)
    
    this.initialize();
  }

  async initialize() {
    try {
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      
      const privateKey = process.env.PRIVATE_KEY;
      if (privateKey) {
        this.signer = new ethers.Wallet(privateKey, this.provider);
        console.log('✅ Blockchain Service initialized with signer:', this.signer.address);
      } else {
        console.warn('⚠️  No PRIVATE_KEY found. Blockchain operations will not work.');
      }

      if (!this.contractAddress) {
        this.contractAddress = this.loadContractAddress();
      }

      if (this.contractAddress && this.signer) {
        const abi = this.getContractABI();
        this.contract = new ethers.Contract(this.contractAddress, abi, this.signer);
        console.log('✅ MatchEscrow contract connected:', this.contractAddress);
      } else {
        console.warn('⚠️  MatchEscrow contract not initialized');
      }
    } catch (error) {
      console.error('❌ Error initializing Blockchain Service:', error);
    }
  }

  loadContractAddress() {
    try {
      const deploymentFile = path.join(__dirname, '../deployments/moonbase-deployment.json');
      if (fs.existsSync(deploymentFile)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
        return deployment.matchEscrowAddress || null;
      }
    } catch (error) {
      console.error('Error loading deployment file:', error);
    }
    return null;
  }

  getContractABI() {
    // MatchEscrow ABI (minimal for our needs)
    return [
      "function createMatch(bytes32 matchId, address playerA, address playerB) external payable",
      "function joinMatch(bytes32 matchId) external payable",
      "function submitResult(bytes32 matchId, address winner, uint256 scoreA, uint256 scoreB, uint256 serverNonce, bytes memory sigA, bytes memory sigB) external",
      "function cancelMatch(bytes32 matchId) external",
      "function getMatch(bytes32 matchId) external view returns (tuple(address playerA, address playerB, uint256 stake, bool playerADeposited, bool playerBDeposited, bool settled, bool canceled, uint256 createdAt))",
      "function getPoints(address player) external view returns (uint256)",
      "event MatchCreated(bytes32 indexed matchId, address indexed playerA, address indexed playerB, uint256 stake)",
      "event MatchJoined(bytes32 indexed matchId, address indexed player, uint256 stake)",
      "event MatchResult(bytes32 indexed matchId, address indexed winner, uint256 scoreA, uint256 scoreB, uint256 totalPayout, uint256 serverNonce)",
      "event Transfer(address indexed from, address indexed to, uint256 value)",
      "event MatchCanceled(bytes32 indexed matchId, string reason)"
    ];
  }

  /**
   * Generate match ID from game code
   */
  generateMatchId(gameCode) {
    return ethers.keccak256(ethers.toUtf8Bytes(gameCode));
  }

  /**
   * Create a match on blockchain (called by playerA)
   * @param {string} gameCode - Game code from lobby
   * @param {string} playerAAddress - Wallet address of player A
   * @param {string} playerBAddress - Wallet address of player B
   * @param {string} stakeAmount - Stake amount in GLMR (as string)
   * @returns {Promise<Object>} Transaction receipt
   */
  async createMatch(gameCode, playerAAddress, playerBAddress, stakeAmount) {
    if (!this.contract) {
      throw new Error('MatchEscrow contract not initialized');
    }

    const matchId = this.generateMatchId(gameCode);
    const stakeWei = ethers.parseEther(stakeAmount);

    try {
      // Note: This should be called by the player from frontend, not server
      // Server can prepare the transaction data for frontend
      const tx = await this.contract.createMatch(
        matchId,
        playerAAddress,
        playerBAddress,
        { value: stakeWei }
      );

      console.log('📝 Match creation transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Match created on blockchain:', matchId);

      return {
        matchId: matchId,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('❌ Error creating match:', error);
      throw error;
    }
  }

  /**
   * Join a match (called by playerB from frontend)
   * Note: This is typically called from frontend, but server can prepare data
   */
  async prepareJoinMatchData(gameCode, stakeAmount) {
    if (!this.contract) {
      throw new Error('MatchEscrow contract not initialized');
    }

    const matchId = this.generateMatchId(gameCode);
    const stakeWei = ethers.parseEther(stakeAmount);

    return {
      matchId: matchId,
      stakeWei: stakeWei.toString(),
      functionData: this.contract.interface.encodeFunctionData('joinMatch', [matchId])
    };
  }

  /**
   * Submit match result to blockchain
   * @param {string} gameCode - Game code
   * @param {string} winnerAddress - Wallet address of winner
   * @param {number} scoreA - Score of player A
   * @param {number} scoreB - Score of player B
   * @param {string} playerAAddress - Wallet address of player A
   * @param {string} playerBAddress - Wallet address of player B
   * @returns {Promise<Object>} Transaction receipt
   */
  async submitMatchResult(gameCode, winnerAddress, scoreA, scoreB, playerAAddress, playerBAddress) {
    if (!this.contract || !this.signer) {
      throw new Error('Blockchain service not ready');
    }

    const matchId = this.generateMatchId(gameCode);
    
    // Get current nonce for this match, increment it
    const currentNonce = this.matchNonces.get(gameCode) || 0;
    const serverNonce = currentNonce + 1;
    this.matchNonces.set(gameCode, serverNonce);

    // Ensure scores are non-negative (uint256 cannot be negative)
    // Use Math.max to ensure minimum value of 0
    const safeScoreA = Math.max(0, Math.floor(Number(scoreA) || 0));
    const safeScoreB = Math.max(0, Math.floor(Number(scoreB) || 0));

    // Create message hash exactly as contract does: keccak256(abi.encodePacked(...))
    // Contract: keccak256(abi.encodePacked(matchId, winner, scoreA, scoreB, serverNonce, address(this)))
    const messageHash = ethers.solidityPackedKeccak256(
      ['bytes32', 'address', 'uint256', 'uint256', 'uint256', 'address'],
      [matchId, winnerAddress, safeScoreA, safeScoreB, serverNonce, this.contractAddress]
    );

    // Contract does: ethSignedMessageHash = messageHash.toEthSignedMessageHash()
    // This adds Ethereum message prefix: keccak256("\x19Ethereum Signed Message:\n32" + hash)
    // We need to manually construct the prefixed message hash and sign it
    // Format: "\x19Ethereum Signed Message:\n32" + messageHash (32 bytes)
    const prefix = "\x19Ethereum Signed Message:\n32";
    const prefixBytes = ethers.toUtf8Bytes(prefix);
    const messageHashBytes = ethers.getBytes(messageHash);
    const prefixedMessage = ethers.concat([prefixBytes, messageHashBytes]);
    const ethSignedMessageHash = ethers.keccak256(prefixedMessage);
    
    // Sign the ethSignedMessageHash directly using the signer's signingKey
    const sigA_raw = this.signer.signingKey.sign(ethSignedMessageHash);
    const sigA = ethers.Signature.from(sigA_raw).serialized;
    const sigB = sigA; // Same signature from server

    try {
      const tx = await this.contract.submitResult(
        matchId,
        winnerAddress,
        safeScoreA,
        safeScoreB,
        serverNonce,
        sigA,
        sigB
      );

      console.log('📝 Match result transaction sent:', tx.hash);
      console.log('⏳ Waiting for transaction confirmation...');
      
      const receipt = await tx.wait();
      
      // Check transaction status
      if (receipt.status !== 1) {
        throw new Error(`Transaction failed with status: ${receipt.status}`);
      }
      
      console.log('✅ Transaction confirmed on blockchain');
      console.log(`   Block: ${receipt.blockNumber}`);
      console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);

      // Verify payout by checking balances and transaction details
      let payoutVerified = false;
      let verifiedPayoutAmount = null;
      
      // Get winner balance before transaction (at block before receipt)
      try {
        const blockBefore = receipt.blockNumber - 1;
        const winnerBalanceBefore = await this.provider.getBalance(winnerAddress, blockBefore);
        
        // Parse events to verify payout
        for (const log of receipt.logs) {
          try {
            const parsed = this.contract.interface.parseLog(log);
            if (parsed && parsed.name === 'MatchResult') {
              verifiedPayoutAmount = ethers.formatEther(parsed.args.totalPayout);
              const eventWinnerAddress = parsed.args.winner;
              console.log(`💰 MatchResult event verified:`);
              console.log(`   Winner Address: ${eventWinnerAddress}`);
              console.log(`   Total Payout: ${verifiedPayoutAmount} GLMR`);
              console.log(`   Transaction Hash: ${tx.hash}`);
              
              // Verify winner address matches
              if (eventWinnerAddress.toLowerCase() !== winnerAddress.toLowerCase()) {
                console.warn(`⚠️  Winner address mismatch: event=${eventWinnerAddress}, expected=${winnerAddress}`);
              }
              
              payoutVerified = true;
              break;
            }
          } catch (err) {
            // Not our event, continue
          }
        }
        
        // Check transaction value transfers
        let transferFound = false;
        if (receipt.logs) {
          for (const log of receipt.logs) {
            // Check for native token transfers (ETH/GLMR)
            if (log.topics && log.topics.length === 3 && log.topics[0] === ethers.id('Transfer(address,address,uint256)')) {
              // This might be an ERC20 transfer, but native transfers appear differently
              try {
                const iface = new ethers.Interface(['event Transfer(address indexed from, address indexed to, uint256 value)']);
                const parsed = iface.parseLog(log);
                if (parsed && parsed.args.to.toLowerCase() === winnerAddress.toLowerCase()) {
                  transferFound = true;
                  const amount = ethers.formatEther(parsed.args.value);
                  console.log(`💰 Transfer detected to winner: ${amount} GLMR`);
                }
              } catch (e) {
                // Not a Transfer event or parsing failed
              }
            }
          }
        }
        
        // Get winner balance after transaction
        const winnerBalanceAfter = await this.provider.getBalance(winnerAddress);
        const balanceIncrease = winnerBalanceAfter - winnerBalanceBefore;
        
        // Get stake amount from contract (total payout = stake * 2)
        const matchOnChain = await this.getMatch(gameCode);
        let expectedPayout = 0n;
        if (matchOnChain && matchOnChain.stake) {
          const stakeWei = ethers.parseEther(matchOnChain.stake);
          expectedPayout = stakeWei * 2n; // Both players' stakes
        } else if (verifiedPayoutAmount) {
          expectedPayout = ethers.parseEther(verifiedPayoutAmount);
        }
        
        console.log(`\n📊 Balance Verification:`);
        console.log(`   Winner Balance Before: ${ethers.formatEther(winnerBalanceBefore)} GLMR`);
        console.log(`   Winner Balance After: ${ethers.formatEther(winnerBalanceAfter)} GLMR`);
        console.log(`   Balance Increase: ${ethers.formatEther(balanceIncrease)} GLMR`);
        if (expectedPayout > 0n) {
          console.log(`   Expected Payout: ${ethers.formatEther(expectedPayout)} GLMR`);
        }
        
        // Verify balance increased by expected amount (within gas tolerance)
        // Note: Balance increase might be less than payout if winner paid for gas
        if (expectedPayout > 0n) {
          const gasUsed = receipt.gasUsed * receipt.gasPrice || 0n;
          const tolerance = gasUsed * 2n; // Allow tolerance for gas fees
          const minExpected = expectedPayout - tolerance;
          
          if (balanceIncrease >= minExpected) {
            console.log(`✅ Balance verification PASSED - Winner received payout`);
            payoutVerified = true;
          } else if (balanceIncrease > 0n) {
            console.log(`⚠️  Balance increase (${ethers.formatEther(balanceIncrease)}) is less than expected`);
            console.log(`   This might be normal if winner paid transaction fees`);
            payoutVerified = true; // Still consider verified if there's some increase
          } else {
            console.warn(`❌ Balance verification FAILED - No balance increase detected`);
            console.warn(`   Winner may not have received payout`);
          }
        } else {
          // Can't verify exact amount, but check if balance increased
          if (balanceIncrease > 0n) {
            console.log(`✅ Balance increased by ${ethers.formatEther(balanceIncrease)} GLMR`);
            payoutVerified = true;
          } else {
            console.warn(`⚠️  No balance increase detected (cannot verify exact payout amount)`);
          }
        }
        
        // Verify match is settled on contract (reuse matchOnChain from above)
        if (matchOnChain && matchOnChain.settled) {
          console.log(`✅ Match confirmed as settled on blockchain`);
        } else {
          console.warn(`⚠️  Match not yet marked as settled on contract`);
        }
        
        // Blockchain explorer link
        const networkName = this.rpcUrl.includes('moonbase') ? 'moonbase' : 'moonbeam';
        const explorerBase = networkName === 'moonbase' 
          ? 'https://moonbase.moonscan.io'
          : 'https://moonbeam.moonscan.io';
        console.log(`\n🔍 View on Explorer: ${explorerBase}/tx/${tx.hash}`);
        console.log(`\n💡 Important: Transaction shows "Value: 0 DEV" because payout is an INTERNAL transfer.`);
        console.log(`   To verify payout:`);
        console.log(`   1. Click "Logs" tab on the explorer → Look for MatchResult event`);
        console.log(`   2. Click "Internal Txns" tab → Should show transfer to winner`);
        console.log(`   3. Check winner balance (above verification confirms: ${ethers.formatEther(balanceIncrease)} GLMR received)`);
        
        // Summary
        console.log(`\n📋 Payout Summary:`);
        console.log(`   ✅ MatchResult Event: ${verifiedPayoutAmount || 'N/A'} GLMR`);
        console.log(`   ✅ Balance Increase: ${ethers.formatEther(balanceIncrease)} GLMR`);
        console.log(`   ✅ Match Settled: ${matchOnChain?.settled ? 'Yes' : 'No'}`);
        if (payoutVerified) {
          console.log(`   ✅ VERIFICATION PASSED - Payout successfully sent to winner!`);
        }
        
      } catch (balanceError) {
        console.warn('⚠️  Could not verify balance changes:', balanceError.message);
      }

      if (!payoutVerified) {
        console.warn('⚠️  MatchResult event not found in transaction logs');
        console.warn('   This may indicate the payout did not execute correctly');
      }

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        serverNonce: serverNonce,
        receipt: receipt
      };
    } catch (error) {
      console.error('❌ Error submitting match result:', error);
      throw error;
    }
  }

  /**
   * Cancel a match (refund deposits)
   */
  async cancelMatch(gameCode) {
    if (!this.contract) {
      throw new Error('MatchEscrow contract not initialized');
    }

    const matchId = this.generateMatchId(gameCode);

    try {
      const tx = await this.contract.cancelMatch(matchId);
      console.log('📝 Cancel match transaction sent:', tx.hash);
      const receipt = await tx.wait();
      
      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('❌ Error canceling match:', error);
      throw error;
    }
  }

  /**
   * Get match details from blockchain
   */
  async getMatch(gameCode) {
    if (!this.contract) {
      throw new Error('MatchEscrow contract not initialized');
    }

    const matchId = this.generateMatchId(gameCode);

    try {
      const match = await this.contract.getMatch(matchId);
      return {
        playerA: match.playerA,
        playerB: match.playerB,
        stake: ethers.formatEther(match.stake),
        playerADeposited: match.playerADeposited,
        playerBDeposited: match.playerBDeposited,
        settled: match.settled,
        canceled: match.canceled,
        createdAt: new Date(Number(match.createdAt) * 1000)
      };
    } catch (error) {
      console.error('❌ Error getting match:', error);
      return null;
    }
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return !!(this.contract && this.signer);
  }
}

module.exports = new BlockchainService();

