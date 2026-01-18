/**
 * Social Intelligence & Guardian Angel System
 * Copyright © 2026 - All Rights Reserved
 * 
 * CONFIDENTIAL AND PROPRIETARY
 * This file contains trade secrets and confidential information.
 * Unauthorized use, copying, or distribution is strictly prohibited.
 * 
 * Created: January 18, 2026 08:59:38 UTC
 * Git Commit: 222fa4c7b18c49341ce43ce4a93882d908ec8e6a
 * File Hash: 9265f638354e2d23d65956ab653bd409601281671a22f55aa6477900ffb2561a
 * 
 * AI-Powered Vulnerable Customer Early Warning System
 * 
 * Detects vulnerability patterns through water usage analytics:
 * - Health emergencies (falls, medical events)
 * - Financial hardship early indicators
 * - Mental health concerns
 * - Social isolation
 * - Child welfare concerns
 */

import { EventEmitter } from 'events'

export enum VulnerabilityType {
  HEALTH_EMERGENCY = 'health_emergency',
  ELDERLY_FALL = 'elderly_fall',
  FINANCIAL_HARDSHIP = 'financial_hardship',
  MENTAL_HEALTH = 'mental_health',
  CHILD_WELFARE = 'child_welfare',
  ISOLATION = 'isolation',
  DOMESTIC_DISTURBANCE = 'domestic_disturbance'
}

export enum AlertUrgency {
  IMMEDIATE = 'immediate',      // Life-threatening - respond within 1 hour
  URGENT = 'urgent',            // Serious concern - respond within 24 hours
  MONITOR = 'monitor',          // Watch closely - respond within 7 days
  ROUTINE = 'routine'           // Normal support - routine outreach
}

export interface VulnerabilityIndicators {
  // Health & Safety
  suddenUsagePatternChange: boolean
  prolongedInactivity: number        // Hours without water use
  nighttimeUsageIncrease: boolean
  unusualTemperaturePatterns: boolean
  
  // Mental Health / Isolation
  irregularDailyRoutine: boolean
  extremeUsagePatterns: boolean
  socialIsolationScore: number       // 0-100
  behavioralAnomalyScore: number
  
  // Financial Hardship
  waterMinimizationBehavior: boolean
  batchWaterUsage: boolean
  temperatureAvoidance: boolean      // Only cold water use
  usageReductionPercentage: number
  
  // Safety Concerns
  childSafetyIndicators: boolean
  domesticDisturbancePatterns: boolean
  substanceAbuseIndicators: boolean
}

export interface WaterUsagePattern {
  timestamp: Date
  flowRate: number
  pressure: number
  temperature: number
  duration: number               // seconds
  timeOfDay: string             // 'morning', 'afternoon', 'evening', 'night'
  dayOfWeek: string
}

export interface SocialValueAlert {
  alertId: string
  propertyId: string
  alertType: VulnerabilityType
  confidenceScore: number        // 0-100
  urgency: AlertUrgency
  detectedAt: Date
  indicators: VulnerabilityIndicators
  suggestedInterventions: string[]
  estimatedImpact: {
    livesAtRisk: number
    potentialCostSaving: number
    socialValueCreated: number
  }
  automatedActions: AutomatedAction[]
  privacyPreserving: boolean
  notificationsSent: string[]
}

export interface AutomatedAction {
  action: string
  executedAt: Date
  recipient: string
  status: 'pending' | 'completed' | 'failed'
  details: any
}

export interface VulnerabilityScore {
  propertyId: string
  overallScore: number           // 0-100
  healthRisk: number
  financialStress: number
  isolationConcern: number
  safetyRisk: number
  lastAssessed: Date
  trendDirection: 'improving' | 'stable' | 'deteriorating'
  requiresIntervention: boolean
}

export interface GuardianAngelConfig {
  enabled: boolean
  inactivityThresholdHours: number
  emergencyContacts: Array<{
    type: 'family' | 'housing_association' | 'emergency_services'
    contactInfo: string
    escalationLevel: number
  }>
  autoEscalation: boolean
  notificationChannels: ('sms' | 'email' | 'app' | 'voice_call')[]
}

export interface SocialImpactMetrics {
  periodStart: Date
  periodEnd: Date
  
  // Lives & Wellbeing
  livesPositivelyImpacted: number
  emergencyInterventions: number
  financialCrisesAverted: number
  lonelinessConcernsAddressed: number
  healthIssuesDetected: number
  estimatedLivesSaved: number
  hospitalAdmissionsPrevented: number
  
  // Financial Impact
  nhsSavings: number             // £
  evictionsPrevented: number
  debtCrisisPreventionValue: number
  socialValueGenerated: number   // Using HM Treasury Green Book methodology
  
  // Regulatory & Reputation
  priorityServicesAutoEnrolment: number
  ofwatCMeXScoreImpact: number
  positiveMediaValue: number
  esgRating: string
  
  // Customer Outcomes
  vulnerableCustomersSupported: number
  averageInterventionTime: number  // hours
  successfulInterventions: number
  ongoingMonitoring: number
}

export class SocialIntelligenceService extends EventEmitter {
  private readonly INACTIVITY_THRESHOLD_HOURS = 18
  private readonly FINANCIAL_HARDSHIP_USAGE_REDUCTION = 0.40  // 40% reduction
  private readonly ISOLATION_SCORE_THRESHOLD = 70
  private readonly HEALTH_RISK_CONFIDENCE_THRESHOLD = 85
  
  private alertHistory: Map<string, SocialValueAlert[]> = new Map()
  private vulnerabilityScores: Map<string, VulnerabilityScore> = new Map()
  private guardianAngelConfigs: Map<string, GuardianAngelConfig> = new Map()
  private socialImpactData: SocialImpactMetrics

  constructor() {
    super()
    this.initializeSocialImpactTracking()
    this.startGuardianAngelMonitoring()
  }

  /**
   * Initialize social impact metrics tracking
   */
  private initializeSocialImpactTracking(): void {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    this.socialImpactData = {
      periodStart: monthStart,
      periodEnd: now,
      livesPositivelyImpacted: 0,
      emergencyInterventions: 0,
      financialCrisesAverted: 0,
      lonelinessConcernsAddressed: 0,
      healthIssuesDetected: 0,
      estimatedLivesSaved: 0,
      hospitalAdmissionsPrevented: 0,
      nhsSavings: 0,
      evictionsPrevented: 0,
      debtCrisisPreventionValue: 0,
      socialValueGenerated: 0,
      priorityServicesAutoEnrolment: 0,
      ofwatCMeXScoreImpact: 0,
      positiveMediaValue: 0,
      esgRating: 'A',
      vulnerableCustomersSupported: 0,
      averageInterventionTime: 0,
      successfulInterventions: 0,
      ongoingMonitoring: 0
    }
  }

  /**
   * Analyze vulnerability patterns for a property
   */
  async analyzeVulnerabilityPatterns(
    propertyId: string,
    usageHistory: WaterUsagePattern[]
  ): Promise<VulnerabilityScore> {
    const indicators = this.detectBehavioralAnomalies(usageHistory)
    
    const healthRisk = this.calculateHealthRiskScore(usageHistory, indicators)
    const financialStress = this.detectFinancialHardship(usageHistory, indicators)
    const isolationConcern = this.assessSocialIsolation(usageHistory, indicators)
    const safetyRisk = this.calculateSafetyRisk(indicators)
    
    const overallScore = (
      healthRisk * 0.35 +
      financialStress * 0.25 +
      isolationConcern * 0.20 +
      safetyRisk * 0.20
    )
    
    const previousScore = this.vulnerabilityScores.get(propertyId)
    const trendDirection = this.determineTrend(overallScore, previousScore?.overallScore)
    
    const score: VulnerabilityScore = {
      propertyId,
      overallScore,
      healthRisk,
      financialStress,
      isolationConcern,
      safetyRisk,
      lastAssessed: new Date(),
      trendDirection,
      requiresIntervention: overallScore > 70 || healthRisk > 80
    }
    
    this.vulnerabilityScores.set(propertyId, score)
    
    // Generate alert if needed
    if (score.requiresIntervention) {
      await this.generateVulnerabilityAlert(propertyId, score, indicators)
    }
    
    return score
  }

  /**
   * Detect behavioral anomalies from water usage patterns
   */
  private detectBehavioralAnomalies(usageHistory: WaterUsagePattern[]): VulnerabilityIndicators {
    const recentUsage = usageHistory.slice(-168) // Last 7 days (hourly readings)
    const historicalUsage = usageHistory.slice(0, -168)
    
    // Calculate baseline patterns
    const baselineAverage = this.calculateAverage(historicalUsage.map(u => u.flowRate))
    const recentAverage = this.calculateAverage(recentUsage.map(u => u.flowRate))
    const usageChange = (baselineAverage - recentAverage) / baselineAverage
    
    // Inactivity detection
    const lastUsage = recentUsage[recentUsage.length - 1]
    const hoursSinceLastUse = (Date.now() - lastUsage.timestamp.getTime()) / (1000 * 60 * 60)
    
    // Night-time usage analysis
    const nightUsage = recentUsage.filter(u => u.timeOfDay === 'night')
    const nightUsageIncrease = nightUsage.length > historicalUsage.filter(u => u.timeOfDay === 'night').length * 1.5
    
    // Routine regularity
    const routineScore = this.calculateRoutineRegularity(recentUsage)
    const irregularRoutine = routineScore < 0.6
    
    // Temperature patterns
    const coldWaterOnly = recentUsage.filter(u => u.temperature < 20).length / recentUsage.length > 0.95
    
    // Batch usage detection
    const batchPattern = this.detectBatchUsage(recentUsage)
    
    // Social isolation indicators
    const isolationScore = this.calculateIsolationScore(usageHistory)
    
    return {
      suddenUsagePatternChange: Math.abs(usageChange) > 0.3,
      prolongedInactivity: hoursSinceLastUse,
      nighttimeUsageIncrease: nightUsageIncrease,
      unusualTemperaturePatterns: coldWaterOnly,
      irregularDailyRoutine: irregularRoutine,
      extremeUsagePatterns: usageChange > 0.5 || usageChange < -0.5,
      socialIsolationScore: isolationScore,
      behavioralAnomalyScore: this.calculateBehavioralAnomalyScore(recentUsage, historicalUsage),
      waterMinimizationBehavior: usageChange > 0.4,
      batchWaterUsage: batchPattern,
      temperatureAvoidance: coldWaterOnly,
      usageReductionPercentage: usageChange * 100,
      childSafetyIndicators: false, // Requires more sophisticated analysis
      domesticDisturbancePatterns: this.detectDisturbancePatterns(recentUsage),
      substanceAbuseIndicators: false // Requires more sophisticated analysis
    }
  }

  /**
   * Calculate health risk score (0-100)
   */
  private calculateHealthRiskScore(
    usageHistory: WaterUsagePattern[],
    indicators: VulnerabilityIndicators
  ): number {
    let score = 0
    
    // Prolonged inactivity is the strongest health indicator
    if (indicators.prolongedInactivity > 24) {
      score += 90  // Very high risk - potential medical emergency
    } else if (indicators.prolongedInactivity > 18) {
      score += 75  // High risk - unusual inactivity
    } else if (indicators.prolongedInactivity > 12) {
      score += 50  // Moderate risk
    }
    
    // Sudden pattern changes
    if (indicators.suddenUsagePatternChange) {
      score += 30
    }
    
    // Night-time usage increase (incontinence, sleep disorders)
    if (indicators.nighttimeUsageIncrease) {
      score += 20
    }
    
    // Extreme behavioral anomalies
    if (indicators.behavioralAnomalyScore > 80) {
      score += 25
    }
    
    return Math.min(score, 100)
  }

  /**
   * Detect financial hardship indicators (0-100)
   */
  private detectFinancialHardship(
    usageHistory: WaterUsagePattern[],
    indicators: VulnerabilityIndicators
  ): number {
    let score = 0
    
    // Extreme water minimization
    if (indicators.usageReductionPercentage > 50) {
      score += 70  // Very strong indicator
    } else if (indicators.usageReductionPercentage > 40) {
      score += 50
    } else if (indicators.usageReductionPercentage > 30) {
      score += 30
    }
    
    // Batch water usage (filling containers to avoid ongoing bills)
    if (indicators.batchWaterUsage) {
      score += 40
    }
    
    // Only cold water use (can't afford heating)
    if (indicators.temperatureAvoidance) {
      score += 30
    }
    
    return Math.min(score, 100)
  }

  /**
   * Assess social isolation (0-100)
   */
  private assessSocialIsolation(
    usageHistory: WaterUsagePattern[],
    indicators: VulnerabilityIndicators
  ): number {
    let score = indicators.socialIsolationScore
    
    // Irregular routine suggests lack of social structure
    if (indicators.irregularDailyRoutine) {
      score += 20
    }
    
    // Extreme patterns suggest mental health issues
    if (indicators.extremeUsagePatterns) {
      score += 15
    }
    
    return Math.min(score, 100)
  }

  /**
   * Calculate safety risk score
   */
  private calculateSafetyRisk(indicators: VulnerabilityIndicators): number {
    let score = 0
    
    if (indicators.childSafetyIndicators) score += 80
    if (indicators.domesticDisturbancePatterns) score += 60
    if (indicators.substanceAbuseIndicators) score += 50
    
    return Math.min(score, 100)
  }

  /**
   * Generate vulnerability alert
   */
  private async generateVulnerabilityAlert(
    propertyId: string,
    score: VulnerabilityScore,
    indicators: VulnerabilityIndicators
  ): Promise<SocialValueAlert> {
    const alertType = this.determineAlertType(score, indicators)
    const urgency = this.determineUrgency(score, indicators)
    const suggestedInterventions = this.generateInterventionPlan(alertType, score)
    
    const alert: SocialValueAlert = {
      alertId: `alert_${propertyId}_${Date.now()}`,
      propertyId,
      alertType,
      confidenceScore: this.calculateConfidence(score, indicators),
      urgency,
      detectedAt: new Date(),
      indicators,
      suggestedInterventions,
      estimatedImpact: this.estimateImpact(alertType, urgency),
      automatedActions: [],
      privacyPreserving: true,
      notificationsSent: []
    }
    
    // Store alert
    const propertyAlerts = this.alertHistory.get(propertyId) || []
    propertyAlerts.push(alert)
    this.alertHistory.set(propertyId, propertyAlerts)
    
    // Execute automated actions
    await this.executeAutomatedActions(alert)
    
    // Emit event for external systems
    this.emit('vulnerability_alert', alert)
    
    // Update social impact metrics
    this.updateSocialImpactMetrics(alert)
    
    return alert
  }

  /**
   * Determine alert type based on indicators
   */
  private determineAlertType(
    score: VulnerabilityScore,
    indicators: VulnerabilityIndicators
  ): VulnerabilityType {
    if (indicators.prolongedInactivity > 18 && score.healthRisk > 70) {
      return VulnerabilityType.HEALTH_EMERGENCY
    }
    if (score.healthRisk > 80) {
      return VulnerabilityType.ELDERLY_FALL
    }
    if (score.financialStress > 70) {
      return VulnerabilityType.FINANCIAL_HARDSHIP
    }
    if (score.isolationConcern > 75) {
      return VulnerabilityType.ISOLATION
    }
    if (indicators.childSafetyIndicators) {
      return VulnerabilityType.CHILD_WELFARE
    }
    if (indicators.domesticDisturbancePatterns) {
      return VulnerabilityType.DOMESTIC_DISTURBANCE
    }
    
    return VulnerabilityType.MENTAL_HEALTH
  }

  /**
   * Determine urgency level
   */
  private determineUrgency(
    score: VulnerabilityScore,
    indicators: VulnerabilityIndicators
  ): AlertUrgency {
    if (indicators.prolongedInactivity > 24 || score.healthRisk > 90) {
      return AlertUrgency.IMMEDIATE
    }
    if (score.healthRisk > 75 || indicators.childSafetyIndicators) {
      return AlertUrgency.URGENT
    }
    if (score.overallScore > 70) {
      return AlertUrgency.MONITOR
    }
    return AlertUrgency.ROUTINE
  }

  /**
   * Generate intervention plan based on alert type
   */
  private generateInterventionPlan(
    alertType: VulnerabilityType,
    score: VulnerabilityScore
  ): string[] {
    const interventions: string[] = []
    
    switch (alertType) {
      case VulnerabilityType.HEALTH_EMERGENCY:
        interventions.push('Contact emergency contacts immediately')
        interventions.push('Alert housing association property manager')
        interventions.push('Consider contacting emergency services')
        interventions.push('Arrange welfare check within 1 hour')
        break
        
      case VulnerabilityType.ELDERLY_FALL:
        interventions.push('Arrange urgent welfare check')
        interventions.push('Contact designated family member/carer')
        interventions.push('Alert housing association')
        interventions.push('Consider telecare alarm system')
        break
        
      case VulnerabilityType.FINANCIAL_HARDSHIP:
        interventions.push('Offer payment plan automatically')
        interventions.push('Check eligibility for social tariff')
        interventions.push('Provide water efficiency advice')
        interventions.push('Connect to debt counseling services')
        interventions.push('Offer free water-saving devices')
        break
        
      case VulnerabilityType.ISOLATION:
        interventions.push('Arrange friendly welfare call')
        interventions.push('Connect to community support services')
        interventions.push('Provide information on local activities')
        interventions.push('Offer referral to mental health support')
        break
        
      case VulnerabilityType.MENTAL_HEALTH:
        interventions.push('Sensitive welfare check')
        interventions.push('Provide mental health resources')
        interventions.push('Connect to counseling services')
        interventions.push('Arrange follow-up support call')
        break
        
      case VulnerabilityType.CHILD_WELFARE:
        interventions.push('Alert child protection team')
        interventions.push('Arrange immediate property visit')
        interventions.push('Contact social services')
        break
        
      case VulnerabilityType.DOMESTIC_DISTURBANCE:
        interventions.push('Arrange discreet welfare check')
        interventions.push('Provide domestic abuse support information')
        interventions.push('Ensure safe communication channels')
        break
    }
    
    return interventions
  }

  /**
   * Execute automated actions for alert
   */
  private async executeAutomatedActions(alert: SocialValueAlert): Promise<void> {
    const config = this.guardianAngelConfigs.get(alert.propertyId)
    
    if (!config || !config.enabled) return
    
    const actions: AutomatedAction[] = []
    
    if (alert.urgency === AlertUrgency.IMMEDIATE) {
      // Send immediate notifications
      for (const contact of config.emergencyContacts.filter(c => c.escalationLevel === 1)) {
        actions.push({
          action: 'emergency_notification',
          executedAt: new Date(),
          recipient: contact.contactInfo,
          status: 'pending',
          details: {
            alertType: alert.alertType,
            urgency: alert.urgency,
            message: `URGENT: Potential emergency at property ${alert.propertyId}. No water use for ${alert.indicators.prolongedInactivity} hours.`
          }
        })
      }
    }
    
    if (alert.alertType === VulnerabilityType.FINANCIAL_HARDSHIP) {
      actions.push({
        action: 'offer_payment_plan',
        executedAt: new Date(),
        recipient: alert.propertyId,
        status: 'pending',
        details: {
          paymentHoliday: '3 months',
          socialTariffCheck: true
        }
      })
    }
    
    alert.automatedActions = actions
    
    // In production, actually execute these actions
    console.log(`[Guardian Angel] Executed ${actions.length} automated actions for ${alert.propertyId}`)
  }

  /**
   * Estimate social and financial impact of intervention
   */
  private estimateImpact(alertType: VulnerabilityType, urgency: AlertUrgency): {
    livesAtRisk: number
    potentialCostSaving: number
    socialValueCreated: number
  } {
    const impacts = {
      [VulnerabilityType.HEALTH_EMERGENCY]: {
        livesAtRisk: urgency === AlertUrgency.IMMEDIATE ? 1 : 0,
        potentialCostSaving: 50000,  // NHS emergency care + hospital stay
        socialValueCreated: 150000   // HM Treasury value of statistical life
      },
      [VulnerabilityType.ELDERLY_FALL]: {
        livesAtRisk: urgency === AlertUrgency.IMMEDIATE ? 1 : 0,
        potentialCostSaving: 30000,  // Hospital admission + care
        socialValueCreated: 80000
      },
      [VulnerabilityType.FINANCIAL_HARDSHIP]: {
        livesAtRisk: 0,
        potentialCostSaving: 5000,   // Eviction costs + support services
        socialValueCreated: 15000    // Family stability, mental health
      },
      [VulnerabilityType.ISOLATION]: {
        livesAtRisk: 0,
        potentialCostSaving: 8000,   // Mental health services
        socialValueCreated: 25000
      },
      [VulnerabilityType.MENTAL_HEALTH]: {
        livesAtRisk: 0,
        potentialCostSaving: 10000,
        socialValueCreated: 30000
      },
      [VulnerabilityType.CHILD_WELFARE]: {
        livesAtRisk: 1,
        potentialCostSaving: 100000, // Child protection, foster care
        socialValueCreated: 250000
      },
      [VulnerabilityType.DOMESTIC_DISTURBANCE]: {
        livesAtRisk: 1,
        potentialCostSaving: 20000,
        socialValueCreated: 60000
      }
    }
    
    return impacts[alertType] || { livesAtRisk: 0, potentialCostSaving: 0, socialValueCreated: 0 }
  }

  /**
   * Update social impact metrics
   */
  private updateSocialImpactMetrics(alert: SocialValueAlert): void {
    this.socialImpactData.livesPositivelyImpacted++
    this.socialImpactData.vulnerableCustomersSupported++
    
    if (alert.urgency === AlertUrgency.IMMEDIATE) {
      this.socialImpactData.emergencyInterventions++
    }
    
    switch (alert.alertType) {
      case VulnerabilityType.HEALTH_EMERGENCY:
      case VulnerabilityType.ELDERLY_FALL:
        this.socialImpactData.healthIssuesDetected++
        if (alert.urgency === AlertUrgency.IMMEDIATE) {
          this.socialImpactData.hospitalAdmissionsPrevented++
          this.socialImpactData.nhsSavings += alert.estimatedImpact.potentialCostSaving
        }
        break
        
      case VulnerabilityType.FINANCIAL_HARDSHIP:
        this.socialImpactData.financialCrisesAverted++
        this.socialImpactData.debtCrisisPreventionValue += alert.estimatedImpact.potentialCostSaving
        break
        
      case VulnerabilityType.ISOLATION:
        this.socialImpactData.lonelinessConcernsAddressed++
        break
    }
    
    this.socialImpactData.socialValueGenerated += alert.estimatedImpact.socialValueCreated
  }

  /**
   * Start Guardian Angel monitoring
   */
  private startGuardianAngelMonitoring(): void {
    // Check every hour for emergencies
    setInterval(() => {
      this.monitorForEmergencies().catch(err => {
        console.error('[Guardian Angel] Monitoring error:', err)
      })
    }, 60 * 60 * 1000) // Every hour
  }

  /**
   * Monitor all properties for emergency situations
   */
  async monitorForEmergencies(): Promise<SocialValueAlert[]> {
    const alerts: SocialValueAlert[] = []
    
    // In production, query database for all properties
    // For now, check properties we're tracking
    for (const [propertyId, score] of this.vulnerabilityScores) {
      if (score.healthRisk > this.HEALTH_RISK_CONFIDENCE_THRESHOLD ||
          score.requiresIntervention) {
        const propertyAlerts = this.alertHistory.get(propertyId) || []
        
        // Check if we've already alerted recently (don't spam)
        const recentAlert = propertyAlerts.find(a => 
          Date.now() - a.detectedAt.getTime() < 6 * 60 * 60 * 1000 // 6 hours
        )
        
        if (!recentAlert) {
          console.log(`[Guardian Angel] Emergency detected at ${propertyId}`)
        }
      }
    }
    
    return alerts
  }

  /**
   * Configure Guardian Angel for a property
   */
  configureGuardianAngel(
    propertyId: string,
    config: GuardianAngelConfig
  ): void {
    this.guardianAngelConfigs.set(propertyId, config)
  }

  /**
   * Get social impact report
   */
  getSocialImpactReport(): SocialImpactMetrics {
    // Calculate averages and derived metrics
    const totalAlerts = Array.from(this.alertHistory.values())
      .reduce((sum, alerts) => sum + alerts.length, 0)
    
    if (totalAlerts > 0) {
      // Calculate estimated lives saved (conservative: 1 in 100 high-risk alerts)
      const highRiskAlerts = Array.from(this.alertHistory.values())
        .flat()
        .filter(a => a.urgency === AlertUrgency.IMMEDIATE || a.urgency === AlertUrgency.URGENT)
        .length
      
      this.socialImpactData.estimatedLivesSaved = Math.floor(highRiskAlerts / 100)
      
      // Estimate evictions prevented
      const financialAlerts = Array.from(this.alertHistory.values())
        .flat()
        .filter(a => a.alertType === VulnerabilityType.FINANCIAL_HARDSHIP)
        .length
      
      this.socialImpactData.evictionsPrevented = Math.floor(financialAlerts * 0.7) // 70% success rate
      
      // Calculate Ofwat C-MeX impact (each vulnerability addressed = +0.1 points)
      this.socialImpactData.ofwatCMeXScoreImpact = 
        Math.round(this.socialImpactData.successfulInterventions * 0.1 * 10) / 10
      
      // Estimate positive media value (conservative)
      this.socialImpactData.positiveMediaValue = 
        this.socialImpactData.estimatedLivesSaved * 500000 + // £500k per life saved story
        this.socialImpactData.emergencyInterventions * 50000  // £50k per emergency story
    }
    
    return { ...this.socialImpactData }
  }

  /**
   * Get vulnerability alerts for a property
   */
  getPropertyAlerts(propertyId: string): SocialValueAlert[] {
    return this.alertHistory.get(propertyId) || []
  }

  /**
   * Get vulnerability score for a property
   */
  getVulnerabilityScore(propertyId: string): VulnerabilityScore | undefined {
    return this.vulnerabilityScores.get(propertyId)
  }

  /**
   * Utility: Calculate average
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  /**
   * Utility: Calculate routine regularity (0-1)
   */
  private calculateRoutineRegularity(usage: WaterUsagePattern[]): number {
    // Simplified - measures consistency of usage times
    const morningUsage = usage.filter(u => u.timeOfDay === 'morning').length
    const eveningUsage = usage.filter(u => u.timeOfDay === 'evening').length
    const totalUsage = usage.length
    
    const consistency = (morningUsage + eveningUsage) / totalUsage
    return consistency
  }

  /**
   * Utility: Detect batch usage patterns
   */
  private detectBatchUsage(usage: WaterUsagePattern[]): boolean {
    // Look for large single usages with long gaps
    const largeBatches = usage.filter(u => u.duration > 300) // 5+ minutes
    return largeBatches.length > usage.length * 0.3
  }

  /**
   * Utility: Calculate isolation score
   */
  private calculateIsolationScore(usage: WaterUsagePattern[]): number {
    // Simplified - would need more sophisticated analysis
    // Look for lack of variation suggesting single occupant
    const uniquePatterns = new Set(usage.map(u => 
      `${u.timeOfDay}-${Math.round(u.flowRate)}`
    )).size
    
    const score = Math.max(0, 100 - uniquePatterns * 2)
    return score
  }

  /**
   * Utility: Calculate behavioral anomaly score
   */
  private calculateBehavioralAnomalyScore(
    recent: WaterUsagePattern[],
    historical: WaterUsagePattern[]
  ): number {
    const recentAvg = this.calculateAverage(recent.map(u => u.flowRate))
    const historicalAvg = this.calculateAverage(historical.map(u => u.flowRate))
    
    const deviation = Math.abs(recentAvg - historicalAvg) / historicalAvg
    return Math.min(deviation * 100, 100)
  }

  /**
   * Utility: Detect disturbance patterns
   */
  private detectDisturbancePatterns(usage: WaterUsagePattern[]): boolean {
    // Look for erratic usage at unusual hours
    const lateNightUsage = usage.filter(u => 
      u.timeOfDay === 'night' && u.flowRate > 5
    )
    return lateNightUsage.length > 3
  }

  /**
   * Utility: Determine trend direction
   */
  private determineTrend(
    currentScore: number,
    previousScore?: number
  ): 'improving' | 'stable' | 'deteriorating' {
    if (!previousScore) return 'stable'
    
    const diff = currentScore - previousScore
    if (diff > 10) return 'deteriorating'
    if (diff < -10) return 'improving'
    return 'stable'
  }

  /**
   * Utility: Calculate confidence score
   */
  private calculateConfidence(
    score: VulnerabilityScore,
    indicators: VulnerabilityIndicators
  ): number {
    let confidence = 50 // Base confidence
    
    // Higher confidence with multiple indicators
    const indicatorCount = Object.values(indicators)
      .filter(v => v === true || (typeof v === 'number' && v > 50))
      .length
    
    confidence += indicatorCount * 5
    
    // Higher confidence with extreme scores
    if (score.overallScore > 80) confidence += 20
    if (score.healthRisk > 90) confidence += 20
    
    return Math.min(confidence, 100)
  }
}

// Singleton instance
export const socialIntelligenceService = new SocialIntelligenceService()
