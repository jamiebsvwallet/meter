#!/bin/bash

# Plumbing IoT Platform - Setup and Launch Script
# This script sets up the entire platform for development and testing

set -e

echo "================================"
echo "🚀 Plumbing IoT BSV Platform"
echo "   Setup & Launch Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Git is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git $(git -v | head -1)${NC}"

echo ""

# Setup Backend
echo -e "${BLUE}📦 Setting up Backend...${NC}"
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "Dependencies already installed"
fi

# Build backend
echo "Building backend..."
npm run build
echo -e "${GREEN}✓ Backend built successfully${NC}"

cd ..
echo ""

# Setup Frontend
echo -e "${BLUE}🎨 Setting up Frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "Dependencies already installed"
fi

echo -e "${GREEN}✓ Frontend setup complete${NC}"

cd ..
echo ""

# Create .env files if they don't exist
echo -e "${BLUE}⚙️  Configuring environment...${NC}"

if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env..."
    cat > backend/.env << EOF
MONGODB_URI=mongodb://localhost:27017/plumbing
BSV_NETWORK=testnet
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=dev-secret-key-change-in-production
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000,http://localhost:8080
EOF
    echo -e "${GREEN}✓ backend/.env created${NC}"
else
    echo "backend/.env already exists"
fi

if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend/.env..."
    cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=development
REACT_APP_VERSION=1.0.0
REACT_APP_ENABLE_VR=true
REACT_APP_ENABLE_CHARTS=true
REACT_APP_ENABLE_BLOCKCHAIN=true
EOF
    echo -e "${GREEN}✓ frontend/.env created${NC}"
else
    echo "frontend/.env already exists"
fi

echo ""

# Option to start services
echo -e "${BLUE}🚀 Platform Setup Complete!${NC}"
echo ""
echo "To start the platform, run the following commands in separate terminals:"
echo ""
echo -e "${GREEN}Terminal 1 (MongoDB - optional, or use Docker):${NC}"
echo "  mongod --dbpath ./data"
echo ""
echo -e "${GREEN}Terminal 2 (Backend):${NC}"
echo "  cd backend && npm run start:dev"
echo ""
echo -e "${GREEN}Terminal 3 (Frontend):${NC}"
echo "  cd frontend && npm start"
echo ""
echo "Or use Docker Compose for all services:"
echo "  docker-compose up -d"
echo ""
echo "Access the platform:"
echo "  Frontend:     http://localhost:3000"
echo "  Backend API:  http://localhost:3001"
echo "  API Docs:     http://localhost:3001/api/docs"
echo "  Health Check: http://localhost:3001/health"
echo ""
echo "Run tests:"
echo "  npm test                    # All tests"
echo "  npm run test:watch         # Watch mode"
echo "  npm run test:coverage      # Coverage report"
echo ""
