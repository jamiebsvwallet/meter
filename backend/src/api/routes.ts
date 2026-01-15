/**
 * API Routes Configuration
 * Backend endpoints for IoT data, job reports, and consent management
 */

/**
 * IoT Data Endpoints
 */
export const IoTRoutes = {
  // Submit single reading
  submitReading: 'POST /api/iot/reading',
  // Submit batch with blockchain proof
  submitBatch: 'POST /api/iot/batch',
  // Get latest readings
  getLatestReadings: 'GET /api/iot/property/:propertyId/readings',
  // Get readings in time range
  getReadingsHistory: 'GET /api/iot/property/:propertyId/readings/history',
  // Get active alerts
  getAlerts: 'GET /api/iot/property/:propertyId/alerts',
  // Get property statistics
  getStats: 'GET /api/iot/property/:propertyId/stats',
  // Register device
  registerDevice: 'POST /api/iot/device/register',
  // Update device status
  updateDeviceStatus: 'PATCH /api/iot/device/:deviceId/status'
}

/**
 * Job Report Endpoints
 */
export const JobRoutes = {
  // Create new job
  createJob: 'POST /api/jobs/create',
  // Get job details
  getJob: 'GET /api/jobs/:jobId',
  // Get property jobs
  getPropertyJobs: 'GET /api/jobs/property/:propertyId',
  // Get pending jobs for plumber
  getPendingJobs: 'GET /api/jobs/plumber/:plumberId/pending',
  // Get completed jobs for plumber
  getCompletedJobs: 'GET /api/jobs/plumber/:plumberId/completed',
  // Get customer jobs
  getCustomerJobs: 'GET /api/jobs/customer/:customerId',
  // Complete job and submit report
  completeJob: 'POST /api/jobs/:jobId/complete',
  // Approve job as customer
  approveJob: 'POST /api/jobs/:jobId/approve',
  // Get revenue
  getRevenue: 'GET /api/jobs/plumber/:plumberId/revenue'
}

/**
 * Consent & Access Control Endpoints
 */
export const ConsentRoutes = {
  // Setup property consent
  setupConsent: 'POST /api/consent/:propertyId/setup',
  // Get consent summary
  getConsentSummary: 'GET /api/consent/:propertyId/summary',
  // Grant water company access
  grantWaterCompanyAccess: 'POST /api/consent/:propertyId/grant-water-company',
  // Revoke water company access
  revokeWaterCompanyAccess: 'DELETE /api/consent/:propertyId/water-company/:companyId',
  // Check access
  checkAccess: 'GET /api/consent/:propertyId/access/:entityId/:entityType',
  // Get audit trail
  getAuditTrail: 'GET /api/consent/:propertyId/audit-trail',
  // Get water company properties
  getWaterCompanyProperties: 'GET /api/water-company/:companyId/properties'
}

/**
 * Blockchain Proof Endpoints
 */
export const BlockchainRoutes = {
  // Submit IoT data hash to blockchain
  submitIoTProof: 'POST /api/blockchain/iot-proof',
  // Submit job report hash to blockchain
  submitJobProof: 'POST /api/blockchain/job-proof',
  // Verify data integrity against blockchain
  verifyIoTData: 'POST /api/blockchain/verify-iot',
  // Verify job report against blockchain
  verifyJobReport: 'POST /api/blockchain/verify-job',
  // Get blockchain transaction reference
  getTransactionRef: 'GET /api/blockchain/tx/:txId'
}

/**
 * BSV Account Endpoints
 */
export const BSVAccountRoutes = {
  // Create customer account
  createCustomerAccount: 'POST /api/bsv/account/customer',
  // Create plumber account
  createPlumberAccount: 'POST /api/bsv/account/plumber',
  // Create water company account
  createWaterCompanyAccount: 'POST /api/bsv/account/water-company',
  // Get account details
  getAccount: 'GET /api/bsv/account/:userId',
  // Store data on customer's BSV account
  storeCustomerData: 'POST /api/bsv/data/customer/:customerId',
  // Store data on plumber's BSV account
  storePlumberData: 'POST /api/bsv/data/plumber/:plumberId',
  // Retrieve customer data
  getCustomerData: 'GET /api/bsv/data/customer/:customerId'
}

/**
 * Authentication Endpoints
 */
export const AuthRoutes = {
  // Sign up
  signup: 'POST /api/auth/signup',
  // Login
  login: 'POST /api/auth/login',
  // Logout
  logout: 'POST /api/auth/logout',
  // Verify BSV signature
  verifySignature: 'POST /api/auth/verify-signature'
}
