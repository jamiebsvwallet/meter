/**
 * Compliance & Audit Logging Service
 * GDPR, HIPAA, SOC2, and industry compliance
 */

import winston from 'winston'
import { Request } from 'express'

export enum ComplianceStandard {
  GDPR = 'GDPR',
  HIPAA = 'HIPAA',
  SOC2 = 'SOC2',
  ISO27001 = 'ISO27001',
  PCI_DSS = 'PCI_DSS'
}

export enum AuditEventType {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  DATA_DELETION = 'DATA_DELETION',
  CONSENT_GRANTED = 'CONSENT_GRANTED',
  CONSENT_REVOKED = 'CONSENT_REVOKED',
  SECURITY_ALERT = 'SECURITY_ALERT',
  API_KEY_GENERATED = 'API_KEY_GENERATED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DATA_EXPORT = 'DATA_EXPORT',
  ADMIN_ACTION = 'ADMIN_ACTION'
}

export enum DataCategory {
  PERSONAL_INFO = 'PERSONAL_INFO',
  IOT_READINGS = 'IOT_READINGS',
  PAYMENT_DATA = 'PAYMENT_DATA',
  LOCATION_DATA = 'LOCATION_DATA',
  USAGE_PATTERNS = 'USAGE_PATTERNS',
  HEALTH_DATA = 'HEALTH_DATA'
}

interface AuditLog {
  timestamp: Date
  eventType: AuditEventType
  userId?: string
  ipAddress?: string
  userAgent?: string
  resource: string
  action: string
  result: 'success' | 'failure'
  dataCategory?: DataCategory
  complianceStandards: ComplianceStandard[]
  details?: any
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface DataRetentionPolicy {
  dataCategory: DataCategory
  retentionPeriodDays: number
  complianceRequirements: ComplianceStandard[]
  autoDeleteEnabled: boolean
}

interface ConsentRecord {
  userId: string
  propertyId: string
  consentType: 'data_collection' | 'data_processing' | 'data_sharing' | 'marketing'
  granted: boolean
  timestamp: Date
  expiryDate?: Date
  ipAddress: string
  version: string
}

export class ComplianceService {
  private logger: winston.Logger
  private retentionPolicies: Map<DataCategory, DataRetentionPolicy>
  private consentRecords: Map<string, ConsentRecord[]>

  constructor() {
    // Configure Winston logger for audit trails
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ 
          filename: 'logs/audit.log',
          maxsize: 10485760, // 10MB
          maxFiles: 10,
          tailable: true
        }),
        new winston.transports.File({ 
          filename: 'logs/security.log', 
          level: 'warn',
          maxsize: 10485760,
          maxFiles: 5
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    })

    this.retentionPolicies = new Map()
    this.consentRecords = new Map()
    this.initializeRetentionPolicies()
  }

  /**
   * Initialize data retention policies
   */
  private initializeRetentionPolicies(): void {
    // GDPR: Personal data retention
    this.retentionPolicies.set(DataCategory.PERSONAL_INFO, {
      dataCategory: DataCategory.PERSONAL_INFO,
      retentionPeriodDays: 365, // 1 year
      complianceRequirements: [ComplianceStandard.GDPR, ComplianceStandard.SOC2],
      autoDeleteEnabled: true
    })

    // IoT readings retention
    this.retentionPolicies.set(DataCategory.IOT_READINGS, {
      dataCategory: DataCategory.IOT_READINGS,
      retentionPeriodDays: 90, // 3 months
      complianceRequirements: [ComplianceStandard.ISO27001],
      autoDeleteEnabled: true
    })

    // Payment data retention (PCI-DSS)
    this.retentionPolicies.set(DataCategory.PAYMENT_DATA, {
      dataCategory: DataCategory.PAYMENT_DATA,
      retentionPeriodDays: 1095, // 3 years
      complianceRequirements: [ComplianceStandard.PCI_DSS, ComplianceStandard.SOC2],
      autoDeleteEnabled: false // Manual review required
    })

    // Location data retention (GDPR)
    this.retentionPolicies.set(DataCategory.LOCATION_DATA, {
      dataCategory: DataCategory.LOCATION_DATA,
      retentionPeriodDays: 180, // 6 months
      complianceRequirements: [ComplianceStandard.GDPR],
      autoDeleteEnabled: true
    })

    // Usage patterns (analytics)
    this.retentionPolicies.set(DataCategory.USAGE_PATTERNS, {
      dataCategory: DataCategory.USAGE_PATTERNS,
      retentionPeriodDays: 730, // 2 years
      complianceRequirements: [ComplianceStandard.SOC2],
      autoDeleteEnabled: true
    })
  }

  /**
   * Log audit event
   */
  logAuditEvent(event: Partial<AuditLog> & { 
    eventType: AuditEventType
    resource: string
    action: string 
  }): void {
    const auditLog: AuditLog = {
      timestamp: new Date(),
      result: 'success',
      complianceStandards: [ComplianceStandard.GDPR, ComplianceStandard.SOC2],
      severity: 'low',
      ...event
    }

    this.logger.info('AUDIT_EVENT', auditLog)

    // Alert on critical events
    if (auditLog.severity === 'critical') {
      this.logger.error('CRITICAL_AUDIT_EVENT', auditLog)
    }
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    eventType: AuditEventType,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const securityLog = {
      timestamp: new Date(),
      eventType,
      severity,
      details
    }

    this.logger.warn('SECURITY_EVENT', securityLog)

    if (severity === 'critical' || severity === 'high') {
      this.logger.error('HIGH_SEVERITY_SECURITY_EVENT', securityLog)
      // In production: trigger alerting system, SIEM, etc.
    }
  }

  /**
   * Log data access (GDPR Article 15 - Right of Access)
   */
  logDataAccess(
    userId: string,
    resource: string,
    dataCategory: DataCategory,
    req?: Request
  ): void {
    this.logAuditEvent({
      eventType: AuditEventType.DATA_ACCESS,
      userId,
      resource,
      action: 'READ',
      dataCategory,
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent'],
      complianceStandards: [ComplianceStandard.GDPR, ComplianceStandard.SOC2],
      severity: 'low'
    })
  }

  /**
   * Log data modification (GDPR Article 16 - Right to Rectification)
   */
  logDataModification(
    userId: string,
    resource: string,
    dataCategory: DataCategory,
    changes: any,
    req?: Request
  ): void {
    this.logAuditEvent({
      eventType: AuditEventType.DATA_MODIFICATION,
      userId,
      resource,
      action: 'UPDATE',
      dataCategory,
      details: { changes },
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent'],
      complianceStandards: [ComplianceStandard.GDPR, ComplianceStandard.SOC2],
      severity: 'medium'
    })
  }

  /**
   * Log data deletion (GDPR Article 17 - Right to Erasure)
   */
  logDataDeletion(
    userId: string,
    resource: string,
    dataCategory: DataCategory,
    reason: string,
    req?: Request
  ): void {
    this.logAuditEvent({
      eventType: AuditEventType.DATA_DELETION,
      userId,
      resource,
      action: 'DELETE',
      dataCategory,
      details: { reason },
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent'],
      complianceStandards: [ComplianceStandard.GDPR],
      severity: 'high'
    })
  }

  /**
   * Record consent (GDPR Article 7 - Conditions for Consent)
   */
  recordConsent(consent: ConsentRecord): void {
    const userId = consent.userId

    if (!this.consentRecords.has(userId)) {
      this.consentRecords.set(userId, [])
    }

    this.consentRecords.get(userId)!.push(consent)

    this.logAuditEvent({
      eventType: consent.granted ? AuditEventType.CONSENT_GRANTED : AuditEventType.CONSENT_REVOKED,
      userId: consent.userId,
      resource: 'user_consent',
      action: consent.granted ? 'GRANT' : 'REVOKE',
      details: {
        consentType: consent.consentType,
        propertyId: consent.propertyId,
        version: consent.version
      },
      ipAddress: consent.ipAddress,
      complianceStandards: [ComplianceStandard.GDPR],
      severity: 'medium'
    })
  }

  /**
   * Check if user has valid consent
   */
  hasValidConsent(
    userId: string,
    consentType: ConsentRecord['consentType']
  ): boolean {
    const consents = this.consentRecords.get(userId)
    if (!consents) return false

    const latestConsent = consents
      .filter(c => c.consentType === consentType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]

    if (!latestConsent) return false

    // Check if granted and not expired
    if (!latestConsent.granted) return false
    if (latestConsent.expiryDate && latestConsent.expiryDate < new Date()) return false

    return true
  }

  /**
   * Get data retention policy
   */
  getRetentionPolicy(dataCategory: DataCategory): DataRetentionPolicy | null {
    return this.retentionPolicies.get(dataCategory) || null
  }

  /**
   * Check if data should be deleted based on retention policy
   */
  shouldDeleteData(dataCategory: DataCategory, dataAge: Date): boolean {
    const policy = this.retentionPolicies.get(dataCategory)
    if (!policy || !policy.autoDeleteEnabled) return false

    const ageInDays = (Date.now() - dataAge.getTime()) / (1000 * 60 * 60 * 24)
    return ageInDays > policy.retentionPeriodDays
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(standard: ComplianceStandard): {
    standard: ComplianceStandard
    timestamp: Date
    dataRetentionCompliance: boolean
    consentManagementCompliance: boolean
    auditLoggingEnabled: boolean
    encryptionStatus: 'enabled' | 'partial' | 'disabled'
    recommendations: string[]
  } {
    const recommendations: string[] = []

    // Check data retention policies
    let hasRetentionPolicies = false
    for (const policy of this.retentionPolicies.values()) {
      if (policy.complianceRequirements.includes(standard)) {
        hasRetentionPolicies = true
        break
      }
    }

    if (!hasRetentionPolicies) {
      recommendations.push(`Implement data retention policies for ${standard}`)
    }

    // Check consent management
    const hasConsentRecords = this.consentRecords.size > 0
    if (!hasConsentRecords && standard === ComplianceStandard.GDPR) {
      recommendations.push('Implement consent management system')
    }

    // Check encryption
    const encryptionStatus = 'partial' // In production, check actual encryption status

    if (encryptionStatus === 'partial') {
      recommendations.push('Enable full data encryption at rest and in transit')
    }

    return {
      standard,
      timestamp: new Date(),
      dataRetentionCompliance: hasRetentionPolicies,
      consentManagementCompliance: hasConsentRecords || standard !== ComplianceStandard.GDPR,
      auditLoggingEnabled: true,
      encryptionStatus,
      recommendations
    }
  }

  /**
   * Export user data (GDPR Article 20 - Right to Data Portability)
   */
  async exportUserData(userId: string): Promise<{
    user: any
    iotReadings: any[]
    consents: ConsentRecord[]
    auditTrail: any[]
  }> {
    this.logAuditEvent({
      eventType: AuditEventType.DATA_EXPORT,
      userId,
      resource: 'user_data',
      action: 'EXPORT',
      complianceStandards: [ComplianceStandard.GDPR],
      severity: 'medium'
    })

    // In production: fetch from database
    return {
      user: { userId, exportedAt: new Date() },
      iotReadings: [],
      consents: this.consentRecords.get(userId) || [],
      auditTrail: []
    }
  }

  /**
   * Anonymize user data (GDPR compliance)
   */
  async anonymizeUserData(userId: string, reason: string): Promise<void> {
    this.logDataDeletion(userId, 'user_data', DataCategory.PERSONAL_INFO, reason)

    // In production: anonymize in database
    this.logger.info('USER_DATA_ANONYMIZED', { userId, reason, timestamp: new Date() })
  }

  /**
   * Get audit logs for user
   */
  async getAuditLogsForUser(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    // In production: query from log files or log aggregation service
    this.logger.info('AUDIT_LOG_REQUEST', { userId, startDate, endDate })
    return []
  }
}

// Singleton instance
export const complianceService = new ComplianceService()
