#!/bin/bash

# StampCoin Platform - Railway.app Deployment

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       StampCoin Platform - Railway Deployment Guide        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📋 Prerequisites:${NC}"
echo "   ✅ GitHub account (for authentication)"
echo "   ✅ Railway.app account (free tier available)"
echo "   ✅ Domain name (optional, Railway provides free .railway.app)"
echo ""

echo -e "${BLUE}Step 1: Create Railway Account${NC}"
echo "   1. Go to: https://railway.app"
echo "   2. Click 'Login with GitHub'"
echo "   3. Authorize Railway"
echo "   4. You're logged in!"
echo ""

echo -e "${BLUE}Step 2: Create New Project${NC}"
echo "   1. Click 'Create New Project'"
echo "   2. Select 'Deploy from GitHub repo'"
echo "   3. Choose 'Stampcoin-platform' repository"
echo "   4. Click 'Deploy'"
echo ""

echo -e "${BLUE}Step 3: Configure Environment${NC}"
echo "   1. Go to Variables tab"
echo "   2. Add these environment variables:"
echo ""
cat << 'ENV'
NODE_ENV=production
PORT=3000
JWT_SECRET=your_production_secret_64_chars
DATABASE_URL=mysql://user:password@mysql.railway.internal:3306/stampcoin
POLYGON_RPC_URL=https://polygon-rpc.com
NFT_CONTRACT_ADDRESS=0x0E903614e8Fb61B5D36734D7B435088C5d68B963
DEPLOYER_PRIVATE_KEY=your_private_key_here
DEPLOYER_WALLET=0xbf725439B03B9AB013200c6eF1E2d1Fb395F46fE

# IPFS
PINATA_API_KEY=your_pinata_key
PINATA_API_SECRET=your_pinata_secret
NFT_STORAGE_API_KEY=your_nft_storage_key

# AI Services
GOOGLE_VISION_API_KEY=your_google_key
AZURE_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_VISION_KEY=your_azure_key

# Payment
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=stampcoin-production

# OAuth
OAUTH_BASE_URL=https://your-domain.railway.app
ENV
echo ""

echo -e "${BLUE}Step 4: Add MySQL Database${NC}"
echo "   1. In Railway dashboard, click 'Add Service'"
echo "   2. Select 'MySQL'"
echo "   3. Wait for setup (~2 minutes)"
echo "   4. Click 'Connect' - it auto-fills DATABASE_URL!"
echo ""

echo -e "${BLUE}Step 5: Run Database Migrations${NC}"
echo "   1. Go to 'Settings' → 'Data'"
echo "   2. Get SSH access info"
echo "   3. Or, commit and push to trigger:"
echo ""
echo "   git add ."
echo "   git commit -m 'Deploy to Railway'"
echo "   git push origin main"
echo ""

echo -e "${BLUE}Step 6: Verify Deployment${NC}"
echo "   1. Railway shows deployment logs"
echo "   2. Green checkmark = Success ✅"
echo "   3. Access at: https://stampcoin-platform.railway.app"
echo ""

echo -e "${BLUE}Step 7: Setup Custom Domain (Optional)${NC}"
echo "   1. Go to 'Settings' → 'Domains'"
echo "   2. Add your domain"
echo "   3. Update DNS records (Railway shows instructions)"
echo "   4. Wait ~10 minutes for SSL certificate"
echo ""

echo -e "${BLUE}🎯 Deployment Status:${NC}"
echo ""

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    echo -e "${GREEN}✅ Railway CLI installed${NC}"
    echo ""
    echo "You can also deploy via CLI:"
    echo "  railway login"
    echo "  railway link (select project)"
    echo "  railway up"
else
    echo -e "${YELLOW}Install Railway CLI (optional):${NC}"
    echo "  npm i -g @railway/cli"
fi

echo ""
echo -e "${BLUE}💰 Railway Pricing:${NC}"
echo "   • Free tier: \$5/month credits"
echo "   • Good for small projects"
echo "   • MySQL: Included"
echo "   • Scale up as needed"
echo ""

echo -e "${BLUE}🚀 After Deployment:${NC}"
echo "   1. Update OAUTH_BASE_URL to your domain"
echo "   2. Test all features"
echo "   3. Monitor logs for errors"
echo "   4. Setup alerts (optional)"
echo ""

echo -e "${YELLOW}⚠️  Security Checklist:${NC}"
echo "   ☐ Don't commit .env to GitHub"
echo "   ☐ Use strong JWT_SECRET (generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
echo "   ☐ Keep private keys secure"
echo "   ☐ Enable 2FA on all accounts"
echo "   ☐ Monitor API key usage"
echo ""

echo -e "${BLUE}📞 Support:${NC}"
echo "   • Railway Docs: https://docs.railway.app"
echo "   • Discord: https://discord.gg/railway"
echo "   • GitHub Issues: Check Stampcoin repo"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ Ready to Deploy!                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
