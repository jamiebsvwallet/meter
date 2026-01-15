/**
 * Real-time WebSocket Service
 * Provides real-time data streaming for IoT readings, predictions, and agent actions
 */

import { Server as SocketIOServer } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import type { Db } from 'mongodb'
import { mlPredictionService } from './ml-prediction.js'
import { agenticAI } from './agentic-ai.js'

interface RealtimeClient {
  id: string
  propertyId?: string
  role?: string
  subscribedChannels: Set<string>
}

export class RealtimeService {
  private io: SocketIOServer | null = null
  private clients: Map<string, RealtimeClient> = new Map()
  private db: Db | null = null
  private broadcastInterval: NodeJS.Timeout | null = null

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer, db: Db): void {
    this.db = db

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/realtime'
    })

    this.setupEventHandlers()
    this.startBroadcasting()

    console.log('✓ Real-time WebSocket service initialized')
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`)

      const client: RealtimeClient = {
        id: socket.id,
        subscribedChannels: new Set()
      }
      this.clients.set(socket.id, client)

      // Authentication
      socket.on('authenticate', (data: { token: string; propertyId?: string; role?: string }) => {
        // Verify JWT token here
        client.propertyId = data.propertyId
        client.role = data.role
        socket.emit('authenticated', { success: true, clientId: socket.id })
      })

      // Subscribe to channels
      socket.on('subscribe', (channel: string) => {
        client.subscribedChannels.add(channel)
        socket.join(channel)
        socket.emit('subscribed', { channel })
        console.log(`Client ${socket.id} subscribed to ${channel}`)
      })

      // Unsubscribe from channels
      socket.on('unsubscribe', (channel: string) => {
        client.subscribedChannels.delete(channel)
        socket.leave(channel)
        socket.emit('unsubscribed', { channel })
      })

      // Request current status
      socket.on('request_status', async () => {
        const status = await this.getCurrentStatus()
        socket.emit('status_update', status)
      })

      // Request property data
      socket.on('request_property_data', async (propertyId: string) => {
        const data = await this.getPropertyData(propertyId)
        socket.emit('property_data', data)
      })

      // Request AI predictions
      socket.on('request_predictions', async (propertyId: string) => {
        const predictions = await this.getLatestPredictions(propertyId)
        socket.emit('predictions_update', predictions)
      })

      // Request agent status
      socket.on('request_agent_status', () => {
        const agentStatus = agenticAI.getStatus()
        const recentActions = agenticAI.getRecentActions(20)
        socket.emit('agent_status', { status: agentStatus, recentActions })
      })

      // Disconnect
      socket.on('disconnect', () => {
        this.clients.delete(socket.id)
        console.log(`Client disconnected: ${socket.id}`)
      })
    })
  }

  /**
   * Start broadcasting updates
   */
  private startBroadcasting(): void {
    // Broadcast updates every 5 seconds
    this.broadcastInterval = setInterval(async () => {
      await this.broadcastUpdates()
    }, 5000)
  }

  /**
   * Broadcast updates to all connected clients
   */
  private async broadcastUpdates(): Promise<void> {
    if (!this.io || !this.db) return

    try {
      // Broadcast IoT updates
      await this.broadcastIoTUpdates()

      // Broadcast AI predictions
      await this.broadcastPredictions()

      // Broadcast agent status
      await this.broadcastAgentStatus()

      // Broadcast payment updates
      await this.broadcastPaymentUpdates()

    } catch (error) {
      console.error('Error broadcasting updates:', error)
    }
  }

  /**
   * Broadcast IoT reading updates
   */
  private async broadcastIoTUpdates(): Promise<void> {
    if (!this.db || !this.io) return

    // Get recent IoT readings (last 30 seconds)
    const recentReadings = await this.db.collection('iot_readings')
      .find({
        timestamp: { $gte: new Date(Date.now() - 30000) }
      })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray()

    if (recentReadings.length === 0) return

    // Group by property
    const propertyReadings = new Map<string, any[]>()
    for (const reading of recentReadings) {
      if (!propertyReadings.has(reading.propertyId)) {
        propertyReadings.set(reading.propertyId, [])
      }
      propertyReadings.get(reading.propertyId)!.push(reading)
    }

    // Broadcast to property-specific channels
    for (const [propertyId, readings] of propertyReadings.entries()) {
      this.io.to(`property:${propertyId}`).emit('iot_update', {
        propertyId,
        readings,
        timestamp: new Date()
      })
    }

    // Broadcast summary to global channel
    this.io.to('global').emit('iot_summary', {
      totalReadings: recentReadings.length,
      properties: propertyReadings.size,
      timestamp: new Date()
    })
  }

  /**
   * Broadcast AI prediction updates
   */
  private async broadcastPredictions(): Promise<void> {
    if (!this.db || !this.io) return

    // Get recent readings for prediction
    const recentReadings = await this.db.collection('iot_readings')
      .find({
        timestamp: { $gte: new Date(Date.now() - 60000) }
      })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray() as any[]

    if (recentReadings.length === 0) return

    // Run predictions
    const predictions = await mlPredictionService.batchPredict(recentReadings)

    // Group by property
    const propertyPredictions = new Map<string, any[]>()
    for (const prediction of predictions) {
      if (!propertyPredictions.has(prediction.propertyId)) {
        propertyPredictions.set(prediction.propertyId, [])
      }
      propertyPredictions.get(prediction.propertyId)!.push(prediction)
    }

    // Broadcast to property-specific channels
    for (const [propertyId, preds] of propertyPredictions.entries()) {
      this.io.to(`property:${propertyId}`).emit('predictions_update', {
        propertyId,
        predictions: preds,
        timestamp: new Date()
      })
    }

    // Broadcast high-risk alerts to global channel
    const highRiskPredictions = predictions.filter(p => p.leakProbability > 0.7)
    if (highRiskPredictions.length > 0) {
      this.io.to('global').emit('high_risk_alert', {
        predictions: highRiskPredictions,
        timestamp: new Date()
      })
    }
  }

  /**
   * Broadcast agent status updates
   */
  private async broadcastAgentStatus(): Promise<void> {
    if (!this.io) return

    const agentStatus = agenticAI.getStatus()
    const recentActions = agenticAI.getRecentActions(10)

    // Broadcast to global channel
    this.io.to('global').emit('agent_status', {
      status: agentStatus,
      recentActions,
      timestamp: new Date()
    })

    // Broadcast recent actions to affected properties
    for (const action of recentActions) {
      if (action.propertyId) {
        this.io.to(`property:${action.propertyId}`).emit('agent_action', {
          action,
          timestamp: new Date()
        })
      }
    }
  }

  /**
   * Broadcast payment updates
   */
  private async broadcastPaymentUpdates(): Promise<void> {
    if (!this.db || !this.io) return

    // Get recent blockchain proofs
    const recentProofs = await this.db.collection('blockchain_proofs')
      .find({
        timestamp: { $gte: new Date(Date.now() - 60000) }
      })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray()

    if (recentProofs.length === 0) return

    // Group by property
    const propertyProofs = new Map<string, any[]>()
    for (const proof of recentProofs) {
      if (!propertyProofs.has(proof.propertyId)) {
        propertyProofs.set(proof.propertyId, [])
      }
      propertyProofs.get(proof.propertyId)!.push(proof)
    }

    // Broadcast to property-specific channels
    for (const [propertyId, proofs] of propertyProofs.entries()) {
      this.io.to(`property:${propertyId}`).emit('payment_update', {
        propertyId,
        proofs,
        timestamp: new Date()
      })
    }
  }

  /**
   * Get current system status
   */
  private async getCurrentStatus(): Promise<any> {
    if (!this.db) return {}

    const [iotCount, jobCount, alertCount] = await Promise.all([
      this.db.collection('iot_readings').countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      this.db.collection('jobs').countDocuments({ status: 'open' }),
      this.db.collection('alerts').countDocuments({ resolved: false })
    ])

    const modelStatus = mlPredictionService.getModelStatus()
    const agentStatus = agenticAI.getStatus()

    return {
      iot: { readings24h: iotCount },
      jobs: { open: jobCount },
      alerts: { unresolved: alertCount },
      ml: modelStatus,
      agent: agentStatus,
      timestamp: new Date()
    }
  }

  /**
   * Get property-specific data
   */
  private async getPropertyData(propertyId: string): Promise<any> {
    if (!this.db) return {}

    const [recentReadings, openJobs, activeAlerts, recentProofs] = await Promise.all([
      this.db.collection('iot_readings')
        .find({ propertyId })
        .sort({ timestamp: -1 })
        .limit(20)
        .toArray(),
      this.db.collection('jobs')
        .find({ propertyId, status: 'open' })
        .toArray(),
      this.db.collection('alerts')
        .find({ propertyId, resolved: false })
        .toArray(),
      this.db.collection('blockchain_proofs')
        .find({ propertyId })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray()
    ])

    return {
      propertyId,
      iot: recentReadings,
      jobs: openJobs,
      alerts: activeAlerts,
      payments: recentProofs,
      timestamp: new Date()
    }
  }

  /**
   * Get latest predictions for property
   */
  private async getLatestPredictions(propertyId: string): Promise<any[]> {
    if (!this.db) return []

    const recentReadings = await this.db.collection('iot_readings')
      .find({ propertyId })
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray() as any[]

    if (recentReadings.length === 0) return []

    return await mlPredictionService.batchPredict(recentReadings)
  }

  /**
   * Send immediate alert to specific property
   */
  sendPropertyAlert(propertyId: string, alert: any): void {
    if (!this.io) return

    this.io.to(`property:${propertyId}`).emit('immediate_alert', {
      propertyId,
      alert,
      timestamp: new Date()
    })
  }

  /**
   * Send global announcement
   */
  sendGlobalAnnouncement(message: string, data?: any): void {
    if (!this.io) return

    this.io.to('global').emit('announcement', {
      message,
      data,
      timestamp: new Date()
    })
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size
  }

  /**
   * Shutdown service
   */
  shutdown(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval)
    }

    if (this.io) {
      this.io.close()
    }

    console.log('Real-time service shutdown')
  }
}

// Singleton instance
export const realtimeService = new RealtimeService()
