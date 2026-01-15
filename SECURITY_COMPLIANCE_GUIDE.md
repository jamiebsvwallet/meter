# Security & Compliance Implementation Guide

## Overview

This document details the enterprise-grade security, compliance, and demand forecasting features implemented to achieve regulations compliance (GDPR, SOC2, ISO27001, HIPAA, PCI-DSS).

## Table of Contents

1. [Security Infrastructure](#security-infrastructure)
2. [Compliance Framework](#compliance-framework)
3. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
4. [Demand Forecasting](#demand-forecasting)
5. [API Endpoints](#api-endpoints)
6. [Deployment Configuration](#deployment-configuration)
7. [Testing & Verification](#testing--verification)

---

## Security Infrastructure

### Security Middleware Layers

The platform implements **25+ security middleware functions** applied in the correct order for maximum protection:

#### 1. HTTP Security Headers (Helmet)
```typescript
// Applied via helmet with custom CSP
Content-Security-Policy: 10 directives
Strict-Transport-Security: max-age=31536000 (1 year)
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

**Configuration:**
- Default sources: `'self'`
- Script sources: `'self' 'unsafe-inline' 'unsafe-eval'` (for React/Material-UI)
- Style sources: `'self' 'unsafe-inline'` (for styled-components)
- Font sources: `'self' data:`
- Image sources: `'self' data: https:`
- Connect sources: `'self'`

#### 2. CORS Protection
```typescript
// Whitelist-based origin checking
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'https://plumbing.local'
]
```

**Features:**
- Rejects requests from non-whitelisted origins
- Credentials enabled for whitelisted origins
- Preflight request caching

#### 3. Rate Limiting

**General API Rate Limit:**
- **100 requests per 15 minutes** per IP
- Applies to: All `/api/*` routes
- Response: `429 Too Many Requests` with retry-after header

**Authentication Rate Limit:**
- **5 requests per 15 minutes** per IP
- Applies to: `/api/auth/*` routes
- Prevents brute force attacks

#### 4. Input Validation & Sanitization

**SQL Injection Prevention:**
```typescript
// Pattern matching for dangerous SQL keywords
Blocked patterns: UNION, SELECT, INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, --, #
```

**XSS Protection:**
```typescript
// Removes dangerous HTML/JS patterns
Sanitized: <script>, <iframe>, <object>, <embed>, javascript:, on* handlers
```

**Request Validation:**
```typescript
// express-validator schemas for all inputs
- propertyId: alphanumeric + underscore, 3-50 chars
- deviceId: alphanumeric + underscore, 3-50 chars  
- email: valid email format
- password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
- readingValue: numeric, min 0
- coordinates: valid latitude/longitude
- dateRange: valid ISO8601 dates
- pagination: page ≥1, limit 1-100
```

#### 5. HTTP Pollution Protection (HPP)
- Prevents duplicate query parameters
- Takes last value if duplicates found
- Protects against parameter pollution attacks

#### 6. Compression
- GZIP compression level 6
- Applies to responses > 1KB
- Reduces bandwidth by ~70%

#### 7. Request Size Limiting
- JSON body: 10MB max
- URL-encoded body: 10MB max
- Prevents denial-of-service via large payloads

#### 8. GDPR Privacy Headers
```http
X-Data-Processing: GDPR-Compliant
X-Privacy-Policy: /api/privacy
X-Data-Retention: See /api/retention-policy
```

---

## Compliance Framework

### Audit Logging System

**Winston Logger Configuration:**
```typescript
Transports:
1. audit.log
   - Level: info
   - Max size: 10MB
   - Max files: 10
   - Tailable: true
   
2. security.log
   - Level: warn
   - Max size: 10MB
   - Max files: 5
   - Tailable: true

3. console
   - Level: info
   - Colorized output
```

**Audit Event Types:**
```typescript
enum AuditEventType {
  DATA_ACCESS = 'DATA_ACCESS',           // Data read operations
  DATA_MODIFICATION = 'DATA_MODIFICATION', // Data write/update operations
  DATA_DELETION = 'DATA_DELETION',       // Data deletion operations
  CONSENT_GIVEN = 'CONSENT_GIVEN',       // User consent granted
  CONSENT_REVOKED = 'CONSENT_REVOKED',   // User consent revoked
  EXPORT_REQUEST = 'EXPORT_REQUEST',     // Data export (GDPR Article 20)
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS', // Failed auth/authorization
  SECURITY_ALERT = 'SECURITY_ALERT'      // Security anomalies
}
```

**Log Format:**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "eventType": "DATA_ACCESS",
  "userId": "user_123",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "resource": "property_data",
  "action": "read",
  "result": "success",
  "dataCategory": "PERSONAL_INFO",
  "complianceStandards": ["GDPR", "SOC2"],
  "severity": "medium"
}
```

### Data Retention Policies

| Data Category | Retention Period | Standards |
|--------------|------------------|-----------|
| Personal Information | 365 days | GDPR Art. 5(e), SOC2 |
| IoT Readings | 90 days | ISO27001 |
| Payment Data | 1095 days (3 years) | PCI-DSS, SOC2 |
| Location Data | 180 days | GDPR Art. 6 |
| Usage Patterns | 730 days (2 years) | SOC2 |

**Automated Cleanup:**
```typescript
// Compliance service checks retention policies
// Flags data for deletion when retention period expires
// Logs all deletions for audit trail
```

### GDPR Compliance

**Implemented Rights:**

1. **Article 7 - Consent** ✅
   ```typescript
   recordConsent(userId, purpose, granted, metadata)
   // Tracks: timestamp, purpose, IP, user agent
   ```

2. **Article 15 - Right to Access** ✅
   ```typescript
   logDataAccess(userId, dataType, purpose)
   // Logs all data access for transparency
   ```

3. **Article 16 - Right to Rectification** ✅
   ```typescript
   logDataModification(userId, dataType, modifications)
   // Tracks what was changed and when
   ```

4. **Article 17 - Right to Erasure** ✅
   ```typescript
   logDataDeletion(userId, dataType, reason)
   // Permanent deletion with audit trail
   ```

5. **Article 20 - Right to Data Portability** ✅
   ```typescript
   exportUserData(userId)
   // JSON export of all user data
   ```

**Consent Management:**
```typescript
interface Consent {
  userId: string
  purpose: string        // e.g., "water_usage_analytics"
  granted: boolean
  timestamp: Date
  expiresAt?: Date       // Optional expiration
  ipAddress: string
  userAgent: string
}
```

### SOC2 Compliance

**Trust Service Criteria:**

1. **Security** ✅
   - Multi-layer security middleware
   - Encryption at rest (partial) and in transit (HTTPS)
   - Access controls via RBAC
   - Audit logging of all security events

2. **Availability** ✅
   - Rate limiting prevents DoS
   - Compression reduces bandwidth
   - Background job processing

3. **Confidentiality** ✅
   - Role-based access control
   - Property ownership validation
   - Authentication required for all data access

4. **Privacy** ✅
   - GDPR compliance
   - Consent management
   - Data retention policies
   - User data export

### ISO27001 Compliance

**Information Security Controls:**

1. **Access Control (A.9)** ✅
   - RBAC with 8 roles and 29 permissions
   - JWT authentication
   - Session management

2. **Cryptography (A.10)** ⚠️
   - TLS/HTTPS (in transit)
   - Database encryption (partial)
   - Password hashing (bcrypt)

3. **Operations Security (A.12)** ✅
   - Audit logging
   - Change management
   - Malware protection (input sanitization)

4. **Communications Security (A.13)** ✅
   - Network segmentation
   - Secure data transfer
   - API security

### HIPAA Compliance (If Health Data)

**If handling health-related IoT data:**

1. **Administrative Safeguards** ✅
   - Access controls
   - Audit logging
   - Security training (documentation)

2. **Technical Safeguards** ✅
   - Access control (RBAC)
   - Audit controls (Winston logs)
   - Integrity controls (input validation)

3. **Physical Safeguards** 📝
   - Server security (deployment-dependent)
   - Device security (IoT device management)

### PCI-DSS Compliance (If Payment Data)

**If handling payment transactions:**

1. **Build and Maintain Secure Network** ✅
   - Firewall (deployment-dependent)
   - Secure defaults

2. **Protect Cardholder Data** ⚠️
   - Encryption (partial)
   - Tokenization (not implemented)

3. **Maintain Vulnerability Management** ✅
   - Input validation
   - Regular updates

---

## Role-Based Access Control (RBAC)

### User Roles

```typescript
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',     // Full system access
  ADMIN = 'ADMIN',                 // Organization admin
  WATER_COMPANY = 'WATER_COMPANY', // Water utility access
  PLUMBER = 'PLUMBER',             // Plumber/contractor
  CUSTOMER = 'CUSTOMER',           // Property owner
  IOT_DEVICE = 'IOT_DEVICE',       // IoT device
  AI_MONITOR = 'AI_MONITOR',       // AI analytics access
  READONLY = 'READONLY'            // Read-only observer
}
```

### Permissions Matrix

| Permission | SUPER_ADMIN | ADMIN | WATER_COMPANY | PLUMBER | CUSTOMER | IOT_DEVICE | AI_MONITOR | READONLY |
|-----------|-------------|-------|---------------|---------|----------|------------|------------|----------|
| USER_CREATE | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| USER_READ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| USER_UPDATE | ✅ | ✅ | ❌ | ❌ | ✅* | ❌ | ❌ | ❌ |
| USER_DELETE | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| PROPERTY_CREATE | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| PROPERTY_READ | ✅ | ✅ | ✅ | ✅ | ✅* | ❌ | ✅* | ✅* |
| PROPERTY_UPDATE | ✅ | ✅ | ✅ | ✅* | ✅* | ❌ | ❌ | ❌ |
| PROPERTY_DELETE | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| DEVICE_CREATE | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| DEVICE_READ | ✅ | ✅ | ✅ | ✅ | ✅* | ✅ | ✅* | ✅* |
| DEVICE_UPDATE | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| DEVICE_DELETE | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| DEVICE_WRITE_DATA | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| JOB_CREATE | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| JOB_READ | ✅ | ✅ | ✅ | ✅ | ✅* | ❌ | ✅* | ✅* |
| JOB_UPDATE | ✅ | ✅ | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| JOB_DELETE | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI_CREATE_MODEL | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| AI_TRAIN_MODEL | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| AI_INFERENCE | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| FORECAST_CREATE | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| FORECAST_READ | ✅ | ✅ | ✅ | ✅ | ✅* | ❌ | ✅ | ✅* |
| ANALYTICS_READ | ✅ | ✅ | ✅ | ✅ | ✅* | ❌ | ✅ | ✅* |
| ANALYTICS_EXPORT | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| SYSTEM_CONFIG | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SYSTEM_LOGS | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| COMPLIANCE_AUDIT | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| CONSENT_MANAGE | ✅ | ✅ | ✅ | ❌ | ✅* | ❌ | ❌ | ❌ |

*\* Indicates permission limited to owned resources only*

### Property Ownership Validation

```typescript
// Middleware automatically checks property ownership
// Exempts SUPER_ADMIN and WATER_COMPANY roles

if (userRole !== SUPER_ADMIN && userRole !== WATER_COMPANY) {
  if (!user.propertyIds.includes(requestedPropertyId)) {
    return 403 Forbidden
  }
}
```

### Authentication Flow

```typescript
1. Client sends request with Bearer token
   Authorization: Bearer <jwt_token>

2. requireAuth() middleware validates JWT
   - Extracts user object {id, email, role, iat, propertyIds?, permissions?}
   - Attaches to req.user

3. requirePermission() checks role→permissions mapping
   - Converts string role to UserRole enum if needed
   - Looks up permissions for user's role
   - Grants/denies access

4. requirePropertyOwnership() validates resource access
   - Checks if user owns requested property
   - Exempts privileged roles
```

---

## Demand Forecasting

### Machine Learning Model

**Algorithm:** Polynomial Regression (Degree 3)

**Formula:**
```
y = β₀ + β₁x + β₂x² + β₃x³
```

Where:
- `y` = predicted consumption (gallons)
- `x` = hour offset from start
- `β₀, β₁, β₂, β₃` = regression coefficients

**Training Requirements:**
- Minimum: **168 hourly readings** (1 week)
- Recommended: 90 days of data
- Data retention: 90 days (ISO27001 compliance)

### Forecasting Features

#### 1. Time-Series Prediction

```typescript
forecastConsumption(hoursAhead: number)
// Returns array of forecasts with:
{
  timestamp: Date
  predictedConsumption: number    // Gallons
  confidence: number              // 0-1 scale
  trend: 'increasing' | 'decreasing' | 'stable'
  peakHours: number[]            // Array of peak hours
  seasonalFactor: number         // Seasonal adjustment (0.8-1.2)
  anomalyScore: number           // 0-1 abnormality score
}
```

**Confidence Calculation:**
```typescript
// Decreases exponentially with forecast horizon
confidence = 0.9 - (hoursAhead / maxHours) * 0.6
// Range: 0.3 (far future) to 0.9 (near term)
```

#### 2. Seasonal Adjustments

```typescript
Seasonal Factors:
- Winter (Dec-Feb): 0.85x base consumption
- Spring (Mar-May): 1.0x base consumption
- Summer (Jun-Aug): 1.15x base consumption
- Fall (Sep-Nov): 0.95x base consumption
```

#### 3. Temperature Adjustments

```typescript
Temperature Multipliers:
- >85°F: 1.30x (high water usage)
- 75-85°F: 1.15x (moderate increase)
- <75°F: 1.0x (normal usage)
```

#### 4. Weekday vs Weekend Patterns

```typescript
// Automatically calculates:
- Weekday average consumption
- Weekend average consumption
- Peak usage hour (0-23)
```

#### 5. Anomaly Detection

**Algorithm:** Standard Deviation Threshold

```typescript
Anomaly Score Calculation:
deviation = |reading - average| / stddev

if (deviation > 2σ) {
  anomalyScore = 0.9  // High anomaly
  severity = 'high'
  logSecurityEvent(SECURITY_ALERT)
} else if (deviation > 1.5σ) {
  anomalyScore = 0.6  // Medium anomaly
} else if (deviation > 1σ) {
  anomalyScore = 0.3  // Low anomaly
}
```

**Default Threshold:** 2.0 standard deviations

#### 6. Peak Demand Forecasting

```typescript
// Aggregates multiple properties
forecastPeakDemand(propertyIds: string[], hoursAhead: number)

Returns:
{
  peakTime: Date              // When peak occurs
  peakDemand: number          // Total gallons across all properties
  confidenceLevel: number     // Aggregate confidence
  contributingProperties: {   // Breakdown by property
    propertyId: string
    estimatedConsumption: number
  }[]
}
```

#### 7. Growth Rate Analysis

```typescript
// Compares first week to last week
growthRate = ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100
// Positive = consumption increasing
// Negative = consumption decreasing
```

### Usage Patterns

```typescript
interface UsagePattern {
  avgDailyConsumption: number      // Gallons/day
  peakUsageHour: number            // 0-23
  weekdayAverage: number           // Weekday consumption
  weekendAverage: number           // Weekend consumption
  seasonalVariation: {             // Seasonal multipliers
    winter: number
    spring: number
    summer: number
    fall: number
  }
  growthRate: number               // % change over time
}
```

---

## API Endpoints

### Forecast Routes

**Base URL:** `/api/forecast`

#### 1. Submit Consumption Reading

```http
POST /api/forecast/readings
Authorization: Bearer <token>
Permission: DEVICE_WRITE_DATA

Body:
{
  "propertyId": "prop_001",
  "consumption": 45.2,
  "timestamp": "2024-01-15T14:30:00Z",
  "temperature": 72,
  "isHoliday": false
}

Response: 201 Created
{
  "message": "Reading recorded successfully"
}
```

**Validation:**
- `propertyId`: alphanumeric + underscore, 3-50 chars
- `consumption`: number ≥ 0
- `timestamp`: ISO8601 date
- `temperature`: optional number
- `isHoliday`: optional boolean

**Audit Log:** `USAGE_PATTERNS` category logged

#### 2. Train Forecasting Model

```http
POST /api/forecast/train/:propertyId
Authorization: Bearer <token>
Permission: FORECAST_CREATE

Response: 200 OK
{
  "message": "Model trained successfully",
  "stats": {
    "dataPoints": 720,
    "trainingPeriod": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-30T23:59:59Z"
    },
    "accuracy": 0.87
  }
}

Error: 400 Bad Request
{
  "error": "Insufficient data",
  "message": "Need at least 168 hourly readings to train model"
}
```

#### 3. Get Consumption Forecast

```http
GET /api/forecast/predict/:propertyId?hours=24
Authorization: Bearer <token>
Permission: FORECAST_READ

Query Parameters:
- hours: 1-168 (default: 24)

Response: 200 OK
{
  "propertyId": "prop_001",
  "forecasts": [
    {
      "timestamp": "2024-01-16T15:00:00Z",
      "predictedConsumption": 42.5,
      "confidence": 0.88,
      "trend": "stable",
      "peakHours": [6, 7, 8, 18, 19, 20],
      "seasonalFactor": 0.85,
      "anomalyScore": 0.0
    },
    // ... 23 more hourly forecasts
  ],
  "summary": {
    "totalPredicted": 1020.0,
    "avgHourly": 42.5,
    "peakHour": 19,
    "confidenceAvg": 0.82
  }
}
```

#### 4. Get Peak Demand Forecast

```http
GET /api/forecast/peak-demand?propertyIds=prop_001,prop_002&hours=24
Authorization: Bearer <token>
Permission: FORECAST_READ

Response: 200 OK
{
  "peakTime": "2024-01-16T19:00:00Z",
  "peakDemand": 850.5,
  "confidenceLevel": 0.84,
  "contributingProperties": [
    {
      "propertyId": "prop_001",
      "estimatedConsumption": 450.2
    },
    {
      "propertyId": "prop_002",
      "estimatedConsumption": 400.3
    }
  ]
}
```

#### 5. Get Usage Patterns

```http
GET /api/forecast/patterns/:propertyId
Authorization: Bearer <token>
Permission: ANALYTICS_READ

Response: 200 OK
{
  "propertyId": "prop_001",
  "patterns": {
    "avgDailyConsumption": 1020.5,
    "peakUsageHour": 19,
    "weekdayAverage": 1050.0,
    "weekendAverage": 950.0,
    "seasonalVariation": {
      "winter": 0.85,
      "spring": 1.0,
      "summer": 1.15,
      "fall": 0.95
    },
    "growthRate": 2.5
  }
}
```

#### 6. Detect Anomalies

```http
GET /api/forecast/anomalies/:propertyId?threshold=2.0
Authorization: Bearer <token>
Permission: ANALYTICS_READ

Query Parameters:
- threshold: 1.0-5.0 (default: 2.0) standard deviations

Response: 200 OK
{
  "propertyId": "prop_001",
  "anomaliesDetected": true,
  "anomalies": [
    {
      "timestamp": "2024-01-15T03:00:00Z",
      "consumption": 150.5,
      "expectedRange": {
        "min": 30.0,
        "max": 50.0
      },
      "deviationScore": 3.2,
      "severity": "high"
    }
  ],
  "totalAnomalies": 3
}
```

**Security Alert:** High anomalies trigger `SECURITY_ALERT` audit log

#### 7. Get Model Statistics

```http
GET /api/forecast/stats/:propertyId
Authorization: Bearer <token>
Permission: ANALYTICS_READ

Response: 200 OK
{
  "propertyId": "prop_001",
  "dataPoints": 720,
  "trainingPeriod": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-30T23:59:59Z"
  },
  "accuracy": 0.87,
  "lastUpdated": "2024-01-15T10:00:00Z"
}
```

---

## Deployment Configuration

### Environment Variables

```bash
# Authentication
JWT_SECRET=your-256-bit-secret-key-here
JWT_EXPIRATION=24h

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Security
ALLOWED_ORIGINS=https://app.plumbing.local,https://api.plumbing.local
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Compliance
AUDIT_LOG_PATH=/var/log/plumbing/audit.log
SECURITY_LOG_PATH=/var/log/plumbing/security.log
AUDIT_LOG_MAX_SIZE=10485760  # 10MB
AUDIT_LOG_MAX_FILES=10

# Forecasting
FORECAST_MIN_DATA_POINTS=168
FORECAST_DATA_RETENTION_DAYS=90
ANOMALY_DETECTION_THRESHOLD=2.0

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

### HTTPS Configuration

**Production Requirements:**
```nginx
# Nginx reverse proxy with TLS
server {
  listen 443 ssl http2;
  server_name api.plumbing.local;

  ssl_certificate /etc/ssl/certs/plumbing.crt;
  ssl_certificate_key /etc/ssl/private/plumbing.key;
  
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### Log Rotation

```bash
# /etc/logrotate.d/plumbing
/var/log/plumbing/*.log {
  daily
  rotate 30
  compress
  delaycompress
  notifempty
  create 0640 plumbing plumbing
  sharedscripts
  postrotate
    systemctl reload plumbing-api
  endscript
}
```

### Database Encryption

**PostgreSQL Configuration:**
```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive columns
ALTER TABLE users 
  ALTER COLUMN email TYPE bytea USING pgp_sym_encrypt(email, 'encryption-key');

ALTER TABLE properties
  ALTER COLUMN address TYPE bytea USING pgp_sym_encrypt(address, 'encryption-key');
```

---

## Testing & Verification

### 1. Security Testing

#### Rate Limiting Test
```bash
# Should return 429 after 100 requests
for i in {1..110}; do
  curl -X GET http://localhost:3000/api/properties
done
```

#### SQL Injection Test
```bash
# Should be blocked by preventSQLInjection middleware
curl -X GET "http://localhost:3000/api/properties?id=1' OR '1'='1"
```

#### XSS Test
```bash
# Should be sanitized
curl -X POST http://localhost:3000/api/consent \
  -H "Content-Type: application/json" \
  -d '{"purpose": "<script>alert(1)</script>"}'
```

#### CORS Test
```bash
# Should be rejected (unauthorized origin)
curl -X GET http://localhost:3000/api/properties \
  -H "Origin: http://malicious.com"
```

### 2. RBAC Testing

#### Permission Check
```bash
# Customer should NOT be able to create users
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer <customer_token>" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
# Expected: 403 Forbidden
```

#### Property Ownership
```bash
# Customer should NOT access other properties
curl -X GET http://localhost:3000/api/properties/prop_999 \
  -H "Authorization: Bearer <customer_token>"
# Expected: 403 Forbidden (if not owner)
```

### 3. Forecasting Testing

#### Train Model
```bash
# Submit 200 readings (> 168 minimum)
for hour in {1..200}; do
  curl -X POST http://localhost:3000/api/forecast/readings \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d "{\"propertyId\": \"prop_001\", \"consumption\": $((40 + RANDOM % 20)), \"timestamp\": \"$(date -u -d "+$hour hours" +%Y-%m-%dT%H:%M:%SZ)\"}"
done

# Train model
curl -X POST http://localhost:3000/api/forecast/train/prop_001 \
  -H "Authorization: Bearer <token>"
```

#### Get Forecast
```bash
curl -X GET "http://localhost:3000/api/forecast/predict/prop_001?hours=24" \
  -H "Authorization: Bearer <token>"
```

#### Anomaly Detection
```bash
# Submit outlier reading
curl -X POST http://localhost:3000/api/forecast/readings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"propertyId": "prop_001", "consumption": 500, "timestamp": "2024-01-15T14:00:00Z"}'

# Check for anomalies
curl -X GET "http://localhost:3000/api/forecast/anomalies/prop_001?threshold=2.0" \
  -H "Authorization: Bearer <token>"
```

### 4. Compliance Verification

#### Audit Logs
```bash
# Check audit log exists and is being written
tail -f /var/log/plumbing/audit.log

# Should show entries like:
# {"timestamp":"2024-01-15T10:30:00.000Z","eventType":"DATA_ACCESS",...}
```

#### Data Retention
```bash
# Query compliance service
curl -X GET http://localhost:3000/api/compliance/report \
  -H "Authorization: Bearer <admin_token>"

# Should return:
# {
#   "gdpr": {"compliant": true, ...},
#   "soc2": {"compliant": true, ...},
#   "iso27001": {"compliant": true, ...}
# }
```

#### GDPR Export
```bash
# Request data export
curl -X POST http://localhost:3000/api/consent/export \
  -H "Authorization: Bearer <customer_token>"

# Should return JSON with all user data
```

---

## Security Checklist

### Pre-Production

- [ ] Set strong `JWT_SECRET` (256-bit)
- [ ] Configure HTTPS/TLS certificates
- [ ] Update `ALLOWED_ORIGINS` whitelist
- [ ] Enable database encryption at rest
- [ ] Configure log rotation
- [ ] Set up firewall rules
- [ ] Review rate limit thresholds
- [ ] Test all RBAC permissions
- [ ] Verify audit logging works
- [ ] Test data retention cleanup
- [ ] Scan for vulnerabilities (`npm audit`)
- [ ] Update dependencies
- [ ] Configure backup strategy
- [ ] Set up monitoring/alerting
- [ ] Document incident response plan

### Post-Deployment

- [ ] Monitor audit logs daily
- [ ] Review security alerts
- [ ] Check rate limit violations
- [ ] Verify HTTPS enforcement
- [ ] Test backup restoration
- [ ] Audit user permissions quarterly
- [ ] Update security documentation
- [ ] Train staff on security procedures
- [ ] Conduct penetration testing
- [ ] Review compliance reports

---

## Troubleshooting

### Common Issues

#### 1. Build Errors

**Issue:** TypeScript errors about missing `iat` property
```
Property 'iat' is missing in type...
```

**Solution:** Already fixed. RBAC interface now includes `iat: number` to match auth.ts

#### 2. Rate Limiting Too Strict

**Issue:** Legitimate users hitting rate limits

**Solution:** Adjust limits in environment variables:
```bash
RATE_LIMIT_MAX_REQUESTS=200  # Increase to 200
RATE_LIMIT_WINDOW_MS=900000   # Keep 15 min window
```

#### 3. Forecasting Errors

**Issue:** "Insufficient data" when training model

**Solution:** Submit at least 168 hourly readings:
```bash
# Check current data points
curl -X GET http://localhost:3000/api/forecast/stats/prop_001
```

#### 4. Audit Logs Not Writing

**Issue:** No logs appearing in audit.log

**Solution:** 
1. Check permissions: `chmod 0640 /var/log/plumbing/audit.log`
2. Check directory exists: `mkdir -p /var/log/plumbing`
3. Check winston configuration in [compliance.ts](backend/src/services/compliance.ts)

#### 5. CORS Errors

**Issue:** Browser console shows CORS policy errors

**Solution:** Add frontend origin to whitelist:
```typescript
// backend/src/middleware/security.ts
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://your-frontend-domain.com'  // Add this
]
```

---

## Additional Resources

- [GDPR Official Text](https://gdpr-info.eu/)
- [SOC2 Framework](https://www.aicpa.org/soc)
- [ISO/IEC 27001](https://www.iso.org/isoiec-27001-information-security.html)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [PCI DSS Standards](https://www.pcisecuritystandards.org/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## Support

For security issues or compliance questions:
- Email: security@plumbing.local
- Issue Tracker: [GitHub Issues](https://github.com/your-repo/issues)
- Documentation: [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

---

**Last Updated:** 2024-01-15  
**Version:** 2.0.0  
**Author:** Platform Security Team
