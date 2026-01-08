#!/bin/bash

# ============================================
# Stampcoin Platform - Vercel + PlanetScale Deployment
# ============================================

set -e

echo "🚀 Deploying Stampcoin Platform to Vercel + PlanetScale..."
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo -e "${BLUE}📦 Step 1: PlanetScale Database Setup${NC}"
echo ""
echo "🌐 Go to: https://planetscale.com/signup"
echo ""
echo "1️⃣  Create account and login"
echo "2️⃣  Create new database:"
echo "   - Name: stampcoin-db"
echo "   - Region: AWS us-east-1"
echo "   - Plan: Hobby (Free)"
echo ""
echo "3️⃣  Get connection string:"
echo "   - Dashboard → stampcoin-db → Connect"
echo "   - Select: Node.js"
echo "   - Copy connection string (looks like):"
echo "     mysql://user:pass@aws.connect.psdb.cloud/stampcoin-db?ssl={...}"
echo ""

read -p "Enter PlanetScale DATABASE_URL: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  No DATABASE_URL provided. Please set it later in Vercel.${NC}"
else
    echo -e "${GREEN}✅ DATABASE_URL saved${NC}"
fi

# Step 2: Run Migrations Locally
echo ""
echo -e "${BLUE}📦 Step 2: Setup Database Schema${NC}"

if [ ! -z "$DATABASE_URL" ]; then
    read -p "Run migrations now? (y/n): " RUN_MIGRATIONS
    
    if [ "$RUN_MIGRATIONS" = "y" ]; then
        echo "Setting DATABASE_URL temporarily..."
        export DATABASE_URL=$DATABASE_URL
        
        echo "Running migrations..."
        npm run db:push
        echo -e "${GREEN}✅ Migrations complete${NC}"
        
        read -p "Seed database with 50 stamps? (y/n): " SEED_DB
        if [ "$SEED_DB" = "y" ]; then
            echo "Seeding database..."
            npx tsx ./server/seed-stamp-data.ts
            echo -e "${GREEN}✅ Database seeded${NC}"
        fi
    fi
fi

# Step 3: Create vercel.json
echo ""
echo -e "${BLUE}📦 Step 3: Configure Vercel${NC}"
echo "Creating vercel.json..."

cat > vercel.json << 'EOF'
{
  "version": 2,
  "buildCommand": "npm run build && npm run build:frontend",
  "installCommand": "npm install",
  "outputDirectory": "dist/client",
  "builds": [
    {
      "src": "dist/client/**",
      "use": "@vercel/static"
    },
    {
      "src": "server/_core/index.ts",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["server/**", "drizzle/**", "dist/**"]
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/_core/index.ts"
    },
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
EOF

echo -e "${GREEN}✅ vercel.json created${NC}"

# Step 4: Vercel Login
echo ""
echo -e "${BLUE}📦 Step 4: Login to Vercel${NC}"
vercel login

# Step 5: Deploy
echo ""
echo -e "${BLUE}📦 Step 5: Deploy to Vercel${NC}"

read -p "Deploy now? (y/n): " DEPLOY_NOW

if [ "$DEPLOY_NOW" = "y" ]; then
    echo "Deploying..."
    vercel --prod
    
    echo ""
    echo -e "${GREEN}✅ Deployment initiated!${NC}"
else
    echo "You can deploy later with: vercel --prod"
fi

# Step 6: Environment Variables
echo ""
echo -e "${BLUE}📦 Step 6: Configure Environment Variables${NC}"
echo ""
echo "🌐 Go to: https://vercel.com/dashboard"
echo ""
echo "Navigate to your project → Settings → Environment Variables"
echo ""
echo "Add the following variables:"
echo ""
echo "Required:"
echo "  DATABASE_URL = $DATABASE_URL"
echo "  NODE_ENV = production"
echo "  JWT_SECRET = $(openssl rand -hex 32)"
echo ""

read -p "Configure Stripe? (y/n): " CONFIG_STRIPE
if [ "$CONFIG_STRIPE" = "y" ]; then
    read -p "Enter STRIPE_SECRET_KEY: " STRIPE_KEY
    read -p "Enter STRIPE_PUBLISHABLE_KEY: " STRIPE_PUB
    echo ""
    echo "Stripe:"
    echo "  STRIPE_SECRET_KEY = $STRIPE_KEY"
    echo "  STRIPE_PUBLISHABLE_KEY = $STRIPE_PUB"
    echo ""
fi

read -p "Configure AWS S3? (y/n): " CONFIG_AWS
if [ "$CONFIG_AWS" = "y" ]; then
    read -p "Enter AWS_ACCESS_KEY_ID: " AWS_KEY
    read -p "Enter AWS_SECRET_ACCESS_KEY: " AWS_SECRET
    read -p "Enter AWS_S3_BUCKET: " S3_BUCKET
    echo ""
    echo "AWS S3:"
    echo "  AWS_ACCESS_KEY_ID = $AWS_KEY"
    echo "  AWS_SECRET_ACCESS_KEY = $AWS_SECRET"
    echo "  AWS_REGION = us-east-1"
    echo "  AWS_S3_BUCKET = $S3_BUCKET"
    echo ""
fi

# Step 7: Custom Domain (Optional)
echo ""
echo -e "${BLUE}📦 Step 7: Custom Domain (Optional)${NC}"
echo ""
read -p "Add custom domain? (y/n): " ADD_DOMAIN

if [ "$ADD_DOMAIN" = "y" ]; then
    read -p "Enter your domain (e.g., stampcoin.com): " DOMAIN
    echo ""
    echo "To add custom domain:"
    echo "1. Go to Vercel Dashboard → Your Project → Settings → Domains"
    echo "2. Add domain: $DOMAIN"
    echo "3. Configure DNS records as shown by Vercel"
    echo ""
fi

# Step 8: Final Steps
echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "📊 Your deployment:"
PROJECT_URL=$(vercel ls 2>/dev/null | grep stampcoin | head -1 | awk '{print $2}')
if [ ! -z "$PROJECT_URL" ]; then
    echo "  🌐 URL: https://$PROJECT_URL"
else
    echo "  🌐 Check: https://vercel.com/dashboard"
fi

echo ""
echo "📝 Next Steps:"
echo "  1. Set environment variables in Vercel Dashboard"
echo "  2. Trigger new deployment (if needed): vercel --prod"
echo "  3. Test your app: visit the URL above"
echo "  4. Monitor logs: vercel logs"
echo ""
echo "📚 Full guide: PRODUCTION_DEPLOYMENT_GUIDE.md"
echo ""
echo -e "${GREEN}🎉 Congratulations on your deployment!${NC}"
