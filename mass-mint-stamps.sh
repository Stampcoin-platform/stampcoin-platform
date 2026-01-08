#!/bin/bash
# Mass Mint All Stamps - Complete Workflow Script
# This script executes the entire process of loading stamps and minting them as NFTs

set -e

echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                          ║"
echo "║           🎨 STAMPCOIN - MASS MINT ALL STAMPS TO NFT 🎨                ║"
echo "║                                                                          ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check environment variables
echo -e "${BLUE}📋 Checking environment configuration...${NC}"
if [ -z "$PINATA_JWT" ]; then
  echo -e "${RED}❌ PINATA_JWT not set${NC}"
  exit 1
fi
if [ -z "$NFT_CONTRACT_ADDRESS" ]; then
  echo -e "${RED}❌ NFT_CONTRACT_ADDRESS not set${NC}"
  exit 1
fi
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
  echo -e "${RED}❌ DEPLOYER_PRIVATE_KEY not set${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Create download directory
echo -e "${BLUE}📁 Setting up download directory...${NC}"
mkdir -p public/downloads
echo -e "${GREEN}✅ Download directory ready${NC}"
echo ""

# Run the minting script
echo -e "${BLUE}🚀 Starting mass minting process...${NC}"
echo "This may take several minutes depending on the number of stamps..."
echo ""

npx tsx server/scripts/mass-mint-all-stamps.ts

echo ""
echo -e "${BLUE}📊 Minting complete!${NC}"
echo ""

# Check results
if [ -f "MINTING_SUMMARY.md" ]; then
  echo -e "${GREEN}✅ Summary saved to: MINTING_SUMMARY.md${NC}"
  echo ""
  echo -e "${YELLOW}📖 Results Preview:${NC}"
  head -20 MINTING_SUMMARY.md
else
  echo -e "${YELLOW}⚠️  Summary file not found${NC}"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                          ║"
echo "║                     🎉 MINTING PROCESS COMPLETE! 🎉                    ║"
echo "║                                                                          ║"
echo "║                      Next Steps:                                         ║"
echo "║                                                                          ║"
echo "║   1. View results: cat MINTING_SUMMARY.md                               ║"
echo "║   2. Browse stamps: npm run dev (then visit /downloads)                 ║"
echo "║   3. Deploy to production: ./deploy-railway.sh                          ║"
echo "║                                                                          ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
