# System Architecture Diagram

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PLUMBING IoT BSV PLATFORM                             │
└─────────────────────────────────────────────────────────────────────────────┘

                              FRONTEND LAYER
┌─────────────────────────────────────────────────────────────────────────────┐
│  React.js / Material-UI                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐   │
│  │ CustomerDashboard    │  │  PlumberPortal       │  │ WaterCompany     │   │
│  ├──────────────────────┤  ├──────────────────────┤  ├──────────────────┤   │
│  │ • Real-time data     │  │ • Pending jobs       │  │ • Consented data │   │
│  │ • Pressure chart     │  │ • Complete job       │  │ • Alert monitor  │   │
│  │ • Temperature chart  │  │ • Revenue tracking   │  │ • Audit trail    │   │
│  │ • Grant/revoke       │  │ • Job history        │  │ • Access status  │   │
│  │   water company      │  │ • Photos upload      │  │                  │   │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓ HTTP/REST
                              BACKEND API LAYER
┌─────────────────────────────────────────────────────────────────────────────┐
│  Express.js / Node.js                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌─────────────────┐ │
│  │ IoT Routes             │  │ Job Routes             │  │ Consent Routes  │ │
│  ├────────────────────────┤  ├────────────────────────┤  ├─────────────────┤ │
│  │ POST /api/iot/reading  │  │ POST /api/jobs/create  │  │ POST /consent   │ │
│  │ POST /api/iot/batch    │  │ POST /api/jobs/:id/    │  │ DELETE /consent │ │
│  │ GET /api/iot/property/ │  │      complete          │  │ GET /audit      │ │
│  │ GET /api/iot/stats     │  │ POST /api/jobs/:id/    │  │ GET /access     │ │
│  │ GET /api/iot/alerts    │  │      approve           │  │                 │ │
│  │                        │  │ GET /api/jobs/revenue  │  │                 │ │
│  └────────────────────────┘  └────────────────────────┘  └─────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
                           SERVICE LAYER
┌─────────────────────────────────────────────────────────────────────────────┐
│  Core Business Logic                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────┐  ┌──────────────────────────┐                  │
│  │ PlumbingService (main)   │  │ BSVAccountManager        │                  │
│  ├──────────────────────────┤  ├──────────────────────────┤                  │
│  │ • submitReading()        │  │ • createCustomerAccount()│                  │
│  │ • submitReadingBatch()   │  │ • createPlumberAccount() │                  │
│  │ • getLatestReadings()    │  │ • registerProperty()     │                  │
│  │ • createJob()            │  │ • storeDataOnAccount()   │                  │
│  │ • completeJob()          │  │ • exportCustomerData()   │                  │
│  │ • approveJob()           │  │ • linkBsvTransaction()   │                  │
│  │ • grantWaterCompanyAccess│  │                          │                  │
│  │ • revokeWaterCompanyAccess                             │                  │
│  │ • checkAccess()          │  │                          │                  │
│  │ • getPropertyStats()     │  │                          │                  │
│  └──────────────────────────┘  └──────────────────────────┘                  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
                         DATA ACCESS LAYER
┌─────────────────────────────────────────────────────────────────────────────┐
│  Storage Services                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐   │
│  │ IoTDataStorage       │  │ JobReportStorage     │  │ ConsentStorage   │   │
│  ├──────────────────────┤  ├──────────────────────┤  ├──────────────────┤   │
│  │ • storeReading()     │  │ • createReport()     │  │ • createConsent()│   │
│  │ • storeBatch()       │  │ • completeReport()   │  │ • grantAccess()  │   │
│  │ • getLatestReadings()│  │ • approveReport()    │  │ • revokeAccess() │   │
│  │ • getReadingsInRange│  │ • getReport()        │  │ • hasAccess()    │   │
│  │ • getPropertyAlerts()│  │ • getPropertyReports()│ │ • getAuditTrail()│   │
│  │ • getPropertyStats()│  │ • getRevenue()       │  │ • logChange()    │   │
│  │ • deleteOldReadings()│  │ • findByHash()       │  │                  │   │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
                        DATABASE LAYER
┌──────────────────────────────────────────────────────────────────────────────┐
│  MongoDB Collections                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  IoTReadings  │ IoTReadingBatches │ IoTDevices │ JobReports                   │
│  ─────────────┴───────────────────┴────────────┴──────────────────────────    │
│  PropertyConsents │ ConsentAuditLogs │ BSVAccounts │ Properties               │
│  ─────────────────┴──────────────────┴─────────────┴────────────────────      │
│  CustomerDataStorage │ PlumberJobStorage │ MeterRecords                       │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
                           ↓
           BLOCKCHAIN LAYER (BSV Network)
┌──────────────────────────────────────────────────────────────────────────────┐
│  Smart Contracts                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │ PropertyRegistry    │  │ IoTDataProof     │  │ JobReport              │  │
│  ├─────────────────────┤  ├──────────────────┤  ├────────────────────────┤  │
│  │ • Property owner    │  │ • Data hash      │  │ • Job completion       │  │
│  │ • Plumber assign    │  │ • Timestamp      │  │ • Work performed       │  │
│  │ • WC consent list   │  │ • Device ID      │  │ • Cost tracking        │  │
│  │ • Access verify     │  │ • Immutable proof│  │ • Customer approval    │  │
│  └─────────────────────┘  └──────────────────┘  │ • Integrity verify     │  │
│                                                  └────────────────────────┘  │
│                                                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ ConsentManager                                                          │  │
│  ├────────────────────────────────────────────────────────────────────────┤  │
│  │ • Consent grants/revokes                                              │  │
│  │ • Expiration dates                                                    │  │
│  │ • Access verification                                                │  │
│  │ • Complete audit trail                                               │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### IoT Reading Flow
```
IoT Device
    │
    ├─→ Pressure (PSI)
    ├─→ Flow Rate (GPM)
    └─→ Temperature (°C)
         │
         ↓
    submitReading()
         │
         ├─→ Detect Alerts (high_pressure, low_flow, temp_anomaly, leak_detected)
         │
         ↓
    IoTDataStorage.storeReading()
         │
         ├─→ MongoDB storage
         │
         ├─→ Customer sees on Dashboard
         │
         ├─→ Plumber sees real-time
         │
         └─→ Water Company sees (if consented)
              │
              ↓
    Periodic Batch Creation
         │
         ├─→ Multiple readings grouped
         │
         ├─→ SHA256 hash calculated
         │
         └─→ Ready for Blockchain Proof
              │
              ↓
    IoTDataProof Contract
         │
         └─→ Immutable hash + timestamp on BSV
```

### Job Workflow
```
Plumber Creates Job
    │
    ├─→ Property ID
    ├─→ Customer ID
    ├─→ Description
    │
    ↓
Job Status: "pending"
    │
    ├─→ Plumber performs work
    │
    ↓
Plumber Completes Job
    │
    ├─→ Work performed items
    ├─→ Parts used + costs
    ├─→ Photos uploaded
    ├─→ Total cost
    │
    ↓
Generate Report Hash
    │
    ├─→ SHA256 of all data
    │
    ↓
Job Status: "completed"
    │
    ├─→ JobReportStorage updates
    │
    ├─→ Ready for Blockchain Proof
    │
    ↓
JobReport Contract
    │
    └─→ Immutable hash on BSV
         │
         ↓
    Customer Views Job
         │
         ├─→ Can review details
         │
         ↓
    Customer Approves
         │
         ├─→ Signature required
         │
         ↓
    Job Status: "approved"
         │
         ├─→ Revenue tracked for plumber
         │
         ├─→ Stored on customer's BSV account
         │
         └─→ Complete audit trail
```

### Consent Flow
```
Customer Account Created
    │
    ├─→ Property registered
    │
    ├─→ Plumber assigned
    │
    ↓
Initial State:
    │
    ├─→ Customer ✓ (always has access)
    ├─→ Plumber ✓ (default assigned)
    ├─→ Water Company ✗ (no access)
    │
    ↓
Customer Grants Water Company Access
    │
    ├─→ Select water company
    ├─→ Provide reason (optional)
    ├─→ Set duration (7d - infinite)
    │
    ↓
ConsentStorage.grantWaterCompanyAccess()
    │
    ├─→ Add to consent list
    ├─→ Log change with timestamp
    ├─→ Set expiration date
    │
    ↓
New State:
    │
    ├─→ Customer ✓
    ├─→ Plumber ✓
    ├─→ Water Company ✓ (until expiration)
    │
    ↓
Water Company Can View
    │
    ├─→ Real-time IoT data
    ├─→ Alerts
    ├─→ Statistics
    │
    ↓
Customer Revokes Access
    │
    ├─→ One-click revocation
    │
    ↓
ConsentStorage.revokeWaterCompanyAccess()
    │
    ├─→ Remove from consent list
    ├─→ Log revocation
    ├─→ Immediate effect
    │
    ↓
Final State:
    │
    ├─→ Customer ✓
    ├─→ Plumber ✓
    ├─→ Water Company ✗ (access denied)
    │
    ↓
Complete Audit Trail Maintained
    │
    └─→ All grants/revokes logged with timestamps
```

## Component Interaction Matrix

```
┌─────────────────┬────────────────┬──────────────┬────────────────────┐
│ Component       │ Reads From     │ Writes To    │ Submits To         │
├─────────────────┼────────────────┼──────────────┼────────────────────┤
│ IoT Device      │ -              │ Readings     │ API /iot/reading   │
├─────────────────┼────────────────┼──────────────┼────────────────────┤
│ PlumbingService │ All Storage    │ All Storage  │ Blockchain         │
├─────────────────┼────────────────┼──────────────┼────────────────────┤
│ IoTDataStorage  │ MongoDB        │ MongoDB      │ -                  │
├─────────────────┼────────────────┼──────────────┼────────────────────┤
│ JobReportStore  │ MongoDB        │ MongoDB      │ -                  │
├─────────────────┼────────────────┼──────────────┼────────────────────┤
│ ConsentStorage  │ MongoDB        │ MongoDB      │ -                  │
├─────────────────┼────────────────┼──────────────┼────────────────────┤
│ BSVAccountMgr   │ MongoDB        │ MongoDB      │ -                  │
├─────────────────┼────────────────┼──────────────┼────────────────────┤
│ Frontend        │ Backend APIs   │ User input   │ Backend APIs       │
├─────────────────┼────────────────┼──────────────┼────────────────────┤
│ Smart Contract  │ Blockchain     │ Blockchain   │ -                  │
└─────────────────┴────────────────┴──────────────┴────────────────────┘
```

## Deployment Architecture

```
Production Environment
├── Load Balancer
│   ├── Backend Server 1 (node app.ts)
│   ├── Backend Server 2 (node app.ts)
│   └── Backend Server 3 (node app.ts)
├── MongoDB Replica Set
│   ├── Primary (reads & writes)
│   ├── Secondary 1 (reads & backups)
│   └── Secondary 2 (reads & backups)
├── CDN
│   ├── Frontend static files
│   ├── Customer photos
│   └── Job report documents
└── BSV Network
    ├── Smart Contracts deployed
    └── Transaction storage
```

## Security Boundaries

```
                    PUBLIC INTERNET
                         │
        ┌────────────────┴────────────────┐
        │                                  │
    Frontend (HTTPS)                  API Gateway
        │                                  │
        │                          (Rate limiting, JWT auth)
        │                                  │
        └────────────────┬────────────────┘
                         │
                    INTERNAL NETWORK
                         │
                   ┌─────┴─────┐
                   │           │
              Backend API    Database
              (Private)      (Private)
                   │           │
                   └─────┬─────┘
                         │
                   BSV Blockchain
                   (Public read-only)
```
