# Test Suite for XCM Cross-Chain Integration

This directory contains comprehensive tests for the XCM cross-chain functionality.

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test suites
```bash
# XCM Service tests
npm run test:xcm

# Cross-chain integration tests
npm run test:crosschain
```

### Run with coverage
```bash
npm run test:coverage
```

### Watch mode
```bash
npm run test:watch
```

## Test Files

### `xcmService.test.js`
Tests for the core XCM service:
- Chain configuration
- XCM message preparation
- Cross-chain data aggregation
- Chain connection management

### `crossChainController.test.js`
Tests for the cross-chain API endpoints:
- GET `/api/crosschain/chains`
- GET `/api/crosschain/nft/:tokenId`
- GET `/api/crosschain/nfts/:address`
- GET `/api/crosschain/marketplace/listings`
- GET `/api/crosschain/leaderboard`
- POST `/api/crosschain/transfer/prepare`

### `crossChainNFTService.test.js`
Tests for cross-chain NFT operations:
- NFT querying across chains
- Multi-chain NFT ownership
- Contract registration

## Test Coverage

The test suite covers:
- ✅ XCM message preparation
- ✅ Multi-chain API connections
- ✅ Cross-chain data aggregation
- ✅ Error handling
- ✅ API endpoint responses
- ✅ Service initialization

## Mocking

Tests use Jest mocks for:
- Blockchain RPC connections
- Polkadot API connections
- External service calls

This allows tests to run without actual blockchain connections.

## Adding New Tests

When adding new cross-chain features:

1. Create test file: `tests/[feature].test.js`
2. Mock external dependencies
3. Test both success and error cases
4. Update this README

## Continuous Integration

These tests should be run in CI/CD pipelines to ensure cross-chain functionality remains working after changes.

