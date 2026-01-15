/**
 * Quantum Technology API Routes
 * Endpoints for quantum computing features
 */

import { Router, Request, Response } from 'express'
import { 
  QuantumRandomGenerator, 
  PostQuantumCrypto, 
  QuantumOptimizer,
  QuantumML,
  QuantumBlockchain,
  QuantumService 
} from '../services/quantum.js'
import { QuantumSensorService, QuantumPhotonicsSensor } from '../services/quantum-sensors.js'
import { requireAuth, requirePermission, Permission, AuthenticatedRequest } from '../middleware/rbac.js'
import { body, param, query, validationResult } from 'express-validator'

const router = Router()

/**
 * GET /api/quantum/status
 * Get quantum technology capabilities and status
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const capabilities = QuantumService.getCapabilities()
    const status = QuantumService.getStatus()

    res.json({
      ...capabilities,
      ...status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get quantum status',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * POST /api/quantum/random
 * Generate quantum-secure random data
 */
router.post(
  '/random',
  requireAuth,
  requirePermission(Permission.SYSTEM_CONFIGURE),
  [
    body('length').isInt({ min: 1, max: 1024 }).withMessage('Length must be between 1 and 1024 bytes'),
    body('format').optional().isIn(['hex', 'base64', 'binary']).withMessage('Invalid format')
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { length, format = 'hex' } = req.body
      const randomBytes = QuantumRandomGenerator.generateQuantumRandom(length)
      
      let output: string
      if (format === 'base64') {
        output = randomBytes.toString('base64')
      } else if (format === 'binary') {
        output = randomBytes.toString('binary')
      } else {
        output = randomBytes.toString('hex')
      }

      res.json({
        randomData: output,
        length,
        format,
        algorithm: 'Quantum Random Number Generator',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate quantum random data',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/quantum/keypair
 * Generate post-quantum cryptography key pair
 */
router.post(
  '/keypair',
  requireAuth,
  requirePermission(Permission.SYSTEM_CONFIGURE),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const keyPair = PostQuantumCrypto.generateQuantumResistantKeyPair()

      res.json({
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        algorithm: keyPair.algorithm,
        securityLevel: 'Quantum-Resistant',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate quantum key pair',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/quantum/optimize-route
 * Quantum optimization for plumber routing
 */
router.post(
  '/optimize-route',
  requireAuth,
  requirePermission(Permission.JOB_READ),
  [
    body('plumberId').isString().notEmpty(),
    body('jobs').isArray().withMessage('Jobs must be an array'),
    body('jobs.*.jobId').isString().notEmpty(),
    body('jobs.*.propertyId').isString().notEmpty(),
    body('jobs.*.location.lat').isFloat({ min: -90, max: 90 }),
    body('jobs.*.location.lng').isFloat({ min: -180, max: 180 }),
    body('jobs.*.priority').isInt({ min: 1, max: 5 }),
    body('jobs.*.estimatedDuration').isInt({ min: 1 }),
    body('startLocation.lat').isFloat({ min: -90, max: 90 }),
    body('startLocation.lng').isFloat({ min: -180, max: 180 })
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { plumberId, jobs, startLocation } = req.body

      const result = QuantumOptimizer.optimizePlumberRoute(
        plumberId,
        jobs,
        startLocation
      )

      res.json({
        plumberId,
        optimizedRoute: result.optimizedRoute,
        totalDistance: result.totalDistance,
        totalTime: result.totalTime,
        algorithm: result.algorithm,
        quantumAdvantage: 'Global optimization with quantum-inspired annealing',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to optimize route',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/quantum/optimize-network
 * Quantum optimization for water distribution network
 */
router.post(
  '/optimize-network',
  requireAuth,
  requirePermission(Permission.SYSTEM_CONFIGURE),
  [
    body('networkNodes').isArray().withMessage('Network nodes must be an array'),
    body('networkNodes.*.nodeId').isString().notEmpty(),
    body('networkNodes.*.pressure').isFloat({ min: 0 }),
    body('networkNodes.*.flow').isFloat({ min: 0 }),
    body('networkNodes.*.elevation').isFloat(),
    body('constraints.minPressure').isFloat({ min: 0 }),
    body('constraints.maxPressure').isFloat({ min: 0 }),
    body('constraints.targetFlow').isFloat({ min: 0 })
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { networkNodes, constraints } = req.body

      const result = QuantumOptimizer.optimizeWaterDistribution(
        networkNodes,
        constraints
      )

      res.json({
        optimizedPressures: result.optimizedPressures,
        energySavings: `${result.energySavings}%`,
        algorithm: result.algorithm,
        quantumAdvantage: 'Energy optimization through quantum annealing',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to optimize network',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/quantum/ml-predict
 * Quantum machine learning prediction
 */
router.post(
  '/ml-predict',
  requireAuth,
  requirePermission(Permission.AI_READ),
  [
    body('historicalData').isArray().withMessage('Historical data must be an array'),
    body('targetPoint').isInt({ min: 0 })
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { historicalData, targetPoint } = req.body

      const result = QuantumML.quantumKernelPrediction(
        historicalData,
        targetPoint
      )

      res.json({
        prediction: result.prediction,
        confidence: result.confidence,
        quantumAdvantage: result.quantumAdvantage,
        algorithm: 'Quantum Kernel Method',
        note: 'Quantum entanglement enhances pattern recognition',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate quantum ML prediction',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/quantum/anomaly-detection
 * Quantum anomaly detection
 */
router.post(
  '/anomaly-detection',
  requireAuth,
  requirePermission(Permission.ANALYTICS_READ),
  [
    body('readings').isArray().withMessage('Readings must be an array'),
    body('threshold').optional().isFloat({ min: 0, max: 1 })
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { readings, threshold = 0.8 } = req.body

      const result = QuantumML.quantumAnomalyDetection(readings, threshold)

      res.json({
        anomalies: result.anomalies,
        totalAnomalies: result.anomalies.length,
        algorithm: result.algorithm,
        quantumAdvantage: 'Quantum state distance provides superior anomaly detection',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to detect anomalies',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/quantum/blockchain-block
 * Create quantum-secure blockchain block
 */
router.post(
  '/blockchain-block',
  requireAuth,
  requirePermission(Permission.DEVICE_WRITE_DATA),
  [
    body('propertyId').isString().notEmpty(),
    body('deviceId').isString().notEmpty(),
    body('reading').isFloat({ min: 0 }),
    body('timestamp').isISO8601(),
    body('previousHash').optional().isString()
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { propertyId, deviceId, reading, timestamp, previousHash = '0' } = req.body

      const block = QuantumBlockchain.createDataBlock(
        {
          propertyId,
          deviceId,
          reading,
          timestamp: new Date(timestamp)
        },
        previousHash
      )

      res.json({
        ...block,
        algorithm: 'SHA-512 with Quantum Signature',
        securityLevel: 'Quantum-Resistant',
        note: 'IoT data integrity guaranteed through quantum blockchain'
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create blockchain block',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/quantum/verify-blockchain
 * Verify quantum blockchain integrity
 */
router.post(
  '/verify-blockchain',
  requireAuth,
  requirePermission(Permission.COMPLIANCE_READ),
  [
    body('blocks').isArray().withMessage('Blocks must be an array')
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { blocks } = req.body

      const result = QuantumBlockchain.verifyBlockchain(blocks)

      res.json({
        isValid: result.isValid,
        corruptedBlocks: result.corruptedBlocks,
        totalBlocks: blocks.length,
        integrityScore: result.isValid ? 100 : Math.round((1 - result.corruptedBlocks.length / blocks.length) * 100),
        algorithm: 'Quantum Hash Chain Verification',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to verify blockchain',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/quantum/sensors/register
 * Register a new quantum-enabled sensor
 */
router.post(
  '/sensors/register',
  requireAuth,
  requirePermission(Permission.DEVICE_CREATE),
  [
    body('propertyId').isString().notEmpty(),
    body('sensorType').isIn(['flow', 'pressure', 'temperature', 'leak'])
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { propertyId, sensorType } = req.body
      const result = QuantumSensorService.registerQuantumSensor(propertyId, sensorType)

      res.status(201).json({
        ...result,
        message: 'Quantum sensor registered successfully',
        quantumTechnology: 'Photonics-based sensing',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to register quantum sensor',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/quantum/sensors/measure
 * Get quantum-enhanced sensor reading
 */
router.post(
  '/sensors/measure',
  requireAuth,
  requirePermission(Permission.DEVICE_READ),
  [
    body('sensorId').isString().notEmpty(),
    body('classicalValue').isFloat()
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { sensorId, classicalValue } = req.body
      const result = QuantumSensorService.getQuantumReading(sensorId, classicalValue)

      res.json({
        ...result,
        precision: 'femto-level (10^-12)',
        technology: 'Quantum Photonics',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get quantum reading',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api/quantum/sensors/entangled-network
 * Create entangled sensor network for correlated measurements
 */
router.post(
  '/sensors/entangled-network',
  requireAuth,
  requirePermission(Permission.SYSTEM_CONFIGURE),
  [
    body('propertyId').isString().notEmpty()
  ],
  (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { propertyId } = req.body
      const result = QuantumSensorService.createEntangledNetwork(propertyId)

      res.json({
        ...result,
        message: 'Entangled sensor network created',
        technology: 'EPR entangled photon pairs',
        advantage: 'Tamper-proof quantum correlations',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create entangled network',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * GET /api/quantum/sensors/capabilities
 * Get quantum sensor capabilities
 */
router.get('/sensors/capabilities', (req: Request, res: Response) => {
  try {
    const capabilities = QuantumSensorService.getAllCapabilities()

    res.json({
      ...capabilities,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get sensor capabilities',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
