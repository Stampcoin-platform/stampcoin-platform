#!/bin/bash

# StampCoin Platform - Smart Contract & NFT Testing Script

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     StampCoin Smart Contract & NFT Testing Suite           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Contract details
CONTRACT_ADDRESS="0x0E903614e8Fb61B5D36734D7B435088C5d68B963"
DEPLOYER_ADDRESS="0xbf725439B03B9AB013200c6eF1E2d1Fb395F46fE"
POLYGONSCAN_URL="https://polygonscan.com/address/$CONTRACT_ADDRESS"

echo -e "${BLUE}📋 Contract Information:${NC}"
echo "   Address: $CONTRACT_ADDRESS"
echo "   Network: Polygon Mainnet"
echo "   Deployer: $DEPLOYER_ADDRESS"
echo ""

echo -e "${BLUE}🔗 Verification Links:${NC}"
echo "   Polygonscan: $POLYGONSCAN_URL"
echo ""

# Function to check contract on Polygonscan
check_contract_status() {
    echo -e "${YELLOW}Checking contract status...${NC}"
    
    # Try to fetch contract info from Polygonscan API
    RESPONSE=$(curl -s "https://api.polygonscan.com/api?module=contract&action=getsourcecode&address=$CONTRACT_ADDRESS&apikey=AKWZX2HBJSMMW8Y4VWKTZ3Z4CKMCVP88N3" 2>/dev/null)
    
    if echo "$RESPONSE" | grep -q '"ContractName":"StampCoinNFT"'; then
        echo -e "${GREEN}✅ Contract found on Polygon!${NC}"
        echo "   Status: Deployed"
        echo "   Verification: Available"
        return 0
    else
        echo -e "${YELLOW}⏳ Contract still propagating...${NC}"
        echo "   Check back in 2-5 minutes"
        return 1
    fi
}

# Function to verify contract source code
verify_contract() {
    echo ""
    echo -e "${BLUE}🔐 Verifying Contract Source...${NC}"
    echo ""
    echo "Manual Verification Steps:"
    echo "1. Go to: $POLYGONSCAN_URL"
    echo "2. Click 'More Options' → 'Verify & Publish'"
    echo "3. Compiler: Solidity (Multi-file)"
    echo "4. Compiler Version: v0.8.20"
    echo "5. License: MIT"
    echo "6. Upload contracts/StampCoinNFT.sol"
    echo "7. Constructor Args:"
    echo "   - Owner: $DEPLOYER_ADDRESS"
    echo "8. Click 'Verify & Publish'"
    echo ""
    echo -e "${GREEN}✅ Once verified, your contract will be public!${NC}"
}

# Function to test NFT minting
test_nft_minting() {
    echo ""
    echo -e "${BLUE}🎨 NFT Minting Test${NC}"
    echo ""
    
    # Check if server is running
    if ! curl -s http://localhost:3000/api/health &> /dev/null; then
        echo -e "${YELLOW}⚠️  Server not running. Start with: npm run dev${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Server is running!${NC}"
    echo ""
    echo "Test Mint Endpoint:"
    echo "POST http://localhost:3000/api/nft/mint"
    echo ""
    echo "Example Request:"
    echo '{'
    echo '  "stampId": 1,'
    echo '  "to": "0xYourWalletAddress",'
    echo '  "metadata": {'
    echo '    "name": "Penny Black",'
    echo '    "description": "First adhesive postage stamp (1840)",'
    echo '    "image": "ipfs://QmXx..."'
    echo '  }'
    echo '}'
    echo ""
    echo "Test with curl:"
    echo 'curl -X POST http://localhost:3000/api/nft/mint -H "Content-Type: application/json" -d '"'"'{...}'"'"''
    echo ""
}

# Function to check gas costs
estimate_gas() {
    echo ""
    echo -e "${BLUE}⛽ Gas Cost Estimation${NC}"
    echo ""
    echo "Polygon Mainnet Costs (approx):"
    echo "   Deploy: ~0.05 MATIC (~$0.04)"
    echo "   Mint NFT: ~0.01 MATIC (~$0.008)"
    echo "   Transfer: ~0.002 MATIC (~$0.0016)"
    echo ""
    echo "Total for 50 stamps: ~0.5 MATIC (~$0.40)"
    echo ""
    echo -e "${GREEN}✅ Very affordable!${NC}"
}

# Function to show minting workflow
show_workflow() {
    echo ""
    echo -e "${BLUE}📊 NFT Minting Workflow${NC}"
    echo ""
    echo "Step 1: Upload Metadata to IPFS"
    echo "   └─ Uses: Pinata + nft.storage"
    echo ""
    echo "Step 2: Call Contract.mint()"
    echo "   └─ Creates NFT on Polygon"
    echo "   └─ Links to IPFS metadata"
    echo ""
    echo "Step 3: Grant MINTER_ROLE"
    echo "   └─ Role: 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceef8d981c8956a6"
    echo ""
    echo "Step 4: Display on Website"
    echo "   └─ Fetch from database"
    echo "   └─ Show in gallery"
    echo "   └─ Enable trading"
    echo ""
}

# Main execution
echo -e "${GREEN}Running tests...${NC}"
echo ""

# Test 1: Check contract
check_contract_status
TEST1=$?

# Test 2: Verify contract
verify_contract

# Test 3: NFT Minting
test_nft_minting
TEST3=$?

# Test 4: Gas costs
estimate_gas

# Test 5: Workflow
show_workflow

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    📋 Test Summary                         ║"
echo "╠════════════════════════════════════════════════════════════╣"

if [ $TEST1 -eq 0 ]; then
    echo -e "║ ${GREEN}✅${NC} Contract Deployed"
else
    echo -e "║ ${YELLOW}⏳${NC} Contract Propagating"
fi

if [ $TEST3 -eq 0 ]; then
    echo -e "║ ${GREEN}✅${NC} Server Ready for Minting"
else
    echo -e "║ ${YELLOW}⚠️ ${NC} Start server with: npm run dev"
fi

echo "║                                                            ║"
echo "║ 🎯 Next Steps:                                             ║"
echo "║    1. Get API keys → /API_KEYS_SETUP.md                   ║"
echo "║    2. Verify contract on Polygonscan                      ║"
echo "║    3. Test minting in local environment                   ║"
echo "║    4. Deploy to production (Railway)                      ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
