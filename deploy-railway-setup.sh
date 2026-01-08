#!/bin/bash

# ============================================
# Stampcoin Platform - Railway Deployment Setup
# Manual Configuration Guide
# ============================================

set -e

echo "🚀 Stampcoin Platform - Railway Deployment Setup"
echo ""
echo "ℹ️  Since you're running in a dev environment,"
echo "   please follow these steps manually on your machine:"
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

cat << 'EOF'

================================================================================
📋 RAILWAY DEPLOYMENT CHECKLIST
================================================================================

STEP 1: Prerequisites
=====================
- Install Node.js 22+ on your local machine
- Install Railway CLI: npm install -g @railway/cli
- Create GitHub account (if not already)
- Push this repository to GitHub (if not already)

STEP 2: Create Railway Account
==============================
1. Go to: https://railway.app
2. Sign up with GitHub
3. Authorize Railway to access your GitHub

STEP 3: Create Railway Project
==============================
1. Dashboard → New Project
2. Select "Deploy from GitHub"
3. Choose your repository: Stampcoin-platform
4. Click "Deploy Now"

STEP 4: Add MySQL Database
==========================
1. Go to your Railway project
2. Click "+ Add Service"
3. Search for "MySQL"
4. Click "Add"
5. Wait 1-2 minutes for initialization

STEP 5: Configure Environment Variables
========================================
Go to your Railway project → Variables
Add these variables:

REQUIRED:
  DATABASE_URL = ${{MySQL.DATABASE_URL}}
  NODE_ENV = production
  JWT_SECRET = (generate: openssl rand -hex 32)

STRIPE (if using payments):
  STRIPE_SECRET_KEY = sk_live_...
  STRIPE_PUBLISHABLE_KEY = pk_live_...

AWS S3 (if using file uploads):
  AWS_ACCESS_KEY_ID = AKIA...
  AWS_SECRET_ACCESS_KEY = ...
  AWS_REGION = us-east-1
  AWS_S3_BUCKET = stampcoin-uploads

POLYGON (if using NFTs):
  POLYGON_RPC_URL = https://polygon-mainnet.g.alchemy.com/v2/...
  NFT_CONTRACT_ADDRESS = 0x...

STEP 6: Deploy
==============
After adding variables, Railway will auto-deploy from GitHub.

Monitor deployment:
1. Go to your Railway project
2. Click on your deployment
3. Wait for "Build Successful" and "Running"

STEP 7: Configure Start Command
================================
1. Railway Project → Service Settings
2. Start Command: node dist/index.js
3. Build Command: npm run build && npm run build:frontend
4. Save

STEP 8: Run Initial Setup
==========================
1. Click "Shell" tab in your Railway service
2. Run migrations: npm run db:push
3. Seed database: npx tsx ./server/seed-stamp-data.ts
4. Check status: curl http://localhost:3000/api/health

STEP 9: Add Custom Domain (Optional)
====================================
1. Railway Project → Settings → Custom Domain
2. Add your domain or use Railway's provided domain
3. Configure DNS if using custom domain

STEP 10: Monitor & Verify
=========================
Your app should now be live!

Test endpoints:
- Health Check: https://yourdomain.com/api/health
- Collections: https://yourdomain.com/collections
- Admin Dashboard: https://yourdomain.com/admin/dashboard

Check logs:
- Railway Dashboard → Logs tab

================================================================================
🎯 AUTOMATION: Run from Local Machine
================================================================================

If you want to use the automated script:

1. On your local machine:

  # Install Railway CLI
  npm install -g @railway/cli
  
  # Login to Railway
  railway login
  
  # Clone and navigate to project
  git clone https://github.com/YOUR_USERNAME/Stampcoin-platform.git
  cd Stampcoin-platform
  
  # Run deployment script
  ./deploy-railway.sh

2. Follow the interactive prompts

================================================================================
📞 NEED HELP?
================================================================================

Documentation:
  - Full Guide: PRODUCTION_DEPLOYMENT_GUIDE.md
  - Quick Guide: QUICK_DEPLOY.md
  - Env Variables: ENV_VARIABLES.md

Railway Support:
  - Docs: https://docs.railway.app
  - Discord: https://discord.gg/railway
  - Status: https://status.railway.app

================================================================================
🎉 WHAT HAPPENS NEXT?
================================================================================

After deployment, you'll have:
  ✅ Production server running
  ✅ Database with 50 stamps
  ✅ StampCoin currency (500K STMP)
  ✅ All systems operational
  ✅ Automatic SSL/TLS
  ✅ Global CDN
  ✅ Automatic backups

Monthly Cost:
  - Railway: $15-20
  - Total: $15-20/month

================================================================================

EOF

echo ""
echo -e "${GREEN}✅ Setup guide prepared!${NC}"
echo ""
echo "Next steps:"
echo "  1. Go to https://railway.app"
echo "  2. Sign in with GitHub"
echo "  3. Create new project → Deploy from GitHub"
echo "  4. Select: Stampcoin-platform repository"
echo "  5. Add MySQL database"
echo "  6. Configure environment variables"
echo "  7. Deploy!"
echo ""
echo "Or run locally with: railway login && ./deploy-railway.sh"
echo ""
