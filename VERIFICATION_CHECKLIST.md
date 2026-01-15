# ✅ Pre-Launch Verification Checklist

## Complete this checklist before going live

---

## Phase 1: Verify Installation

- [ ] **Node.js Installed**
  ```bash
  node --version  # Should be v18+
  npm --version   # Should be v9+
  ```

- [ ] **Backend Dependencies**
  ```bash
  cd backend && npm list jsonwebtoken
  # Should show jsonwebtoken@9.0.3
  ```

- [ ] **Frontend Dependencies**
  ```bash
  cd frontend && npm list react
  # Should show react@18.x
  ```

- [ ] **Docker (Optional)**
  ```bash
  docker --version     # If using Docker
  docker-compose --version
  ```

---

## Phase 2: Verify Builds

- [ ] **Backend Builds**
  ```bash
  cd backend
  npm run build
  # Should complete with no errors
  ```

- [ ] **Frontend Builds**
  ```bash
  cd frontend
  npm run build
  # Should complete with no errors
  ```

---

## Phase 3: Verify Services

### Using Docker Compose (Easiest)

- [ ] **Start Services**
  ```bash
  docker-compose up -d
  # Should start MongoDB and backend
  ```

- [ ] **Check MongoDB**
  ```bash
  docker ps | grep mongodb
  # Should show plumbing-mongodb running
  ```

- [ ] **Check Backend**
  ```bash
  docker ps | grep backend
  # Should show plumbing-backend running
  ```

- [ ] **Test Backend Health**
  ```bash
  curl http://localhost:3001/health
  # Should return: {"status":"healthy",...}
  ```

### Using Local Setup

- [ ] **Start MongoDB**
  ```bash
  mongod --dbpath ./data
  # Should show "waiting for connections on port 27017"
  ```

- [ ] **Start Backend**
  ```bash
  cd backend
  npm run start:dev
  # Should show "Server listening on http://localhost:3001"
  ```

- [ ] **Test Backend Health**
  ```bash
  curl http://localhost:3001/health
  # Should return: {"status":"healthy",...}
  ```

---

## Phase 4: Verify API Endpoints

- [ ] **API Docs**
  ```bash
  curl http://localhost:3001/api/docs
  # Should return API documentation
  ```

- [ ] **Submit IoT Reading**
  ```bash
  curl -X POST http://localhost:3001/api/iot/reading \
    -H "Content-Type: application/json" \
    -d '{
      "deviceId":"sensor_001",
      "propertyId":"prop_001",
      "pressure":65.5,
      "flowRate":2.3,
      "temperature":18.5,
      "recordedBy":"test"
    }'
  # Should return: {"_id":...,"timestamp":...}
  ```

- [ ] **Create User (Auth)**
  ```bash
  curl -X POST http://localhost:3001/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{
      "email":"test@example.com",
      "password":"password123",
      "name":"Test User"
    }'
  # Should return: {"userId":...,"token":...}
  ```

- [ ] **Get Heatmap Data**
  ```bash
  curl http://localhost:3001/api/heatmap?hours=24
  # Should return heatmap data
  ```

---

## Phase 5: Verify Frontend

- [ ] **Start Frontend**
  ```bash
  cd frontend
  npm start
  # Should show webpack compiling
  ```

- [ ] **Access Web App**
  ```bash
  open http://localhost:3000
  # Should load the platform UI
  ```

- [ ] **Test Role Switching**
  - Click "Customer" button - should switch to Customer Dashboard
  - Click "Plumber" button - should switch to Plumber Portal
  - Click "Water Company" button - should switch to Water Company Dashboard

- [ ] **Test API Connection**
  - Check browser console (F12) - should show no errors
  - Should see API calls being made to backend

---

## Phase 6: Verify Database

- [ ] **Connect to MongoDB**
  ```bash
  mongosh mongodb://localhost:27017/plumbing
  ```

- [ ] **Check Collections**
  ```javascript
  // In mongosh:
  show collections
  // Should show collections like:
  // iot_readings, jobs, consent, users, etc.
  ```

- [ ] **Check IoT Data**
  ```javascript
  db.iot_readings.findOne()
  // Should return a reading document
  ```

---

## Phase 7: Verify Authentication

- [ ] **User Signup**
  ```bash
  curl -X POST http://localhost:3001/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{
      "email":"user@test.com",
      "password":"test123",
      "name":"Test User"
    }'
  # Capture the token
  ```

- [ ] **Token Verification**
  ```bash
  TOKEN="your-token-here"
  curl -X POST http://localhost:3001/api/auth/verify \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$TOKEN\"}"
  # Should return: {"valid":true,"user":{...}}
  ```

- [ ] **Get Profile**
  ```bash
  TOKEN="your-token-here"
  curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3001/api/auth/profile
  # Should return user profile
  ```

---

## Phase 8: Verify Blockchain Service

- [ ] **Submit IoT Proof**
  ```bash
  curl -X POST http://localhost:3001/api/blockchain/iot-proof \
    -H "Content-Type: application/json" \
    -d '{
      "dataHash":"abc123def456",
      "timestamp":'$(date +%s)',
      "propertyId":"prop_001",
      "deviceId":"sensor_001"
    }'
  # Should return: {"txId":...,"verified":true}
  ```

- [ ] **Get Blockchain Stats**
  ```bash
  curl http://localhost:3001/api/blockchain/stats
  # Should return stats about stored proofs
  ```

---

## Phase 9: Run Tests

- [ ] **Run All Tests**
  ```bash
  npm test
  # All tests should pass
  ```

- [ ] **Check Test Output**
  - Should show: "PASSED: X tests"
  - No failed tests
  - All categories covered:
    - IoT Data ✓
    - Jobs ✓
    - Consent ✓
    - Blockchain ✓
    - Authentication ✓

---

## Phase 10: Verify Docker

- [ ] **Build Docker Image**
  ```bash
  docker build -t plumbing-backend:test .
  # Should complete with no errors
  ```

- [ ] **Run Docker Container**
  ```bash
  docker run -d \
    -e MONGODB_URI="mongodb://host.docker.internal:27017/plumbing" \
    -p 3001:3001 \
    plumbing-backend:test
  # Should start container
  ```

- [ ] **Test Docker Container**
  ```bash
  curl http://localhost:3001/health
  # Should return health status
  ```

---

## Phase 11: Performance Check

- [ ] **Backend Response Time**
  ```bash
  time curl http://localhost:3001/health
  # Should respond in < 100ms
  ```

- [ ] **Database Query Time**
  ```bash
  time curl http://localhost:3001/api/heatmap?hours=24
  # Should respond in < 500ms
  ```

- [ ] **Memory Usage**
  ```bash
  # Check process memory
  ps aux | grep node
  # Should be < 500MB
  ```

---

## Phase 12: Configuration Check

- [ ] **Backend .env**
  ```bash
  cat backend/.env
  # Should have all required variables
  ```

- [ ] **Frontend .env**
  ```bash
  cat frontend/.env
  # Should have REACT_APP_API_URL set
  ```

- [ ] **Production Template**
  ```bash
  cat .env.production
  # Should have all production configuration options
  ```

---

## Phase 13: Documentation Check

- [ ] **GETTING_STARTED.md exists**
  - [ ] Contains quick start instructions
  - [ ] Has API examples
  - [ ] Lists endpoints

- [ ] **DEPLOYMENT_GUIDE.md exists**
  - [ ] Has Docker instructions
  - [ ] Has Kubernetes examples
  - [ ] Has backup strategies

- [ ] **DOCUMENTATION_INDEX.md exists**
  - [ ] Links all documents
  - [ ] Provides navigation

- [ ] **PROJECT_COMPLETE.md exists**
  - [ ] Lists all phases completed
  - [ ] Shows completion status

---

## Phase 14: Security Check

- [ ] **No Credentials in Code**
  ```bash
  grep -r "password" backend/src --exclude-dir=node_modules
  grep -r "secret" backend/src --exclude-dir=node_modules
  # Should not find hardcoded credentials
  ```

- [ ] **Environment Variables Configured**
  - [ ] JWT_SECRET is set
  - [ ] MONGODB_URI is set
  - [ ] CORS_ORIGIN is configured

- [ ] **CORS is Restricted**
  - [ ] Not set to "*"
  - [ ] Limited to specific origins

---

## Phase 15: Final Cleanup

- [ ] **No Console Errors**
  - [ ] Browser console clean
  - [ ] Backend logs clean
  - [ ] No TypeScript warnings

- [ ] **Files Organized**
  - [ ] All new files created
  - [ ] All modified files updated
  - [ ] No test files left in src/

- [ ] **Git Status**
  ```bash
  git status
  # Should show all changes ready
  git add .
  git commit -m "Complete platform implementation"
  ```

---

## Pre-Production Checklist

- [ ] All 15 phases completed
- [ ] All tests passing
- [ ] All documentation written
- [ ] Security verified
- [ ] Performance acceptable
- [ ] Docker builds successfully
- [ ] Database connectivity working
- [ ] API endpoints responding
- [ ] Frontend loads correctly
- [ ] Authentication functional
- [ ] Blockchain service ready

---

## Production Deployment Checklist

Before deploying to production:

- [ ] **Environment Variables**
  ```bash
  # Edit .env.production with:
  - MONGODB_URI (production database)
  - JWT_SECRET (strong random secret)
  - BSV_NETWORK (mainnet)
  - FRONTEND_URL (your domain)
  ```

- [ ] **Database Backup**
  ```bash
  # Set up automated backups
  # Test restore procedure
  ```

- [ ] **Monitoring Setup**
  ```bash
  # Configure logging
  # Set up alerts
  # Test monitoring
  ```

- [ ] **SSL/TLS**
  ```bash
  # Get certificate
  # Configure reverse proxy
  # Test HTTPS
  ```

- [ ] **Domain Configuration**
  ```bash
  # Point DNS to server
  # Test domain resolution
  # Verify SSL works
  ```

---

## Success Criteria

Your platform is ready for production when:

✅ All 15 phases verified
✅ All tests passing
✅ No errors in logs
✅ API responding correctly
✅ Frontend loading
✅ Database working
✅ Docker builds
✅ Documentation complete
✅ Security verified
✅ Performance acceptable

---

## Support

If any check fails:

1. Review the error message
2. Check relevant documentation:
   - GETTING_STARTED.md
   - DEPLOYMENT_GUIDE.md
   - QUICK_START.md
3. Check server logs
4. Review GitHub issues

---

## 🎉 When All Checks Pass

**Congratulations! Your platform is ready for production.**

Next steps:
1. Deploy to your infrastructure
2. Configure monitoring
3. Set up backups
4. Go live!

---

**Checklist Version**: 1.0
**Last Updated**: January 9, 2026
**Status**: Ready for verification ✅
