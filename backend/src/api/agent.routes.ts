/**
 * AI Agent API Routes
 * Endpoints for managing the agentic AI system
 */

import { Router, type Request, type Response } from 'express'
import type { Db } from 'mongodb'
import { agenticAI } from '../services/agentic-ai.js'
import { mlPredictionService } from '../services/ml-prediction.js'
import { realtimeService } from '../services/realtime.js'

export function createAgentRouter(db: Db): Router {
  const router = Router()

  /**
   * GET /api/agent/status
   * Get current agent status
   */
  router.get('/status', (req: Request, res: Response) => {
    try {
      const status = agenticAI.getStatus()
      const recentActions = agenticAI.getRecentActions(20)
      const mlStatus = mlPredictionService.getModelStatus()
      const realtimeClients = realtimeService.getConnectedClientsCount()

      res.json({
        success: true,
        agent: status,
        ml: mlStatus,
        realtime: {
          connectedClients: realtimeClients
        },
        recentActions,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Error getting agent status:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get agent status'
      })
    }
  })

  /**
   * POST /api/agent/start
   * Start the autonomous agent
   */
  router.post('/start', (req: Request, res: Response) => {
    try {
      const { intervalMs = 30000 } = req.body

      agenticAI.startMonitoring(intervalMs)

      res.json({
        success: true,
        message: 'Agentic AI monitoring started',
        intervalMs
      })
    } catch (error) {
      console.error('Error starting agent:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to start agent'
      })
    }
  })

  /**
   * POST /api/agent/stop
   * Stop the autonomous agent
   */
  router.post('/stop', (req: Request, res: Response) => {
    try {
      agenticAI.stopMonitoring()

      res.json({
        success: true,
        message: 'Agentic AI monitoring stopped'
      })
    } catch (error) {
      console.error('Error stopping agent:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to stop agent'
      })
    }
  })

  /**
   * PUT /api/agent/config
   * Update agent configuration
   */
  router.put('/config', (req: Request, res: Response) => {
    try {
      const config = req.body

      agenticAI.updateConfig(config)

      res.json({
        success: true,
        message: 'Agent configuration updated',
        config: agenticAI.getStatus().config
      })
    } catch (error) {
      console.error('Error updating agent config:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update agent configuration'
      })
    }
  })

  /**
   * GET /api/agent/actions
   * Get recent agent actions
   */
  router.get('/actions', (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50
      const actions = agenticAI.getRecentActions(limit)

      res.json({
        success: true,
        actions,
        count: actions.length
      })
    } catch (error) {
      console.error('Error getting agent actions:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get agent actions'
      })
    }
  })

  /**
   * GET /api/agent/actions/:propertyId
   * Get actions for specific property
   */
  router.get('/actions/:propertyId', async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params

      const actions = await db.collection('agent_actions')
        .find({ propertyId })
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray()

      res.json({
        success: true,
        propertyId,
        actions,
        count: actions.length
      })
    } catch (error) {
      console.error('Error getting property actions:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get property actions'
      })
    }
  })

  /**
   * POST /api/agent/train
   * Train ML model with historical data
   */
  router.post('/train', async (req: Request, res: Response) => {
    try {
      // Get historical IoT readings
      const historicalReadings = await db.collection('iot_readings')
        .find({})
        .sort({ timestamp: -1 })
        .limit(10000)
        .toArray() as any[]

      if (historicalReadings.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No historical data available for training'
        })
      }

      await mlPredictionService.trainModel(historicalReadings)

      const modelStatus = mlPredictionService.getModelStatus()

      res.json({
        success: true,
        message: 'ML model trained successfully',
        modelStatus,
        trainingDataPoints: historicalReadings.length
      })
    } catch (error) {
      console.error('Error training model:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to train ML model'
      })
    }
  })

  /**
   * POST /api/agent/predict
   * Run prediction for specific property/device
   */
  router.post('/predict', async (req: Request, res: Response) => {
    try {
      const { propertyId, deviceId } = req.body

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          error: 'Property ID required'
        })
      }

      // Get recent readings
      const query: any = { propertyId }
      if (deviceId) query.deviceId = deviceId

      const recentReadings = await db.collection('iot_readings')
        .find(query)
        .sort({ timestamp: -1 })
        .limit(20)
        .toArray() as any[]

      if (recentReadings.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No readings found for this property/device'
        })
      }

      const predictions = await mlPredictionService.batchPredict(recentReadings)

      res.json({
        success: true,
        propertyId,
        deviceId,
        predictions,
        readingCount: recentReadings.length
      })
    } catch (error) {
      console.error('Error running prediction:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to run prediction'
      })
    }
  })

  /**
   * GET /api/agent/alerts
   * Get active AI-generated alerts
   */
  router.get('/alerts', async (req: Request, res: Response) => {
    try {
      const alerts = await db.collection('alerts')
        .find({ aiGenerated: true, resolved: false })
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray()

      res.json({
        success: true,
        alerts,
        count: alerts.length
      })
    } catch (error) {
      console.error('Error getting alerts:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get alerts'
      })
    }
  })

  /**
   * GET /api/agent/maintenance
   * Get scheduled predictive maintenance
   */
  router.get('/maintenance', async (req: Request, res: Response) => {
    try {
      const maintenance = await db.collection('maintenance_schedule')
        .find({ aiGenerated: true })
        .sort({ scheduledFor: 1 })
        .toArray()

      res.json({
        success: true,
        maintenance,
        count: maintenance.length
      })
    } catch (error) {
      console.error('Error getting maintenance schedule:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get maintenance schedule'
      })
    }
  })

  /**
   * GET /api/agent/payment-flags
   * Get payment anomaly flags
   */
  router.get('/payment-flags', async (req: Request, res: Response) => {
    try {
      const flags = await db.collection('payment_flags')
        .find({ resolved: false })
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray()

      res.json({
        success: true,
        flags,
        count: flags.length
      })
    } catch (error) {
      console.error('Error getting payment flags:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get payment flags'
      })
    }
  })

  /**
   * POST /api/agent/resolve-alert/:alertId
   * Resolve an AI alert
   */
  router.post('/resolve-alert/:alertId', async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params

      const result = await db.collection('alerts').updateOne(
        { _id: alertId as any },
        { $set: { resolved: true, resolvedAt: new Date() } }
      )

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        })
      }

      res.json({
        success: true,
        message: 'Alert resolved'
      })
    } catch (error) {
      console.error('Error resolving alert:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to resolve alert'
      })
    }
  })

  /**
   * GET /api/agent/statistics
   * Get agent performance statistics
   */
  router.get('/statistics', async (req: Request, res: Response) => {
    try {
      const [
        totalActions,
        executedActions,
        failedActions,
        activeAlerts,
        resolvedAlerts,
        scheduledMaintenance
      ] = await Promise.all([
        db.collection('agent_actions').countDocuments({}),
        db.collection('agent_actions').countDocuments({ status: 'executed' }),
        db.collection('agent_actions').countDocuments({ status: 'failed' }),
        db.collection('alerts').countDocuments({ aiGenerated: true, resolved: false }),
        db.collection('alerts').countDocuments({ aiGenerated: true, resolved: true }),
        db.collection('maintenance_schedule').countDocuments({ aiGenerated: true })
      ])

      // Get action distribution by type
      const actionsByType = await db.collection('agent_actions')
        .aggregate([
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
        .toArray()

      // Get priority distribution
      const actionsByPriority = await db.collection('agent_actions')
        .aggregate([
          { $group: { _id: '$priority', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
        .toArray()

      const successRate = totalActions > 0 
        ? ((executedActions / totalActions) * 100).toFixed(2)
        : '0.00'

      res.json({
        success: true,
        statistics: {
          actions: {
            total: totalActions,
            executed: executedActions,
            failed: failedActions,
            pending: totalActions - executedActions - failedActions,
            successRate: `${successRate}%`,
            byType: actionsByType,
            byPriority: actionsByPriority
          },
          alerts: {
            active: activeAlerts,
            resolved: resolvedAlerts,
            total: activeAlerts + resolvedAlerts
          },
          maintenance: {
            scheduled: scheduledMaintenance
          }
        },
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Error getting statistics:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get statistics'
      })
    }
  })

  return router
}
