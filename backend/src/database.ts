/**
 * Database Initialization & Connection
 * Sets up MongoDB connection and initializes collections
 */

import { MongoClient, Db } from 'mongodb'

// MongoDB connection string (configure via environment variable)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plumbing-iot'
const DB_NAME = 'plumbing-iot'

let db: Db | null = null
let client: MongoClient | null = null

/**
 * Initialize MongoDB connection and collections
 */
export async function initializeDatabase(): Promise<Db> {
  if (db) {
    return db
  }

  try {
    client = new MongoClient(MONGODB_URI)
    await client.connect()

    console.log('✓ Connected to MongoDB')

    db = client.db(DB_NAME)

    // Create collections with schema validation
    await createCollections(db)

    // Create indexes
    await createIndexes(db)

    console.log('✓ Database collections and indexes initialized')

    return db
  } catch (error) {
    console.error('✗ Failed to initialize database:', error)
    throw error
  }
}

/**
 * Create MongoDB collections
 */
async function createCollections(db: Db): Promise<void> {
  const collections = await db.listCollections().toArray()
  const collectionNames = new Set(collections.map(c => c.name))

  // Create IoT collections if not exist
  if (!collectionNames.has('IoTReadings')) {
    await db.createCollection('IoTReadings')
    console.log('  ✓ Created IoTReadings collection')
  }

  if (!collectionNames.has('IoTReadingBatches')) {
    await db.createCollection('IoTReadingBatches')
    console.log('  ✓ Created IoTReadingBatches collection')
  }

  if (!collectionNames.has('IoTDevices')) {
    await db.createCollection('IoTDevices')
    console.log('  ✓ Created IoTDevices collection')
  }

  // Create Job collections if not exist
  if (!collectionNames.has('JobReports')) {
    await db.createCollection('JobReports')
    console.log('  ✓ Created JobReports collection')
  }

  // Create Consent collections if not exist
  if (!collectionNames.has('PropertyConsents')) {
    await db.createCollection('PropertyConsents')
    console.log('  ✓ Created PropertyConsents collection')
  }

  if (!collectionNames.has('ConsentAuditLogs')) {
    await db.createCollection('ConsentAuditLogs')
    console.log('  ✓ Created ConsentAuditLogs collection')
  }

  // Create Meter records collection (original)
  if (!collectionNames.has('MeterRecords')) {
    await db.createCollection('MeterRecords')
    console.log('  ✓ Created MeterRecords collection')
  }

  // Create BSV Account collection
  if (!collectionNames.has('BSVAccounts')) {
    await db.createCollection('BSVAccounts')
    console.log('  ✓ Created BSVAccounts collection')
  }
}

/**
 * Create necessary indexes for performance
 */
async function createIndexes(db: Db): Promise<void> {
  // IoT Readings indexes
  const readingsCollection = db.collection('IoTReadings')
  await readingsCollection.createIndex({ propertyId: 1, timestamp: -1 })
  await readingsCollection.createIndex({ deviceId: 1, timestamp: -1 })
  await readingsCollection.createIndex({ timestamp: -1 })
  await readingsCollection.createIndex({ alerts: 1 })
  console.log('  ✓ Created IoTReadings indexes')

  // IoT Batches indexes
  const batchesCollection = db.collection('IoTReadingBatches')
  await batchesCollection.createIndex({ propertyId: 1, timestamp: -1 })
  await batchesCollection.createIndex({ dataHash: 1 }, { unique: true })
  console.log('  ✓ Created IoTReadingBatches indexes')

  // IoT Devices indexes
  const devicesCollection = db.collection('IoTDevices')
  await devicesCollection.createIndex({ propertyId: 1 })
  await devicesCollection.createIndex({ deviceId: 1 }, { unique: true })
  await devicesCollection.createIndex({ status: 1 })
  console.log('  ✓ Created IoTDevices indexes')

  // Job Reports indexes
  const jobsCollection = db.collection('JobReports')
  await jobsCollection.createIndex({ jobId: 1 }, { unique: true })
  await jobsCollection.createIndex({ propertyId: 1, status: 1 })
  await jobsCollection.createIndex({ plumberId: 1, status: 1 })
  await jobsCollection.createIndex({ customerId: 1, status: 1 })
  await jobsCollection.createIndex({ completionTime: -1 })
  await jobsCollection.createIndex({ reportHash: 1 }, { unique: true })
  console.log('  ✓ Created JobReports indexes')

  // Property Consents indexes
  const consentsCollection = db.collection('PropertyConsents')
  await consentsCollection.createIndex({ propertyId: 1 }, { unique: true })
  await consentsCollection.createIndex({ customerId: 1 })
  await consentsCollection.createIndex({ plumberId: 1 })
  console.log('  ✓ Created PropertyConsents indexes')

  // Consent Audit Logs indexes
  const auditCollection = db.collection('ConsentAuditLogs')
  await auditCollection.createIndex({ propertyId: 1, timestamp: -1 })
  await auditCollection.createIndex({ entityId: 1 })
  await auditCollection.createIndex({ timestamp: -1 })
  console.log('  ✓ Created ConsentAuditLogs indexes')

  // BSV Accounts indexes
  const accountsCollection = db.collection('BSVAccounts')
  await accountsCollection.createIndex({ userId: 1 }, { unique: true })
  await accountsCollection.createIndex({ accountType: 1 })
  console.log('  ✓ Created BSVAccounts indexes')
}

/**
 * Get database instance
 */
export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.')
  }
  return db
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close()
    db = null
    client = null
    console.log('✓ Database connection closed')
  }
}

/**
 * Health check - verify database is accessible
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    if (!db) {
      return false
    }
    await db.admin().ping()
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}
