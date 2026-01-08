#!/bin/bash

###############################################################################
# Stampcoin Platform - Local Development Setup Script
# سكريبت إعداد التطوير المحلي لمنصة StampCoin
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  💻 Local Development Setup for Stampcoin Platform${NC}"
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
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        echo "Install from: https://nodejs.org/"
        exit 1
    fi
    NODE_VERSION=$(node -v)
    print_success "Node.js found: $NODE_VERSION"
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        print_step "Installing pnpm..."
        npm install -g pnpm
    fi
    PNPM_VERSION=$(pnpm -v)
    print_success "pnpm found: $PNPM_VERSION"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Install from: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    DOCKER_VERSION=$(docker -v)
    print_success "Docker found: $DOCKER_VERSION"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    COMPOSE_VERSION=$(docker-compose -v)
    print_success "Docker Compose found: $COMPOSE_VERSION"
    
    echo ""
}

###############################################################################
# Setup Environment
###############################################################################

setup_environment() {
    print_step "Setting up environment variables..."
    
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.local.example" ]; then
            cp .env.local.example .env.local
            print_success ".env.local created from template"
        else
            print_error ".env.local.example not found"
            exit 1
        fi
    else
        print_info ".env.local already exists"
    fi
    
    echo ""
}

###############################################################################
# Install Dependencies
###############################################################################

install_dependencies() {
    print_step "Installing project dependencies..."
    
    if [ ! -d "node_modules" ]; then
        pnpm install
        print_success "Dependencies installed"
    else
        print_info "Dependencies already installed"
    fi
    
    echo ""
}

###############################################################################
# Start Docker Services
###############################################################################

start_docker() {
    print_step "Starting Docker services..."
    
    if [ ! -f "docker-compose.yml" ] && [ ! -f "docker-compose.override.yml" ]; then
        print_info "No docker-compose files found. Skipping Docker setup."
        return
    fi
    
    # Try to start with compose file
    if docker-compose -f docker-compose.override.yml up -d 2>/dev/null || docker-compose up -d 2>/dev/null; then
        print_success "Docker services started"
        
        # Wait for MySQL to be ready
        print_step "Waiting for MySQL to be ready..."
        sleep 5
        
        # Check if MySQL is healthy
        for i in {1..15}; do
            if docker ps 2>/dev/null | grep -q "stampcoin-mysql"; then
                print_success "MySQL container is running"
                break
            fi
            echo "Attempt $i/15..."
            sleep 2
        done
    else
        print_info "Docker services may already be running"
    fi
    
    echo ""
}

###############################################################################
# Setup Database
###############################################################################

setup_database() {
    print_step "Setting up database..."
    
    if pnpm db:push 2>/dev/null; then
        print_success "Database migrations applied"
    else
        print_info "Database migrations not available (will retry)"
    fi
    
    echo ""
}

###############################################################################
# Seed Database
###############################################################################

seed_database() {
    echo ""
    read -p "Seed database with initial data? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "Seeding database..."
        if pnpm db:seed 2>/dev/null; then
            print_success "Database seeded"
        else
            print_info "Database seeding skipped or not available"
        fi
    fi
    
    echo ""
}

###############################################################################
# Display URLs
###############################################################################

display_urls() {
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ Setup Complete!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${BLUE}🌐 Application URLs:${NC}"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend:  http://localhost:3000"
    echo "   API:      http://localhost:3000/api"
    echo ""
    
    echo -e "${BLUE}🗄️  Database Management:${NC}"
    echo "   Adminer:  http://localhost:8080"
    echo "   Redis UI: http://localhost:8081"
    echo "   MailHog:  http://localhost:8025"
    echo ""
    
    echo -e "${BLUE}📝 Database Credentials:${NC}"
    echo "   Host:     localhost:3306"
    echo "   Database: stampcoin"
    echo "   User:     stampcoin"
    echo "   Password: stampcoin123"
    echo ""
    
    echo -e "${YELLOW}🚀 Next Steps:${NC}"
    echo "   1. Run: pnpm dev"
    echo "   2. Open: http://localhost:5173"
    echo "   3. Start developing!"
    echo ""
    
    echo -e "${YELLOW}📋 Useful Commands:${NC}"
    echo "   pnpm dev              # Start development server"
    echo "   pnpm test             # Run tests"
    echo "   pnpm lint             # Check code quality"
    echo "   pnpm db:push          # Apply migrations"
    echo "   pnpm db:seed          # Seed database"
    echo "   docker-compose logs   # View Docker logs"
    echo "   docker-compose down   # Stop services"
    echo ""
}

###############################################################################
# Main Execution
###############################################################################

main() {
    check_prerequisites
    setup_environment
    install_dependencies
    start_docker
    setup_database
    seed_database
    display_urls
}

# Run main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
