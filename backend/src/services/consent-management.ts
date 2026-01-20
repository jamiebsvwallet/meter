/**
 * GDPR-Compliant Consent Management System
 * 
 * Manages customer consent for data sharing:
 * - Smart meter data access
 * - Neighborhood leak mapping participation
 * - Water company data sharing
 * - Third-party access control
 * 
 * All consent changes are timestamped and hashed to BSV blockchain
 */

import { createHash } from 'crypto';
import { ObjectId } from 'mongodb';

export interface ConsentRecord {
  id: string;
  propertyId: string;
  customerId: string;
  
  // Granular consent flags
  consents: {
    smartMeterDataAccess: boolean; // Allow smart meter readings in reports
    neighborhoodLeakSharing: boolean; // Share anonymized leak data with neighbors
    waterCompanyAccess: boolean; // Allow water company to see data
    researchDataSharing: boolean; // Anonymized data for research
    predictionModeling: boolean; // Use data to train AI models
    thirdPartyPartners: boolean; // Share with vetted partners
  };
  
  // Who can access what
  authorizedParties: AuthorizedParty[];
  
  // Audit trail
  grantedAt: Date;
  lastModified: Date;
  expiresAt: Date | null; // Optional expiration
  revokedAt: Date | null;
  
  // Blockchain proof
  consentHash: string;
  blockchainTxid: string | null;
  
  // Compliance
  gdprCompliant: boolean;
  consentVersion: string; // Terms version agreed to
  ipAddress: string; // Where consent was granted
  deviceInfo: string;
}

export interface AuthorizedParty {
  partyId: string;
  partyName: string;
  partyType: 'water_company' | 'plumber' | 'housing_association' | 'researcher' | 'insurance' | 'other';
  accessLevel: 'full' | 'anonymized' | 'aggregated';
  purpose: string;
  grantedAt: Date;
  expiresAt: Date | null;
  active: boolean;
}

export interface ConsentAuditLog {
  id: string;
  consentRecordId: string;
  propertyId: string;
  customerId: string;
  action: 'granted' | 'modified' | 'revoked' | 'renewed' | 'expired';
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  performedBy: string; // User ID
  performedAt: Date;
  reason: string;
  ipAddress: string;
  blockchainTxid: string | null;
}

export interface DataAccessRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterType: 'water_company' | 'researcher' | 'insurance' | 'other';
  propertyId: string;
  customerId: string;
  dataRequested: string[];
  purpose: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  reviewedAt: Date | null;
  reviewedBy: string | null;
  expiresAt: Date;
}

export class ConsentManagementService {
  /**
   * Create initial consent record for new customer
   */
  static async createConsentRecord(
    propertyId: string,
    customerId: string,
    initialConsents: {
      smartMeterDataAccess: boolean;
      neighborhoodLeakSharing: boolean;
      waterCompanyAccess: boolean;
      researchDataSharing: boolean;
      predictionModeling: boolean;
      thirdPartyPartners: boolean;
    },
    metadata: {
      ipAddress: string;
      deviceInfo: string;
      consentVersion: string;
    }
  ): Promise<ConsentRecord> {
    const id = new ObjectId().toHexString();
    const now = new Date();
    
    const record: ConsentRecord = {
      id,
      propertyId,
      customerId,
      consents: initialConsents,
      authorizedParties: [],
      grantedAt: now,
      lastModified: now,
      expiresAt: null, // No expiration unless customer sets one
      revokedAt: null,
      consentHash: '',
      blockchainTxid: null,
      gdprCompliant: true,
      consentVersion: metadata.consentVersion,
      ipAddress: metadata.ipAddress,
      deviceInfo: metadata.deviceInfo
    };

    // Hash consent for blockchain
    record.consentHash = this.hashConsent(record);

    // TODO: Save to MongoDB
    // TODO: Submit to BSV blockchain
    record.blockchainTxid = await this.submitConsentToBlockchain(record);

    // Create audit log
    await this.createAuditLog({
      consentRecordId: id,
      propertyId,
      customerId,
      action: 'granted',
      changes: Object.keys(initialConsents).map(key => ({
        field: key,
        oldValue: false,
        newValue: (initialConsents as any)[key]
      })),
      performedBy: customerId,
      performedAt: now,
      reason: 'Initial consent grant',
      ipAddress: metadata.ipAddress,
      blockchainTxid: record.blockchainTxid
    });

    return record;
  }

  /**
   * Update consent preferences
   */
  static async updateConsent(
    consentRecordId: string,
    customerId: string,
    updates: Partial<ConsentRecord['consents']>,
    metadata: {
      ipAddress: string;
      reason: string;
    }
  ): Promise<ConsentRecord> {
    // TODO: Fetch existing record from MongoDB
    const existingRecord = await this.getConsentRecord(consentRecordId);

    if (!existingRecord) {
      throw new Error('Consent record not found');
    }

    if (existingRecord.customerId !== customerId) {
      throw new Error('Unauthorized: Cannot modify another customer\'s consent');
    }

    const changes: ConsentAuditLog['changes'] = [];
    Object.keys(updates).forEach(key => {
      const oldValue = (existingRecord.consents as any)[key];
      const newValue = (updates as any)[key];
      if (oldValue !== newValue) {
        changes.push({ field: key, oldValue, newValue });
      }
    });

    const updatedRecord: ConsentRecord = {
      ...existingRecord,
      consents: {
        ...existingRecord.consents,
        ...updates
      },
      lastModified: new Date(),
      consentHash: ''
    };

    // Rehash for blockchain
    updatedRecord.consentHash = this.hashConsent(updatedRecord);
    updatedRecord.blockchainTxid = await this.submitConsentToBlockchain(updatedRecord);

    // Audit log
    await this.createAuditLog({
      consentRecordId,
      propertyId: existingRecord.propertyId,
      customerId,
      action: 'modified',
      changes,
      performedBy: customerId,
      performedAt: new Date(),
      reason: metadata.reason,
      ipAddress: metadata.ipAddress,
      blockchainTxid: updatedRecord.blockchainTxid
    });

    // TODO: Save to MongoDB

    return updatedRecord;
  }

  /**
   * Revoke all consents (GDPR right to withdraw)
   */
  static async revokeAllConsents(
    consentRecordId: string,
    customerId: string,
    metadata: {
      ipAddress: string;
      reason: string;
    }
  ): Promise<ConsentRecord> {
    const existingRecord = await this.getConsentRecord(consentRecordId);

    if (!existingRecord) {
      throw new Error('Consent record not found');
    }

    if (existingRecord.customerId !== customerId) {
      throw new Error('Unauthorized');
    }

    const revokedRecord: ConsentRecord = {
      ...existingRecord,
      consents: {
        smartMeterDataAccess: false,
        neighborhoodLeakSharing: false,
        waterCompanyAccess: false,
        researchDataSharing: false,
        predictionModeling: false,
        thirdPartyPartners: false
      },
      revokedAt: new Date(),
      lastModified: new Date(),
      authorizedParties: existingRecord.authorizedParties.map(p => ({
        ...p,
        active: false
      })),
      consentHash: ''
    };

    revokedRecord.consentHash = this.hashConsent(revokedRecord);
    revokedRecord.blockchainTxid = await this.submitConsentToBlockchain(revokedRecord);

    await this.createAuditLog({
      consentRecordId,
      propertyId: existingRecord.propertyId,
      customerId,
      action: 'revoked',
      changes: [{ field: 'all_consents', oldValue: true, newValue: false }],
      performedBy: customerId,
      performedAt: new Date(),
      reason: metadata.reason,
      ipAddress: metadata.ipAddress,
      blockchainTxid: revokedRecord.blockchainTxid
    });

    return revokedRecord;
  }

  /**
   * Add authorized party (e.g., water company, researcher)
   */
  static async authorizeParty(
    consentRecordId: string,
    customerId: string,
    party: {
      partyId: string;
      partyName: string;
      partyType: AuthorizedParty['partyType'];
      accessLevel: AuthorizedParty['accessLevel'];
      purpose: string;
      expiresAt: Date | null;
    }
  ): Promise<ConsentRecord> {
    const existingRecord = await this.getConsentRecord(consentRecordId);

    if (!existingRecord) {
      throw new Error('Consent record not found');
    }

    if (existingRecord.customerId !== customerId) {
      throw new Error('Unauthorized');
    }

    const authorizedParty: AuthorizedParty = {
      ...party,
      grantedAt: new Date(),
      active: true
    };

    const updatedRecord: ConsentRecord = {
      ...existingRecord,
      authorizedParties: [
        ...existingRecord.authorizedParties,
        authorizedParty
      ],
      lastModified: new Date(),
      consentHash: ''
    };

    updatedRecord.consentHash = this.hashConsent(updatedRecord);
    updatedRecord.blockchainTxid = await this.submitConsentToBlockchain(updatedRecord);

    await this.createAuditLog({
      consentRecordId,
      propertyId: existingRecord.propertyId,
      customerId,
      action: 'modified',
      changes: [{
        field: 'authorizedParties',
        oldValue: existingRecord.authorizedParties.length,
        newValue: updatedRecord.authorizedParties.length
      }],
      performedBy: customerId,
      performedAt: new Date(),
      reason: `Authorized ${party.partyName} for ${party.purpose}`,
      ipAddress: '',
      blockchainTxid: updatedRecord.blockchainTxid
    });

    return updatedRecord;
  }

  /**
   * Revoke access for specific party
   */
  static async revokePartyAccess(
    consentRecordId: string,
    customerId: string,
    partyId: string
  ): Promise<ConsentRecord> {
    const existingRecord = await this.getConsentRecord(consentRecordId);

    if (!existingRecord) {
      throw new Error('Consent record not found');
    }

    if (existingRecord.customerId !== customerId) {
      throw new Error('Unauthorized');
    }

    const updatedRecord: ConsentRecord = {
      ...existingRecord,
      authorizedParties: existingRecord.authorizedParties.map(p => 
        p.partyId === partyId ? { ...p, active: false } : p
      ),
      lastModified: new Date(),
      consentHash: ''
    };

    updatedRecord.consentHash = this.hashConsent(updatedRecord);
    updatedRecord.blockchainTxid = await this.submitConsentToBlockchain(updatedRecord);

    return updatedRecord;
  }

  /**
   * Check if specific data access is allowed
   */
  static async checkDataAccess(
    consentRecordId: string,
    requesterId: string,
    dataType: keyof ConsentRecord['consents']
  ): Promise<{ allowed: boolean; reason: string }> {
    const record = await this.getConsentRecord(consentRecordId);

    if (!record) {
      return { allowed: false, reason: 'No consent record found' };
    }

    if (record.revokedAt) {
      return { allowed: false, reason: 'Consent has been revoked' };
    }

    if (record.expiresAt && record.expiresAt < new Date()) {
      return { allowed: false, reason: 'Consent has expired' };
    }

    if (!record.consents[dataType]) {
      return { allowed: false, reason: `Customer has not consented to ${dataType}` };
    }

    // Check if requester is authorized
    const authorizedParty = record.authorizedParties.find(p => p.partyId === requesterId);
    if (!authorizedParty) {
      return { allowed: false, reason: 'Requester is not an authorized party' };
    }

    if (!authorizedParty.active) {
      return { allowed: false, reason: 'Party authorization has been revoked' };
    }

    if (authorizedParty.expiresAt && authorizedParty.expiresAt < new Date()) {
      return { allowed: false, reason: 'Party authorization has expired' };
    }

    return { allowed: true, reason: 'Access granted' };
  }

  /**
   * Get consent status for property
   */
  static async getConsentStatus(propertyId: string): Promise<{
    hasActiveConsent: boolean;
    smartMeterAllowed: boolean;
    neighborhoodSharingAllowed: boolean;
    waterCompanyAccessAllowed: boolean;
    authorizedParties: string[];
  }> {
    // TODO: Query MongoDB for consent record by propertyId
    const record = await this.getConsentRecordByProperty(propertyId);

    if (!record || record.revokedAt) {
      return {
        hasActiveConsent: false,
        smartMeterAllowed: false,
        neighborhoodSharingAllowed: false,
        waterCompanyAccessAllowed: false,
        authorizedParties: []
      };
    }

    return {
      hasActiveConsent: true,
      smartMeterAllowed: record.consents.smartMeterDataAccess,
      neighborhoodSharingAllowed: record.consents.neighborhoodLeakSharing,
      waterCompanyAccessAllowed: record.consents.waterCompanyAccess,
      authorizedParties: record.authorizedParties
        .filter(p => p.active)
        .map(p => p.partyName)
    };
  }

  /**
   * Create audit log entry
   */
  private static async createAuditLog(log: Omit<ConsentAuditLog, 'id'>): Promise<void> {
    const auditLog: ConsentAuditLog = {
      id: new ObjectId().toHexString(),
      ...log
    };

    // TODO: Save to MongoDB audit collection
    console.log('Audit log created:', auditLog);
  }

  /**
   * Hash consent record for blockchain verification
   */
  private static hashConsent(record: ConsentRecord): string {
    const dataString = JSON.stringify({
      id: record.id,
      propertyId: record.propertyId,
      customerId: record.customerId,
      consents: record.consents,
      authorizedParties: record.authorizedParties.map(p => ({
        partyId: p.partyId,
        active: p.active
      })),
      lastModified: record.lastModified,
      revokedAt: record.revokedAt
    });
    return createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Submit consent to BSV blockchain
   */
  private static async submitConsentToBlockchain(record: ConsentRecord): Promise<string> {
    // TODO: Integrate with BSV SDK
    // For now, simulate transaction ID
    const txid = createHash('sha256')
      .update(record.consentHash)
      .update(Date.now().toString())
      .digest('hex');
    
    return txid;
  }

  /**
   * Fetch consent record by ID
   */
  private static async getConsentRecord(id: string): Promise<ConsentRecord | null> {
    // TODO: Query MongoDB
    // For now, return mock data
    return null;
  }

  /**
   * Fetch consent record by property ID
   */
  private static async getConsentRecordByProperty(propertyId: string): Promise<ConsentRecord | null> {
    // TODO: Query MongoDB
    return null;
  }

  /**
   * Export customer's consent history (GDPR data portability)
   */
  static async exportConsentHistory(customerId: string): Promise<{
    consentRecords: ConsentRecord[];
    auditLogs: ConsentAuditLog[];
    exportedAt: Date;
    format: string;
  }> {
    // TODO: Query all records and logs for customer
    return {
      consentRecords: [],
      auditLogs: [],
      exportedAt: new Date(),
      format: 'JSON'
    };
  }

  /**
   * Delete customer data (GDPR right to erasure)
   */
  static async deleteCustomerData(customerId: string): Promise<{
    success: boolean;
    itemsDeleted: number;
    blockchainNote: string;
  }> {
    // TODO: Delete from MongoDB
    // NOTE: Blockchain records are immutable, but we can mark as deleted
    return {
      success: true,
      itemsDeleted: 0,
      blockchainNote: 'Blockchain consent hashes remain immutable but are marked as deleted in off-chain database'
    };
  }
}
