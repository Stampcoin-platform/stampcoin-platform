#!/bin/bash

# ============================================================================
# Stamp Authentication System - Quick Setup
# نظام توثيق الطوابع - إعداد سريع
# ============================================================================

set -e

echo "
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║          🏛️  Stamp Authentication & Trading System Setup  🏛️          ║
║                                                                          ║
║                    نظام توثيق وتداول الطوابع                          ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================================================
# Step 1: Check Prerequisites
# ============================================================================

echo -e "${BLUE}📋 Step 1: Checking Prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm: $(npm --version)${NC}"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️  MySQL client not found (might be running in Docker)${NC}"
else
    echo -e "${GREEN}✅ MySQL: $(mysql --version)${NC}"
fi

# ============================================================================
# Step 2: Create Database Tables
# ============================================================================

echo ""
echo -e "${BLUE}📊 Step 2: Setting up Database...${NC}"

if [ -f ".env" ]; then
    source .env
    
    if [ ! -z "$DATABASE_URL" ]; then
        echo -e "${GREEN}✅ Database URL found in .env${NC}"
        
        # Run migration
        if [ -f "db/migrations/007_stamp_authentication_system.sql" ]; then
            echo -e "${BLUE}Running migration...${NC}"
            # Note: Adjust this based on your DB setup
            # mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < db/migrations/007_stamp_authentication_system.sql
            echo -e "${GREEN}✅ Migration file ready: db/migrations/007_stamp_authentication_system.sql${NC}"
            echo -e "${YELLOW}⚠️  Please run it manually or via your migration tool${NC}"
        fi
    else
        echo -e "${RED}❌ DATABASE_URL not found in .env${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# ============================================================================
# Step 3: Install Dependencies (if needed)
# ============================================================================

echo ""
echo -e "${BLUE}📦 Step 3: Checking Dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# ============================================================================
# Step 4: Verify Environment Variables
# ============================================================================

echo ""
echo -e "${BLUE}🔧 Step 4: Verifying Environment Variables...${NC}"

required_vars=(
    "POLYGON_RPC_URL"
    "NFT_CONTRACT_ADDRESS"
    "DEPLOYER_PRIVATE_KEY"
    "PINATA_JWT"
    "NFT_STORAGE_API_KEY"
    "DATABASE_URL"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
        echo -e "${RED}❌ $var is not set${NC}"
    else
        echo -e "${GREEN}✅ $var is set${NC}"
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Missing environment variables. Please add them to .env:${NC}"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    echo ""
    exit 1
fi

# ============================================================================
# Step 5: Check File Structure
# ============================================================================

echo ""
echo -e "${BLUE}📁 Step 5: Verifying File Structure...${NC}"

files_to_check=(
    "server/routers/stamp-authentication.ts"
    "client/src/components/StampUploadForm.tsx"
    "client/src/components/PhysicalTrade.tsx"
    "client/src/pages/upload.tsx"
    "client/src/pages/my-stamps.tsx"
    "db/migrations/007_stamp_authentication_system.sql"
)

all_files_exist=true

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file NOT FOUND${NC}"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    echo -e "${RED}❌ Some files are missing. Please check the installation.${NC}"
    exit 1
fi

# ============================================================================
# Step 6: TypeScript Compilation Check
# ============================================================================

echo ""
echo -e "${BLUE}🔨 Step 6: Checking TypeScript Compilation...${NC}"

if npm run check > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${YELLOW}⚠️  TypeScript has some errors. You may need to fix them.${NC}"
fi

# ============================================================================
# Step 7: Create Upload Directories
# ============================================================================

echo ""
echo -e "${BLUE}📂 Step 7: Creating Upload Directories...${NC}"

mkdir -p public/uploads/stamps
mkdir -p public/uploads/shipping
mkdir -p public/uploads/receipts

echo -e "${GREEN}✅ Upload directories created${NC}"

# ============================================================================
# Success Summary
# ============================================================================

echo ""
echo "
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║                     ✅ SETUP COMPLETE! ✅                               ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
"

echo -e "${GREEN}🎉 Stamp Authentication System is ready!${NC}"
echo ""
echo -e "${BLUE}📖 Next Steps:${NC}"
echo ""
echo "1️⃣  Run the database migration:"
echo "   ${YELLOW}mysql -u root -p your_database < db/migrations/007_stamp_authentication_system.sql${NC}"
echo ""
echo "2️⃣  Start the development server:"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "3️⃣  Open the application:"
echo "   ${YELLOW}http://localhost:3000${NC}"
echo ""
echo "4️⃣  Test the features:"
echo "   • Upload a stamp: ${YELLOW}http://localhost:3000/upload${NC}"
echo "   • View your stamps: ${YELLOW}http://localhost:3000/my-stamps${NC}"
echo "   • Browse marketplace: ${YELLOW}http://localhost:3000/marketplace${NC}"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   • Full Guide: ${YELLOW}STAMP_AUTHENTICATION_SYSTEM.md${NC}"
echo "   • Quick Reference: ${YELLOW}See the API section in the docs${NC}"
echo ""
echo -e "${GREEN}✨ Happy Trading! ✨${NC}"
echo ""

# ============================================================================
# Optional: Start Development Server
# ============================================================================

read -p "Do you want to start the development server now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}🚀 Starting development server...${NC}"
    npm run dev
fi
