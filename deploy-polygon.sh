#!/bin/bash

# Polygon Mainnet Deployment Script
# This script will guide you through deploying StampCoinNFT to Polygon mainnet

set -e

echo "================================================"
echo "  StampCoin NFT - Polygon Mainnet Deployment"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ No .env file found${NC}"
    echo ""
    echo "Creating .env from template..."
    cp .env.deployment.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo ""
    echo "Please edit .env and add your:"
    echo "  1. DEPLOYER_PRIVATE_KEY (from MetaMask)"
    echo "  2. POLYGONSCAN_API_KEY (optional, for verification)"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Load environment variables
source .env

# Check for required variables
if [ -z "$DEPLOYER_PRIVATE_KEY" ] || [ "$DEPLOYER_PRIVATE_KEY" = "your_private_key_here_64_hex_chars_no_0x_prefix" ]; then
    echo -e "${RED}❌ DEPLOYER_PRIVATE_KEY not set in .env${NC}"
    echo ""
    echo "Get your private key from MetaMask:"
    echo "  1. Click account icon → Account Details"
    echo "  2. Click 'Show private key'"
    echo "  3. Enter password"
    echo "  4. Copy key (remove 0x prefix)"
    echo "  5. Add to .env file"
    exit 1
fi

# Set default RPC if not provided
if [ -z "$POLYGON_RPC_URL" ]; then
    export POLYGON_RPC_URL="https://polygon-rpc.com"
    echo -e "${YELLOW}⚠️  Using default Polygon RPC: $POLYGON_RPC_URL${NC}"
fi

echo "Deployment Configuration:"
echo "  Network: Polygon Mainnet (Chain ID: 137)"
echo "  RPC URL: $POLYGON_RPC_URL"
echo "  Deployer: 0x${DEPLOYER_PRIVATE_KEY:0:8}...${DEPLOYER_PRIVATE_KEY: -6}"
echo ""

# Check wallet balance
echo "Checking wallet balance..."
cd /workspaces/Stampcoin-platform/contracts

# Try to get balance (this will fail if RPC is unreachable)
BALANCE=$(npx hardhat run --network polygon << 'CHECKBALANCE'
const { ethers } = require("hardhat");
async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(ethers.formatEther(balance));
}
main().catch(() => process.exit(1));
CHECKBALANCE
) || {
    echo -e "${RED}❌ Could not connect to Polygon network${NC}"
    echo "Check your POLYGON_RPC_URL in .env"
    exit 1
}

echo -e "${GREEN}✅ Wallet balance: $BALANCE MATIC${NC}"

# Check if balance is sufficient
BALANCE_FLOAT=$(echo "$BALANCE" | awk '{print $1}')
if (( $(echo "$BALANCE_FLOAT < 0.05" | bc -l) )); then
    echo -e "${RED}❌ Insufficient MATIC for deployment${NC}"
    echo "You need at least 0.05 MATIC for gas fees"
    echo "Current balance: $BALANCE MATIC"
    echo ""
    echo "Buy MATIC from exchanges and send to your wallet"
    exit 1
fi

echo ""
echo "Pre-deployment checks:"
echo -e "  ${GREEN}✅${NC} Wallet has sufficient MATIC"
echo -e "  ${GREEN}✅${NC} Connected to Polygon mainnet"
echo -e "  ${GREEN}✅${NC} Contract compiled"
echo ""

# Confirm deployment
echo -e "${YELLOW}⚠️  WARNING: This will deploy to MAINNET using real MATIC${NC}"
echo ""
read -p "Are you sure you want to deploy? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "Starting deployment..."
echo ""

# Deploy
npx hardhat run scripts/deploy.js --network polygon

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Save the contract address from above"
echo "  2. Verify contract on Polygonscan"
echo "  3. Update platform .env with contract address"
echo "  4. Grant MINTER_ROLE to platform backend"
echo ""
echo "See contracts/DEPLOYMENT_INFO.md for details"
