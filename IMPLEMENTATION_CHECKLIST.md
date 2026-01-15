# Implementation Checklist & Next Steps

## ✅ Completed Components

### Smart Contracts (Ready for Scrypt compilation)
- [x] PropertyRegistry.ts
- [x] IoTDataProof.ts
- [x] JobReport.ts
- [x] ConsentManager.ts

### Backend Services
- [x] PlumbingService.ts (main orchestration)
- [x] IoTDataStorage.ts (sensor data)
- [x] JobReportStorage.ts (job management)
- [x] ConsentStorage.ts (permissions)
- [x] BSVAccountManager.ts (user accounts)

### API Routes
- [x] iot.routes.ts
- [x] jobs.routes.ts
- [x] consent.routes.ts
- [x] routes.ts (configuration)

### Data Types
- [x] Extended types.ts with all models

### Frontend Components
- [x] CustomerDashboard.tsx
- [x] PlumberPortal.tsx
- [x] WaterCompanyDashboard.tsx

### Tests & Documentation
- [x] integration.test.ts
- [x] PLUMBING_PLATFORM.md
- [x] QUICK_START.md
- [x] IMPLEMENTATION_SUMMARY.md

---

## 🔧 Next Steps (Implementation Order)

### Phase 1: Backend Setup (Day 1-2)

#### 1.1 Update Main Application File
Create `backend/src/app.ts` or update existing to wire routes:

```typescript
import express from 'express'
import { createIoTRouter } from './api/iot.routes'
import { createJobRouter } from './api/jobs.routes'
import { createConsentRouter } from './api/consent.routes'
import { MongoClient } from 'mongodb'

const app = express()
app.use(express.json())

const client = new MongoClient(process.env.MONGODB_URI!)
const db = client.db('plumbing')

// Mount routes
app.use('/api/iot', createIoTRouter(db))
app.use('/api/jobs', createJobRouter(db))
app.use('/api/consent', createConsentRouter(db))

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.listen(process.env.PORT || 3000)
```

#### 1.2 Compile Smart Contracts
```bash
cd backend
npm run compile  # Compiles Scrypt contracts to JSON artifacts
```

#### 1.3 Setup MongoDB
```bash
# Local
mongod --dbpath ./data

# Or use MongoDB Atlas cloud:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/plumbing
```

#### 1.4 Configure Environment
Create `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/plumbing
BSV_NETWORK=testnet
PORT=3000
JWT_SECRET=your-secret-key
```

#### 1.5 Build Backend
```bash
cd backend
npm run build
```

### Phase 2: Frontend Integration (Day 3)

#### 2.1 Create Main App Component
Update `frontend/src/App.tsx` to route between dashboards:

```typescript
import React, { useState } from 'react'
import { CustomerDashboard } from './components/CustomerDashboard'
import { PlumberPortal } from './components/PlumberPortal'
import { WaterCompanyDashboard } from './components/WaterCompanyDashboard'

export const App: React.FC = () => {
  const [userType] = useState<'customer' | 'plumber' | 'water_company'>('customer')
  const [userId] = useState('user_123')

  return (
    <div>
      {userType === 'customer' && <CustomerDashboard propertyId="prop_001" />}
      {userType === 'plumber' && <PlumberPortal plumberId={userId} />}
      {userType === 'water_company' && <WaterCompanyDashboard companyId={userId} />}
    </div>
  )
}
```

#### 2.2 Add API Service Layer
Create `frontend/src/services/api.ts`:

```typescript
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000'

export const apiService = {
  async getReadings(propertyId: string) {
    const res = await fetch(`${API_BASE}/api/iot/property/${propertyId}/readings`)
    return res.json()
  },
  // ... other methods
}
```

#### 2.3 Test Frontend
```bash
cd frontend
npm start
# Opens at http://localhost:8080
```

### Phase 3: Blockchain Integration (Day 4-5)

#### 3.1 Deploy Smart Contracts
Use provided contract ABIs to deploy to BSV testnet:

```typescript
import { Meter } from './contracts/IoTDataProof'
import { PublicKey, PrivateKey } from '@bsv/sdk'

// Deploy IoTDataProof contract
const contract = new Meter(...)
const deployTx = await contract.deploy()
console.log('Deployed to:', deployTx.txid)
```

#### 3.2 Create Blockchain Service
Create `backend/src/services/blockchain.ts`:

```typescript
export class BlockchainService {
  async submitIoTProof(dataHash: string, timestamp: number, propertyId: string) {
    // Call smart contract to record proof
    // Store returning transaction ID
  }

  async verifyData(propertyId: string, readingHash: string) {
    // Query blockchain to verify data hasn't been tampered
  }
}
```

#### 3.3 Update API Routes
Wire blockchain service into API endpoints:

```typescript
router.post('/blockchain/iot-proof', async (req, res) => {
  const { dataHash, timestamp, propertyId } = req.body
  const txId = await blockchainService.submitIoTProof(
    dataHash,
    timestamp,
    propertyId
  )
  res.json({ txId })
})
```

### Phase 4: Testing (Day 6)

#### 4.1 Run Unit Tests
```bash
cd backend
npm test
```

#### 4.2 Manual API Testing
```bash
# Use QUICK_START.md examples
# Test IoT data flow
# Test job creation/completion
# Test consent management
```

#### 4.3 Load Testing
```bash
npm install -g artillery

# Create load-test.yml
artillery run load-test.yml --target http://localhost:3000
```

### Phase 5: Authentication (Day 7)

#### 5.1 Add JWT Middleware
```typescript
import jwt from 'jsonwebtoken'

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const decoded = jwt.verify(token, process.env.JWT_SECRET!)
  ;(req as any).user = decoded
  next()
}
```

#### 5.2 Create Auth Routes
```typescript
router.post('/auth/signup', async (req, res) => {
  // Create user, return JWT
})

router.post('/auth/login', async (req, res) => {
  // Verify credentials, return JWT
})
```

### Phase 6: Production Deployment (Day 8-10)

#### 6.1 Environment Configuration
```
MONGODB_URI=<production-mongodb>
BSV_NETWORK=mainnet
PORT=3000
JWT_SECRET=<secure-secret>
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
```

#### 6.2 Deploy Backend
```bash
# Using Docker
docker build -t plumbing-backend .
docker run -p 3000:3000 plumbing-backend

# Or traditional
npm run build
npm start
```

#### 6.3 Deploy Frontend
```bash
cd frontend
REACT_APP_API_URL=https://api.yourdomain.com npm run build
# Deploy dist/ folder to CDN/web server
```

#### 6.4 Setup Monitoring
- Add logging (Winston/Bunyan)
- Monitor API response times
- Alert on errors
- Track blockchain transaction costs

---

## 📋 Validation Checklist

### Before Going Live

- [ ] All tests pass (`npm test`)
- [ ] Smart contracts compile without errors
- [ ] API endpoints respond correctly
- [ ] Frontend components render
- [ ] Database connections work
- [ ] Blockchain network configured correctly
- [ ] Environment variables set
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Logging working
- [ ] Backups configured
- [ ] Security audit completed

### API Validation
- [ ] POST /api/iot/reading works
- [ ] POST /api/iot/batch generates correct hash
- [ ] GET /api/iot/property/:id/readings returns data
- [ ] POST /api/jobs/create succeeds
- [ ] POST /api/jobs/:id/complete generates hash
- [ ] POST /api/consent/:id/grant-water-company works
- [ ] DELETE /api/consent/:id/water-company/:company removes access
- [ ] GET /api/water-company/:id/properties returns list

### Frontend Validation
- [ ] Customer dashboard loads
- [ ] Charts render correctly
- [ ] Grant/revoke buttons work
- [ ] Plumber portal shows jobs
- [ ] Job completion workflow works
- [ ] Water company dashboard shows properties
- [ ] No console errors

### Blockchain Validation
- [ ] Contract deploys successfully
- [ ] Hashes stored on-chain correctly
- [ ] Can verify data against blockchain
- [ ] Transaction costs acceptable
- [ ] Testnet transactions confirm

---

## 🚀 Quick Start Command Sequence

```bash
# 1. Backend Setup
cd backend
npm install
npm run build
npm run compile
npm test

# 2. Start MongoDB
mongod --dbpath ./data &

# 3. Start Backend
npm start  # Runs on port 3000

# 4. Frontend Setup (new terminal)
cd frontend
npm install
npm start  # Runs on port 8080

# 5. Test API (new terminal)
curl -X POST http://localhost:3000/api/iot/reading \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"sensor_001","propertyId":"prop_001","pressure":65,"flowRate":2.3,"temperature":18.5,"recordedBy":"plumber_001"}'

# 6. View in browser
open http://localhost:8080
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| PLUMBING_PLATFORM.md | Complete architecture guide |
| QUICK_START.md | Getting started with examples |
| IMPLEMENTATION_SUMMARY.md | What's been built |
| IMPLEMENTATION_CHECKLIST.md | This file - next steps |

---

## 🎯 Success Criteria

Your platform is complete when:

1. ✅ Customers can view real-time pressure/flow/temperature
2. ✅ Plumbers can create, complete, and track jobs
3. ✅ Customers can grant/revoke water company access
4. ✅ Water companies see consented data in real-time
5. ✅ Job completion generates blockchain hash
6. ✅ IoT readings generate blockchain hash
7. ✅ Complete audit trail of all data access
8. ✅ Revenue reports for plumbers
9. ✅ No unauthorized data access
10. ✅ Blockchain proof immutable for 6+ months

---

## 📞 Support Resources

- **Scrypt-TS Docs**: https://docs.scrypt.io
- **BSV SDK**: https://github.com/bitcoin-sv/ts-sdk
- **React Docs**: https://react.dev
- **MongoDB**: https://docs.mongodb.com
- **Express**: https://expressjs.com

---

**You're ready to build! Start with Phase 1 and work through sequentially.**
