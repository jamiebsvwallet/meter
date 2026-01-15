/**
 * Zone & Acoustic API Routes
 * Endpoints for zone-based leak identification and acoustic camera visualization
 */

import { Router, type Request, type Response } from 'express'
import type { Db } from 'mongodb'
import { zoneIdentificationService, acousticCameraService } from '../services/zone-acoustic.js'

export function createZoneAcousticRouter(db: Db): Router {
  const router = Router()
  const zoneService = zoneIdentificationService(db)
  const acousticService = acousticCameraService(db)

  /**
   * POST /api/zones/register
   * Register a new zone configuration
   */
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const zoneConfig = req.body
      
      if (!zoneConfig.zoneId || !zoneConfig.propertyId) {
        return res.status(400).json({
          success: false,
          error: 'zoneId and propertyId are required'
        })
      }

      await zoneService.registerZone(zoneConfig)

      res.json({
        success: true,
        message: 'Zone registered successfully',
        zone: zoneConfig
      })
    } catch (error) {
      console.error('Error registering zone:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to register zone'
      })
    }
  })

  /**
   * GET /api/zones/property/:propertyId
   * Get all zones for a property
   */
  router.get('/property/:propertyId', async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params
      const zones = await zoneService.getPropertyZones(propertyId)

      res.json({
        success: true,
        propertyId,
        zones,
        count: zones.length
      })
    } catch (error) {
      console.error('Error getting zones:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get zones'
      })
    }
  })

  /**
   * POST /api/zones/acoustic/reading
   * Submit acoustic sensor reading
   */
  router.post('/acoustic/reading', async (req: Request, res: Response) => {
    try {
      const reading = {
        ...req.body,
        timestamp: new Date()
      }

      await acousticService.recordAcousticReading(reading)

      res.json({
        success: true,
        message: 'Acoustic reading recorded'
      })
    } catch (error) {
      console.error('Error recording acoustic reading:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to record acoustic reading'
      })
    }
  })

  /**
   * POST /api/zones/acoustic/analyze
   * Analyze acoustic readings and triangulate leaks
   */
  router.post('/acoustic/analyze', async (req: Request, res: Response) => {
    try {
      const { readings } = req.body

      if (!readings || !Array.isArray(readings)) {
        return res.status(400).json({
          success: false,
          error: 'readings array is required'
        })
      }

      const leakLocation = await zoneService.processAcousticReadings(readings)

      if (leakLocation) {
        res.json({
          success: true,
          leakDetected: true,
          location: leakLocation
        })
      } else {
        res.json({
          success: true,
          leakDetected: false,
          message: 'No leak detected or insufficient sensors'
        })
      }
    } catch (error) {
      console.error('Error analyzing acoustic data:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to analyze acoustic data'
      })
    }
  })

  /**
   * GET /api/zones/leaks/:propertyId
   * Get recent leak locations for a property
   */
  router.get('/leaks/:propertyId', async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params
      const hours = parseInt(req.query.hours as string) || 24

      const leaks = await zoneService.getRecentLeaks(propertyId, hours)

      res.json({
        success: true,
        propertyId,
        leaks,
        count: leaks.length,
        timeRange: `Last ${hours} hours`
      })
    } catch (error) {
      console.error('Error getting leaks:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get leak locations'
      })
    }
  })

  /**
   * GET /api/zones/heatmap/:propertyId
   * Generate zone heatmap showing leak risk
   */
  router.get('/heatmap/:propertyId', async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params
      const hours = parseInt(req.query.hours as string) || 24

      const heatmap = await zoneService.generateZoneHeatmap(propertyId, hours)

      res.json({
        success: true,
        heatmap
      })
    } catch (error) {
      console.error('Error generating heatmap:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to generate heatmap'
      })
    }
  })

  /**
   * POST /api/zones/acoustic-camera/generate
   * Generate acoustic camera visualization
   */
  router.post('/acoustic-camera/generate', async (req: Request, res: Response) => {
    try {
      const { propertyId, zoneId, startTime, endTime } = req.body

      if (!propertyId || !zoneId) {
        return res.status(400).json({
          success: false,
          error: 'propertyId and zoneId are required'
        })
      }

      const timeRange = {
        start: startTime ? new Date(startTime) : new Date(Date.now() - 60 * 60 * 1000),
        end: endTime ? new Date(endTime) : new Date()
      }

      const acousticImage = await acousticService.generateAcousticImage(
        propertyId,
        zoneId,
        timeRange
      )

      res.json({
        success: true,
        acousticImage
      })
    } catch (error) {
      console.error('Error generating acoustic camera image:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to generate acoustic image'
      })
    }
  })

  /**
   * GET /api/zones/acoustic-camera/live/:propertyId/:zoneId
   * Get live acoustic camera feed
   */
  router.get('/acoustic-camera/live/:propertyId/:zoneId', async (req: Request, res: Response) => {
    try {
      const { propertyId, zoneId } = req.params

      const timeRange = {
        start: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        end: new Date()
      }

      const acousticImage = await acousticService.generateAcousticImage(
        propertyId,
        zoneId,
        timeRange
      )

      res.json({
        success: true,
        live: true,
        acousticImage,
        nextUpdate: new Date(Date.now() + 5000) // Update every 5 seconds
      })
    } catch (error) {
      console.error('Error getting live acoustic feed:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get live feed'
      })
    }
  })

  /**
   * GET /api/zones/pinpoint/:leakId
   * Get detailed leak pinpoint information
   */
  router.get('/pinpoint/:leakId', async (req: Request, res: Response) => {
    try {
      const { leakId } = req.params

      const leak = await db.collection('leak_locations').findOne({ _id: leakId as any })

      if (!leak) {
        return res.status(404).json({
          success: false,
          error: 'Leak location not found'
        })
      }

      res.json({
        success: true,
        leak: {
          ...leak,
          visualizationUrl: `/api/zones/acoustic-camera/live/${leak.propertyId}/${leak.zoneId}`
        }
      })
    } catch (error) {
      console.error('Error getting leak pinpoint:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get leak details'
      })
    }
  })

  return router
}
