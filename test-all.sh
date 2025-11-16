#!/bin/bash

echo "🧪 Testing PokeWars Cross-Chain Integration"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health check
echo "1. Testing server health..."
HEALTH=$(curl -s http://localhost:4000/api/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ Server is running${NC}"
    echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"
else
    echo -e "${RED}❌ Server not responding${NC}"
    echo "Make sure server is running: cd server && npm run dev"
    exit 1
fi

# Test 2: Supported chains
echo ""
echo "2. Testing supported chains..."
CHAINS=$(curl -s http://localhost:4000/api/crosschain/chains)
if echo "$CHAINS" | grep -q "success"; then
    echo -e "${GREEN}✅ Cross-chain API working${NC}"
    echo "$CHAINS" | jq . 2>/dev/null || echo "$CHAINS"
else
    echo -e "${YELLOW}⚠️  Cross-chain API may not be initialized${NC}"
    echo "$CHAINS"
fi

# Test 3: Cross-chain marketplace
echo ""
echo "3. Testing cross-chain marketplace..."
MARKETPLACE=$(curl -s "http://localhost:4000/api/crosschain/marketplace/listings?limit=5")
if echo "$MARKETPLACE" | grep -q "success"; then
    echo -e "${GREEN}✅ Marketplace API working${NC}"
    echo "$MARKETPLACE" | jq '.listings | length' 2>/dev/null || echo "Response received"
else
    echo -e "${YELLOW}⚠️  Marketplace may not have contracts deployed${NC}"
    echo "$MARKETPLACE"
fi

# Test 4: Cross-chain leaderboard
echo ""
echo "4. Testing cross-chain leaderboard..."
LEADERBOARD=$(curl -s "http://localhost:4000/api/crosschain/leaderboard?count=5")
if echo "$LEADERBOARD" | grep -q "success"; then
    echo -e "${GREEN}✅ Leaderboard API working${NC}"
    echo "$LEADERBOARD" | jq '.players | length' 2>/dev/null || echo "Response received"
else
    echo -e "${YELLOW}⚠️  Leaderboard may not have contracts deployed${NC}"
    echo "$LEADERBOARD"
fi

echo ""
echo -e "${GREEN}✅ Basic API tests complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "   1. Open http://localhost:5173 in browser"
echo "   2. Install Polkadot.js extension"
echo "   3. Test wallet connection and signing"
echo "   4. Test cross-chain features in UI"

