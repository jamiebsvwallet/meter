#!/bin/bash

# Plumbing IoT BSV Platform - Setup Script
# Automates database, backend, and frontend startup

set -e

echo "🚀 Starting Plumbing IoT BSV Platform Setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========== BACKEND SETUP ==========
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd /workspaces/meter/backend
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

# ========== FRONTEND SETUP ==========
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd /workspaces/meter/frontend
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

# ========== MONGODB SETUP ==========
echo -e "${BLUE}🗄️  Starting MongoDB (Docker)...${NC}"

# Check if MongoDB container is already running
if docker ps | grep -q mongodb; then
  echo "✓ MongoDB already running"
else
  # Check if container exists but is stopped
  if docker ps -a | grep -q mongodb; then
    echo "Starting existing MongoDB container..."
    docker start mongodb
  else
    echo "Creating new MongoDB container..."
    docker run -d -p 27017:27017 --name mongodb mongo:latest
  fi
fi

# Wait for MongoDB to be ready
sleep 3
echo -e "${GREEN}✓ MongoDB ready on mongodb://localhost:27017${NC}"
echo ""

# ========== BACKEND SERVER STARTUP ==========
echo -e "${BLUE}🚀 Starting backend server on port 3001...${NC}"
cd /workspaces/meter/backend
npm run start:dev &
BACKEND_PID=$!
sleep 5

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
  echo -e "${GREEN}✓ Backend server running (PID: $BACKEND_PID)${NC}"
else
  echo -e "❌ Backend server failed to start"
  exit 1
fi
echo ""

# ========== FRONTEND SERVER STARTUP ==========
echo -e "${BLUE}🎨 Starting frontend on port 3000...${NC}"
cd /workspaces/meter/frontend
npm start &
FRONTEND_PID=$!
sleep 5

# Check if frontend started successfully
if ps -p $FRONTEND_PID > /dev/null; then
  echo -e "${GREEN}✓ Frontend running (PID: $FRONTEND_PID)${NC}"
else
  echo -e "❌ Frontend failed to start"
  exit 1
fi
echo ""

# ========== PLATFORM READY ==========
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Plumbing IoT BSV Platform is READY${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo "📍 Access the platform:"
echo "   • Frontend:     http://localhost:3000"
echo "   • Backend API:  http://localhost:3001"
echo "   • API Docs:     http://localhost:3001/api/docs"
echo "   • Health Check: http://localhost:3001/health"
echo ""
echo "📊 Features:"
echo "   • Real-time IoT sensor data (pressure, flow, temperature)"
echo "   • Leak detection and alerts"
echo "   • Job management and reporting"
echo "   • Customer consent and permissions"
echo "   • Water company access control"
echo "   • BSV blockchain proof storage"
echo ""
echo "⏹️  To stop all services, press Ctrl+C"
echo ""

# Keep script running to show logs
wait

# ========== BACKEND SERVER SETUP ==========
echo -e "${BLUE}🔧 Building backend...${NC}"
cd /workspaces/meter/backend
npm run build
echo -e "${GREEN}✓ Backend built${NC}"
echo ""

echo -e "${BLUE}🚀 Starting backend server...${NC}"
cd /workspaces/meter/backend
npm run start &
BACKEND_PID=$!