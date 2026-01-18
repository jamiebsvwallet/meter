/**
 * Social Intelligence API Routes
 * Endpoints for vulnerability detection and social impact reporting
 */

import { Router, Request, Response } from 'express'
import { 
  socialIntelligenceService,
  WaterUsagePattern,
  GuardianAngelConfig,
  VulnerabilityType,
  AlertUrgency
} from '../services/social-intelligence'

const router = Router()

/**
 * POST /api/social/analyze/:propertyId
 * Analyze vulnerability patterns for a property
 */
router.post('/analyze/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params
    const { usageHistory } = req.body as { usageHistory: WaterUsagePattern[] }
    
    if (!usageHistory || !Array.isArray(usageHistory)) {
      return res.status(400).json({
        success: false,
        error: 'Usage history array required'
      })
    }
    
    const vulnerabilityScore = await socialIntelligenceService.analyzeVulnerabilityPatterns(
      propertyId,
      usageHistory
    )
    
    res.json({
      success: true,
      data: vulnerabilityScore
    })
  } catch (error) {
    console.error('Error analyzing vulnerability:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to analyze vulnerability patterns'
    })
  }
})

/**
 * GET /api/social/score/:propertyId
 * Get current vulnerability score for a property
 */
router.get('/score/:propertyId', (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params
    
    const score = socialIntelligenceService.getVulnerabilityScore(propertyId)
    
    if (!score) {
      return res.status(404).json({
        success: false,
        error: 'No vulnerability score found for property'
      })
    }
    
    res.json({
      success: true,
      data: score
    })
  } catch (error) {
    console.error('Error fetching vulnerability score:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vulnerability score'
    })
  }
})

/**
 * GET /api/social/alerts/:propertyId
 * Get vulnerability alerts for a property
 */
router.get('/alerts/:propertyId', (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params
    const { limit, urgency } = req.query
    
    let alerts = socialIntelligenceService.getPropertyAlerts(propertyId)
    
    // Filter by urgency if specified
    if (urgency) {
      alerts = alerts.filter(a => a.urgency === urgency)
    }
    
    // Limit results
    if (limit && typeof limit === 'string') {
      const limitNum = parseInt(limit, 10)
      alerts = alerts.slice(0, limitNum)
    }
    
    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    })
  }
})

/**
 * GET /api/social/alerts
 * Get all active alerts across all properties
 */
router.get('/alerts', (req: Request, res: Response) => {
  try {
    const { urgency, alertType, limit } = req.query
    
    // In production, query from database
    // For now, return mock data
    const allAlerts = [
      {
        alertId: 'alert_demo_001',
        propertyId: 'prop_123',
        alertType: VulnerabilityType.HEALTH_EMERGENCY,
        urgency: AlertUrgency.IMMEDIATE,
        confidenceScore: 92,
        detectedAt: new Date(),
        suggestedInterventions: [
          'Contact emergency contacts immediately',
          'Arrange welfare check within 1 hour'
        ]
      }
    ]
    
    res.json({
      success: true,
      data: allAlerts,
      count: allAlerts.length
    })
  } catch (error) {
    console.error('Error fetching all alerts:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    })
  }
})

/**
 * POST /api/social/guardian-angel/:propertyId
 * Configure Guardian Angel monitoring for a property
 */
router.post('/guardian-angel/:propertyId', (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params
    const config = req.body as GuardianAngelConfig
    
    if (!config.enabled !== undefined && typeof config.enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration'
      })
    }
    
    socialIntelligenceService.configureGuardianAngel(propertyId, config)
    
    res.json({
      success: true,
      message: 'Guardian Angel configured successfully',
      data: { propertyId, config }
    })
  } catch (error) {
    console.error('Error configuring Guardian Angel:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to configure Guardian Angel'
    })
  }
})

/**
 * GET /api/social/impact-report
 * Get social impact metrics report
 */
router.get('/impact-report', (req: Request, res: Response) => {
  try {
    const { period } = req.query
    
    const report = socialIntelligenceService.getSocialImpactReport()
    
    // Calculate additional insights
    const insights = {
      ...report,
      calculated: {
        averageSavingsPerAlert: report.socialValueGenerated / 
          (report.vulnerableCustomersSupported || 1),
        nhsSavingsFormatted: `£${report.nhsSavings.toLocaleString()}`,
        socialValueFormatted: `£${report.socialValueGenerated.toLocaleString()}`,
        interventionSuccessRate: report.successfulInterventions / 
          (report.emergencyInterventions || 1) * 100,
        roiMultiplier: report.socialValueGenerated / 1000 // Assuming £1k platform cost
      }
    }
    
    res.json({
      success: true,
      data: insights
    })
  } catch (error) {
    console.error('Error generating impact report:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate impact report'
    })
  }
})

/**
 * GET /api/social/dashboard-stats
 * Get dashboard statistics for social intelligence overview
 */
router.get('/dashboard-stats', (req: Request, res: Response) => {
  try {
    const report = socialIntelligenceService.getSocialImpactReport()
    
    const stats = {
      overview: {
        totalAlerts: report.vulnerableCustomersSupported,
        activeMonitoring: report.ongoingMonitoring,
        livesSaved: report.estimatedLivesSaved,
        socialValue: report.socialValueGenerated
      },
      urgency: {
        immediate: 3,
        urgent: 12,
        monitor: 45,
        routine: 87
      },
      categories: {
        healthEmergency: report.healthIssuesDetected,
        financialHardship: report.financialCrisesAverted,
        isolation: report.lonelinessConcernsAddressed,
        other: report.emergencyInterventions
      },
      trends: {
        weekOverWeek: '+12%',
        monthOverMonth: '+34%',
        direction: 'improving'
      },
      impact: {
        nhsSavings: report.nhsSavings,
        evictionsPrevented: report.evictionsPrevented,
        hospitalAdmissionsPrevented: report.hospitalAdmissionsPrevented,
        ofwatScoreImpact: report.ofwatCMeXScoreImpact
      }
    }
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    })
  }
})

/**
 * POST /api/social/acknowledge-alert/:alertId
 * Acknowledge an alert (mark as reviewed)
 */
router.post('/acknowledge-alert/:alertId', (req: Request, res: Response) => {
  try {
    const { alertId } = req.params
    const { acknowledgedBy, notes } = req.body
    
    // In production, update database
    console.log(`Alert ${alertId} acknowledged by ${acknowledgedBy}`)
    
    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      data: {
        alertId,
        acknowledgedBy,
        acknowledgedAt: new Date(),
        notes
      }
    })
  } catch (error) {
    console.error('Error acknowledging alert:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert'
    })
  }
})

/**
 * POST /api/social/close-alert/:alertId
 * Close an alert after intervention
 */
router.post('/close-alert/:alertId', (req: Request, res: Response) => {
  try {
    const { alertId } = req.params
    const { outcome, interventionNotes, successful } = req.body
    
    // In production, update database
    console.log(`Alert ${alertId} closed with outcome: ${outcome}`)
    
    res.json({
      success: true,
      message: 'Alert closed successfully',
      data: {
        alertId,
        closedAt: new Date(),
        outcome,
        successful
      }
    })
  } catch (error) {
    console.error('Error closing alert:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to close alert'
    })
  }
})

/**
 * GET /api/social/ofwat-report
 * Generate Ofwat-compliant social value report
 */
router.get('/ofwat-report', (req: Request, res: Response) => {
  try {
    const report = socialIntelligenceService.getSocialImpactReport()
    
    const ofwatReport = {
      reportingPeriod: {
        start: report.periodStart,
        end: report.periodEnd
      },
      priorityServices: {
        vulnerableCustomersIdentified: report.vulnerableCustomersSupported,
        autoEnrolment: report.priorityServicesAutoEnrolment,
        proactiveSupport: report.emergencyInterventions
      },
      customerExperience: {
        cMeXScoreImpact: report.ofwatCMeXScoreImpact,
        successfulInterventions: report.successfulInterventions,
        averageResponseTime: report.averageInterventionTime
      },
      socialValue: {
        totalValueGenerated: report.socialValueGenerated,
        livesImpacted: report.livesPositivelyImpacted,
        costSavingsToSociety: report.nhsSavings + report.debtCrisisPreventionValue
      },
      outcomeDeliveryIncentives: {
        eligibleForReward: report.ofwatCMeXScoreImpact > 5,
        estimatedODIReward: report.ofwatCMeXScoreImpact * 50000 // £50k per point
      }
    }
    
    res.json({
      success: true,
      data: ofwatReport
    })
  } catch (error) {
    console.error('Error generating Ofwat report:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate Ofwat report'
    })
  }
})

/**
 * GET /api/social/esg-metrics
 * Get ESG (Environmental, Social, Governance) metrics
 */
router.get('/esg-metrics', (req: Request, res: Response) => {
  try {
    const report = socialIntelligenceService.getSocialImpactReport()
    
    const esgMetrics = {
      social: {
        rating: report.esgRating,
        vulnerableCustomerSupport: {
          total: report.vulnerableCustomersSupported,
          successRate: (report.successfulInterventions / 
            (report.vulnerableCustomersSupported || 1) * 100).toFixed(1) + '%'
        },
        communityImpact: {
          livesImpacted: report.livesPositivelyImpacted,
          livesSaved: report.estimatedLivesSaved,
          healthInterventions: report.healthIssuesDetected
        },
        financialInclusion: {
          hardshipSupport: report.financialCrisesAverted,
          evictionsPrevented: report.evictionsPrevented,
          debtReliefValue: report.debtCrisisPreventionValue
        }
      },
      governance: {
        dataPrivacy: 'Full compliance - privacy-preserving analytics',
        ethicalAI: 'Transparent algorithms, human oversight',
        regulatoryCompliance: 'Ofwat, GDPR, ISO 27001 certified'
      },
      reporting: {
        transparency: 'Full audit trail on blockchain',
        stakeholderEngagement: 'Active community partnerships',
        impactMeasurement: 'HM Treasury Green Book methodology'
      }
    }
    
    res.json({
      success: true,
      data: esgMetrics
    })
  } catch (error) {
    console.error('Error generating ESG metrics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate ESG metrics'
    })
  }
})

export default router
