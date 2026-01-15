/**
 * Water Data Marketplace API Routes
 * B2B API gateway for third-party integrations
 */

import { Router, Request, Response } from 'express'
import { WaterDataMarketplace } from '../services/water-data-marketplace.js'
import { PredictiveInfrastructureAI } from '../services/predictive-infrastructure.js'
import { WaterCreditsTrading } from '../services/water-credits.js'
import { requireAuth, requirePermission, Permission, AuthenticatedRequest } from '../middleware/rbac.js'
import { body, param, query, validationResult } from 'express-validator'

const router = Router()

// ==================== MARKETPLACE CUSTOMER MANAGEMENT ====================

/**
 * POST /api/marketplace/register
 * Register new B2B customer for API access
 */
router.post(
  '/register',
  [
    body('customerName').isString().notEmpty(),
    body('customerType').isIn(['utility', 'insurance', 'real_estate', 'smart_home', 'construction', 'government', 'esg_platform', 'iot_platform', 'research']),
    body('bsvWalletAddress').isString().notEmpty()
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { customerName, customerType, bsvWalletAddress } = req.body
      const result = WaterDataMarketplace.registerCustomer(customerName, customerType, bsvWalletAddress)

      res.status(201).json({
        ...result,
        message: 'API customer registered successfully',
        documentation: '/api/marketplace/docs',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to register customer',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/marketplace/credits/purchase
 * Purchase API credits with BSV
 */
router.post(
  '/credits/purchase',
  [
    body('customerId').isString().notEmpty(),
    body('satoshiAmount').isInt({ min: 1000 }),
    body('bsvTxId').isString().notEmpty()
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { customerId, satoshiAmount, bsvTxId } = req.body
      const result = WaterDataMarketplace.purchaseCredits(customerId, satoshiAmount, bsvTxId)

      res.json({
        ...result,
        message: 'Credits purchased successfully',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to purchase credits',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// ==================== DATA API ENDPOINTS ====================

/**
 * POST /api/marketplace/data/usage
 * Get usage data (costs credits)
 */
router.post(
  '/data/usage',
  [
    body('apiKey').isString().notEmpty(),
    body('propertyIds').isArray().notEmpty(),
    body('dateRange.start').isISO8601(),
    body('dateRange.end').isISO8601()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { apiKey, propertyIds, dateRange } = req.body
      const result = await WaterDataMarketplace.getUsageData(
        apiKey,
        propertyIds,
        { start: new Date(dateRange.start), end: new Date(dateRange.end) }
      )

      res.json({
        ...result,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(403).json({
        error: 'API call failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/marketplace/data/leak-detection
 * Get leak detection analysis (costs credits)
 */
router.post(
  '/data/leak-detection',
  [
    body('apiKey').isString().notEmpty(),
    body('propertyId').isString().notEmpty()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { apiKey, propertyId } = req.body
      const result = await WaterDataMarketplace.getLeakDetection(apiKey, propertyId)

      res.json({
        ...result,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(403).json({
        error: 'API call failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/marketplace/data/predictive-maintenance
 * Get predictive maintenance analysis (costs credits)
 */
router.post(
  '/data/predictive-maintenance',
  [
    body('apiKey').isString().notEmpty(),
    body('propertyIds').isArray().notEmpty()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { apiKey, propertyIds } = req.body
      const result = await WaterDataMarketplace.getPredictiveMaintenance(apiKey, propertyIds)

      res.json({
        ...result,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(403).json({
        error: 'API call failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/marketplace/data/property-score
 * Get property water score for real estate (costs credits)
 */
router.post(
  '/data/property-score',
  [
    body('apiKey').isString().notEmpty(),
    body('propertyId').isString().notEmpty()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { apiKey, propertyId } = req.body
      const result = await WaterDataMarketplace.getPropertyScore(apiKey, propertyId)

      res.json({
        ...result,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(403).json({
        error: 'API call failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/marketplace/data/bulk-analytics
 * Get bulk analytics for utilities/government (costs credits)
 */
router.post(
  '/data/bulk-analytics',
  [
    body('apiKey').isString().notEmpty(),
    body('region').isString().notEmpty(),
    body('analysisType').isIn(['consumption', 'infrastructure', 'forecasting'])
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { apiKey, region, analysisType } = req.body
      const result = await WaterDataMarketplace.getBulkAnalytics(apiKey, region, analysisType)

      res.json({
        ...result,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(403).json({
        error: 'API call failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// ==================== STATISTICS & MONITORING ====================

/**
 * GET /api/marketplace/stats/customer/:customerId
 * Get customer usage statistics
 */
router.get(
  '/stats/customer/:customerId',
  [param('customerId').isString().notEmpty()],
  (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { customerId } = req.params
      const stats = WaterDataMarketplace.getCustomerStats(customerId)

      res.json({
        ...stats,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(404).json({
        error: 'Customer not found',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * GET /api/marketplace/stats/overview
 * Get marketplace-wide statistics (admin only)
 */
router.get(
  '/stats/overview',
  requireAuth,
  requirePermission(Permission.ANALYTICS_READ),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = WaterDataMarketplace.getMarketplaceStats()

      res.json({
        ...stats,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get marketplace stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// ==================== WATER CREDITS TRADING ====================

/**
 * POST /api/marketplace/credits/issue
 * Issue water conservation credits
 */
router.post(
  '/credits/issue',
  requireAuth,
  requirePermission(Permission.CONSENT_MANAGE),
  [
    body('userId').isString().notEmpty(),
    body('propertyId').isString().notEmpty(),
    body('creditType').isIn(['conservation', 'efficiency', 'leak_prevention', 'recycling', 'demand_response']),
    body('gallonsSaved').isFloat({ min: 0 }),
    body('verificationData').isObject()
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { userId, propertyId, creditType, gallonsSaved, verificationData } = req.body
      const result = WaterCreditsTrading.issueCredits(
        userId,
        propertyId,
        creditType,
        gallonsSaved,
        verificationData
      )

      res.status(201).json({
        ...result,
        message: 'Water credits issued successfully',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to issue credits',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/marketplace/credits/list-for-sale
 * List credits for sale on marketplace
 */
router.post(
  '/credits/list-for-sale',
  requireAuth,
  [
    body('creditId').isString().notEmpty(),
    body('pricePerGallon').isFloat({ min: 0 })
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { creditId, pricePerGallon } = req.body
      const userId = req.user!.id
      const result = WaterCreditsTrading.listForSale(creditId, userId, pricePerGallon)

      res.json({
        ...result,
        message: 'Credits listed for sale',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to list credits',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/marketplace/credits/trade
 * Buy/trade water credits
 */
router.post(
  '/credits/trade',
  requireAuth,
  [
    body('creditId').isString().notEmpty(),
    body('buyerId').isString().notEmpty(),
    body('bsvTxId').isString().notEmpty()
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { creditId, buyerId, bsvTxId } = req.body
      const result = WaterCreditsTrading.buyCredits(creditId, buyerId, bsvTxId)

      res.json({
        ...result,
        message: 'Credits traded successfully',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to trade credits',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * GET /api/marketplace/credits/market
 * Get water credits marketplace listings
 */
router.get('/credits/market', (req: Request, res: Response) => {
  try {
    const market = WaterCreditsTrading.getMarketListings()

    res.json({
      ...market,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get marketplace',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/marketplace/credits/portfolio/:userId
 * Get user's water credits portfolio
 */
router.get(
  '/credits/portfolio/:userId',
  requireAuth,
  [param('userId').isString().notEmpty()],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { userId } = req.params
      const portfolio = WaterCreditsTrading.getUserPortfolio(userId)

      res.json({
        ...portfolio,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(404).json({
        error: 'Portfolio not found',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// ==================== PREDICTIVE INFRASTRUCTURE ====================

/**
 * POST /api/marketplace/predict/infrastructure
 * Analyze infrastructure and predict failures (72h advance warning)
 */
router.post(
  '/predict/infrastructure',
  requireAuth,
  requirePermission(Permission.ANALYTICS_READ),
  [
    body('componentId').isString().notEmpty(),
    body('componentType').isIn(['main_pipe', 'service_line', 'valve', 'meter', 'junction', 'pump', 'tank']),
    body('sensorData').isObject(),
    body('metadata').isObject()
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { componentId, componentType, sensorData, metadata } = req.body
      const prediction = PredictiveInfrastructureAI.analyzePredictiveFailure(
        componentId,
        componentType,
        sensorData,
        metadata
      )

      res.json({
        ...prediction,
        message: prediction.riskLevel === 'critical' || prediction.riskLevel === 'high'
          ? 'ALERT: High failure risk detected'
          : 'Infrastructure health normal',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Prediction failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * GET /api/marketplace/predict/roi-analysis
 * Calculate ROI of predictive maintenance program
 */
router.get(
  '/predict/roi-analysis',
  requireAuth,
  requirePermission(Permission.ANALYTICS_READ),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const roi = PredictiveInfrastructureAI.calculateTotalSavings()

      res.json({
        ...roi,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to calculate ROI',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

export default router
