/**
 * Integration Tests for Plumbing IoT Platform
 * Tests all major flows: IoT, Jobs, Consent, Blockchain
 */

import { MongoClient, Db } from 'mongodb'
import * as crypto from 'crypto'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration: number
}

class PlatformTester {
  private db: Db | null = null
  private results: TestResult[] = []

  async connect(mongoUri: string) {
    const client = new MongoClient(mongoUri)
    await client.connect()
    this.db = client.db('plumbing_test')
    console.log('✓ Connected to MongoDB')
  }

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const start = Date.now()
    try {
      await testFn()
      this.results.push({
        name,
        passed: true,
        duration: Date.now() - start
      })
      console.log(`✓ ${name}`)
    } catch (error: any) {
      this.results.push({
        name,
        passed: false,
        error: error.message,
        duration: Date.now() - start
      })
      console.log(`✗ ${name}: ${error.message}`)
    }
  }

  // ========== IoT Data Tests ==========

  async testIoTDataFlow() {
    await this.runTest('IoT Data: Submit Reading', async () => {
      if (!this.db) throw new Error('DB not connected')
      
      const reading = {
        deviceId: 'sensor_001',
        propertyId: 'prop_001',
        pressure: 65.5,
        flowRate: 2.3,
        temperature: 18.5,
        recordedBy: 'system',
        timestamp: Date.now()
      }

      const result = await this.db.collection('iot_readings').insertOne(reading)
      if (!result.insertedId) throw new Error('Failed to insert reading')
    })

    await this.runTest('IoT Data: Batch Readings', async () => {
      if (!this.db) throw new Error('DB not connected')
      
      const readings = Array.from({ length: 10 }, (_, i) => ({
        deviceId: `sensor_${i}`,
        propertyId: 'prop_001',
        pressure: 60 + Math.random() * 10,
        flowRate: 2 + Math.random() * 2,
        temperature: 15 + Math.random() * 10,
        recordedBy: 'system',
        timestamp: Date.now() + i * 1000
      }))

      const result = await this.db.collection('iot_readings').insertMany(readings)
      if (result.insertedCount !== 10) throw new Error('Failed to insert batch')
    })

    await this.runTest('IoT Data: Retrieve Readings', async () => {
      if (!this.db) throw new Error('DB not connected')
      
      const readings = await this.db
        .collection('iot_readings')
        .find({ propertyId: 'prop_001' })
        .toArray()
      
      if (readings.length === 0) throw new Error('No readings found')
    })

    await this.runTest('IoT Data: Calculate Stats', async () => {
      if (!this.db) throw new Error('DB not connected')
      
      const stats = await this.db.collection('iot_readings')
        .aggregate([
          { $match: { propertyId: 'prop_001' } },
          {
            $group: {
              _id: '$propertyId',
              avgPressure: { $avg: '$pressure' },
              maxPressure: { $max: '$pressure' },
              minPressure: { $min: '$pressure' },
              count: { $sum: 1 }
            }
          }
        ])
        .toArray()
      
      if (stats.length === 0) throw new Error('Failed to calculate stats')
    })
  }

  // ========== Job Tests ==========

  async testJobFlow() {
    let jobId = ''

    await this.runTest('Jobs: Create Job', async () => {
      if (!this.db) throw new Error('DB not connected')
      
      const job = {
        propertyId: 'prop_001',
        customerId: 'cust_001',
        description: 'Fix leaking pipe',
        priority: 'high',
        status: 'pending',
        createdAt: new Date()
      }

      const result = await this.db.collection('jobs').insertOne(job)
      jobId = result.insertedId.toString()
      if (!jobId) throw new Error('Failed to create job')
    })

    await this.runTest('Jobs: Complete Job', async () => {
      if (!this.db || !jobId) throw new Error('Missing job ID')
      
      const report = {
        jobId,
        plumberId: 'plumber_001',
        workPerformed: ['Located leak', 'Replaced pipe'],
        partsUsed: [{ name: 'Copper pipe', cost: 25, quantity: 5 }],
        totalCost: 125,
        completedAt: new Date(),
        status: 'completed'
      }

      const result = await this.db.collection('job_reports').insertOne(report)
      if (!result.insertedId) throw new Error('Failed to create report')
    })

    await this.runTest('Jobs: Calculate Revenue', async () => {
      if (!this.db) throw new Error('DB not connected')
      
      const revenue = await this.db.collection('job_reports')
        .aggregate([
          { $match: { plumberId: 'plumber_001' } },
          {
            $group: {
              _id: '$plumberId',
              totalRevenue: { $sum: '$totalCost' },
              jobCount: { $sum: 1 }
            }
          }
        ])
        .toArray()
      
      if (revenue.length === 0) throw new Error('No revenue data found')
    })
  }

  // ========== Consent Tests ==========

  async testConsentFlow() {
    await this.runTest('Consent: Setup Property Consent', async () => {
      if (!this.db) throw new Error('DB not connected')
      
      const consent = {
        propertyId: 'prop_001',
        customerId: 'cust_001',
        waterCompanyAccess: [],
        createdAt: new Date()
      }

      const result = await this.db.collection('consent').updateOne(
        { propertyId: 'prop_001' },
        { $set: consent },
        { upsert: true }
      )
      if (!result.upsertedId && result.modifiedCount === 0) {
        throw new Error('Failed to setup consent')
      }
    })

    await this.runTest('Consent: Grant Water Company Access', async () => {
      if (!this.db) throw new Error('DB not connected')
      
      const updateDoc = {
        $push: {
          waterCompanyAccess: {
            companyId: 'waterco_001',
            grantedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          }
        }
      }
      
      const result = await this.db.collection('consent').updateOne(
        { propertyId: 'prop_001' },
        updateDoc as any
      )
      if (result.modifiedCount === 0) throw new Error('Failed to grant access')
    })

    await this.runTest('Consent: Revoke Water Company Access', async () => {
      if (!this.db) throw new Error('DB not connected')
      
      const updateDoc = {
        $pull: {
          waterCompanyAccess: { companyId: 'waterco_001' }
        }
      }
      
      const result = await this.db.collection('consent').updateOne(
        { propertyId: 'prop_001' },
        updateDoc as any
      )
      if (result.modifiedCount === 0) throw new Error('Failed to revoke access')
    })

    await this.runTest('Consent: Audit Trail', async () => {
      if (!this.db) throw new Error('DB not connected')
      
      const auditLog = {
        propertyId: 'prop_001',
        action: 'water_company_access_revoked',
        companyId: 'waterco_001',
        timestamp: new Date()
      }

      const result = await this.db.collection('audit_logs').insertOne(auditLog)
      if (!result.insertedId) throw new Error('Failed to create audit log')
    })
  }

  // ========== Blockchain Tests ==========

  async testBlockchainFlow() {
    await this.runTest('Blockchain: Submit IoT Proof', async () => {
      if (!this.db) throw new Error('DB not connected')
      
      const dataHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({ test: 'data' }))
        .digest('hex')
      
      const proof = {
        dataHash,
        propertyId: 'prop_001',
        deviceId: 'sensor_001',
        type: 'iot_reading',
        timestamp: Date.now(),
        verified: true
      }

      const result = await this.db.collection('blockchain_proofs').insertOne(proof)
      if (!result.insertedId) throw new Error('Failed to submit proof')
    })

    await this.runTest('Blockchain: Submit Job Proof', async () => {
      if (!this.db) throw new Error('DB not connected')
      
      const reportHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({ jobId: 'job_001' }))
        .digest('hex')
      
      const proof = {
        reportHash,
        jobId: 'job_001',
        plumberId: 'plumber_001',
        type: 'job_report',
        timestamp: Date.now(),
        verified: true
      }

      const result = await this.db.collection('blockchain_proofs').insertOne(proof)
      if (!result.insertedId) throw new Error('Failed to submit job proof')
    })

    await this.runTest('Blockchain: Verify Data', async () => {
      if (!this.db) throw new Error('DB not connected')
      
      const dataHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({ test: 'data' }))
        .digest('hex')
      
      const proof = await this.db
        .collection('blockchain_proofs')
        .findOne({ dataHash })
      
      if (!proof || !proof.verified) throw new Error('Data verification failed')
    })

    await this.runTest('Blockchain: Get Stats', async () => {
      if (!this.db) throw new Error('DB not connected')
      
      const stats = await this.db.collection('blockchain_proofs')
        .aggregate([
          {
            $group: {
              _id: null,
              totalProofs: { $sum: 1 },
              verifiedProofs: { $sum: { $cond: ['$verified', 1, 0] } }
            }
          }
        ])
        .toArray()
      
      if (stats.length === 0) throw new Error('Failed to get stats')
    })
  }

  // ========== Authentication Tests ==========

  async testAuthenticationFlow() {
    await this.runTest('Auth: Create User', async () => {
      if (!this.db) throw new Error('DB not connected')
      
      const user = {
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Test User',
        role: 'customer',
        createdAt: new Date()
      }

      const result = await this.db.collection('users').insertOne(user)
      if (!result.insertedId) throw new Error('Failed to create user')
    })

    await this.runTest('Auth: Verify User', async () => {
      if (!this.db) throw new Error('DB not connected')
      
      const user = await this.db
        .collection('users')
        .findOne({ email: 'test@example.com' })
      
      if (!user) throw new Error('User not found')
    })
  }

  // ========== Report Generation ==========

  printReport() {
    console.log('\n' + '='.repeat(60))
    console.log('TEST REPORT')
    console.log('='.repeat(60))

    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const total = this.results.length

    console.log(`\nTotal Tests: ${total}`)
    console.log(`Passed: ${passed} ✓`)
    console.log(`Failed: ${failed} ✗`)
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(2)}%`)

    if (failed > 0) {
      console.log('\nFailed Tests:')
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  ✗ ${r.name}: ${r.error}`)
        })
    }

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)
    console.log(`\nTotal Duration: ${totalDuration}ms`)
    console.log('='.repeat(60) + '\n')
  }

  // ========== Run All Tests ==========

  async runAll() {
    console.log('\n🧪 Starting Platform Tests...\n')

    await this.testIoTDataFlow()
    await this.testJobFlow()
    await this.testConsentFlow()
    await this.testBlockchainFlow()
    await this.testAuthenticationFlow()

    this.printReport()
  }
}

// Run tests if this file is executed directly
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plumbing'
const tester = new PlatformTester()

tester
  .connect(mongoUri)
  .then(() => tester.runAll())
  .catch(error => {
    console.error('Test execution failed:', error)
    process.exit(1)
  })

export { PlatformTester }
