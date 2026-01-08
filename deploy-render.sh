#!/bin/bash

# ============================================
# Stampcoin Platform - Render.com Deployment Script
# ============================================

set -e

echo "🚀 Deploying Stampcoin Platform to Render..."
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  Note: Render uses PostgreSQL, not MySQL${NC}"
echo "This script will help you prepare for PostgreSQL migration"
echo ""

# Step 1: Database Schema Conversion
echo -e "${BLUE}📦 Step 1: Convert Database Schema${NC}"
echo "Updating drizzle.config.ts for PostgreSQL..."

cat > drizzle.config.ts << 'EOF'
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
EOF

echo -e "${GREEN}✅ drizzle.config.ts updated${NC}"

# Step 2: Update Dependencies
echo ""
echo -e "${BLUE}📦 Step 2: Update Dependencies${NC}"
echo "Updating package.json for PostgreSQL..."

# Backup package.json
cp package.json package.json.backup

# Update dependencies using npm
npm uninstall mysql2
npm install postgres drizzle-orm@latest

echo -e "${GREEN}✅ Dependencies updated${NC}"

# Step 3: Manual Instructions
echo ""
echo -e "${BLUE}📦 Step 3: Manual Configuration Required${NC}"
echo ""
echo "Please complete these steps manually:"
echo ""
echo "1️⃣  Update server/db.ts:"
echo "   ${YELLOW}Replace:${NC}"
echo "     import { drizzle } from 'drizzle-orm/mysql2';"
echo "     import mysql from 'mysql2/promise';"
echo "   ${YELLOW}With:${NC}"
echo "     import { drizzle } from 'drizzle-orm/postgres-js';"
echo "     import postgres from 'postgres';"
echo ""
echo "2️⃣  Update connection code:"
echo "   ${YELLOW}Replace:${NC}"
echo "     const pool = mysql.createPool(process.env.DATABASE_URL!);"
echo "     export const db = drizzle(pool);"
echo "   ${YELLOW}With:${NC}"
echo "     const queryClient = postgres(process.env.DATABASE_URL!);"
echo "     export const db = drizzle(queryClient);"
echo ""
echo "3️⃣  Update drizzle/schema.ts:"
echo "   ${YELLOW}Replace all:${NC}"
echo "     mysqlTable → pgTable"
echo "     mysqlEnum → pgEnum"
echo "     int() → integer()"
echo "     varchar() → text() or varchar()"
echo "     timestamp() → timestamp()"
echo ""

read -p "Press Enter after completing manual changes..."

# Step 4: Render Setup Instructions
echo ""
echo -e "${BLUE}📦 Step 4: Render.com Setup${NC}"
echo ""
echo "🌐 Go to: https://render.com/dashboard"
echo ""
echo "1️⃣  Create PostgreSQL Database:"
echo "   - New + → PostgreSQL"
echo "   - Name: stampcoin-db"
echo "   - Plan: Free (512 MB)"
echo "   - Click Create Database"
echo ""
echo "2️⃣  Create Web Service:"
echo "   - New + → Web Service"
echo "   - Connect your GitHub repo"
echo "   - Name: stampcoin-platform"
echo "   - Region: Oregon (US West)"
echo "   - Branch: main"
echo "   - Runtime: Node"
echo "   - Build Command: npm install && npm run build && npm run build:frontend"
echo "   - Start Command: npm start"
echo "   - Plan: Starter ($7/month)"
echo ""
echo "3️⃣  Environment Variables (in Web Service):"
echo "   DATABASE_URL = \${{stampcoin-db.DATABASE_URL}}"
echo "   NODE_ENV = production"
echo "   JWT_SECRET = $(openssl rand -hex 32)"
echo ""
read -p "Enter STRIPE_SECRET_KEY (or press Enter to skip): " STRIPE_KEY
if [ ! -z "$STRIPE_KEY" ]; then
    echo "   STRIPE_SECRET_KEY = $STRIPE_KEY"
fi

read -p "Enter AWS_ACCESS_KEY_ID (or press Enter to skip): " AWS_KEY
if [ ! -z "$AWS_KEY" ]; then
    echo "   AWS_ACCESS_KEY_ID = $AWS_KEY"
    read -p "Enter AWS_SECRET_ACCESS_KEY: " AWS_SECRET
    echo "   AWS_SECRET_ACCESS_KEY = $AWS_SECRET"
    echo "   AWS_REGION = us-east-1"
    read -p "Enter AWS_S3_BUCKET: " S3_BUCKET
    echo "   AWS_S3_BUCKET = $S3_BUCKET"
fi

echo ""
echo "4️⃣  After deployment:"
echo "   - Go to Web Service → Shell"
echo "   - Run: npm run db:push"
echo "   - Run: npx tsx ./server/seed-stamp-data.ts"
echo ""

# Step 5: Commit Changes
echo ""
echo -e "${BLUE}📦 Step 5: Commit Changes${NC}"
read -p "Commit and push changes to GitHub? (y/n): " COMMIT

if [ "$COMMIT" = "y" ]; then
    git add drizzle.config.ts package.json package-lock.json
    git commit -m "feat: migrate to PostgreSQL for Render deployment"
    git push origin main
    echo -e "${GREEN}✅ Changes pushed to GitHub${NC}"
    echo "Render will automatically deploy from GitHub"
fi

echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "📝 Next Steps:"
echo "  1. Go to https://render.com/dashboard"
echo "  2. Create PostgreSQL database"
echo "  3. Create Web Service"
echo "  4. Configure environment variables"
echo "  5. Deploy!"
echo ""
echo "📚 Full guide: PRODUCTION_DEPLOYMENT_GUIDE.md"
echo ""
echo -e "${GREEN}🎉 Good luck with your deployment!${NC}"
