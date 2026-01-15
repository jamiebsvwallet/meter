import { Collection, Db } from 'mongodb'
import { IoTReading, IoTReadingBatch, AlertType } from '../types.js'

/**
 * IoTDataStorage handles real-time sensor readings
 * Stores pressure, flow, temperature data with alert tracking
 */
export class IoTDataStorage {
  private readonly readings: Collection<IoTReading>
  private readonly batches: Collection<IoTReadingBatch>

  constructor(private readonly db: Db) {
    this.readings = db.collection<IoTReading>('IoTReadings')
    this.batches = db.collection<IoTReadingBatch>('IoTReadingBatches')

    // Create indexes for fast queries
    this.readings.createIndex({ propertyId: 1, timestamp: -1 })
    this.readings.createIndex({ deviceId: 1 })
    this.readings.createIndex({ alerts: 1 })
    this.batches.createIndex({ propertyId: 1, timestamp: -1 })
  }

  /**
   * Store a single IoT reading from a device
   */
  async storeReading(reading: IoTReading): Promise<string> {
    const result = await this.readings.insertOne({
      ...reading,
      timestamp: reading.timestamp || Date.now()
    })
    return result.insertedId.toString()
  }

  /**
   * Store a batch of readings and create blockchain proof
   */
  async storeBatch(batch: IoTReadingBatch): Promise<string> {
    const result = await this.batches.insertOne({
      ...batch,
      timestamp: batch.timestamp || Date.now()
    })
    return result.insertedId.toString()
  }

  /**
   * Get latest readings for a property
   */
  async getLatestReadings(
    propertyId: string,
    limit: number = 100
  ): Promise<IoTReading[]> {
    return await this.readings
      .find({ propertyId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
  }

  /**
   * Get readings within a time range
   */
  async getReadingsInRange(
    propertyId: string,
    startTime: number,
    endTime: number
  ): Promise<IoTReading[]> {
    return await this.readings
      .find({
        propertyId,
        timestamp: { $gte: startTime, $lte: endTime }
      })
      .sort({ timestamp: -1 })
      .toArray()
  }

  /**
   * Get readings by device
   */
  async getDeviceReadings(deviceId: string, limit: number = 50): Promise<IoTReading[]> {
    return await this.readings
      .find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
  }

  /**
   * Get all alerts for a property
   */
  async getPropertyAlerts(propertyId: string): Promise<IoTReading[]> {
    return await this.readings
      .find({
        propertyId,
        alerts: { $exists: true, $ne: [] }
      })
      .sort({ timestamp: -1 })
      .toArray()
  }

  /**
   * Aggregate alerts across properties for heatmap (returns counts per property)
   */
  async getHeatmapAggregation(hours: number = 24): Promise<Array<{ propertyId: string; recentAlertCount: number; currentAlertCount: number }>> {
    const startTime = Date.now() - hours * 60 * 60 * 1000

    // Aggregate alerts over the last `hours` and count current active alerts (last 5 minutes)
    const recentPipeline = [
      { $match: { timestamp: { $gte: startTime }, alerts: { $exists: true, $ne: [] } } },
      { $unwind: '$alerts' },
      { $group: { _id: '$propertyId', recentAlertCount: { $sum: 1 } } }
    ]

    const recent = await this.readings.aggregate(recentPipeline).toArray()

    const fiveMinAgo = Date.now() - 5 * 60 * 1000
    const currentPipeline = [
      { $match: { timestamp: { $gte: fiveMinAgo }, alerts: { $exists: true, $ne: [] } } },
      { $unwind: '$alerts' },
      { $group: { _id: '$propertyId', currentAlertCount: { $sum: 1 } } }
    ]

    const current = await this.readings.aggregate(currentPipeline).toArray()

    // Merge results
    const map = new Map<string, { propertyId: string; recentAlertCount: number; currentAlertCount: number }>()
    for (const r of recent) {
      map.set(r._id, { propertyId: r._id, recentAlertCount: r.recentAlertCount, currentAlertCount: 0 })
    }
    for (const c of current) {
      if (map.has(c._id)) {
        map.get(c._id)!.currentAlertCount = c.currentAlertCount
      } else {
        map.set(c._id, { propertyId: c._id, recentAlertCount: 0, currentAlertCount: c.currentAlertCount })
      }
    }

    return Array.from(map.values())
  }

  /**
   * Get specific alert type for a property
   */
  async getAlertsByType(propertyId: string, alertType: AlertType): Promise<IoTReading[]> {
    return await this.readings
      .find({
        propertyId,
        alerts: alertType
      })
      .sort({ timestamp: -1 })
      .toArray()
  }

  /**
   * Get reading batches for blockchain verification
   */
  async getBatches(propertyId: string, limit: number = 20): Promise<IoTReadingBatch[]> {
    return await this.batches
      .find({ propertyId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
  }

  /**
   * Get batch by hash (for verification)
   */
  async getBatchByHash(dataHash: string): Promise<IoTReadingBatch | null> {
    return await this.batches.findOne({ dataHash })
  }

  /**
   * Delete old readings (data retention policy)
   */
  async deleteOldReadings(beforeTimestamp: number): Promise<number> {
    const result = await this.readings.deleteMany({
      timestamp: { $lt: beforeTimestamp }
    })
    return result.deletedCount || 0
  }

  /**
   * Get statistics for a property
   */
  async getPropertyStats(propertyId: string, hours: number = 24): Promise<{
    avgPressure: number
    avgFlowRate: number
    avgTemperature: number
    maxPressure: number
    minPressure: number
    alertCount: number
    readingCount: number
  }> {
    const startTime = Date.now() - hours * 60 * 60 * 1000

    const readings = await this.getReadingsInRange(propertyId, startTime, Date.now())

    if (readings.length === 0) {
      return {
        avgPressure: 0,
        avgFlowRate: 0,
        avgTemperature: 0,
        maxPressure: 0,
        minPressure: 0,
        alertCount: 0,
        readingCount: 0
      }
    }

    const pressures = readings.map(r => r.pressure)
    const flowRates = readings.map(r => r.flowRate)
    const temperatures = readings.map(r => r.temperature)
    const alerts = readings.filter(r => r.alerts.length > 0).length

    return {
      avgPressure: pressures.reduce((a, b) => a + b, 0) / pressures.length,
      avgFlowRate: flowRates.reduce((a, b) => a + b, 0) / flowRates.length,
      avgTemperature: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
      maxPressure: Math.max(...pressures),
      minPressure: Math.min(...pressures),
      alertCount: alerts,
      readingCount: readings.length
    }
  }
}
