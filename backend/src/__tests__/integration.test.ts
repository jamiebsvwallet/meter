/**
 * Example Integration Tests
 * Test file showing how to test the platform components
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { MongoClient, Db } from 'mongodb'
import { PlumbingService } from '../lookup-services/PlumbingService.js'
import { IoTDataStorage } from '../lookup-services/IoTDataStorage.js'
import { JobReportStorage } from '../lookup-services/JobReportStorage.js'
import { ConsentStorage } from '../lookup-services/ConsentStorage.js'
import { BSVAccountManager } from '../lookup-services/BSVAccountManager.js'

describe('Plumbing IoT Platform Integration Tests', () => {
  let db: Db
  let service: PlumbingService
  let client: MongoClient

  beforeEach(async () => {
    client = new MongoClient('mongodb://localhost:27017')
    await client.connect()
    db = client.db('plumbing_test')
    service = new PlumbingService(db)
  })

  afterEach(async () => {
    await db.dropDatabase()
    await client.close()
  })

  describe('IoT Data Flow', () => {
    it('should store IoT reading with alerts', async () => {
      const readingId = await service.submitReading(
        'sensor_001',
        'prop_001',
        85, // High pressure alert
        2.5,
        18.5,
        'plumber_001'
      )

      expect(readingId).toBeDefined()

      const readings = await service.getLatestReadings('prop_001', 1)
      expect(readings).toHaveLength(1)
      expect(readings[0].pressure).toBe(85)
      expect(readings[0].alerts).toContain('high_pressure')
    })

    it('should create and verify batch hash', async () => {
      const mockReadings = [
        {
          deviceId: 'sensor_001',
          propertyId: 'prop_001',
          timestamp: Date.now(),
          pressure: 65,
          flowRate: 2.3,
          temperature: 18.5,
          alerts: [],
          recordedBy: 'plumber_001'
        }
      ]

      const { batchId, dataHash } = await service.submitReadingBatch(
        'prop_001',
        mockReadings,
        'plumber_001'
      )

      expect(batchId).toBeDefined()
      expect(dataHash).toBeDefined()
      expect(dataHash.length).toBe(64) // SHA256 hex is 64 chars
    })

    it('should register and track IoT device', async () => {
      await service.registerDevice('sensor_001', 'prop_001', 'pressure_sensor', 'plumber_001')

      // Update status
      await service.updateDeviceStatus('sensor_001', 'active')

      const devices = await service.getPropertyDevices('prop_001')
      expect(devices).toHaveLength(1)
      expect(devices[0].status).toBe('active')
    })

    it('should calculate property statistics', async () => {
      // Submit multiple readings
      for (let i = 0; i < 10; i++) {
        await service.submitReading(
          'sensor_001',
          'prop_001',
          60 + i,
          2.0 + i * 0.1,
          18.0 + i * 0.2,
          'plumber_001'
        )
      }

      const stats = await service.getPropertyStats('prop_001', 24)
      expect(stats.avgPressure).toBeGreaterThan(0)
      expect(stats.avgFlowRate).toBeGreaterThan(0)
      expect(stats.avgTemperature).toBeGreaterThan(0)
      expect(stats.readingCount).toBe(10)
    })
  })

  describe('Job Report Flow', () => {
    it('should create job and mark as pending', async () => {
      const jobId = await service.createJob(
        'prop_001',
        'john_smith',
        'plumber_001',
        'Fix water line leak'
      )

      expect(jobId).toBeDefined()

      const job = await service.getJob(jobId)
      expect(job?.status).toBe('pending')
      expect(job?.description).toBe('Fix water line leak')
    })

    it('should complete job and generate report hash', async () => {
      const jobId = await service.createJob(
        'prop_001',
        'john_smith',
        'plumber_001',
        'Fix water line leak'
      )

      const { reportHash } = await service.completeJob(
        jobId,
        ['Replaced water line', 'Tested pressure'],
        [{ name: 'PVC pipe', cost: 50, quantity: 1 }],
        150,
        ['photo1.jpg']
      )

      expect(reportHash).toBeDefined()
      expect(reportHash.length).toBe(64)

      const job = await service.getJob(jobId)
      expect(job?.status).toBe('completed')
      expect(job?.totalCost).toBe(150)
    })

    it('should approve job as customer', async () => {
      const jobId = await service.createJob(
        'prop_001',
        'john_smith',
        'plumber_001',
        'Fix water line leak'
      )

      await service.completeJob(
        jobId,
        ['Work done'],
        [],
        150,
        []
      )

      await service.approveJob(jobId, 'signature_hash')

      const job = await service.getJob(jobId)
      expect(job?.status).toBe('approved')
    })

    it('should calculate plumber revenue', async () => {
      // Create and complete 3 jobs
      for (let i = 0; i < 3; i++) {
        const jobId = await service.createJob(
          `prop_00${i}`,
          `customer_${i}`,
          'plumber_001',
          `Job ${i}`
        )

        await service.completeJob(jobId, ['Work'], [], 100 + i * 50, [])
        await service.approveJob(jobId, 'sig')
      }

      const revenue = await service.getRevenue(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        new Date()
      )

      expect(revenue.jobCount).toBe(3)
      expect(revenue.totalRevenue).toBe(350)
      expect(revenue.avgJobCost).toBe(350 / 3)
    })
  })

  describe('Consent Management', () => {
    it('should setup property consent', async () => {
      await service.setupPropertyConsent('prop_001', 'john_smith', 'plumber_001')

      const summary = await service.getConsentSummary('prop_001')
      expect(summary.customer).toBe('john_smith')
      expect(summary.plumber).toBe('plumber_001')
      expect(summary.waterCompanies).toHaveLength(0)
    })

    it('should grant water company access', async () => {
      await service.setupPropertyConsent('prop_001', 'john_smith', 'plumber_001')

      await service.grantWaterCompanyAccess(
        'prop_001',
        'water-corp-1',
        'Leak prevention audit',
        30
      )

      const summary = await service.getConsentSummary('prop_001')
      expect(summary.waterCompanies).toHaveLength(1)
      expect(summary.waterCompanies[0].companyId).toBe('water-corp-1')
    })

    it('should revoke water company access', async () => {
      await service.setupPropertyConsent('prop_001', 'john_smith', 'plumber_001')

      await service.grantWaterCompanyAccess(
        'prop_001',
        'water-corp-1',
        'Audit',
        30
      )

      await service.revokeWaterCompanyAccess('prop_001', 'water-corp-1')

      const hasAccess = await service.checkAccess(
        'prop_001',
        'water-corp-1',
        'water_company'
      )

      expect(hasAccess).toBe(false)
    })

    it('should verify access permissions', async () => {
      await service.setupPropertyConsent('prop_001', 'john_smith', 'plumber_001')

      const customerAccess = await service.checkAccess(
        'prop_001',
        'john_smith',
        'customer'
      )
      expect(customerAccess).toBe(true)

      const plumberAccess = await service.checkAccess(
        'prop_001',
        'plumber_001',
        'plumber'
      )
      expect(plumberAccess).toBe(true)

      const waterCompanyAccess = await service.checkAccess(
        'prop_001',
        'water-corp-1',
        'water_company'
      )
      expect(waterCompanyAccess).toBe(false)
    })

    it('should track consent audit trail', async () => {
      await service.setupPropertyConsent('prop_001', 'john_smith', 'plumber_001')

      await service.grantWaterCompanyAccess('prop_001', 'water-corp-1', 'Audit', 30)
      await service.revokeWaterCompanyAccess('prop_001', 'water-corp-1')

      const trail = await service.getConsentAuditTrail('prop_001')
      expect(trail.length).toBeGreaterThan(0)
      expect(trail[0].action).toBe('revoke')
      expect(trail[1].action).toBe('grant')
    })
  })

  describe('BSV Account Management', () => {
    it('should create customer account', async () => {
      const manager = new BSVAccountManager(db)

      const account = await manager.createCustomerAccount(
        'john_smith',
        'identity_key_123'
      )

      expect(account.userId).toBe('john_smith')
      expect(account.accountType).toBe('customer')

      const retrieved = await manager.getAccount('john_smith')
      expect(retrieved?.identityKey).toBe('identity_key_123')
    })

    it('should create plumber account', async () => {
      const manager = new BSVAccountManager(db)

      const account = await manager.createPlumberAccount(
        'plumber_001',
        'plumber_key_123'
      )

      expect(account.accountType).toBe('plumber')
    })

    it('should register property to customer', async () => {
      const manager = new BSVAccountManager(db)

      await manager.createCustomerAccount('john_smith', 'key_123')
      await manager.registerProperty('prop_001', '123 Main St', 'john_smith')

      const properties = await manager.getCustomerProperties('john_smith')
      expect(properties).toHaveLength(1)
      expect(properties[0].address).toBe('123 Main St')
    })

    it('should store data on customer account', async () => {
      const manager = new BSVAccountManager(db)

      await manager.createCustomerAccount('john_smith', 'key_123')

      const mockReadings = [
        {
          deviceId: 'sensor_001',
          propertyId: 'prop_001',
          timestamp: Date.now(),
          pressure: 65,
          flowRate: 2.3,
          temperature: 18.5,
          alerts: [],
          recordedBy: 'plumber_001'
        }
      ]

      const storageId = await manager.storeDataOnCustomerAccount(
        'john_smith',
        'prop_001',
        mockReadings
      )

      expect(storageId).toBeDefined()

      const stored = await manager.getCustomerStoredData('john_smith', 'prop_001')
      expect(stored).toHaveLength(1)
    })

    it('should export customer data for GDPR', async () => {
      const manager = new BSVAccountManager(db)

      await manager.createCustomerAccount('john_smith', 'key_123')
      await manager.registerProperty('prop_001', '123 Main St', 'john_smith')

      const exported = await manager.exportCustomerData('john_smith')

      expect(exported.account?.userId).toBe('john_smith')
      expect(exported.properties).toHaveLength(1)
      expect(exported.exportedAt).toBeDefined()
    })
  })

  describe('End-to-End Scenarios', () => {
    it('should complete full customer workflow', async () => {
      // Customer setup
      await service.setupPropertyConsent('prop_001', 'customer1', 'plumber1')

      // Customer grants water company access
      await service.grantWaterCompanyAccess('prop_001', 'water-corp-1', 'Audit')

      // Plumber registers device
      await service.registerDevice('sensor_001', 'prop_001', 'pressure_sensor', 'plumber1')

      // Device sends readings
      await service.submitReading('sensor_001', 'prop_001', 65, 2.3, 18.5, 'plumber1')
      await service.submitReading('sensor_001', 'prop_001', 64, 2.1, 18.4, 'plumber1')

      // Plumber creates and completes job
      const jobId = await service.createJob('prop_001', 'customer1', 'plumber1', 'Fix leak')
      await service.completeJob(jobId, ['Work done'], [], 150, [])

      // Customer approves
      await service.approveJob(jobId, 'sig')

      // Verify final state
      const stats = await service.getPropertyStats('prop_001', 24)
      expect(stats.readingCount).toBe(2)

      const revenue = await service.getRevenue(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        new Date()
      )
      expect(revenue.totalRevenue).toBe(150)

      const waterCompanyProperties = await service.getWaterCompanyProperties('water-corp-1')
      expect(waterCompanyProperties).toContain('prop_001')
    })
  })
})
