/**
 * Example Usage & Integration Guide
 * Demonstrates how to use the Plumbing IoT Platform
 */

import fetch from 'node-fetch'

const API_URL = 'http://localhost:3001'

// ========== Helper Functions ==========

async function apiCall(method: string, endpoint: string, body?: any): Promise<any> {
  const url = `${API_URL}${endpoint}`
  const options: any = {
    method,
    headers: { 'Content-Type': 'application/json' }
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  return await response.json()
}

// ========== IoT Device Examples ==========

/**
 * Example 1: IoT Device sends real-time reading
 */
async function submitIoTReading(): Promise<void> {
  console.log('\n📊 Example 1: IoT Device Submits Reading')
  console.log('=' .repeat(50))

  const reading = {
    deviceId: 'sensor-001',
    propertyId: 'property-123',
    pressure: 65.5, // PSI
    flowRate: 3.2, // GPM
    temperature: 18.5, // Celsius
    recordedBy: 'system'
  }

  try {
    const result = await apiCall('POST', '/api/iot/reading', reading)
    console.log('✓ Reading submitted:', result)
  } catch (error) {
    console.error('✗ Error:', error)
  }
}

/**
 * Example 2: Get latest readings for a property
 */
async function getLatestReadings(): Promise<void> {
  console.log('\n📈 Example 2: Get Latest Readings')
  console.log('='.repeat(50))

  try {
    const result = await apiCall(
      'GET',
      '/api/iot/property/property-123/readings?limit=10&userId=customer-001'
    )
    console.log('✓ Latest readings retrieved:', result.readingsCount, 'readings')
    if (result.readings?.length > 0) {
      console.log('  First reading:', result.readings[0])
    }
  } catch (error) {
    console.error('✗ Error:', error)
  }
}

/**
 * Example 3: Register IoT device
 */
async function registerDevice(): Promise<void> {
  console.log('\n🔧 Example 3: Register IoT Device')
  console.log('='.repeat(50))

  const device = {
    deviceId: 'device-pressure-001',
    propertyId: 'property-123',
    deviceType: 'pressure_sensor',
    registeredBy: 'plumber-001'
  }

  try {
    const result = await apiCall('POST', '/api/iot/device/register', device)
    console.log('✓ Device registered:', result)
  } catch (error) {
    console.error('✗ Error:', error)
  }
}

/**
 * Example 4: Get active alerts
 */
async function getAlerts(): Promise<void> {
  console.log('\n⚠️  Example 4: Get Active Alerts')
  console.log('='.repeat(50))

  try {
    const result = await apiCall('GET', '/api/iot/property/property-123/alerts?userId=customer-001')
    console.log('✓ Active alerts:', result.alertCount)
    if (result.alerts?.length > 0) {
      console.log('  Alerts:', result.alerts)
    }
  } catch (error) {
    console.error('✗ Error:', error)
  }
}

/**
 * Example 5: Get property statistics
 */
async function getPropertyStats(): Promise<void> {
  console.log('\n📊 Example 5: Property Statistics')
  console.log('='.repeat(50))

  try {
    const result = await apiCall(
      'GET',
      '/api/iot/property/property-123/stats?userId=customer-001'
    )
    console.log('✓ Property statistics:', result.stats)
  } catch (error) {
    console.error('✗ Error:', error)
  }
}

// ========== Job Report Examples ==========

/**
 * Example 6: Create new plumbing job
 */
async function createJob(): Promise<void> {
  console.log('\n💼 Example 6: Create Plumbing Job')
  console.log('='.repeat(50))

  const job = {
    jobId: `job-${Date.now()}`,
    propertyId: 'property-123',
    customerId: 'customer-001',
    plumberId: 'plumber-001',
    description: 'Fix leak detected in main water line',
    status: 'pending'
  }

  try {
    const result = await apiCall('POST', '/api/jobs/create', job)
    console.log('✓ Job created:', result)
  } catch (error) {
    console.error('✗ Error:', error)
  }
}

/**
 * Example 7: Complete job and submit report
 */
async function completeJob(): Promise<void> {
  console.log('\n✅ Example 7: Complete Job')
  console.log('='.repeat(50))

  const jobId = `job-${Date.now() - 1000}` // Use previously created job ID

  const completion = {
    workPerformed: [
      'Located leak at meter connection',
      'Replaced copper pipe section',
      'Pressure tested system at 80 PSI',
      'All connections sealed'
    ],
    partsUsed: [
      { name: 'Copper pipe 1/2"', cost: 15, quantity: 8 },
      { name: 'Solder and flux', cost: 5, quantity: 1 },
      { name: 'Coupling fittings', cost: 2, quantity: 4 }
    ],
    totalCost: 133,
    photos: [
      'https://photos.example.com/leak-before.jpg',
      'https://photos.example.com/leak-after.jpg'
    ],
    customerSignature: 'signature-hash-xyz'
  }

  try {
    const result = await apiCall('POST', `/api/jobs/${jobId}/complete`, completion)
    console.log('✓ Job completed:', result)
  } catch (error) {
    console.error('✗ Error:', error)
  }
}

/**
 * Example 8: Get plumber revenue
 */
async function getPlumberRevenue(): Promise<void> {
  console.log('\n💰 Example 8: Get Plumber Revenue')
  console.log('='.repeat(50))

  try {
    const result = await apiCall('GET', '/api/jobs/plumber/plumber-001/revenue')
    console.log('✓ Plumber revenue:', result)
  } catch (error) {
    console.error('✗ Error:', error)
  }
}

// ========== Consent & Access Control Examples ==========

/**
 * Example 9: Setup property consent
 */
async function setupConsent(): Promise<void> {
  console.log('\n🔐 Example 9: Setup Property Consent')
  console.log('='.repeat(50))

  const consent = {
    customerId: 'customer-001',
    plumberId: 'plumber-001'
  }

  try {
    const result = await apiCall('POST', '/api/consent/property-123/setup', consent)
    console.log('✓ Consent setup:', result)
  } catch (error) {
    console.error('✗ Error:', error)
  }
}

/**
 * Example 10: Grant water company access
 */
async function grantWaterCompanyAccess(): Promise<void> {
  console.log('\n🌊 Example 10: Grant Water Company Access')
  console.log('='.repeat(50))

  const grantAccess = {
    companyId: 'waterco-city-001',
    reason: 'Municipal water monitoring program',
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  }

  try {
    const result = await apiCall(
      'POST',
      '/api/consent/property-123/grant-water-company',
      grantAccess
    )
    console.log('✓ Water company access granted:', result)
  } catch (error) {
    console.error('✗ Error:', error)
  }
}

/**
 * Example 11: Get consent summary
 */
async function getConsentSummary(): Promise<void> {
  console.log('\n📋 Example 11: Consent Summary')
  console.log('='.repeat(50))

  try {
    const result = await apiCall('GET', '/api/consent/property-123/summary')
    console.log('✓ Consent summary:', result)
  } catch (error) {
    console.error('✗ Error:', error)
  }
}

/**
 * Example 12: Get audit trail
 */
async function getAuditTrail(): Promise<void> {
  console.log('\n📜 Example 12: Audit Trail')
  console.log('='.repeat(50))

  try {
    const result = await apiCall('GET', '/api/consent/property-123/audit-trail')
    console.log('✓ Audit entries:', result.auditLogCount || 0)
    if (result.auditLog?.length > 0) {
      console.log('  Recent actions:', result.auditLog.slice(0, 3))
    }
  } catch (error) {
    console.error('✗ Error:', error)
  }
}

// ========== Blockchain Integration Examples ==========

/**
 * Example 13: Submit IoT data hash to blockchain
 */
async function submitToBlockchain(): Promise<void> {
  console.log('\n⛓️  Example 13: Submit Data Hash to Blockchain')
  console.log('='.repeat(50))

  const blockchainProof = {
    dataType: 'iot-batch',
    batchId: 'batch-001',
    propertyId: 'property-123',
    dataHash: 'abc123def456...', // SHA-256 hash
    timestamp: Date.now(),
    description: 'IoT readings batch proof'
  }

  console.log('📤 Submitting to blockchain:')
  console.log('   Hash:', blockchainProof.dataHash)
  console.log('   Timestamp:', blockchainProof.timestamp)
  console.log('   Property:', blockchainProof.propertyId)
  console.log('   ✓ Data proof would be immutably stored on BSV')
}

// ========== Main Example Runner ==========

/**
 * Run all examples
 */
async function runAllExamples(): Promise<void> {
  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║   Plumbing IoT BSV Platform - Usage Examples                   ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')

  // IoT Examples
  await submitIoTReading()
  await registerDevice()
  await getLatestReadings()
  await getPropertyStats()
  await getAlerts()

  // Job Examples
  await createJob()
  await completeJob()
  await getPlumberRevenue()

  // Consent Examples
  await setupConsent()
  await grantWaterCompanyAccess()
  await getConsentSummary()
  await getAuditTrail()

  // Blockchain Examples
  await submitToBlockchain()

  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   Examples Complete                                            ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
}

// Export for use in other modules
export {
  submitIoTReading,
  getLatestReadings,
  registerDevice,
  getAlerts,
  getPropertyStats,
  createJob,
  completeJob,
  getPlumberRevenue,
  setupConsent,
  grantWaterCompanyAccess,
  getConsentSummary,
  getAuditTrail,
  submitToBlockchain,
  runAllExamples
}

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error)
}
