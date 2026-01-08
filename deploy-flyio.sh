#!/bin/bash

###############################################################################
# Fly.io Deployment Script for Stampcoin Platform
# سكريبت نشر منصة StampCoin على Fly.io
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="stampcoin-platform"
DB_NAME="stampcoin-db"
REGION="fra"  # Frankfurt, Europe
MEMORY="1gb"
CPU_KIND="shared"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  🚀 Fly.io Deployment for Stampcoin Platform${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}→ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

###############################################################################
# Check Prerequisites
###############################################################################

check_prerequisites() {
    print_header
    print_step "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Please install Docker from: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    print_success "Docker found"
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    print_success "Git found"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    print_success "Node.js found: $(node --version)"
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        print_step "Installing pnpm..."
        npm install -g pnpm
    fi
    print_success "pnpm found: $(pnpm --version)"
}

###############################################################################
# Install Fly.io CLI
###############################################################################

install_flyio() {
    if command -v flyctl &> /dev/null; then
        print_success "Fly.io CLI already installed: $(flyctl version)"
        return
    fi
    
    print_step "Installing Fly.io CLI..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -L https://fly.io/install.sh | sh
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install flyctl
    else
        print_error "Unsupported OS. Please install Fly.io CLI manually:"
        echo "https://fly.io/docs/getting-started/installing-flyctl/"
        exit 1
    fi
    
    print_success "Fly.io CLI installed"
}

###############################################################################
# Authenticate with Fly.io
###############################################################################

authenticate_flyio() {
    print_step "Authenticating with Fly.io..."
    
    # Check if already authenticated
    if flyctl auth whoami &> /dev/null; then
        print_success "Already authenticated as: $(flyctl auth whoami)"
        return
    fi
    
    print_info "You'll be redirected to the browser to login"
    flyctl auth login
    print_success "Authentication successful"
}

###############################################################################
# Create or Update App
###############################################################################

setup_app() {
    print_step "Setting up Fly.io app..."
    
    # Check if app already exists
    if flyctl app list | grep -q "^$APP_NAME"; then
        print_info "App '$APP_NAME' already exists. Skipping creation."
        return
    fi
    
    print_step "Creating new Fly.io app: $APP_NAME"
    
    # Create app
    flyctl launch \
        --name "$APP_NAME" \
        --region "$REGION" \
        --skip-deploy \
        --no-cache \
        --generate-name=false 2>/dev/null || true
    
    print_success "App '$APP_NAME' created/updated"
}

###############################################################################
# Setup PostgreSQL Database
###############################################################################

setup_database() {
    print_step "Setting up PostgreSQL database..."
    
    # Check if database already exists
    if flyctl postgres list 2>/dev/null | grep -q "^$DB_NAME"; then
        print_info "Database '$DB_NAME' already exists"
        
        # Check if it's already attached
        if flyctl config show 2>/dev/null | grep -q "DATABASE_URL"; then
            print_success "Database already attached"
            return
        fi
    else
        print_step "Creating PostgreSQL cluster: $DB_NAME"
        
        flyctl postgres create \
            --name "$DB_NAME" \
            --initial-cluster-size 1 \
            --vm-size shared-cpu-1x \
            --region "$REGION" \
            --skip-confirmation || true
    fi
    
    # Attach database
    print_step "Attaching database to app..."
    flyctl postgres attach "$DB_NAME" \
        --app "$APP_NAME" \
        --skip-confirmation 2>/dev/null || true
    
    print_success "PostgreSQL database setup complete"
}

###############################################################################
# Set Environment Variables
###############################################################################

setup_environment() {
    print_step "Setting up environment variables..."
    
    # Generate JWT Secret
    print_step "Generating JWT_SECRET..."
    JWT_SECRET=$(openssl rand -hex 32)
    
    # Set secrets
    echo ""
    print_info "Setting environment variables..."
    
    flyctl secrets set \
        NODE_ENV=production \
        JWT_SECRET="$JWT_SECRET" \
        --app "$APP_NAME" 2>/dev/null || true
    
    print_success "NODE_ENV and JWT_SECRET set"
    
    # Optional: Stripe
    echo ""
    read -p "$(echo -e ${YELLOW}Configure Stripe? (y/n)${NC} )" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter Stripe Secret Key (sk_live_...): " stripe_key
        if [ ! -z "$stripe_key" ]; then
            flyctl secrets set \
                STRIPE_SECRET_KEY="$stripe_key" \
                --app "$APP_NAME" 2>/dev/null || true
            print_success "Stripe Secret Key set"
        fi
        
        read -p "Enter Stripe Publishable Key (pk_live_...): " stripe_pub
        if [ ! -z "$stripe_pub" ]; then
            flyctl secrets set \
                STRIPE_PUBLISHABLE_KEY="$stripe_pub" \
                --app "$APP_NAME" 2>/dev/null || true
            print_success "Stripe Publishable Key set"
        fi
    fi
    
    # Optional: AWS S3
    echo ""
    read -p "$(echo -e ${YELLOW}Configure AWS S3? (y/n)${NC} )" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter AWS Access Key ID: " aws_key
        read -p "Enter AWS Secret Access Key: " aws_secret
        read -p "Enter AWS Region (us-east-1): " aws_region
        read -p "Enter S3 Bucket Name: " aws_bucket
        
        if [ ! -z "$aws_key" ] && [ ! -z "$aws_secret" ]; then
            flyctl secrets set \
                AWS_ACCESS_KEY_ID="$aws_key" \
                AWS_SECRET_ACCESS_KEY="$aws_secret" \
                AWS_REGION="${aws_region:-us-east-1}" \
                AWS_S3_BUCKET="${aws_bucket:-stampcoin-uploads}" \
                --app "$APP_NAME" 2>/dev/null || true
            print_success "AWS credentials set"
        fi
    fi
    
    print_success "Environment configuration complete"
}

###############################################################################
# Install Dependencies
###############################################################################

install_dependencies() {
    print_step "Installing project dependencies..."
    
    cd /workspaces/Stampcoin-platform
    
    if [ ! -d "node_modules" ]; then
        pnpm install
        print_success "Dependencies installed"
    else
        print_success "Dependencies already installed"
    fi
}

###############################################################################
# Deploy Application
###############################################################################

deploy_application() {
    print_step "Deploying application to Fly.io..."
    
    cd /workspaces/Stampcoin-platform
    
    flyctl deploy \
        --app "$APP_NAME" \
        --remote-only
    
    print_success "Application deployed successfully!"
}

###############################################################################
# Run Migrations
###############################################################################

run_migrations() {
    echo ""
    read -p "$(echo -e ${YELLOW}Run database migrations? (y/n)${NC} )" -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi
    
    print_step "Running migrations..."
    
    # Connect and run migrations
    flyctl ssh console --app "$APP_NAME" <<'EOF'
npm run db:push
echo "Migrations completed"
exit
EOF
    
    print_success "Migrations completed"
}

###############################################################################
# Seed Database
###############################################################################

seed_database() {
    echo ""
    read -p "$(echo -e ${YELLOW}Seed database with initial data? (y/n)${NC} )" -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi
    
    print_step "Seeding database..."
    
    flyctl ssh console --app "$APP_NAME" <<'EOF'
npx tsx ./server/seed-stamp-data.ts
echo "Database seeded"
exit
EOF
    
    print_success "Database seeded with data"
}

###############################################################################
# Post-Deployment Info
###############################################################################

post_deployment_info() {
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ Deployment Complete!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    APP_URL="https://$APP_NAME.fly.dev"
    
    echo -e "${BLUE}📱 App URL:${NC} $APP_URL"
    echo -e "${BLUE}🏥 Health Check:${NC} $APP_URL/api/health"
    echo ""
    
    echo -e "${YELLOW}📝 Useful Commands:${NC}"
    echo "   View logs:        flyctl logs --app $APP_NAME"
    echo "   SSH console:      flyctl ssh console --app $APP_NAME"
    echo "   Open app:         flyctl open --app $APP_NAME"
    echo "   Restart:          flyctl restart --app $APP_NAME"
    echo "   View status:      flyctl status --app $APP_NAME"
    echo "   View metrics:     flyctl metrics --app $APP_NAME"
    echo ""
    
    echo -e "${YELLOW}🔧 Database Commands:${NC}"
    echo "   Connect to DB:    flyctl postgres connect --app $DB_NAME"
    echo "   DB status:        flyctl postgres status $DB_NAME"
    echo "   Backups:          flyctl postgres backups list $DB_NAME"
    echo ""
    
    echo -e "${YELLOW}🚀 Next Steps:${NC}"
    echo "   1. Test the health endpoint: curl $APP_URL/api/health"
    echo "   2. Visit the app in browser:  $APP_URL"
    echo "   3. Add custom domain (optional)"
    echo "   4. Configure monitoring (optional)"
    echo "   5. Set up CI/CD pipeline (optional)"
    echo ""
    
    echo -e "${BLUE}📚 Documentation:${NC}"
    echo "   Fly.io Docs: https://fly.io/docs/"
    echo "   Dashboard:   https://fly.io/dashboard/"
    echo ""
}

###############################################################################
# Error Handler
###############################################################################

error_handler() {
    local line_no=$1
    print_error "Deployment failed at line $line_no"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "1. Check Fly.io status:     flyctl status"
    echo "2. View detailed logs:      flyctl logs --app $APP_NAME"
    echo "3. Check database:          flyctl postgres status $DB_NAME"
    echo "4. Restart application:     flyctl restart --app $APP_NAME"
    echo ""
    echo "For more help, visit: https://fly.io/docs/"
    exit 1
}

trap 'error_handler $LINENO' ERR

###############################################################################
# Main Execution
###############################################################################

main() {
    check_prerequisites
    install_flyio
    authenticate_flyio
    setup_app
    setup_database
    setup_environment
    install_dependencies
    deploy_application
    
    # Post-deployment steps
    read -p "$(echo -e ${YELLOW}Run post-deployment tasks (migrations, seeding)? (y/n)${NC} )" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_migrations
        seed_database
    fi
    
    post_deployment_info
}

# Run main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi

echo ""
echo -e "${BLUE}📦 Step 3: Add PostgreSQL Database${NC}"
read -p "Add PostgreSQL database? (y/n): " ADD_DB

if [ "$ADD_DB" = "y" ]; then
    echo "Creating PostgreSQL database..."
    flyctl postgres create \
        --name stampcoin-db \
        --initial-cluster-size 1 \
        --vm-size shared-cpu-1x \
        --region fra
    echo -e "${GREEN}✅ Database created${NC}"
    
    # Attach database
    APP_NAME=$(grep '^app = ' fly.toml | cut -d'"' -f2)
    flyctl postgres attach stampcoin-db --app $APP_NAME
    echo "DATABASE_URL will be set automatically"
fi

echo ""
echo -e "${BLUE}🔐 Step 4: Set Environment Variables${NC}"

# JWT Secret
JWT_SECRET=$(openssl rand -hex 32)
echo "Setting JWT_SECRET..."
flyctl secrets set JWT_SECRET=$JWT_SECRET

# Node Environment
echo "Setting NODE_ENV..."
flyctl secrets set NODE_ENV=production

# Optional: Stripe
read -p "Configure Stripe? (y/n): " CONFIG_STRIPE
if [ "$CONFIG_STRIPE" = "y" ]; then
    read -p "Enter STRIPE_SECRET_KEY: " STRIPE_KEY
    read -p "Enter STRIPE_PUBLISHABLE_KEY: " STRIPE_PUB
    flyctl secrets set \
        STRIPE_SECRET_KEY=$STRIPE_KEY \
        STRIPE_PUBLISHABLE_KEY=$STRIPE_PUB
    echo -e "${GREEN}✅ Stripe configured${NC}"
fi

# Optional: AWS S3
read -p "Configure AWS S3? (y/n): " CONFIG_AWS
if [ "$CONFIG_AWS" = "y" ]; then
    read -p "Enter AWS_ACCESS_KEY_ID: " AWS_KEY
    read -p "Enter AWS_SECRET_ACCESS_KEY: " AWS_SECRET
    read -p "Enter AWS_S3_BUCKET: " S3_BUCKET
    flyctl secrets set \
        AWS_ACCESS_KEY_ID=$AWS_KEY \
        AWS_SECRET_ACCESS_KEY=$AWS_SECRET \
        AWS_REGION=us-east-1 \
        AWS_S3_BUCKET=$S3_BUCKET
    echo -e "${GREEN}✅ AWS configured${NC}"
fi

echo ""
echo -e "${BLUE}📤 Step 5: Build and Deploy${NC}"
read -p "Deploy now? (y/n): " DEPLOY

if [ "$DEPLOY" = "y" ]; then
    echo "Building and deploying..."
    flyctl deploy
    
    echo ""
    echo -e "${GREEN}✅ Deployment started!${NC}"
    echo "Monitoring deployment..."
    flyctl logs
else
    echo "You can deploy later with: flyctl deploy"
fi

echo ""
echo -e "${BLUE}🔄 Step 6: Run Migrations${NC}"
read -p "Run migrations now? (y/n): " RUN_MIGRATIONS

if [ "$RUN_MIGRATIONS" = "y" ]; then
    echo "Running migrations..."
    flyctl ssh console
    # In the SSH console:
    # npm run db:push
    # npx tsx ./server/seed-stamp-data.ts
    echo ""
    echo "In the SSH console, run:"
    echo "  npm run db:push"
    echo "  npx tsx ./server/seed-stamp-data.ts"
fi

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "🌐 Your app is live at:"
APP_NAME=$(grep '^app = ' fly.toml | cut -d'"' -f2)
echo "  https://$APP_NAME.fly.dev"
echo ""
echo "📊 View dashboard:"
echo "  https://fly.io/dashboard"
echo ""
echo "📝 View logs:"
echo "  flyctl logs"
echo ""
echo "🔧 SSH into app:"
echo "  flyctl ssh console"
echo ""
