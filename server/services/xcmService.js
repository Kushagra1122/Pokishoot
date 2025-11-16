const { ApiPromise, WsProvider } = require('@polkadot/api');
const { ethers } = require('ethers');

/**
 * XCM Cross-Chain Service
 * Handles cross-chain operations using XCM (Cross-Consensus Message Format)
 * Supports transfers between Moonbeam and other Polkadot parachains
 */
class XCMService {
  constructor() {
    this.apis = new Map(); // Store API connections per chain
    this.evmProviders = new Map(); // Store EVM providers per chain
    this.chainConfigs = {
      moonbeam: {
        wsUrl: 'wss://wss.api.moonbeam.network',
        rpcUrl: 'https://rpc.api.moonbeam.network',
        chainId: 1284,
        paraId: 2004,
        type: 'evm',
      },
      moonbase: {
        wsUrl: 'wss://wss.api.moonbase.moonbeam.network',
        rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
        chainId: 1287,
        paraId: 1000,
        type: 'evm',
      },
      // Add other parachains for cross-chain operations
      astar: {
        wsUrl: 'wss://astar-rpc.dwellir.com',
        rpcUrl: 'https://astar-rpc.dwellir.com',
        paraId: 2006,
        type: 'substrate',
      },
      assetHub: {
        wsUrl: 'wss://polkadot-asset-hub-rpc.polkadot.io',
        rpcUrl: 'https://polkadot-asset-hub-rpc.polkadot.io',
        paraId: 1000,
        type: 'substrate',
      },
    };
  }

  /**
   * Initialize API connection for a specific chain
   */
  async initializeChain(chainName) {
    const config = this.chainConfigs[chainName];
    if (!config) {
      throw new Error(`Unknown chain: ${chainName}`);
    }

    // If already initialized, return existing API
    if (this.apis.has(chainName)) {
      return this.apis.get(chainName);
    }

    try {
      if (config.type === 'substrate') {
        // Initialize Substrate API
        const provider = new WsProvider(config.wsUrl);
        const api = await ApiPromise.create({ provider });
        this.apis.set(chainName, api);
        console.log(`✅ Connected to ${chainName} via Substrate API`);
        return api;
      } else {
        // Initialize EVM provider
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.evmProviders.set(chainName, provider);
        console.log(`✅ Connected to ${chainName} via EVM RPC`);
        return provider;
      }
    } catch (error) {
      console.error(`❌ Error connecting to ${chainName}:`, error);
      throw error;
    }
  }

  /**
   * Get API for a chain (initialize if needed)
   */
  async getApi(chainName) {
    if (!this.apis.has(chainName) && !this.evmProviders.has(chainName)) {
      await this.initializeChain(chainName);
    }
    return this.apis.get(chainName) || this.evmProviders.get(chainName);
  }

  /**
   * Prepare XCM message for cross-chain NFT transfer
   * This creates the XCM instructions for transferring an NFT between chains
   */
  async prepareXCMTransfer(sourceChain, destChain, tokenId, recipientAddress) {
    try {
      const sourceApi = await this.getApi(sourceChain);
      const destConfig = this.chainConfigs[destChain];

      if (!destConfig) {
        throw new Error(`Unknown destination chain: ${destChain}`);
      }

      // For Moonbeam (EVM), we use XCM precompiles
      if (sourceChain === 'moonbeam' || sourceChain === 'moonbase') {
        return this.prepareEVMXCMTransfer(
          sourceChain,
          destChain,
          tokenId,
          recipientAddress
        );
      }

      // For Substrate chains, use XCM pallet
      return this.prepareSubstrateXCMTransfer(
        sourceApi,
        destConfig.paraId,
        tokenId,
        recipientAddress
      );
    } catch (error) {
      console.error('Error preparing XCM transfer:', error);
      throw error;
    }
  }

  /**
   * Prepare XCM transfer for EVM chains (Moonbeam)
   */
  async prepareEVMXCMTransfer(sourceChain, destChain, tokenId, recipientAddress) {
    const config = this.chainConfigs[sourceChain];
    const destConfig = this.chainConfigs[destChain];

    // XCM precompile address on Moonbeam
    const XCM_PRECOMPILE = '0x0000000000000000000000000000000000000804';

    // For Moonbeam, we use the XCM precompile to send XCM messages
    // This is a simplified version - in production, you'd use the full XCM format
    return {
      type: 'xcm_transfer',
      sourceChain,
      destChain,
      destParaId: destConfig.paraId,
      tokenId,
      recipientAddress,
      precompileAddress: XCM_PRECOMPILE,
      method: 'xcm_transfer',
      // XCM instructions would be encoded here
      instructions: this.encodeXCMInstructions(destConfig.paraId, recipientAddress, tokenId),
    };
  }

  /**
   * Prepare XCM transfer for Substrate chains
   */
  async prepareSubstrateXCMTransfer(api, destParaId, tokenId, recipientAddress) {
    // Create XCM message for transferring NFT
    // This is a simplified example - full implementation would use proper XCM format
    const xcmMessage = {
      V2: [
        {
          WithdrawAsset: {
            id: { Concrete: { parents: 0, interior: 'Here' } },
            fun: { Fungible: 1 }, // 1 unit (NFT)
          },
        },
        {
          InitiateReserveWithdraw: {
            assets: { Wild: 'All' },
            reserve: { parents: 1, interior: { X1: { Parachain: destParaId } } },
            xcm: [
              {
                DepositAsset: {
                  assets: { Wild: 'All' },
                  beneficiary: {
                    parents: 0,
                    interior: { X1: { AccountId32: { network: null, id: recipientAddress } } },
                  },
                },
              },
            ],
          },
        },
      ],
    };

    return {
      type: 'xcm_transfer',
      destParaId,
      tokenId,
      recipientAddress,
      xcmMessage,
    };
  }

  /**
   * Encode XCM instructions for EVM
   */
  encodeXCMInstructions(destParaId, recipientAddress, tokenId) {
    // Simplified XCM encoding
    // In production, use proper XCM encoding libraries
    return {
      dest: {
        parents: 1,
        interior: { X1: { Parachain: destParaId } },
      },
      beneficiary: {
        parents: 0,
        interior: { X1: { AccountId32: { network: null, id: recipientAddress } } },
      },
      assets: {
        fungible: false,
        id: tokenId,
      },
    };
  }

  /**
   * Query cross-chain NFT ownership
   */
  async queryCrossChainNFT(chainName, contractAddress, tokenId) {
    try {
      const api = await this.getApi(chainName);
      const config = this.chainConfigs[chainName];

      if (config.type === 'evm') {
        // Query EVM contract
        const nftABI = [
          'function ownerOf(uint256 tokenId) external view returns (address)',
          'function tokenURI(uint256 tokenId) external view returns (string)',
        ];
        const contract = new ethers.Contract(contractAddress, nftABI, api);
        const owner = await contract.ownerOf(tokenId);
        const tokenURI = await contract.tokenURI(tokenId);
        return { owner, tokenURI, chain: chainName };
      } else {
        // Query Substrate chain (would need NFT pallet)
        // This is a placeholder - actual implementation depends on NFT standard used
        return { owner: null, tokenURI: null, chain: chainName };
      }
    } catch (error) {
      console.error(`Error querying NFT on ${chainName}:`, error);
      return null;
    }
  }

  /**
   * Aggregate data from multiple chains
   */
  async aggregateCrossChainData(chainNames, queryFn) {
    const results = await Promise.allSettled(
      chainNames.map(async (chainName) => {
        try {
          return await queryFn(chainName);
        } catch (error) {
          console.error(`Error querying ${chainName}:`, error);
          return null;
        }
      })
    );

    return results
      .map((result, index) => ({
        chain: chainNames[index],
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null,
      }))
      .filter((item) => item.data !== null);
  }

  /**
   * Get supported chains
   */
  getSupportedChains() {
    return Object.keys(this.chainConfigs);
  }

  /**
   * Get chain configuration
   */
  getChainConfig(chainName) {
    return this.chainConfigs[chainName];
  }

  /**
   * Cleanup connections
   */
  async disconnect() {
    for (const [chainName, api] of this.apis.entries()) {
      if (api && api.disconnect) {
        await api.disconnect();
      }
    }
    this.apis.clear();
    this.evmProviders.clear();
  }
}

// Export singleton instance
const xcmService = new XCMService();
module.exports = xcmService;

