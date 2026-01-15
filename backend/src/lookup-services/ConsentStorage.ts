import { Collection, Db } from 'mongodb'
import { PropertyConsent, WaterCompanyConsent, ConsentAuditLog } from '../types.js'

/**
 * ConsentStorage manages data access permissions
 * Tracks what plumbers, customers, and water companies can access
 */
export class ConsentStorage {
  private readonly consents: Collection<PropertyConsent>
  private readonly auditLogs: Collection<ConsentAuditLog>

  constructor(private readonly db: Db) {
    this.consents = db.collection<PropertyConsent>('PropertyConsents')
    this.auditLogs = db.collection<ConsentAuditLog>('ConsentAuditLogs')

    this.consents.createIndex({ propertyId: 1 }, { unique: true })
    this.consents.createIndex({ customerId: 1 })
    this.consents.createIndex({ plumberId: 1 })
    this.auditLogs.createIndex({ propertyId: 1, timestamp: -1 })
    this.auditLogs.createIndex({ entityId: 1 })
  }

  /**
   * Create property consent record
   */
  async createConsent(
    propertyId: string,
    customerId: string,
    plumberId: string
  ): Promise<void> {
    await this.consents.insertOne({
      propertyId,
      customerId,
      plumberId,
      waterCompanyAccess: [],
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  /**
   * Get consent for a property
   */
  async getConsent(propertyId: string): Promise<PropertyConsent | null> {
    return await this.consents.findOne({ propertyId })
  }

  /**
   * Grant water company access with expiration
   */
  async grantWaterCompanyAccess(
    propertyId: string,
    companyId: string,
    reason?: string,
    expirationDays?: number
  ): Promise<void> {
    const expiresAt = expirationDays
      ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)
      : undefined

    const waterCompanyConsent: WaterCompanyConsent = {
      companyId,
      grantedAt: new Date(),
      reason,
      expiresAt,
      isActive: true
    }

    await this.consents.updateOne(
      { propertyId },
      {
        $push: { waterCompanyAccess: waterCompanyConsent },
        $set: { updatedAt: new Date() }
      }
    )

    // Log the change
    await this.logConsentChange(propertyId, companyId, 'grant', reason)
  }

  /**
   * Revoke water company access
   */
  async revokeWaterCompanyAccess(propertyId: string, companyId: string): Promise<void> {
    await this.consents.updateOne(
      { propertyId, 'waterCompanyAccess.companyId': companyId },
      {
        $set: {
          'waterCompanyAccess.$.isActive': false,
          'waterCompanyAccess.$.revokedAt': new Date(),
          updatedAt: new Date()
        }
      }
    )

    await this.logConsentChange(propertyId, companyId, 'revoke')
  }

  /**
   * Check if entity has access to property
   */
  async hasAccess(
    propertyId: string,
    entityId: string,
    entityType: 'customer' | 'plumber' | 'water_company'
  ): Promise<boolean> {
    const consent = await this.getConsent(propertyId)
    if (!consent) return false

    if (entityType === 'customer') {
      return consent.customerId === entityId
    }

    if (entityType === 'plumber') {
      return consent.plumberId === entityId
    }

    if (entityType === 'water_company') {
      const company = consent.waterCompanyAccess.find(w => w.companyId === entityId)
      if (!company) return false

      // Check if still active and not expired
      if (!company.isActive) return false
      if (company.expiresAt && new Date() > company.expiresAt) {
        // Auto-revoke expired access
        await this.revokeWaterCompanyAccess(propertyId, entityId)
        return false
      }

      return true
    }

    return false
  }

  /**
   * Get all properties a water company has access to
   */
  async getWaterCompanyProperties(companyId: string): Promise<string[]> {
    const consents = await this.consents
      .find({
        'waterCompanyAccess': {
          $elemMatch: {
            companyId,
            isActive: true
          }
        }
      })
      .toArray()

    return consents
      .map(c => c.propertyId)
  }

  /**
   * Get all water companies with access to a property
   */
  async getPropertyWaterCompanies(propertyId: string): Promise<WaterCompanyConsent[]> {
    const consent = await this.getConsent(propertyId)
    if (!consent) return []

    return consent.waterCompanyAccess.filter(w => w.isActive)
  }

  /**
   * Log consent changes for audit trail
   */
  private async logConsentChange(
    propertyId: string,
    entityId: string,
    action: 'grant' | 'revoke',
    reason?: string
  ): Promise<void> {
    await this.auditLogs.insertOne({
      id: `${propertyId}-${entityId}-${Date.now()}`,
      propertyId,
      entityId,
      action,
      timestamp: new Date(),
      reason
    })
  }

  /**
   * Get consent audit trail
   */
  async getAuditTrail(propertyId: string): Promise<ConsentAuditLog[]> {
    return await this.auditLogs
      .find({ propertyId })
      .sort({ timestamp: -1 })
      .toArray()
  }

  /**
   * Get easy consent summary for customer
   */
  async getConsentSummary(propertyId: string): Promise<{
    customer: string
    plumber: string
    waterCompanies: Array<{ companyId: string; grantedAt: Date; reason?: string }>
  }> {
    const consent = await this.getConsent(propertyId)

    if (!consent) {
      return {
        customer: '',
        plumber: '',
        waterCompanies: []
      }
    }

    return {
      customer: consent.customerId,
      plumber: consent.plumberId,
      waterCompanies: consent.waterCompanyAccess
        .filter(w => w.isActive)
        .map(w => ({
          companyId: w.companyId,
          grantedAt: w.grantedAt,
          reason: w.reason
        }))
    }
  }
}
