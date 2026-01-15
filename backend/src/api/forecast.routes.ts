/**
 * Demand Forecasting API Routes
 * Endpoints for water consumption forecasting and demand analytics
 */

import { Router, Request, Response } from 'express'
import { demandForecastingService } from '../services/demand-forecasting.js'
import { requireAuth, requirePermission, Permission, AuthenticatedRequest } from '../middleware/rbac.js'
import { complianceService, AuditEventType, DataCategory } from '../services/compliance.js'
import { body, param, query, validationResult } from 'express-validator'

const router = Router()

/**
 * POST /api/forecast/readings
 * Submit consumption reading
 */
router.post(
  '/readings',
  requireAuth,
  requirePermission(Permission.DEVICE_WRITE_DATA),
  [
    body('propertyId').isString().trim().notEmpty(),
    body('consumption').isNumeric(),
    body('timestamp').optional().isISO8601(),
    body('temperature').optional().isNumeric(),
    body('isHoliday').optional().isBoolean()
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation Error', details: errors.array() })
    }

    try {
      const timestamp = req.body.timestamp ? new Date(req.body.timestamp) : new Date()
      const date = new Date(timestamp)

      const reading = {
        propertyId: req.body.propertyId,
        timestamp,
        consumption: parseFloat(req.body.consumption),
        temperature: req.body.temperature ? parseFloat(req.body.temperature) : undefined,
        dayOfWeek: date.getDay(),
        hourOfDay: date.getHours(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isHoliday: req.body.isHoliday || false,
        season: getSeason(date)
      }

      demandForecastingService.addReading(reading)

      complianceService.logDataAccess(
        req.user!.id,
        `/api/forecast/readings`,
        DataCategory.USAGE_PATTERNS,
        req
      )

      res.json({
        success: true,
        message: 'Consumption reading recorded',
        reading: {
          propertyId: reading.propertyId,
          timestamp: reading.timestamp,
          consumption: reading.consumption
        }
      })
    } catch (error: any) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      })
    }
  }
)

/**
 * POST /api/forecast/train/:propertyId
 * Train forecasting model for property
 */
router.post(
  '/train/:propertyId',
  requireAuth,
  requirePermission(Permission.FORECAST_CREATE),
  [param('propertyId').isString().trim().notEmpty()],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation Error', details: errors.array() })
    }

    try {
      const { propertyId } = req.params
      const success = demandForecastingService.trainModel(propertyId)

      if (!success) {
        return res.status(400).json({
          error: 'Training Failed',
          message: 'Insufficient data or training error. Need at least 1 week of hourly data.'
        })
      }

      const stats = demandForecastingService.getModelStats(propertyId)

      complianceService.logAuditEvent({
        eventType: AuditEventType.ADMIN_ACTION,
        userId: req.user!.id,
        resource: `forecast_model_${propertyId}`,
        action: 'TRAIN',
        result: 'success',
        severity: 'low'
      })

      res.json({
        success: true,
        message: 'Forecasting model trained successfully',
        propertyId,
        stats
      })
    } catch (error: any) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      })
    }
  }
)

/**
 * GET /api/forecast/predict/:propertyId
 * Get consumption forecast for property
 */
router.get(
  '/predict/:propertyId',
  requireAuth,
  requirePermission(Permission.FORECAST_READ),
  [
    param('propertyId').isString().trim().notEmpty(),
    query('hours').optional().isInt({ min: 1, max: 168 })
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation Error', details: errors.array() })
    }

    try {
      const { propertyId } = req.params
      const hoursAhead = parseInt(req.query.hours as string) || 24

      const forecasts = demandForecastingService.forecastConsumption(propertyId, hoursAhead)

      complianceService.logDataAccess(
        req.user!.id,
        `/api/forecast/predict/${propertyId}`,
        DataCategory.USAGE_PATTERNS,
        req
      )

      res.json({
        success: true,
        propertyId,
        hoursAhead,
        forecasts,
        generatedAt: new Date()
      })
    } catch (error: any) {
      res.status(500).json({
        error: 'Forecast Error',
        message: error.message
      })
    }
  }
)

/**
 * GET /api/forecast/peak-demand
 * Get peak demand forecast across multiple properties
 */
router.get(
  '/peak-demand',
  requireAuth,
  requirePermission(Permission.FORECAST_READ),
  [
    query('propertyIds').isString().notEmpty(),
    query('hours').optional().isInt({ min: 1, max: 168 })
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation Error', details: errors.array() })
    }

    try {
      const propertyIds = (req.query.propertyIds as string).split(',')
      const hoursAhead = parseInt(req.query.hours as string) || 24

      const peakDemand = demandForecastingService.forecastPeakDemand(propertyIds, hoursAhead)

      complianceService.logDataAccess(
        req.user!.id,
        `/api/forecast/peak-demand`,
        DataCategory.USAGE_PATTERNS,
        req
      )

      res.json({
        success: true,
        propertyCount: propertyIds.length,
        hoursAhead,
        peakDemand,
        generatedAt: new Date()
      })
    } catch (error: any) {
      res.status(500).json({
        error: 'Forecast Error',
        message: error.message
      })
    }
  }
)

/**
 * GET /api/forecast/patterns/:propertyId
 * Get usage patterns for property
 */
router.get(
  '/patterns/:propertyId',
  requireAuth,
  requirePermission(Permission.ANALYTICS_READ),
  [param('propertyId').isString().trim().notEmpty()],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation Error', details: errors.array() })
    }

    try {
      const { propertyId } = req.params
      const patterns = demandForecastingService.getUsagePatterns(propertyId)

      if (!patterns) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'No usage patterns available for this property'
        })
      }

      complianceService.logDataAccess(
        req.user!.id,
        `/api/forecast/patterns/${propertyId}`,
        DataCategory.USAGE_PATTERNS,
        req
      )

      res.json({
        success: true,
        propertyId,
        patterns
      })
    } catch (error: any) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      })
    }
  }
)

/**
 * GET /api/forecast/anomalies/:propertyId
 * Check for consumption anomalies
 */
router.get(
  '/anomalies/:propertyId',
  requireAuth,
  requirePermission(Permission.ANALYTICS_READ),
  [
    param('propertyId').isString().trim().notEmpty(),
    query('threshold').optional().isFloat({ min: 1, max: 5 })
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation Error', details: errors.array() })
    }

    try {
      const { propertyId } = req.params
      const threshold = parseFloat(req.query.threshold as string) || 2.0

      const isAnomaly = demandForecastingService.detectAnomalies(propertyId, threshold)

      if (isAnomaly) {
        complianceService.logAuditEvent({
          eventType: AuditEventType.SECURITY_ALERT,
          userId: req.user!.id,
          resource: `consumption_${propertyId}`,
          action: 'ANOMALY_DETECTED',
          result: 'success',
          severity: 'medium',
          details: { threshold }
        })
      }

      res.json({
        success: true,
        propertyId,
        anomalyDetected: isAnomaly,
        threshold,
        checkedAt: new Date()
      })
    } catch (error: any) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      })
    }
  }
)

/**
 * GET /api/forecast/stats/:propertyId
 * Get model statistics
 */
router.get(
  '/stats/:propertyId',
  requireAuth,
  requirePermission(Permission.FORECAST_READ),
  [param('propertyId').isString().trim().notEmpty()],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation Error', details: errors.array() })
    }

    try {
      const { propertyId } = req.params
      const stats = demandForecastingService.getModelStats(propertyId)

      if (!stats) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'No model statistics available for this property'
        })
      }

      res.json({
        success: true,
        propertyId,
        stats
      })
    } catch (error: any) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      })
    }
  }
)

// Helper function
function getSeason(date: Date): 'winter' | 'spring' | 'summer' | 'fall' {
  const month = date.getMonth() + 1
  if (month >= 12 || month <= 2) return 'winter'
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  return 'fall'
}

export function createForecastRouter(): Router {
  return router
}
