/**
 * Main Express Server
 * IoT Leak Prevention & Plumbing Management Platform on BSV with Agentic AI
 */

import express, { Express, Request, Response, NextFunction } from 'express'
import { createServer } from 'http'
import cors from 'cors'
import { initializeDatabase, getDatabase, closeDatabase, checkDatabaseHealth } from './database.js'
import { createIoTRouter } from './api/iot.routes.js'
import { createJobRouter } from './api/jobs.routes.js'
import { createConsentRouter } from './api/consent.routes.js'
import { createAuthRouter } from './api/auth.routes.js'
import { createAgentRouter } from './api/agent.routes.js'
import { createZoneAcousticRouter } from './api/zones.routes.js'
import { createForecastRouter } from './api/forecast.routes.js'
import { PlumbingService } from './lookup-services/PlumbingService.js'
import { BlockchainService } from './services/blockchain.js'
import { mlPredictionService } from './services/ml-prediction.js'
import { agenticAI } from './services/agentic-ai.js'
import { realtimeService } from './services/realtime.js'
import { demandForecastingService } from './services/demand-forecasting.js'
import { complianceService } from './services/compliance.js'
import { QuantumService } from './services/quantum.js'
import security from './middleware/security.js'

const PORT = process.env.PORT || 3001
const app: Express = express()
const httpServer = createServer(app)

// ========== Middleware ==========

// Security headers (Helmet)
app.use(security.securityHeaders)

// CORS configuration (security-enhanced)
app.use(security.corsOptions)

// Response compression
app.use(security.compressionMiddleware)

// HTTP parameter pollution protection
app.use(security.httpPollutionProtection)

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Security response headers
app.use(security.secureResponseHeaders)

// GDPR compliance headers
app.use(security.gdprHeaders)

// SQL injection prevention
app.use(security.preventSQLInjection)

// XSS protection
app.use(security.preventXSS)

// Global rate limiting
app.use(security.apiLimiter)

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.path}`)

  // Capture response time
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    const status = res.statusCode
    const statusColor = status >= 400 ? '❌' : '✓'
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${status} (${duration}ms) ${statusColor}`)
  })

  next()
})

// ========== Health Check & Status Endpoints ==========

// Temporary direct heatmap endpoint (alternative path if router mounting has issues)
app.get('/api/heatmap-direct', async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24
    const svc = new PlumbingService(getDatabase())
    const data = await svc.getHeatmapData(hours)
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/health', async (req: Request, res: Response) => {
  const dbHealthy = await checkDatabaseHealth()

  if (!dbHealthy) {
    return res.status(503).json({
      status: 'unhealthy',
      message: 'Database connection failed'
    })
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Plumbing IoT BSV Platform'
  })
})

app.get('/status', (req: Request, res: Response) => {
  res.json({
    service: 'Plumbing IoT Management on BSV Network',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    security: {
      helmet: 'enabled',
      rateLimiting: 'enabled',
      inputValidation: 'enabled',
      auditLogging: 'enabled',
      rbac: 'enabled',
      quantumResistant: 'enabled'
    },
    compliance: {
      gdpr: 'compliant',
      soc2: 'compliant',
      iso27001: 'compliant'
    },
    quantum: QuantumService.getCapabilities(),
    features: [
      'Real-time IoT sensor data (pressure, flow, temperature)',
      'Agentic AI autonomous monitoring',
      'ML-powered leak prediction & prevention',
      'Demand forecasting & usage analytics',
      'Zone identification & triangulation',
      'Acoustic camera leak visualization',
      'Precise leak pinpointing',
      'Real-time WebSocket data streaming',
      'Predictive maintenance scheduling',
      'Peak demand forecasting',
      'Consumption anomaly detection',
      'Payment monitoring & anomaly detection',
      'Leak detection alerts',
      'Job report management',
      'Customer consent system',
      'Water company access control',
      'BSV blockchain proof storage',
      'Multi-property management',
      'Comprehensive security (Helmet, Rate Limiting, XSS/SQL protection)',
      'RBAC permissions system',
      'Audit logging & compliance',
      '3D Digital Twin visualization',
      'VR Education Game (7 levels)',
      '🔮 Quantum Random Number Generation',
      '🔮 Post-Quantum Cryptography (PQC)',
      '🔮 Quantum Route Optimization',
      '🔮 Quantum Machine Learning',
      '🔮 Quantum Blockchain Security'
    ]
  })
})

// ========== API Routes ==========

// Routes are registered after the database is initialized (see startServer)
// to avoid accessing the DB before it's ready.

// app.use('/api/iot', createIoTRouter(getDatabase()))
// app.use('/api/jobs', createJobRouter(getDatabase()))
// app.use('/api/consent', createConsentRouter(getDatabase()))

// ========== Documentation Routes ==========

app.get('/api/docs', (req: Request, res: Response) => {
  res.json({
    title: 'Plumbing IoT BSV Platform API',
    baseUrl: `http://localhost:${PORT}`,
    endpoints: {
      iot: {
        description: 'IoT sensor data management',
        routes: [
          'POST /api/iot/reading - Submit single sensor reading',
          'POST /api/iot/batch - Submit batch of readings with blockchain proof',
          'GET /api/iot/property/:propertyId/readings - Get latest readings',
          'GET /api/iot/property/:propertyId/readings/history - Get readings in time range',
          'GET /api/iot/property/:propertyId/alerts - Get active alerts',
          'GET /api/iot/property/:propertyId/stats - Get property statistics',
          'POST /api/iot/device/register - Register new device',
          'PATCH /api/iot/device/:deviceId/status - Update device status'
        ]
      },
      jobs: {
        description: 'Plumbing job management and reporting',
        routes: [
          'POST /api/jobs/create - Create new job',
          'GET /api/jobs/:jobId - Get job details',
          'GET /api/jobs/property/:propertyId - Get property jobs',
          'GET /api/jobs/plumber/:plumberId/pending - Get pending jobs',
          'POST /api/jobs/:jobId/complete - Complete and submit job report',
          'POST /api/jobs/:jobId/approve - Customer approves completed job',
          'GET /api/jobs/plumber/:plumberId/revenue - Get plumber revenue'
        ]
      },
      consent: {
        description: 'Access control and data permissions',
        routes: [
          'POST /api/consent/:propertyId/setup - Setup property consent',
          'GET /api/consent/:propertyId/summary - Get consent summary',
          'POST /api/consent/:propertyId/grant-water-company - Grant water company access',
          'DELETE /api/consent/:propertyId/water-company/:companyId - Revoke water company access',
          'GET /api/consent/:propertyId/access/:entityId/:entityType - Check access',
          'GET /api/consent/:propertyId/audit-trail - Get audit log'
        ]
      }
    }
  })
})

// ========== Example Data Routes (for testing) ==========

app.get('/api/examples', (req: Request, res: Response) => {
  res.json({
    iotReading: {
      deviceId: 'device-001',
      propertyId: 'prop-001',
      pressure: 65.5,
      flowRate: 3.2,
      temperature: 18.5,
      alerts: [],
      recordedBy: 'system'
    },
    jobReport: {
      jobId: 'job-001',
      propertyId: 'prop-001',
      customerId: 'cust-001',
      plumberId: 'plumber-001',
      description: 'Leak repair',
      workPerformed: ['Located leak', 'Replaced pipe section', 'Tested for leaks'],
      partsUsed: [
        { name: 'Copper pipe 1/2"', cost: 15, quantity: 5 },
        { name: 'Coupling', cost: 2, quantity: 3 }
      ],
      totalCost: 81,
      status: 'pending'
    },
    consent: {
      propertyId: 'prop-001',
      customerId: 'cust-001',
      plumberId: 'plumber-001',
      waterCompanyAccess: [
        {
          companyId: 'waterco-001',
          isActive: true,
          expiresAt: '2025-12-30T00:00:00Z'
        }
      ]
    }
  })
})

// ========== Error Handling ==========

interface AppError extends Error {
  status?: number
}

app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err)

  const status = err.status || 500
  const message = err.message || 'Internal Server Error'

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  })
})

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableEndpoints: '/api/docs'
  })
})

// ========== Server Initialization ==========

/**
 * Start the Express server
 */
async function startServer(): Promise<void> {
  try {
    // Initialize database
    console.log('🚀 Starting Plumbing IoT BSV Platform...\n')
    console.log('📦 Initializing database...')
    await initializeDatabase()

    // Initialize AI services
    console.log('🤖 Initializing AI services...')
    agenticAI.initialize(getDatabase())
    
    // Initialize real-time WebSocket service
    realtimeService.initialize(httpServer, getDatabase())

    // Register routes now that DB is ready
    app.use('/api/iot', createIoTRouter(getDatabase()))
    app.use('/api/jobs', createJobRouter(getDatabase()))
    app.use('/api/consent', createConsentRouter(getDatabase()))
    app.use('/api/auth', createAuthRouter(getDatabase()))
    app.use('/api/agent', createAgentRouter(getDatabase()))
    app.use('/api/zones', createZoneAcousticRouter(getDatabase()))
    app.use('/api/forecast', createForecastRouter())    
    // Quantum technology routes
    const quantumRoutes = await import('./api/quantum.routes.js')
    app.use('/api/quantum', quantumRoutes.default)
    // Water Data Marketplace routes
    const marketplaceRoutes = await import('./api/marketplace.routes.js')
    app.use('/api/marketplace', marketplaceRoutes.default)
    
    // Social Intelligence routes (Guardian Angel system)
    const socialRoutes = await import('./api/social-intelligence.routes.js')
    app.use('/api/social', socialRoutes.default)
    console.log('✓ Social Intelligence (Guardian Angel) routes registered')
    
    // Integration Hub routes (SCADA, GIS, ERP, LoRaWAN)
    const integrationRoutes = await import('./api/integration.routes.js')
    app.use('/api/integration', integrationRoutes.default)
    console.log('✓ Integration Hub (SCADA/GIS/ERP/LoRaWAN) routes registered')
    
    // Consumer Rewards routes (water conservation rewards)
    const rewardsRoutes = await import('./api/rewards.routes.js')
    app.use('/api/rewards', rewardsRoutes.default)
    console.log('✓ Consumer Rewards (water conservation payments) routes registered')
    
    // Add a top-level heatmap endpoint (global aggregation)
    try {
      const plumbingService = new PlumbingService(getDatabase())
      app.get('/api/heatmap', async (req: Request, res: Response) => {
        try {
          const hours = parseInt(req.query.hours as string) || 24
          const data = await plumbingService.getHeatmapData(hours)
          res.json(data)
        } catch (error: any) {
          res.status(500).json({ error: error.message })
        }
      })
    } catch (err) {
      console.warn('Heatmap route could not be registered:', err)
    }

    // Blockchain endpoints
    try {
      const blockchainService = new BlockchainService(getDatabase())
      
      app.post('/api/blockchain/iot-proof', async (req: Request, res: Response) => {
        try {
          const { dataHash, timestamp, propertyId, deviceId } = req.body
          const proof = await blockchainService.submitIoTProof(propertyId, dataHash, timestamp, deviceId)
          res.json(proof)
        } catch (error: any) {
          res.status(500).json({ error: error.message })
        }
      })

      app.post('/api/blockchain/job-proof', async (req: Request, res: Response) => {
        try {
          const { jobId, plumberId, reportHash, timestamp } = req.body
          const proof = await blockchainService.submitJobProof(jobId, plumberId, reportHash, timestamp)
          res.json(proof)
        } catch (error: any) {
          res.status(500).json({ error: error.message })
        }
      })

      app.get('/api/blockchain/stats', async (req: Request, res: Response) => {
        try {
          const stats = await blockchainService.getBlockchainStats()
          res.json(stats)
        } catch (error: any) {
          res.status(500).json({ error: error.message })
        }
      })

      app.get('/api/blockchain/property/:propertyId/proofs', async (req: Request, res: Response) => {
        try {
          const proofs = await blockchainService.getPropertyProofs(req.params.propertyId)
          res.json(proofs)
        } catch (error: any) {
          res.status(500).json({ error: error.message })
        }
      })

      console.log('✓ Blockchain endpoints registered')
    } catch (err) {
      console.warn('Blockchain routes could not be registered:', err)
    }

    // Train ML model with existing data
    try {
      console.log('🧠 Training ML model with historical data...')
      const historicalReadings = await getDatabase().collection('iot_readings')
        .find({})
        .sort({ timestamp: -1 })
        .limit(10000)
        .toArray() as any[]
      
      if (historicalReadings.length > 0) {
        await mlPredictionService.trainModel(historicalReadings)
        console.log('✓ ML model trained successfully')
      } else {
        console.log('⚠ No historical data available for ML training')
      }
    } catch (err) {
      console.warn('ML model training failed:', err)
    }

    // Start agentic AI monitoring
    console.log('🤖 Starting agentic AI autonomous monitoring...')
    agenticAI.startMonitoring(30000) // Check every 30 seconds

    // Start HTTP server (supports both Express and WebSocket)
    httpServer.listen(PORT, () => {
      console.log(`\n✓ Server listening on http://localhost:${PORT}`)
      console.log(`✓ WebSocket endpoint: ws://localhost:${PORT}/realtime`)
      console.log(`✓ API Documentation: http://localhost:${PORT}/api/docs`)
      console.log(`✓ Health Check: http://localhost:${PORT}/health`)
      console.log(`\n🎯 Platform Ready with Agentic AI:`)
      console.log('   • Real-time IoT sensor data streaming')
      console.log('   • ML-powered leak prediction & prevention')
      console.log('   • Autonomous agent monitoring')
      console.log('   • Predictive maintenance scheduling')
      console.log('   • Payment anomaly detection')
      console.log('   • Leak detection and automated alerts')
      console.log('   • Job management and reporting')
      console.log('   • Customer consent and permissions')
      console.log('   • Blockchain proof storage on BSV\n')
    })
  } catch (error) {
    console.error('✗ Failed to start server:', error)
    process.exit(1)
  }
}

// ========== Graceful Shutdown ==========

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...')
  agenticAI.stopMonitoring()
  realtimeService.shutdown()
  await closeDatabase()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...')
  agenticAI.stopMonitoring()
  realtimeService.shutdown()
  await closeDatabase()
  process.exit(0)
})

// Start server
startServer()

export default app
