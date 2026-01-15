# Plumbing IoT BSV Platform

A blockchain-enabled water management system for leak prevention and real-time monitoring on the BSV network.

## Overview

This platform enables:

- **IoT Leak Detection**: Real-time pressure, flow rate, and temperature monitoring
- **Customer Dashboard**: View water system data and manage access permissions
- **Plumber Portal**: Manage jobs, submit reports, and track revenue
- **Water Company Access**: Permission-based access to anonymized data
- **Blockchain Proof**: Hash + timestamp stored immutably on BSV
- **BSV Account Storage**: Customers and plumbers store data on their own BSV accounts

## Architecture

### Smart Contracts (Scrypt-TS)

#### PropertyRegistry
Manages property ownership and access rights
```typescript
- propertyId: Hash of property address
- customerPublicKey: Property owner
- plumberPublicKey: Assigned plumber
- consentedWaterCompanies: Approved water boards
- Methods:
  - authorizeWaterCompany()
  - revokeWaterCompany()
  - verifyAccess()
```

#### IoTDataProof
Stores cryptographic proof of sensor readings
```typescript
- propertyId: Link to property
- dataHash: SHA256 of reading batch
- timestamp: When data was recorded
- deviceId: Source device
- recordCount: Number of readings
- Methods:
  - recordReadings() - Submit new batch
  - verifyDataHash() - Verify integrity
```

#### JobReport
Immutable job completion records
```typescript
- jobId: Unique identifier
- propertyId: Associated property
- reportHash: SHA256 of full report
- status: pending | completed | approved
- Methods:
  - completeJob() - Mark job done
  - approveJob() - Customer approval
  - verifyReport() - Check integrity
```

#### ConsentManager
Tracks data access permissions
```typescript
- propertyId: Target property
- waterCompanyConsents: Encoded access list
- consentLog: Audit trail
- Methods:
  - grantWaterCompanyAccess()
  - revokeWaterCompanyAccess()
  - hasAccess()
  - getConsentAuditTrail()
```

### Backend Services

#### PlumbingService
Main orchestration service for all operations

```typescript
// IoT Methods
submitReading() - Device sends real-time data
submitReadingBatch() - Batch with blockchain proof
getLatestReadings() - Customer/plumber view
getActiveAlerts() - Alert tracking
getPropertyStats() - 24-hour statistics

// Job Report Methods
createJob() - New job creation
completeJob() - Job completion with hash
approveJob() - Customer approval
getPlumberPendingJobs()
getCustomerCompletedJobs()
getRevenue() - Plumber earnings

// Consent Methods
setupPropertyConsent() - Initialize
grantWaterCompanyAccess() - Add water board
revokeWaterCompanyAccess() - Remove access
checkAccess() - Verify permissions
getConsentAuditTrail() - Access history
```

#### IoTDataStorage
Handles sensor readings database
- Stores pressure, flow, temperature
- Tracks alerts by type
- Calculates statistics
- Manages data retention

#### JobReportStorage
Manages job and work order database
- Work performed tracking
- Parts and costs
- Photos and documentation
- Invoice generation
- Revenue calculations

#### ConsentStorage
Manages permissions and audit logs
- Access control per property
- Water company permissions with expiration
- Consent audit trail
- Easy consent summary for customers

#### BSVAccountManager
Handles user account and data sovereignty
- Customer account creation
- Plumber account creation
- Water company accounts
- Property registration
- Data storage on customer's BSV account
- GDPR data export

### Data Models

#### IoTReading
```typescript
{
  deviceId: string
  propertyId: string
  timestamp: number
  pressure: number        // PSI
  flowRate: number        // GPM
  temperature: number     // Celsius
  alerts: AlertType[]
  recordedBy: string      // Plumber
}
```

#### IoTReadingBatch
```typescript
{
  batchId: string
  propertyId: string
  deviceIds: string[]
  readings: IoTReading[]
  dataHash: string        // SHA256
  timestamp: number
  recordedBy: string
}
```

#### JobReport
```typescript
{
  jobId: string
  propertyId: string
  customerId: string
  plumberId: string
  description: string
  workPerformed: string[]
  partsUsed: { name, cost, quantity }[]
  totalCost: number
  photos: string[]
  startTime: Date
  completionTime?: Date
  customerSignature?: string
  reportHash: string      // SHA256
  status: 'pending' | 'completed' | 'approved'
}
```

#### PropertyConsent
```typescript
{
  propertyId: string
  customerId: string
  plumberId: string
  waterCompanyAccess: [{
    companyId: string
    grantedAt: Date
    reason?: string
    expiresAt?: Date
    isActive: boolean
  }]
}
```

### Frontend Components

#### CustomerDashboard
- Real-time pressure, flow, temperature display
- 24-hour trend charts
- Active alerts notification
- Grant/revoke water company access
- Data access summary

#### PlumberPortal
- Pending jobs list
- Complete job with work details and costs
- Photo uploads
- Revenue tracking
- Job history

#### WaterCompanyDashboard
- List of properties with access
- Real-time data viewing
- Alert monitoring
- Consent status tracking
- Access audit trail

## API Endpoints

### IoT Data Routes
```
POST   /api/iot/reading                        - Submit reading
POST   /api/iot/batch                          - Submit batch with hash
GET    /api/iot/property/:propertyId/readings  - Get latest
GET    /api/iot/property/:propertyId/readings/history
GET    /api/iot/property/:propertyId/alerts    - Active alerts
GET    /api/iot/property/:propertyId/stats     - Statistics
POST   /api/iot/device/register                - Register device
PATCH  /api/iot/device/:deviceId/status        - Update status
```

### Job Report Routes
```
POST   /api/jobs/create                        - Create job
GET    /api/jobs/:jobId                        - Get details
GET    /api/jobs/property/:propertyId          - Property jobs
GET    /api/jobs/plumber/:plumberId/pending    - Pending
GET    /api/jobs/plumber/:plumberId/completed  - Completed
POST   /api/jobs/:jobId/complete               - Complete & hash
POST   /api/jobs/:jobId/approve                - Approve
GET    /api/jobs/plumber/:plumberId/revenue    - Revenue
```

### Consent Routes
```
POST   /api/consent/:propertyId/setup
GET    /api/consent/:propertyId/summary
POST   /api/consent/:propertyId/grant-water-company
DELETE /api/consent/:propertyId/water-company/:companyId
GET    /api/consent/:propertyId/access/:entityId/:entityType
GET    /api/consent/:propertyId/audit-trail
GET    /api/water-company/:companyId/properties
```

### Blockchain Routes
```
POST   /api/blockchain/iot-proof               - Submit IoT hash
POST   /api/blockchain/job-proof               - Submit job hash
POST   /api/blockchain/verify-iot              - Verify data
POST   /api/blockchain/verify-job              - Verify report
GET    /api/blockchain/tx/:txId                - Get tx ref
```

### BSV Account Routes
```
POST   /api/bsv/account/customer               - Create customer
POST   /api/bsv/account/plumber                - Create plumber
POST   /api/bsv/account/water-company          - Create company
GET    /api/bsv/account/:userId                - Get account
POST   /api/bsv/data/customer/:customerId      - Store data
GET    /api/bsv/data/customer/:customerId      - Retrieve data
```

## Data Flow

### IoT Reading Flow
```
1. Device sends: pressure, flow, temperature
2. Backend detects alerts
3. Reading stored in MongoDB
4. Batch created periodically
5. Batch hash calculated (SHA256)
6. Hash + timestamp submitted to BSV blockchain
7. Customer sees real-time data on dashboard
8. Plumber can access with consent
9. Water company sees if granted consent
```

### Job Completion Flow
```
1. Plumber creates job
2. Performs work on customer's property
3. Submits completion report:
   - Work performed
   - Parts used and costs
   - Photos
4. Report serialized and hashed (SHA256)
5. Hash + timestamp submitted to BSV
6. Customer approves job
7. Job stored on customer's BSV account
8. Plumber tracks in portal
9. Revenue calculated for period
```

### Consent Grant Flow
```
1. Customer logs in
2. Identifies water company
3. Provides reason (optional)
4. Sets access duration (7 days - indefinite)
5. Consent recorded on-chain
6. Water company can now access data
7. Audit log created
8. Customer can revoke anytime
```

## Security Considerations

### On-Chain
- Only hashes stored (privacy preservation)
- Timestamps for temporal verification
- Immutable audit trail
- Digital signatures for authorization

### Off-Chain
- MongoDB encryption at rest
- HTTPS/TLS for data in transit
- Access control lists per property
- Audit logging of all consent changes
- Rate limiting on API endpoints

### Consent Model
- Customer controls all data access
- Granular per-property permissions
- Water company access can be revoked instantly
- Expiration dates for temporary access
- Full audit trail of consent changes

## Setup & Installation

### Requirements
- Node.js 18+
- MongoDB
- TypeScript
- scrypt-ts (for contracts)

### Backend Setup
```bash
cd backend
npm install
npm run build
npm run compile  # Compile Scrypt contracts
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Environment Variables
```
MONGODB_URI=mongodb://localhost:27017/plumbing
BSV_NETWORK=testnet  # or mainnet
PLUMBER_ID=<your-identity-key>
```

## Testing Workflows

### Customer Registration
1. Sign up → Create account
2. Register property
3. Invite plumber
4. Grant water company access

### Plumber Workflow
1. Register → Create account
2. Accept property assignment
3. Register devices at property
4. Submit readings from devices
5. Create job
6. Complete job with report
7. Track revenue

### Water Company Workflow
1. Register → Create account
2. Request customer consent
3. Receive access (or not)
4. View real-time data
5. Monitor alerts
6. Track leak prevention impact

## Scalability

- MongoDB sharding by propertyId
- IoT readings batched for efficiency
- Blockchain submission batched (reduced costs)
- CDN for photo storage
- Rate limiting per entity
- Connection pooling

## Future Enhancements

- Machine learning anomaly detection
- Predictive leak prevention
- Insurance claim integration
- Smart contract automation for water rates
- Multi-currency settlement
- Mobile app for field technicians
- AR visualization for water system
- Integration with utility billing systems

## License

See LICENSE.txt

## Support

For issues or questions, contact the development team.
