import { Router, Request, Response } from 'express'
import { Db } from 'mongodb'
import { PlumbingService } from '../lookup-services/PlumbingService.js'

/**
 * IoT Data API Routes
 * Handles device readings, batching, and storage
 */
export function createIoTRouter(db: Db): Router {
  const router = Router()
  const service = new PlumbingService(db)

  /**
   * POST /api/iot/reading
   * Device submits real-time reading
   */
  router.post('/reading', async (req: Request, res: Response) => {
    try {
      const { deviceId, propertyId, pressure, flowRate, temperature, recordedBy } = req.body

      // Validate input
      if (!deviceId || !propertyId || pressure === undefined || flowRate === undefined || temperature === undefined) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const readingId = await service.submitReading(
        deviceId,
        propertyId,
        pressure,
        flowRate,
        temperature,
        recordedBy
      )

      res.json({
        success: true,
        readingId,
        timestamp: new Date()
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * POST /api/iot/batch
   * Plumber submits batch with blockchain proof
   */
  router.post('/batch', async (req: Request, res: Response) => {
    try {
      const { propertyId, readings, recordedBy } = req.body

      if (!propertyId || !readings || !Array.isArray(readings)) {
        return res.status(400).json({ error: 'Invalid batch data' })
      }

      const { batchId, dataHash } = await service.submitReadingBatch(
        propertyId,
        readings,
        recordedBy
      )

      res.json({
        success: true,
        batchId,
        dataHash,
        readingCount: readings.length,
        // This hash should be submitted to blockchain
        blockchainSubmission: {
          contractType: 'IoTDataProof',
          dataHash,
          timestamp: Date.now(),
          propertyId,
          recordCount: readings.length
        }
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * GET /api/iot/property/:propertyId/readings
   * Get latest readings for property
   */
  router.get('/property/:propertyId/readings', async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params
      const limit = parseInt(req.query.limit as string) || 100

      // Check access permission
      const entityId = (req as any).user?.id
      const entityType = (req as any).user?.type
      const hasAccess = await service.checkAccess(propertyId, entityId, entityType)

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const readings = await service.getLatestReadings(propertyId, limit)
      res.json(readings)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * GET /api/iot/property/:propertyId/readings/history
   * Get readings in time range
   */
  router.get('/property/:propertyId/readings/history', async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params
      const { startTime, endTime } = req.query

      if (!startTime || !endTime) {
        return res.status(400).json({ error: 'startTime and endTime required' })
      }

      const readings = await service.getReadingsHistory(
        propertyId,
        parseInt(startTime as string),
        parseInt(endTime as string)
      )

      res.json(readings)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * GET /api/iot/property/:propertyId/alerts
   * Get active alerts
   */
  router.get('/property/:propertyId/alerts', async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params

      const alerts = await service.getActiveAlerts(propertyId)
      res.json(alerts)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * GET /api/iot/heatmap
   * Return heatmap aggregation for all properties (hours query param)
   */
  router.get('/heatmap', async (req: Request, res: Response) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24
      const data = await service.getHeatmapData(hours)
      res.json(data)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * GET /api/iot/property/:propertyId/stats
   * Get property statistics
   */
  router.get('/property/:propertyId/stats', async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params
      const hours = parseInt(req.query.hours as string) || 24

      const stats = await service.getPropertyStats(propertyId, hours)
      res.json(stats)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * POST /api/iot/device/register
   * Register new IoT device
   */
  router.post('/device/register', async (req: Request, res: Response) => {
    try {
      const { deviceId, propertyId, deviceType, registeredBy } = req.body

      if (!deviceId || !propertyId || !deviceType) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      await service.registerDevice(deviceId, propertyId, deviceType, registeredBy)

      res.json({
        success: true,
        deviceId,
        status: 'active'
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * PATCH /api/iot/device/:deviceId/status
   * Update device status
   */
  router.patch('/device/:deviceId/status', async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params
      const { status } = req.body

      if (!['active', 'inactive', 'error'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' })
      }

      await service.updateDeviceStatus(deviceId, status)

      res.json({
        success: true,
        deviceId,
        status
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  return router
}
