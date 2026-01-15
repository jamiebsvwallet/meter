# Quick Start Guide - Plumbing IoT BSV Platform

## 1. Prerequisites

- MongoDB running locally or cloud
- Node.js 18+
- npm installed

## 2. Setup Backend

```bash
cd backend
npm install

# Configure environment
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/plumbing
BSV_NETWORK=testnet
PORT=3000
EOF

# Build and start
npm run build
npm start
```

## 3. Setup Frontend

```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:8080`

## 4. Basic Usage Scenarios

### Scenario A: Customer Setup

```bash
# 1. Customer creates account
curl -X POST http://localhost:3000/api/bsv/account/customer \
  -H "Content-Type: application/json" \
  -d '{"userId": "john_smith", "identityKey": "abc123..."}'

# 2. Register property
curl -X POST http://localhost:3000/api/consent/prop_001/setup \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "john_smith",
    "plumberId": "plumber_001"
  }'

# 3. Grant water company access
curl -X POST http://localhost:3000/api/consent/prop_001/grant-water-company \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "water-corp-1",
    "reason": "Leak prevention audit",
    "expirationDays": 30
  }'
```

### Scenario B: IoT Device Sends Data

```bash
# Device sends pressure, flow, temperature reading
curl -X POST http://localhost:3000/api/iot/reading \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "sensor_001",
    "propertyId": "prop_001",
    "pressure": 65.5,
    "flowRate": 2.3,
    "temperature": 18.5,
    "recordedBy": "plumber_001"
  }'

# Response:
# {
#   "success": true,
#   "readingId": "reading_123...",
#   "timestamp": "2025-01-15T10:30:00Z"
# }
```

### Scenario C: Plumber Submits Reading Batch

```bash
# Submit multiple readings as batch for blockchain proof
curl -X POST http://localhost:3000/api/iot/batch \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "prop_001",
    "recordedBy": "plumber_001",
    "readings": [
      {
        "deviceId": "sensor_001",
        "propertyId": "prop_001",
        "timestamp": 1673787000000,
        "pressure": 65.5,
        "flowRate": 2.3,
        "temperature": 18.5,
        "alerts": []
      },
      {
        "deviceId": "sensor_001",
        "propertyId": "prop_001",
        "timestamp": 1673787060000,
        "pressure": 64.2,
        "flowRate": 2.1,
        "temperature": 18.6,
        "alerts": []
      }
    ]
  }'

# Response includes dataHash for blockchain:
# {
#   "success": true,
#   "batchId": "batch_123...",
#   "dataHash": "a1b2c3d4...",
#   "readingCount": 2,
#   "blockchainSubmission": {
#     "contractType": "IoTDataProof",
#     "dataHash": "a1b2c3d4...",
#     "timestamp": 1673787120000,
#     "propertyId": "prop_001",
#     "recordCount": 2
#   }
# }
```

### Scenario D: Job Creation and Completion

```bash
# Plumber creates job
curl -X POST http://localhost:3000/api/jobs/create \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "prop_001",
    "customerId": "john_smith",
    "plumberId": "plumber_001",
    "description": "Fix main water line leak"
  }'

# Response:
# {
#   "success": true,
#   "jobId": "job_456...",
#   "status": "pending",
#   "createdAt": "2025-01-15T11:00:00Z"
# }

# Complete job with report
curl -X POST http://localhost:3000/api/jobs/job_456/complete \
  -H "Content-Type: application/json" \
  -d '{
    "workPerformed": [
      "Replaced damaged water line section",
      "Pressure tested system"
    ],
    "partsUsed": [
      {"name": "PVC pipe 3/4 inch", "cost": 45.00, "quantity": 1},
      {"name": "Connectors", "cost": 20.00, "quantity": 4}
    ],
    "totalCost": 150.00,
    "photos": [
      "https://example.com/photos/before.jpg",
      "https://example.com/photos/after.jpg"
    ]
  }'

# Response includes reportHash for blockchain:
# {
#   "success": true,
#   "jobId": "job_456...",
#   "status": "completed",
#   "reportHash": "e5f6g7h8...",
#   "blockchainSubmission": {
#     "contractType": "JobReport",
#     "reportHash": "e5f6g7h8...",
#     "timestamp": 1673790600000,
#     "jobId": "job_456...",
#     "cost": 150.00
#   }
# }

# Customer approves job
curl -X POST http://localhost:3000/api/jobs/job_456/approve \
  -H "Content-Type: application/json" \
  -d '{"customerSignature": "signed_hash_xyz..."}'

# Response:
# {
#   "success": true,
#   "jobId": "job_456...",
#   "status": "approved"
# }
```

### Scenario E: Customer Views Dashboard

```bash
# Get latest readings
curl http://localhost:3000/api/iot/property/prop_001/readings?limit=100

# Response:
# [
#   {
#     "deviceId": "sensor_001",
#     "propertyId": "prop_001",
#     "timestamp": 1673787000000,
#     "pressure": 65.5,
#     "flowRate": 2.3,
#     "temperature": 18.5,
#     "alerts": []
#   },
#   ...
# ]

# Get statistics
curl http://localhost:3000/api/iot/property/prop_001/stats?hours=24

# Response:
# {
#   "avgPressure": 64.8,
#   "avgFlowRate": 2.2,
#   "avgTemperature": 18.4,
#   "maxPressure": 66.2,
#   "minPressure": 62.1,
#   "alertCount": 0,
#   "readingCount": 47
# }

# Get active alerts
curl http://localhost:3000/api/iot/property/prop_001/alerts

# Response: [] (empty if no alerts)
```

### Scenario F: Plumber Views Portal

```bash
# Get pending jobs
curl http://localhost:3000/api/jobs/plumber/plumber_001/pending

# Response:
# [
#   {
#     "jobId": "job_789...",
#     "propertyId": "prop_001",
#     "customerId": "john_smith",
#     "description": "Fix main water line leak",
#     "status": "pending",
#     "createdAt": "2025-01-15T11:00:00Z"
#   }
# ]

# Get revenue for period
curl http://localhost:3000/api/jobs/plumber/plumber_001/revenue \
  -G \
  -d "startDate=2025-01-01T00:00:00Z" \
  -d "endDate=2025-01-31T23:59:59Z"

# Response:
# {
#   "totalRevenue": 1250.00,
#   "jobCount": 5,
#   "avgJobCost": 250.00
# }
```

### Scenario G: Water Company Views Properties

```bash
# Get all properties with access
curl http://localhost:3000/api/water-company/water-corp-1/properties

# Response:
# ["prop_001", "prop_002", "prop_003"]

# Get property details
curl http://localhost:3000/api/iot/property/prop_001/stats?hours=24

# Get active alerts for all properties (loop through)
curl http://localhost:3000/api/iot/property/prop_001/alerts
```

## 5. Blockchain Integration (Next Steps)

The platform generates hashes ready for blockchain submission:

```typescript
// IoT Reading Batch
{
  contractType: "IoTDataProof",
  dataHash: "sha256_of_readings",
  timestamp: 1673787120000,
  propertyId: "prop_001",
  recordCount: 2
}

// Job Report
{
  contractType: "JobReport",
  reportHash: "sha256_of_report",
  timestamp: 1673790600000,
  jobId: "job_456...",
  cost: 150.00
}
```

To submit to BSV blockchain:
1. Call smart contract deploy
2. Submit transaction with hash data
3. Store transaction ID in database

See [smart contracts](/backend/src/contracts/) for contract implementations.

## 6. Frontend Features

### Customer Dashboard
- View real-time pressure, flow, temperature
- 24-hour trend charts
- Active alerts display
- Grant/revoke water company access

### Plumber Portal
- Pending jobs list
- Complete job with details
- Revenue tracking
- Job history

### Water Company Dashboard
- Properties with access
- Real-time data viewing
- Alert monitoring
- Access audit trail

## 7. Testing Tips

```bash
# Monitor database
mongo plumbing
db.IoTReadings.find().limit(5)
db.JobReports.find().limit(5)
db.PropertyConsents.find().limit(5)

# Check API health
curl http://localhost:3000/api/health

# View logs
tail -f server.log
```

## 8. Production Checklist

- [ ] Set BSV_NETWORK=mainnet
- [ ] Configure MongoDB encryption at rest
- [ ] Enable HTTPS/TLS for all APIs
- [ ] Implement rate limiting
- [ ] Add API authentication middleware
- [ ] Setup audit logging
- [ ] Configure backup strategy
- [ ] Test blockchain integration
- [ ] Load testing for IoT readings
- [ ] Security audit

## 9. Support & Resources

- Smart Contracts: [/backend/src/contracts/](../backend/src/contracts/)
- Services: [/backend/src/lookup-services/](../backend/src/lookup-services/)
- API Routes: [/backend/src/api/](../backend/src/api/)
- Frontend Components: [/frontend/src/components/](../frontend/src/components/)
- Full Documentation: [PLUMBING_PLATFORM.md](./PLUMBING_PLATFORM.md)
