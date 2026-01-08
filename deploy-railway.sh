#!/bin/bash

# ============================================
# Stampcoin Platform - Railway Deployment Script
# ============================================

set -e  # Exit on error

echo "🚀 Deploying Stampcoin Platform to Railway..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found!${NC}"
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo -e "${BLUE}📦 Step 1: Login to Railway${NC}"
railway login

echo ""
echo -e "${BLUE}📦 Step 2: Initialize Project${NC}"
read -p "Is this a new project? (y/n): " NEW_PROJECT

if [ "$NEW_PROJECT" = "y" ]; then
    railway init
    echo -e "${GREEN}✅ Project created${NC}"
else
    railway link
    echo -e "${GREEN}✅ Project linked${NC}"
fi

echo ""
echo -e "${BLUE}📦 Step 3: Add MySQL Database${NC}"
read -p "Add MySQL database? (y/n): " ADD_MYSQL

if [ "$ADD_MYSQL" = "y" ]; then
    echo "Adding MySQL service..."
    railway add mysql
    echo -e "${GREEN}✅ MySQL added${NC}"
    echo "⏳ Waiting for MySQL to initialize (30 seconds)..."
    sleep 30
fi

echo ""
echo -e "${BLUE}🔐 Step 4: Configure Environment Variables${NC}"

# Generate JWT Secret
JWT_SECRET=$(openssl rand -hex 32)
echo "Generated JWT_SECRET: $JWT_SECRET"

# Set environment variables
echo "Setting NODE_ENV..."
railway variables set NODE_ENV=production

echo "Setting JWT_SECRET..."
railway variables set JWT_SECRET=$JWT_SECRET

# Optional: Set DATABASE_URL if not using Railway MySQL
read -p "Use Railway MySQL? (y/n): " USE_RAILWAY_MYSQL
if [ "$USE_RAILWAY_MYSQL" = "n" ]; then
    read -p "Enter DATABASE_URL: " DB_URL
    railway variables set DATABASE_URL=$DB_URL
else
    echo "Using Railway MySQL (DATABASE_URL set automatically)"
    railway variables set DATABASE_URL='${{MySQL.DATABASE_URL}}'
fi

# Optional: Stripe
read -p "Configure Stripe? (y/n): " CONFIG_STRIPE
if [ "$CONFIG_STRIPE" = "y" ]; then
    read -p "Enter STRIPE_SECRET_KEY: " STRIPE_KEY
    read -p "Enter STRIPE_PUBLISHABLE_KEY: " STRIPE_PUB
    railway variables set STRIPE_SECRET_KEY=$STRIPE_KEY
    railway variables set STRIPE_PUBLISHABLE_KEY=$STRIPE_PUB
fi

# Optional: AWS S3
read -p "Configure AWS S3? (y/n): " CONFIG_AWS
if [ "$CONFIG_AWS" = "y" ]; then
    read -p "Enter AWS_ACCESS_KEY_ID: " AWS_KEY
    read -p "Enter AWS_SECRET_ACCESS_KEY: " AWS_SECRET
    read -p "Enter AWS_REGION (default: us-east-1): " AWS_REGION
    AWS_REGION=${AWS_REGION:-us-east-1}
    read -p "Enter AWS_S3_BUCKET: " S3_BUCKET
    
    railway variables set AWS_ACCESS_KEY_ID=$AWS_KEY
    railway variables set AWS_SECRET_ACCESS_KEY=$AWS_SECRET
    railway variables set AWS_REGION=$AWS_REGION
    railway variables set AWS_S3_BUCKET=$S3_BUCKET
fi

echo -e "${GREEN}✅ Environment variables configured${NC}"

echo ""
echo -e "${BLUE}📤 Step 5: Deploy Application${NC}"
railway up

echo ""
echo -e "${BLUE}🔄 Step 6: Run Database Migrations${NC}"
read -p "Run migrations now? (y/n): " RUN_MIGRATIONS

if [ "$RUN_MIGRATIONS" = "y" ]; then
    echo "Running migrations..."
    railway run npm run db:push
    echo -e "${GREEN}✅ Migrations complete${NC}"
    
    read -p "Seed database with 50 stamps? (y/n): " SEED_DB
    if [ "$SEED_DB" = "y" ]; then
        echo "Seeding database..."
        railway run npx tsx ./server/seed-stamp-data.ts
        echo -e "${GREEN}✅ Database seeded with 50 stamps${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📊 View deployment status:"
railway status

echo ""
echo "🌐 Open application:"
railway open

echo ""
echo "📝 View logs:"
echo "  railway logs"

echo ""
echo "🔧 Manage project:"
echo "  https://railway.app/dashboard"

echo ""
echo -e "${GREEN}🎉 Stampcoin Platform is now live!${NC}"
