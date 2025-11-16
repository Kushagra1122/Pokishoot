const xcmService = require('../services/xcmService');

// Suppress console logs during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('XCM Service', () => {
  beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterAll(async () => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    await xcmService.disconnect();
  });

  describe('getSupportedChains', () => {
    it('should return list of supported chains', () => {
      const chains = xcmService.getSupportedChains();
      expect(chains).toBeInstanceOf(Array);
      expect(chains.length).toBeGreaterThan(0);
      expect(chains).toContain('moonbase');
      expect(chains).toContain('moonbeam');
    });
  });

  describe('getChainConfig', () => {
    it('should return configuration for moonbase', () => {
      const config = xcmService.getChainConfig('moonbase');
      expect(config).toBeDefined();
      expect(config.type).toBe('evm');
      expect(config.chainId).toBe(1287);
      expect(config.paraId).toBe(1000);
    });

    it('should return configuration for moonbeam', () => {
      const config = xcmService.getChainConfig('moonbeam');
      expect(config).toBeDefined();
      expect(config.type).toBe('evm');
      expect(config.chainId).toBe(1284);
      expect(config.paraId).toBe(2004);
    });

    it('should return undefined for unknown chain', () => {
      const config = xcmService.getChainConfig('unknown');
      expect(config).toBeUndefined();
    });
  });

  describe('prepareXCMTransfer', () => {
    it('should prepare XCM transfer for EVM chains', async () => {
      const xcmTransfer = await xcmService.prepareXCMTransfer(
        'moonbase',
        'moonbeam',
        '123',
        '0x1234567890123456789012345678901234567890'
      );

      expect(xcmTransfer).toBeDefined();
      expect(xcmTransfer.type).toBe('xcm_transfer');
      expect(xcmTransfer.sourceChain).toBe('moonbase');
      expect(xcmTransfer.destChain).toBe('moonbeam');
      expect(xcmTransfer.tokenId).toBe('123');
      expect(xcmTransfer.recipientAddress).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should throw error for unknown source chain', async () => {
      await expect(
        xcmService.prepareXCMTransfer(
          'unknown',
          'moonbeam',
          '123',
          '0x1234567890123456789012345678901234567890'
        )
      ).rejects.toThrow();
    });

    it('should throw error for unknown destination chain', async () => {
      await expect(
        xcmService.prepareXCMTransfer(
          'moonbase',
          'unknown',
          '123',
          '0x1234567890123456789012345678901234567890'
        )
      ).rejects.toThrow();
    });
  });

  describe('aggregateCrossChainData', () => {
    it('should aggregate data from multiple chains', async () => {
      const queryFn = async (chainName) => {
        return { chain: chainName, data: `data from ${chainName}` };
      };

      const results = await xcmService.aggregateCrossChainData(
        ['moonbase', 'moonbeam'],
        queryFn
      );

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('chain');
      expect(results[0]).toHaveProperty('data');
    });

    it('should handle errors gracefully', async () => {
      const queryFn = async (chainName) => {
        if (chainName === 'moonbase') {
          throw new Error('Chain error');
        }
        return { chain: chainName, data: 'success' };
      };

      const results = await xcmService.aggregateCrossChainData(
        ['moonbase', 'moonbeam'],
        queryFn
      );

      expect(results).toBeInstanceOf(Array);
      // Should still return successful results
      const successful = results.filter((r) => r.data !== null);
      expect(successful.length).toBeGreaterThan(0);
    });
  });
});

