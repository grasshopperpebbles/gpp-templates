#!/bin/bash

# Local Development Startup Script
# Starts all Docker containers and sets up the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Local Development Environment${NC}"
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml not found. Make sure you're in the backend directory.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Starting Docker containers...${NC}"

# Start containers in background
docker compose up -d

# Wait a moment for containers to initialize
sleep 5

# Check if containers are running
if ! docker compose ps | grep -q "Up"; then
    echo -e "${RED}❌ Failed to start containers${NC}"
    docker compose logs
    exit 1
fi

echo -e "${GREEN}✅ Docker containers started successfully!${NC}"

# Wait for WordPress to be ready
echo -e "${YELLOW}⏳ Waiting for WordPress to be ready...${NC}"
echo -e "${YELLOW}   This may take a few minutes on first run...${NC}"

# First, wait for the container to be running
echo -e "${YELLOW}   Checking container status...${NC}"
timeout=30
while ! docker compose ps wordpress | grep -q "Up" && [ $timeout -gt 0 ]; do
    printf "."
    sleep 2
    timeout=$((timeout - 2))
done
echo ""

# Now wait for WordPress to respond
echo -e "${YELLOW}   Waiting for WordPress to respond on port 8080...${NC}"
timeout=180  # Increased to 3 minutes
attempt=0
while ! curl -s --connect-timeout 5 http://localhost:8080 > /dev/null && [ $timeout -gt 0 ]; do
    printf "."
    sleep 2
    timeout=$((timeout - 2))
    attempt=$((attempt + 1))
    
    # Every 30 seconds, show a status update
    if [ $((attempt % 15)) -eq 0 ]; then
        echo ""
        echo -e "${YELLOW}   Still waiting... checking container status:${NC}"
        docker compose ps wordpress --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"
    fi
done
echo ""

if [ $timeout -le 0 ]; then
    echo -e "${RED}❌ WordPress failed to start within 3 minutes${NC}"
    echo ""
    echo -e "${YELLOW}📋 Troubleshooting information:${NC}"
    echo ""
    echo -e "${BLUE}Container Status:${NC}"
    docker compose ps
    echo ""
    echo -e "${BLUE}Recent WordPress logs:${NC}"
    docker compose logs --tail=50 wordpress
    echo ""
    echo -e "${YELLOW}💡 Common issues and solutions:${NC}"
    echo "   1. Port 8080 already in use:"
    echo -e "      ${GREEN}lsof -i :8080${NC} (check what's using the port)"
    echo -e "      ${GREEN}docker compose down && docker compose up -d${NC} (restart containers)"
    echo ""
    echo "   2. Database connection issues:"
    echo -e "      ${GREEN}docker compose logs db${NC} (check database logs)"
    echo -e "      ${GREEN}docker compose restart db${NC} (restart database)"
    echo ""
    echo "   3. First-time setup taking longer:"
    echo -e "      ${GREEN}docker compose logs -f wordpress${NC} (watch live logs)"
    echo "      Wait for 'Apache/2.4.X (Debian) PHP/8.3.X configured'"
    echo ""
    echo "   4. Permission issues:"
    echo -e "      ${GREEN}docker compose down -v${NC} (remove volumes)"
    echo -e "      ${GREEN}./dev.sh${NC} (start fresh)"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ WordPress is ready!${NC}"

# Run plugin installation script
echo -e "${YELLOW}🔌 Installing and configuring plugins...${NC}"
if [ -f "install-plugins.sh" ]; then
    chmod +x install-plugins.sh
    docker compose exec wordpress bash /usr/local/bin/install-plugins.sh
else
    echo -e "${YELLOW}⚠️  install-plugins.sh not found, skipping plugin setup${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Development environment is ready!${NC}"
echo "======================================="
echo ""
echo -e "${BLUE}🌐 Available URLs:${NC}"
echo -e "   📱 WordPress Admin:  ${GREEN}http://localhost:8080/wp-admin${NC}"
echo -e "   🔍 GraphQL Explorer: ${GREEN}http://localhost:8080/graphql${NC}"
echo -e "   🗄️  phpMyAdmin:       ${GREEN}http://localhost:9090${NC}"
echo -e "   🖥️  Frontend:         ${GREEN}http://localhost:3000${NC} (when Next.js is running)"
echo ""
echo -e "${BLUE}🔐 Default Credentials:${NC}"
echo -e "   👤 WordPress: ${GREEN}admin / admin${NC}"
echo -e "   🗄️  Database:  ${GREEN}root / root${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "   1. Start your Next.js frontend:"
echo -e "      ${YELLOW}cd ../frontend && npm install && npm run dev${NC}"
echo ""
echo "   2. Seed your WooCommerce store:"
echo -e "      ${YELLOW}npm run seed:woo${NC}"
echo ""
echo "   3. Test GraphQL at:"
echo -e "      ${GREEN}http://localhost:8080/graphql${NC}"
echo ""
echo -e "${BLUE}🛠️  Useful Commands:${NC}"
echo -e "   📊 View logs:        ${YELLOW}docker compose logs -f${NC}"
echo -e "   🛑 Stop containers:  ${YELLOW}docker compose down${NC}"
echo -e "   🗑️  Reset everything: ${YELLOW}docker compose down -v${NC}"
echo -e "   🔄 Restart:          ${YELLOW}docker compose restart${NC}"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"