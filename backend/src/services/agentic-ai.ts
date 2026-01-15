/**
 * Agentic AI Service
 * Autonomous agent system for real-time monitoring, decision-making, and automated actions
 */

import { mlPredictionService } from './ml-prediction.js'
import type { Db } from 'mongodb'

interface AgentConfig {
  enabled: boolean
  autoResponse: boolean
  notificationThreshold: number
  actionThreshold: number
  paymentMonitoring: boolean
  leakPrevention: boolean
  predictiveMaintenance: boolean
}

interface AgentAction {
  id: string
  timestamp: Date
  type: 'alert' | 'notification' | 'maintenance_schedule' | 'emergency_response' | 'payment_flag'
  priority: 'low' | 'medium' | 'high' | 'critical'
  propertyId: string
  deviceId?: string
  reason: string
  data: any
  status: 'pending' | 'executed' | 'failed'
  result?: any
}

interface MonitoringState {
  activeAlerts: Map<string, any>
  scheduledActions: AgentAction[]
  lastCheck: Map<string, Date>
  paymentIssues: Map<string, any>
}

export class AgenticAIService {
  private config: AgentConfig
  private state: MonitoringState
  private db: Db | null = null
  private monitoringInterval: NodeJS.Timeout | null = null
  private actionCallbacks: Map<string, Function> = new Map()

  constructor() {
    this.config = {
      enabled: true,
      autoResponse: true,
      notificationThreshold: 0.5,
      actionThreshold: 0.7,
      paymentMonitoring: true,
      leakPrevention: true,
      predictiveMaintenance: true
    }

    this.state = {
      activeAlerts: new Map(),
      scheduledActions: [],
      lastCheck: new Map(),
      paymentIssues: new Map()
    }
  }

  /**
   * Initialize the agent with database connection
   */
  initialize(db: Db): void {
    this.db = db
    console.log('✓ Agentic AI Service initialized')
  }

  /**
   * Start autonomous monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      console.log('Monitoring already active')
      return
    }

    console.log(`🤖 Starting agentic AI monitoring (interval: ${intervalMs}ms)`)
    
    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoringCycle()
    }, intervalMs)

    // Perform initial check
    this.performMonitoringCycle()
  }

  /**
   * Stop autonomous monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      console.log('🤖 Agentic AI monitoring stopped')
    }
  }

  /**
   * Main monitoring cycle - autonomous decision making
   */
  private async performMonitoringCycle(): Promise<void> {
    if (!this.db || !this.config.enabled) return

    try {
      const now = new Date()
      
      // 1. Monitor IoT data for leak prevention
      if (this.config.leakPrevention) {
        await this.monitorIoTData(now)
      }

      // 2. Monitor payments
      if (this.config.paymentMonitoring) {
        await this.monitorPayments(now)
      }

      // 3. Predictive maintenance scheduling
      if (this.config.predictiveMaintenance) {
        await this.schedulePredictiveMaintenance(now)
      }

      // 4. Execute pending actions
      await this.executePendingActions()

    } catch (error) {
      console.error('Error in monitoring cycle:', error)
    }
  }

  /**
   * Monitor IoT data in real-time and make decisions
   */
  private async monitorIoTData(now: Date): Promise<void> {
    const iotReadings = this.db!.collection('iot_readings')
    
    // Get recent readings (last 5 minutes)
    const recentReadings = await iotReadings
      .find({
        timestamp: { $gte: new Date(now.getTime() - 5 * 60 * 1000) }
      })
      .sort({ timestamp: -1 })
      .toArray()

    if (recentReadings.length === 0) return

    // Group by device
    const deviceMap = new Map<string, any[]>()
    for (const reading of recentReadings) {
      const key = `${reading.propertyId}-${reading.deviceId}`
      if (!deviceMap.has(key)) {
        deviceMap.set(key, [])
      }
      deviceMap.get(key)!.push(reading)
    }

    // Analyze each device
    for (const [deviceKey, readings] of deviceMap.entries()) {
      const latest = readings[0]
      const historical = readings.slice(1)

      // Run ML prediction
      const prediction = await mlPredictionService.predictLeakProbability(latest, historical)

      // Agent decision making
      await this.makeLeakPreventionDecision(prediction, latest)
    }
  }

  /**
   * Make autonomous decisions based on leak predictions
   */
  private async makeLeakPreventionDecision(prediction: any, reading: any): Promise<void> {
    const deviceKey = `${prediction.propertyId}-${prediction.deviceId}`

    // Check if already alerted
    if (this.state.activeAlerts.has(deviceKey)) {
      const existingAlert = this.state.activeAlerts.get(deviceKey)
      // Update if severity increased
      if (prediction.leakProbability > existingAlert.leakProbability) {
        await this.escalateAlert(deviceKey, prediction, reading)
      }
      return
    }

    // Critical - immediate action
    if (prediction.leakProbability > 0.9) {
      await this.createAction({
        type: 'emergency_response',
        priority: 'critical',
        propertyId: prediction.propertyId,
        deviceId: prediction.deviceId,
        reason: `CRITICAL LEAK DETECTED: ${prediction.recommendation}`,
        data: { prediction, reading }
      })
      this.state.activeAlerts.set(deviceKey, prediction)
    }
    // High risk - urgent action
    else if (prediction.leakProbability > this.config.actionThreshold) {
      await this.createAction({
        type: 'maintenance_schedule',
        priority: 'high',
        propertyId: prediction.propertyId,
        deviceId: prediction.deviceId,
        reason: `High leak risk detected: ${prediction.recommendation}`,
        data: { prediction, reading, urgency: 'urgent' }
      })
      this.state.activeAlerts.set(deviceKey, prediction)
    }
    // Moderate risk - notification
    else if (prediction.leakProbability > this.config.notificationThreshold) {
      await this.createAction({
        type: 'notification',
        priority: 'medium',
        propertyId: prediction.propertyId,
        deviceId: prediction.deviceId,
        reason: `Anomaly detected: ${prediction.recommendation}`,
        data: { prediction, reading }
      })
    }
  }

  /**
   * Escalate existing alert
   */
  private async escalateAlert(deviceKey: string, prediction: any, reading: any): Promise<void> {
    console.log(`⚠️ Escalating alert for ${deviceKey}`)
    
    await this.createAction({
      type: 'emergency_response',
      priority: 'critical',
      propertyId: prediction.propertyId,
      deviceId: prediction.deviceId,
      reason: `ESCALATED: Leak situation worsening - ${prediction.recommendation}`,
      data: { prediction, reading, escalated: true }
    })

    this.state.activeAlerts.set(deviceKey, prediction)
  }

  /**
   * Monitor payment transactions
   */
  private async monitorPayments(now: Date): Promise<void> {
    // Get recent blockchain transactions
    const proofs = this.db!.collection('blockchain_proofs')
    
    const recentPayments = await proofs
      .find({
        type: 'job',
        timestamp: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      })
      .toArray()

    for (const payment of recentPayments) {
      // Check for payment anomalies
      const anomaly = this.detectPaymentAnomaly(payment)
      
      if (anomaly.suspicious) {
        await this.createAction({
          type: 'payment_flag',
          priority: anomaly.severity as any,
          propertyId: payment.propertyId,
          reason: `Payment anomaly detected: ${anomaly.reason}`,
          data: { payment, anomaly }
        })
      }
    }
  }

  /**
   * Detect payment anomalies
   */
  private detectPaymentAnomaly(payment: any): { suspicious: boolean; reason: string; severity: string } {
    // Check for unusual amounts
    if (payment.amount && payment.amount > 10000) {
      return {
        suspicious: true,
        reason: 'Unusually high payment amount',
        severity: 'high'
      }
    }

    // Check for duplicate transactions
    const recentTransactions = Array.from(this.state.lastCheck.entries())
      .filter(([key]) => key.startsWith('payment:'))
    
    // Add more sophisticated payment monitoring logic here
    
    return { suspicious: false, reason: '', severity: 'low' }
  }

  /**
   * Schedule predictive maintenance
   */
  private async schedulePredictiveMaintenance(now: Date): Promise<void> {
    const iotReadings = this.db!.collection('iot_readings')
    
    // Get all devices
    const devices = await iotReadings.distinct('deviceId')
    
    for (const deviceId of devices) {
      const deviceKey = `maintenance:${deviceId}`
      const lastCheck = this.state.lastCheck.get(deviceKey)
      
      // Check if maintenance is due (every 30 days)
      if (!lastCheck || now.getTime() - lastCheck.getTime() > 30 * 24 * 60 * 60 * 1000) {
        // Get device history
        const history = await iotReadings
          .find({ deviceId })
          .sort({ timestamp: -1 })
          .limit(100)
          .toArray() as any[]

        if (history.length > 0) {
          const predictions = await mlPredictionService.batchPredict(history)
          const avgRisk = predictions.reduce((sum, p) => sum + p.leakProbability, 0) / predictions.length

          if (avgRisk > 0.3) {
            await this.createAction({
              type: 'maintenance_schedule',
              priority: avgRisk > 0.6 ? 'high' : 'medium',
              propertyId: history[0].propertyId,
              deviceId,
              reason: `Predictive maintenance recommended (risk score: ${(avgRisk * 100).toFixed(1)}%)`,
              data: { avgRisk, predictions: predictions[0] }
            })
          }
        }

        this.state.lastCheck.set(deviceKey, now)
      }
    }
  }

  /**
   * Create an agent action
   */
  private async createAction(actionData: Omit<AgentAction, 'id' | 'timestamp' | 'status'>): Promise<AgentAction> {
    const action: AgentAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'pending',
      ...actionData
    }

    this.state.scheduledActions.push(action)

    // Store in database
    if (this.db) {
      await this.db.collection('agent_actions').insertOne(action)
    }

    console.log(`🤖 Agent action created: [${action.priority}] ${action.type} - ${action.reason}`)

    return action
  }

  /**
   * Execute pending actions
   */
  private async executePendingActions(): Promise<void> {
    const pendingActions = this.state.scheduledActions.filter(a => a.status === 'pending')

    for (const action of pendingActions) {
      try {
        await this.executeAction(action)
        action.status = 'executed'
        
        // Update in database
        if (this.db) {
          await this.db.collection('agent_actions').updateOne(
            { id: action.id },
            { $set: { status: 'executed', result: action.result } }
          )
        }
      } catch (error) {
        console.error(`Failed to execute action ${action.id}:`, error)
        action.status = 'failed'
        action.result = { error: String(error) }
      }
    }

    // Clean up old executed actions
    this.state.scheduledActions = this.state.scheduledActions.filter(
      a => a.status === 'pending' || 
      (a.status === 'executed' && Date.now() - a.timestamp.getTime() < 60 * 60 * 1000)
    )
  }

  /**
   * Execute a specific action
   */
  private async executeAction(action: AgentAction): Promise<void> {
    console.log(`🤖 Executing action: ${action.type} [${action.priority}]`)

    switch (action.type) {
      case 'emergency_response':
        await this.handleEmergencyResponse(action)
        break
      case 'maintenance_schedule':
        await this.handleMaintenanceSchedule(action)
        break
      case 'notification':
        await this.handleNotification(action)
        break
      case 'payment_flag':
        await this.handlePaymentFlag(action)
        break
      case 'alert':
        await this.handleAlert(action)
        break
    }

    // Call registered callbacks
    const callback = this.actionCallbacks.get(action.type)
    if (callback) {
      await callback(action)
    }
  }

  /**
   * Handle emergency response
   */
  private async handleEmergencyResponse(action: AgentAction): Promise<void> {
    // Create urgent job
    if (this.db) {
      const job = {
        propertyId: action.propertyId,
        deviceId: action.deviceId,
        type: 'emergency_leak_response',
        priority: 'critical',
        status: 'open',
        description: action.reason,
        createdAt: new Date(),
        createdBy: 'agent',
        aiGenerated: true,
        predictionData: action.data
      }

      const result = await this.db.collection('jobs').insertOne(job)
      action.result = { jobCreated: true, jobId: result.insertedId }

      // Create critical alert
      await this.db.collection('alerts').insertOne({
        propertyId: action.propertyId,
        deviceId: action.deviceId,
        type: 'critical_leak',
        message: action.reason,
        severity: 'critical',
        timestamp: new Date(),
        resolved: false,
        aiGenerated: true
      })
    }
  }

  /**
   * Handle maintenance scheduling
   */
  private async handleMaintenanceSchedule(action: AgentAction): Promise<void> {
    if (this.db) {
      const maintenance = {
        propertyId: action.propertyId,
        deviceId: action.deviceId,
        type: 'predictive_maintenance',
        priority: action.priority,
        scheduledFor: action.data.prediction?.predictedFailureTime || new Date(Date.now() + 48 * 60 * 60 * 1000),
        reason: action.reason,
        status: 'scheduled',
        createdAt: new Date(),
        aiGenerated: true,
        predictionData: action.data
      }

      const result = await this.db.collection('maintenance_schedule').insertOne(maintenance)
      action.result = { maintenanceScheduled: true, maintenanceId: result.insertedId }
    }
  }

  /**
   * Handle notification
   */
  private async handleNotification(action: AgentAction): Promise<void> {
    if (this.db) {
      await this.db.collection('notifications').insertOne({
        propertyId: action.propertyId,
        deviceId: action.deviceId,
        type: 'ai_alert',
        message: action.reason,
        priority: action.priority,
        timestamp: new Date(),
        read: false,
        aiGenerated: true,
        data: action.data
      })
      action.result = { notificationSent: true }
    }
  }

  /**
   * Handle payment flag
   */
  private async handlePaymentFlag(action: AgentAction): Promise<void> {
    if (this.db) {
      await this.db.collection('payment_flags').insertOne({
        propertyId: action.propertyId,
        reason: action.reason,
        severity: action.priority,
        timestamp: new Date(),
        resolved: false,
        aiGenerated: true,
        paymentData: action.data
      })
      action.result = { paymentFlagged: true }
    }
  }

  /**
   * Handle general alert
   */
  private async handleAlert(action: AgentAction): Promise<void> {
    if (this.db) {
      await this.db.collection('alerts').insertOne({
        propertyId: action.propertyId,
        deviceId: action.deviceId,
        type: 'ai_alert',
        message: action.reason,
        severity: action.priority,
        timestamp: new Date(),
        resolved: false,
        aiGenerated: true
      })
      action.result = { alertCreated: true }
    }
  }

  /**
   * Register callback for action type
   */
  onAction(actionType: string, callback: Function): void {
    this.actionCallbacks.set(actionType, callback)
  }

  /**
   * Update agent configuration
   */
  updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('🤖 Agent configuration updated:', this.config)
  }

  /**
   * Get agent status
   */
  getStatus(): {
    enabled: boolean
    monitoring: boolean
    config: AgentConfig
    activeAlerts: number
    pendingActions: number
    executedActions: number
  } {
    return {
      enabled: this.config.enabled,
      monitoring: this.monitoringInterval !== null,
      config: this.config,
      activeAlerts: this.state.activeAlerts.size,
      pendingActions: this.state.scheduledActions.filter(a => a.status === 'pending').length,
      executedActions: this.state.scheduledActions.filter(a => a.status === 'executed').length
    }
  }

  /**
   * Get recent actions
   */
  getRecentActions(limit: number = 50): AgentAction[] {
    return this.state.scheduledActions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Clear resolved alerts
   */
  clearResolvedAlerts(): void {
    const toRemove: string[] = []
    for (const [key, alert] of this.state.activeAlerts.entries()) {
      if (alert.leakProbability < 0.3) {
        toRemove.push(key)
      }
    }
    toRemove.forEach(key => this.state.activeAlerts.delete(key))
  }
}

// Singleton instance
export const agenticAI = new AgenticAIService()
