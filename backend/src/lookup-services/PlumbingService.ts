import { Db } from 'mongodb'
import { IoTDataStorage } from './IoTDataStorage.js'
import { JobReportStorage } from './JobReportStorage.js'
import { ConsentStorage } from './ConsentStorage.js'
import { IoTReading, IoTReadingBatch, IoTDevice, JobReport, AlertType } from '../types.js'
import crypto from 'crypto'

/**
 * PlumbingService orchestrates IoT data, job reports, and consent management
 */
export class PlumbingService {
  private iotStorage: IoTDataStorage
  private jobStorage: JobReportStorage
  private consentStorage: ConsentStorage
  private devicesCollection

  constructor(private readonly db: Db) {
    this.iotStorage = new IoTDataStorage(db)
    this.jobStorage = new JobReportStorage(db)
    this.consentStorage = new ConsentStorage(db)
    this.devicesCollection = db.collection<IoTDevice>('IoTDevices')

    this.devicesCollection.createIndex({ propertyId: 1 })
    this.devicesCollection.createIndex({ deviceId: 1 }, { unique: true })
  }

  // ========== IoT Data Methods ==========

  /**
   * Device sends real-time reading
   * Gateway endpoint for IoT devices
   */
  async submitReading(
    deviceId: string,
    propertyId: string,
    pressure: number,
    flowRate: number,
    temperature: number,
    recordedBy: string
  ): Promise<string> {
    // Detect alerts
    const alerts = this.detectAlerts(pressure, flowRate, temperature)

    const reading: IoTReading = {
      deviceId,
      propertyId,
      timestamp: Date.now(),
      pressure,
      flowRate,
      temperature,
      alerts,
      recordedBy
    }

    return await this.iotStorage.storeReading(reading)
  }

  /**
   * Plumber submits batch of readings with blockchain proof
   */
  async submitReadingBatch(
    propertyId: string,
    readings: IoTReading[],
    recordedBy: string
  ): Promise<{ batchId: string; dataHash: string }> {
    // Calculate hash for blockchain proof
    const serialized = JSON.stringify(readings)
    const dataHash = crypto.createHash('sha256').update(serialized).digest('hex')

    const batch: IoTReadingBatch = {
      batchId: `batch_${Date.now()}_${Math.random().toString(36)}`,
      propertyId,
      deviceIds: [...new Set(readings.map(r => r.deviceId))],
      readings,
      dataHash,
      timestamp: Date.now(),
      recordedBy
    }

    const batchId = await this.iotStorage.storeBatch(batch)

    return {
      batchId,
      dataHash
    }
  }

  /**
   * Get latest readings for customer/plumber view
   */
  async getLatestReadings(propertyId: string, limit: number = 100): Promise<IoTReading[]> {
    return await this.iotStorage.getLatestReadings(propertyId, limit)
  }

  /**
   * Get readings in time range
   */
  async getReadingsHistory(
    propertyId: string,
    startTime: number,
    endTime: number
  ): Promise<IoTReading[]> {
    return await this.iotStorage.getReadingsInRange(propertyId, startTime, endTime)
  }

  /**
   * Get active alerts for a property
   */
  async getActiveAlerts(propertyId: string): Promise<IoTReading[]> {
    return await this.iotStorage.getPropertyAlerts(propertyId)
  }

  /**
   * Get property statistics
   */
  async getPropertyStats(propertyId: string, hours: number = 24) {
    return await this.iotStorage.getPropertyStats(propertyId, hours)
  }

  /**
   * Register IoT device
   */
  async registerDevice(
    deviceId: string,
    propertyId: string,
    deviceType: string,
    registeredBy: string
  ): Promise<void> {
    await this.devicesCollection.insertOne({
      deviceId,
      propertyId,
      deviceType: deviceType as any,
      status: 'active',
      lastSeen: new Date(),
      registeredAt: new Date(),
      registeredBy
    })
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(deviceId: string, status: 'active' | 'inactive' | 'error'): Promise<void> {
    await this.devicesCollection.updateOne(
      { deviceId },
      {
        $set: {
          status,
          lastSeen: new Date()
        }
      }
    )
  }

  /**
   * Get devices for property
   */
  async getPropertyDevices(propertyId: string): Promise<IoTDevice[]> {
    return await this.devicesCollection.find({ propertyId }).toArray()
  }

  // ========== Job Report Methods ==========

  /**
   * Create new job
   */
  async createJob(
    propertyId: string,
    customerId: string,
    plumberId: string,
    description: string
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36)}`

    const report: JobReport = {
      jobId,
      propertyId,
      customerId,
      plumberId,
      description,
      workPerformed: [],
      partsUsed: [],
      totalCost: 0,
      photos: [],
      startTime: new Date(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      reportHash: ''
    }

    await this.jobStorage.createReport(report)
    return jobId
  }

  /**
   * Complete job and generate hash for blockchain
   */
  async completeJob(
    jobId: string,
    workPerformed: string[],
    partsUsed: any[],
    totalCost: number,
    photos: string[]
  ): Promise<{ jobId: string; reportHash: string }> {
    const job = await this.jobStorage.getReport(jobId)
    if (!job) throw new Error('Job not found')

    // Create report hash
    const reportData = {
      jobId,
      workPerformed,
      partsUsed,
      totalCost,
      photos,
      completedAt: new Date().toISOString()
    }
    const reportHash = crypto.createHash('sha256').update(JSON.stringify(reportData)).digest('hex')

    await this.jobStorage.completeReport(
      jobId,
      new Date(),
      totalCost,
      reportHash
    )

    await this.jobStorage.updateReportDetails(jobId, {
      workPerformed,
      partsUsed,
      photos
    })

    return { jobId, reportHash }
  }

  /**
   * Customer approves completed job
   */
  async approveJob(jobId: string, customerSignature: string): Promise<void> {
    await this.jobStorage.approveReport(jobId, customerSignature)
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<JobReport | null> {
    return await this.jobStorage.getReport(jobId)
  }

  /**
   * Get jobs for property
   */
  async getPropertyJobs(propertyId: string, status?: string): Promise<JobReport[]> {
    return await this.jobStorage.getPropertyReports(propertyId, status)
  }

  /**
   * Return heatmap data containing location + aggregated counts
   */
  async getHeatmapData(hours: number = 24): Promise<Array<{ propertyId: string; lat: number; lng: number; recentAlertCount: number; currentAlertCount: number; leakScore: number }>> {
    const agg = await this.iotStorage.getHeatmapAggregation(hours)

    // For demo purposes generate deterministic coordinates from propertyId
    // centered roughly at a default city (San Francisco) and add small offsets
    const baseLat = 37.7749
    const baseLng = -122.4194

    const results = agg.map(item => {
      // Deterministic pseudo-random from propertyId
      const hash = crypto.createHash('md5').update(item.propertyId).digest()
      const latOffset = (hash[0] - 128) / 1280 // approx ±0.1
      const lngOffset = (hash[1] - 128) / 1280
      const lat = baseLat + latOffset
      const lng = baseLng + lngOffset

      // Simple leakage scoring: current alerts weighted higher
      const leakScore = Math.min(100, item.currentAlertCount * 40 + item.recentAlertCount * 10)

      return { propertyId: item.propertyId, lat, lng, recentAlertCount: item.recentAlertCount, currentAlertCount: item.currentAlertCount, leakScore }
    })

    return results
  }

  /**
   * Get pending jobs for plumber
   */
  async getPlumberPendingJobs(plumberId: string): Promise<JobReport[]> {
    return await this.jobStorage.getPlumberReports(plumberId, 'pending')
  }

  /**
   * Get completed jobs for customer
   */
  async getCustomerCompletedJobs(customerId: string): Promise<JobReport[]> {
    return await this.jobStorage.getCustomerReports(customerId, 'approved')
  }

  /**
   * Get revenue for period
   */
  async getRevenue(startDate: Date, endDate: Date) {
    return await this.jobStorage.getRevenue(startDate, endDate)
  }

  // ========== Consent Methods ==========

  /**
   * Initialize consent for new property
   */
  async setupPropertyConsent(
    propertyId: string,
    customerId: string,
    plumberId: string
  ): Promise<void> {
    await this.consentStorage.createConsent(propertyId, customerId, plumberId)
  }

  /**
   * Customer grants water company access
   */
  async grantWaterCompanyAccess(
    propertyId: string,
    companyId: string,
    reason?: string,
    expirationDays?: number
  ): Promise<void> {
    await this.consentStorage.grantWaterCompanyAccess(propertyId, companyId, reason, expirationDays)
  }

  /**
   * Customer revokes water company access
   */
  async revokeWaterCompanyAccess(propertyId: string, companyId: string): Promise<void> {
    await this.consentStorage.revokeWaterCompanyAccess(propertyId, companyId)
  }

  /**
   * Check access permission
   */
  async checkAccess(
    propertyId: string,
    entityId: string,
    entityType: 'customer' | 'plumber' | 'water_company'
  ): Promise<boolean> {
    return await this.consentStorage.hasAccess(propertyId, entityId, entityType)
  }

  /**
   * Get water company properties
   */
  async getWaterCompanyProperties(companyId: string): Promise<string[]> {
    return await this.consentStorage.getWaterCompanyProperties(companyId)
  }

  /**
   * Get consent summary for customer
   */
  async getConsentSummary(propertyId: string) {
    return await this.consentStorage.getConsentSummary(propertyId)
  }

  /**
   * Get audit trail
   */
  async getConsentAuditTrail(propertyId: string) {
    return await this.consentStorage.getAuditTrail(propertyId)
  }

  // ========== Helper Methods ==========

  /**
   * Detect anomalies and alert conditions
   */
  private detectAlerts(pressure: number, flowRate: number, temperature: number): AlertType[] {
    const alerts: AlertType[] = []

    // Pressure thresholds
    if (pressure > 80) alerts.push('high_pressure')
    if (pressure < 20) alerts.push('low_pressure')

    // Flow rate thresholds
    if (flowRate > 10) alerts.push('high_flow')
    if (flowRate < 0.1) alerts.push('low_flow')

    // Temperature thresholds
    if (temperature > 60) alerts.push('temp_anomaly')
    if (temperature < 0) alerts.push('temp_anomaly')

    // Potential leak detection (abnormal flow patterns)
    if (flowRate > 5 && pressure < 30) alerts.push('leak_detected')

    return alerts
  }

  /**
   * Generate report for blockchain submission
   */
  generateBlockchainProof(batch: IoTReadingBatch): {
    propertyId: string
    dataHash: string
    timestamp: number
    recordCount: number
  } {
    return {
      propertyId: batch.propertyId,
      dataHash: batch.dataHash,
      timestamp: batch.timestamp,
      recordCount: batch.readings.length
    }
  }
}
