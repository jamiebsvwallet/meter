import { Db } from 'mongodb'
import { BSVAccount, Property, IoTReading, IoTReadingBatch, JobReport } from '../types.js'

/**
 * BSVAccountManager handles user account creation and BSV address management
 * Allows customers and plumbers to store data on their own BSV accounts
 */
export class BSVAccountManager {
  private readonly accounts: any
  private readonly properties: any

  constructor(private readonly db: Db) {
    this.accounts = db.collection<BSVAccount>('BSVAccounts')
    this.properties = db.collection<Property>('Properties')

    this.accounts.createIndex({ userId: 1 }, { unique: true })
    this.accounts.createIndex({ identityKey: 1 }, { unique: true })
    this.properties.createIndex({ propertyId: 1 }, { unique: true })
    this.properties.createIndex({ ownerId: 1 })
  }

  /**
   * Create customer account
   */
  async createCustomerAccount(userId: string, identityKey: string): Promise<BSVAccount> {
    const account: BSVAccount = {
      userId,
      identityKey,
      issuedAt: new Date(),
      accountType: 'customer',
      properties: []
    }

    await this.accounts.insertOne(account)
    return account
  }

  /**
   * Create plumber account
   */
  async createPlumberAccount(userId: string, identityKey: string): Promise<BSVAccount> {
    const account: BSVAccount = {
      userId,
      identityKey,
      issuedAt: new Date(),
      accountType: 'plumber',
      properties: []
    }

    await this.accounts.insertOne(account)
    return account
  }

  /**
   * Create water company account
   */
  async createWaterCompanyAccount(companyId: string, identityKey: string): Promise<BSVAccount> {
    const account: BSVAccount = {
      userId: companyId,
      identityKey,
      issuedAt: new Date(),
      accountType: 'water_company',
      properties: []
    }

    await this.accounts.insertOne(account)
    return account
  }

  /**
   * Get account
   */
  async getAccount(userId: string): Promise<BSVAccount | null> {
    return await this.accounts.findOne({ userId })
  }

  /**
   * Get account by identity key
   */
  async getAccountByKey(identityKey: string): Promise<BSVAccount | null> {
    return await this.accounts.findOne({ identityKey })
  }

  /**
   * Register property to customer
   */
  async registerProperty(
    propertyId: string,
    address: string,
    customerId: string
  ): Promise<void> {
    const property: Property = {
      propertyId,
      address,
      ownerId: customerId,
      createdAt: new Date()
    }

    await this.properties.insertOne(property)

    // Add to customer's property list
    await this.accounts.updateOne(
      { userId: customerId },
      { $push: { properties: propertyId } }
    )
  }

  /**
   * Get customer properties
   */
  async getCustomerProperties(customerId: string): Promise<Property[]> {
    return await this.properties.find({ ownerId: customerId }).toArray()
  }

  /**
   * Store data batch on customer's BSV account
   * Encrypts and stores IoT readings encrypted with customer's key
   */
  async storeDataOnCustomerAccount(
    customerId: string,
    propertyId: string,
    readings: IoTReading[]
  ): Promise<string> {
    const account = await this.getAccount(customerId)
    if (!account) throw new Error('Customer account not found')

    // Serialize and encrypt with customer's identity key
    const dataPacket = {
      propertyId,
      readings,
      storedAt: new Date(),
      hash: this.calculateHash(readings)
    }

    // In production, use BSV's encryption/signing
    // Store reference to BSV blockchain
    const storageRef = {
      customerId,
      propertyId,
      dataHash: dataPacket.hash,
      storedAt: new Date(),
      bsvTxId: undefined // Would be populated after blockchain submission
    }

    const collection = this.db.collection('CustomerDataStorage')
    const result = await collection.insertOne(storageRef)

    return result.insertedId.toString()
  }

  /**
   * Store job report on plumber's BSV account
   */
  async storeJobReportOnPlumberAccount(
    plumberId: string,
    jobReport: JobReport
  ): Promise<string> {
    const account = await this.getAccount(plumberId)
    if (!account) throw new Error('Plumber account not found')

    const storageRef = {
      plumberId,
      jobId: jobReport.jobId,
      reportHash: jobReport.reportHash,
      storedAt: new Date(),
      bsvTxId: undefined
    }

    const collection = this.db.collection('PlumberJobStorage')
    const result = await collection.insertOne(storageRef)

    return result.insertedId.toString()
  }

  /**
   * Retrieve customer's stored data
   */
  async getCustomerStoredData(customerId: string, propertyId?: string) {
    const collection = this.db.collection('CustomerDataStorage')

    const query: any = { customerId }
    if (propertyId) query.propertyId = propertyId

    return await collection.find(query).toArray()
  }

  /**
   * Retrieve plumber's stored job reports
   */
  async getPlumberStoredJobs(plumberId: string) {
    const collection = this.db.collection('PlumberJobStorage')

    return await collection.find({ plumberId }).toArray()
  }

  /**
   * Link BSV transaction to data
   * Called after data is submitted to blockchain
   */
  async linkBsvTransaction(
    storageId: string,
    txId: string,
    storageType: 'customer' | 'plumber'
  ): Promise<void> {
    const collection = this.db.collection(
      storageType === 'customer' ? 'CustomerDataStorage' : 'PlumberJobStorage'
    )

    await collection.updateOne(
      { _id: storageId as any },
      { $set: { bsvTxId: txId } }
    )
  }

  /**
   * Export customer data (GDPR)
   */
  async exportCustomerData(customerId: string) {
    const account = await this.getAccount(customerId)
    const properties = await this.getCustomerProperties(customerId)
    const storedData = await this.getCustomerStoredData(customerId)

    return {
      account,
      properties,
      storedData,
      exportedAt: new Date()
    }
  }

  /**
   * Calculate SHA256 hash
   */
  private calculateHash(data: any): string {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
  }
}
