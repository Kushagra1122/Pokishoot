const crossChainNFTService = require('../services/crossChainNFTService');
const xcmService = require('../services/xcmService');

// Mock dependencies
jest.mock('../services/xcmService');
jest.mock('../services/nftService');

describe('Cross-Chain NFT Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize service', async () => {
      xcmService.initializeChain.mockResolvedValue({});
      
      await crossChainNFTService.initialize();
      
      expect(xcmService.initializeChain).toHaveBeenCalledWith('moonbase');
      expect(xcmService.initializeChain).toHaveBeenCalledWith('moonbeam');
    });
  });

  describe('queryNFTMultiChain', () => {
    it('should query NFT across multiple chains', async () => {
      const mockResults = [
        { chain: 'moonbase', owner: '0x123...', tokenURI: 'ipfs://...' },
        { chain: 'moonbeam', owner: '0x456...', tokenURI: 'ipfs://...' },
      ];

      xcmService.aggregateCrossChainData.mockResolvedValue(mockResults);
      xcmService.getApi.mockResolvedValue({});
      xcmService.queryCrossChainNFT.mockResolvedValue(mockResults[0]);

      // Mock contract addresses
      process.env.NFT_CONTRACT_ADDRESS = '0xNFT';
      process.env.MOONBEAM_NFT_CONTRACT_ADDRESS = '0xNFT2';

      const results = await crossChainNFTService.queryNFTMultiChain('123');

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getNFTsByOwnerMultiChain', () => {
    it('should get NFTs owned by address across chains', async () => {
      const mockProvider = {
        getBalance: jest.fn(),
      };

      const mockContract = {
        balanceOf: jest.fn().mockResolvedValue('2'),
        tokenOfOwnerByIndex: jest.fn()
          .mockResolvedValueOnce('1')
          .mockResolvedValueOnce('2'),
      };

      xcmService.getApi.mockResolvedValue(mockProvider);
      
      // Mock ethers.Contract
      const originalEthers = require('ethers');
      jest.spyOn(originalEthers, 'Contract').mockImplementation(() => mockContract);

      process.env.NFT_CONTRACT_ADDRESS = '0xNFT';
      process.env.MOONBEAM_NFT_CONTRACT_ADDRESS = '0xNFT2';

      const nfts = await crossChainNFTService.getNFTsByOwnerMultiChain(
        '0x1234567890123456789012345678901234567890'
      );

      expect(nfts).toBeDefined();
      expect(Array.isArray(nfts)).toBe(true);
    });
  });

  describe('registerNFTContract', () => {
    it('should register NFT contract for a chain', () => {
      crossChainNFTService.registerNFTContract('testchain', '0xTest');
      const address = crossChainNFTService.getNFTContract('testchain');
      expect(address).toBe('0xTest');
    });
  });
});

