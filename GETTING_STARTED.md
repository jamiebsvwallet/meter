# Quick Start Guide - Plumbing IoT BSV Platform

## 5-Minute Quick Start

### Option 1: Using Docker (Easiest)

```bash
# Start all services (MongoDB + Backend)
docker-compose up -d

# Start frontend (in separate terminal)
cd frontend && npm start

# Access at: http://localhost:3000
```

### Option 2: Local Development

```bash
# Run setup script (one-time)
chmod +x start.sh
./start.sh

# Terminal 1: Start Backend
cd backend
npm run start:dev

# Terminal 2: Start Frontend
cd frontend
npm start

# Terminal 3: Start MongoDB (if not using Docker)
mongod --dbpath ./data

# Access at: http://localhost:3000
```

## Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `http://localhost:3001/health` | Health check |
| `http://localhost:3001/status` | API status |
| `http://localhost:3001/api/docs` | API documentation |
| `http://localhost:3001/api/examples` | Example data |
| `http://localhost:3000` | Frontend app |

## API Examples

### Submit IoT Reading

```bash
curl -X POST http://localhost:3001/api/iot/reading \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "sensor_001",
    "propertyId": "prop_001",
    "pressure": 65.5,
    "flowRate": 2.3,
    "temperature": 18.5,
    "recordedBy": "system"
  }'
```

### Create Job

```bash
curl -X POST http://localhost:3001/api/jobs/create \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "prop_001",
    "customerId": "cust_001",
    "description": "Fix leaking pipe",
    "priority": "high"
  }'
```

### Grant Water Company Access

```bash
curl -X POST http://localhost:3001/api/consent/prop_001/grant-water-company \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "waterco_001",
    "expiresAt": "2027-01-09T00:00:00Z"
  }'
```

### Submit Blockchain Proof

```bash
curl -X POST http://localhost:3001/api/blockchain/iot-proof \
  -H "Content-Type: application/json" \
  -d '{
    "dataHash": "abc123...",
    "timestamp": 1673270400,
    "propertyId": "prop_001",
    "deviceId": "sensor_001"
  }'
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- platform.test.ts
```

## Database

### MongoDB Connection

```bash
# Direct connection
mongosh "mongodb://localhost:27017/plumbing"

# Docker MongoDB
docker exec -it plumbing-mongodb mongosh
```

### Useful Queries

```javascript
// Check readings
db.iot_readings.find({ propertyId: 'prop_001' }).limit(10)

// Check jobs
db.jobs.find({ status: 'pending' })

// Check blockchain proofs
db.blockchain_proofs.find({}).count()

// Check consent
db.consent.findOne({ propertyId: 'prop_001' })
```

## Features

✅ **Real-time IoT Data Collection**
- Pressure, flow rate, temperature monitoring
- Configurable polling intervals
- Alert generation for anomalies

✅ **Leak Detection & Prevention**
- Automatic detection of abnormal readings
- Email notifications
- Historical data analysis

✅ **Plumbing Job Management**
- Job creation and tracking
- Work performed logging
- Parts cost calculation
- Revenue reporting

✅ **Customer Consent System**
- Grant/revoke water company access
- Time-limited permissions
- Audit trail of all access

✅ **Blockchain Integration**
- IoT readings stored on BSV
- Job completion proofs
- Immutable audit trail
- Data verification

✅ **Multi-User Dashboard**
- Customer dashboard (view readings, manage consent)
- Plumber portal (manage jobs, track revenue)
- Water company dashboard (view consented properties)

## Environment Variables

### Backend (.env)

```
MONGODB_URI=mongodb://localhost:27017/plumbing
PORT=3001
BSV_NETWORK=testnet
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=development
```

## Troubleshooting

### Port Already in Use

```bash
# Find process
lsof -i :3001

# Kill it
kill -9 <PID>
```

### MongoDB Not Running

```bash
# Start MongoDB
mongod --dbpath ./data

# Or use Docker
docker-compose up mongodb
```

### Dependencies Issue

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clean build
npm run build -- --clean
```

## Development Commands

```bash
# Format code
npm run lint

# Compile contracts
npm run compile

# Generate API docs
npm run docs

# Run in production mode
npm run start:prod

# View logs
docker logs -f plumbing-backend
```

## Next Steps

1. ✅ Review [QUICK_START.md](./QUICK_START.md) for detailed examples
2. ✅ Check [PLUMBING_PLATFORM.md](./PLUMBING_PLATFORM.md) for architecture
3. ✅ See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production deployment
4. ✅ Read [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) for complete feature list

## Support

- 📖 Full API documentation at `http://localhost:3001/api/docs`
- 💬 GitHub Issues: https://github.com/p2ppsr/meter/issues
- 📧 Email: support@plumbingplatform.local

**Happy building! 🚀**
