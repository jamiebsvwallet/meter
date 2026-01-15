/**
 * Universal Water Data API Marketplace
 * The "AWS/Plaid for Water Infrastructure"
 * Pay-per-call API with BSV micropayments
 */

import crypto from 'crypto'

/**
 * API Product Types
 */
export enum APIProduct {
  USAGE_DATA = 'usage_data',
  LEAK_DETECTION = 'leak_detection',
  PREDICTIVE_MAINTENANCE = 'predictive_maintenance',
  CONSUMPTION_FORECAST = 'consumption_forecast',
  INFRASTRUCTURE_HEALTH = 'infrastructure_health',
  WATER_QUALITY = 'water_quality',
  PROPERTY_SCORE = 'property_score',
  ANOMALY_DETECTION = 'anomaly_detection',
  BULK_ANALYTICS = 'bulk_analytics'
}

/**
 * Customer Types (B2B)
 */
export enum CustomerType {
  UTILITY = 'utility',
  INSURANCE = 'insurance',
  REAL_ESTATE = 'real_estate',
  SMART_HOME = 'smart_home',
  CONSTRUCTION = 'construction',
  GOVERNMENT = 'government',
  ESG_PLATFORM = 'esg_platform',
  IOT_PLATFORM = 'iot_platform',
  RESEARCH = 'research'
}

/**
 * API Call Pricing (BSV satoshis)
 */
const API_PRICING = {
  [APIProduct.USAGE_DATA]: 100,              // 100 sats per call
  [APIProduct.LEAK_DETECTION]: 500,          // 500 sats
  [APIProduct.PREDICTIVE_MAINTENANCE]: 1000, // 1000 sats
  [APIProduct.CONSUMPTION_FORECAST]: 750,    // 750 sats
  [APIProduct.INFRASTRUCTURE_HEALTH]: 1500,  // 1500 sats
  [APIProduct.WATER_QUALITY]: 300,           // 300 sats
  [APIProduct.PROPERTY_SCORE]: 2000,         // 2000 sats
  [APIProduct.ANOMALY_DETECTION]: 800,       // 800 sats
  [APIProduct.BULK_ANALYTICS]: 5000          // 5000 sats
}

/**
 * API Customer Account
 */
interface APICustomer {
  customerId: string
  customerName: string
  customerType: CustomerType
  apiKey: string
  bsvWalletAddress: string
  credits: number
  totalCalls: number
  lastCallTimestamp: Date
  rateLimit: number
  subscriptionTier: 'free' | 'basic' | 'professional' | 'enterprise'
}

/**
 * API Call Log
 */
interface APICallLog {
  callId: string
  customerId: string
  apiProduct: APIProduct
  timestamp: Date
  costSatoshis: number
  bsvTxId: string
  responseTime: number
  dataPoints: number
  success: boolean
}

/**
 * Water Data Marketplace Service
 */
export class WaterDataMarketplace {
  private static customers: Map<string, APICustomer> = new Map()
  private static callLogs: APICallLog[] = []
  private static totalRevenue = 0

  /**
   * Register new API customer (B2B onboarding)
   */
  static registerCustomer(
    customerName: string,
    customerType: CustomerType,
    bsvWalletAddress: string
  ): {
    customerId: string
    apiKey: string
    subscriptionTier: string
    rateLimits: {
      callsPerHour: number
      callsPerDay: number
    }
    pricing: any
  } {
    const customerId = `cust_${crypto.randomBytes(12).toString('hex')}`
    const apiKey = `mkt_${crypto.randomBytes(24).toString('hex')}`

    // Determine subscription tier based on customer type
    let subscriptionTier: 'free' | 'basic' | 'professional' | 'enterprise' = 'basic'
    let rateLimit = 1000

    if (customerType === CustomerType.UTILITY || customerType === CustomerType.GOVERNMENT) {
      subscriptionTier = 'enterprise'
      rateLimit = 100000
    } else if (customerType === CustomerType.INSURANCE || customerType === CustomerType.REAL_ESTATE) {
      subscriptionTier = 'professional'
      rateLimit = 10000
    }

    const customer: APICustomer = {
      customerId,
      customerName,
      customerType,
      apiKey,
      bsvWalletAddress,
      credits: 0,
      totalCalls: 0,
      lastCallTimestamp: new Date(),
      rateLimit,
      subscriptionTier
    }

    this.customers.set(customerId, customer)

    return {
      customerId,
      apiKey,
      subscriptionTier,
      rateLimits: {
        callsPerHour: rateLimit,
        callsPerDay: rateLimit * 24
      },
      pricing: API_PRICING
    }
  }

  /**
   * Purchase API credits with BSV
   */
  static purchaseCredits(
    customerId: string,
    satoshiAmount: number,
    bsvTxId: string
  ): {
    creditsAdded: number
    totalCredits: number
    transactionId: string
  } {
    const customer = this.customers.get(customerId)
    if (!customer) {
      throw new Error('Customer not found')
    }

    // 1 credit = 1 satoshi
    const creditsAdded = satoshiAmount

    customer.credits += creditsAdded
    this.customers.set(customerId, customer)

    return {
      creditsAdded,
      totalCredits: customer.credits,
      transactionId: bsvTxId
    }
  }

  /**
   * Call Usage Data API
   */
  static async getUsageData(
    apiKey: string,
    propertyIds: string[],
    dateRange: { start: Date; end: Date }
  ): Promise<{
    success: boolean
    data?: any
    cost: number
    creditsRemaining: number
    callId: string
  }> {
    const customer = this.findCustomerByApiKey(apiKey)
    if (!customer) {
      throw new Error('Invalid API key')
    }

    const cost = API_PRICING[APIProduct.USAGE_DATA] * propertyIds.length
    
    if (customer.credits < cost) {
      throw new Error('Insufficient credits')
    }

    // Deduct credits
    customer.credits -= cost
    customer.totalCalls++
    customer.lastCallTimestamp = new Date()

    // Generate mock usage data (in production: query real database)
    const usageData = propertyIds.map(propId => ({
      propertyId: propId,
      dateRange,
      totalConsumption: Math.floor(Math.random() * 10000) + 5000,
      averageDaily: Math.floor(Math.random() * 500) + 200,
      peakHour: Math.floor(Math.random() * 24),
      anomaliesDetected: Math.floor(Math.random() * 3)
    }))

    // Log API call
    const callId = this.logAPICall(customer.customerId, APIProduct.USAGE_DATA, cost, true)

    return {
      success: true,
      data: usageData,
      cost,
      creditsRemaining: customer.credits,
      callId
    }
  }

  /**
   * Call Leak Detection API
   */
  static async getLeakDetection(
    apiKey: string,
    propertyId: string
  ): Promise<{
    success: boolean
    data?: any
    cost: number
    creditsRemaining: number
  }> {
    const customer = this.findCustomerByApiKey(apiKey)
    if (!customer) {
      throw new Error('Invalid API key')
    }

    const cost = API_PRICING[APIProduct.LEAK_DETECTION]
    
    if (customer.credits < cost) {
      throw new Error('Insufficient credits')
    }

    customer.credits -= cost
    customer.totalCalls++

    const leakData = {
      propertyId,
      leaksDetected: Math.random() > 0.7,
      leakLocations: Math.random() > 0.7 ? [
        { location: 'bathroom_2', severity: 'moderate', flowRate: 2.5 },
        { location: 'outdoor_sprinkler', severity: 'low', flowRate: 0.8 }
      ] : [],
      estimatedWaterLoss: Math.floor(Math.random() * 500),
      repairCostEstimate: Math.floor(Math.random() * 2000) + 500,
      confidenceScore: 0.85 + Math.random() * 0.1
    }

    this.logAPICall(customer.customerId, APIProduct.LEAK_DETECTION, cost, true)

    return {
      success: true,
      data: leakData,
      cost,
      creditsRemaining: customer.credits
    }
  }

  /**
   * Call Predictive Maintenance API
   */
  static async getPredictiveMaintenance(
    apiKey: string,
    propertyIds: string[]
  ): Promise<{
    success: boolean
    data?: any
    cost: number
    creditsRemaining: number
  }> {
    const customer = this.findCustomerByApiKey(apiKey)
    if (!customer) {
      throw new Error('Invalid API key')
    }

    const cost = API_PRICING[APIProduct.PREDICTIVE_MAINTENANCE] * propertyIds.length
    
    if (customer.credits < cost) {
      throw new Error('Insufficient credits')
    }

    customer.credits -= cost
    customer.totalCalls++

    const predictions = propertyIds.map(propId => ({
      propertyId: propId,
      failureRisk: Math.random() > 0.8 ? 'high' : (Math.random() > 0.5 ? 'moderate' : 'low'),
      hoursUntilFailure: Math.floor(Math.random() * 168) + 24,
      componentAtRisk: ['main_pipe', 'valve', 'meter', 'service_line'][Math.floor(Math.random() * 4)],
      recommendedAction: 'Inspect and replace aging components',
      costToRepair: Math.floor(Math.random() * 5000) + 1000,
      costIfFailed: Math.floor(Math.random() * 50000) + 10000
    }))

    this.logAPICall(customer.customerId, APIProduct.PREDICTIVE_MAINTENANCE, cost, true)

    return {
      success: true,
      data: predictions,
      cost,
      creditsRemaining: customer.credits
    }
  }

  /**
   * Call Property Water Score API (for Real Estate)
   */
  static async getPropertyScore(
    apiKey: string,
    propertyId: string
  ): Promise<{
    success: boolean
    data?: any
    cost: number
    creditsRemaining: number
  }> {
    const customer = this.findCustomerByApiKey(apiKey)
    if (!customer) {
      throw new Error('Invalid API key')
    }

    const cost = API_PRICING[APIProduct.PROPERTY_SCORE]
    
    if (customer.credits < cost) {
      throw new Error('Insufficient credits')
    }

    customer.credits -= cost
    customer.totalCalls++

    const propertyScore = {
      propertyId,
      overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
      breakdown: {
        infrastructureHealth: Math.floor(Math.random() * 30) + 70,
        waterEfficiency: Math.floor(Math.random() * 30) + 70,
        leakHistory: Math.floor(Math.random() * 30) + 70,
        maintenanceRecord: Math.floor(Math.random() * 30) + 70,
        futureRisk: Math.floor(Math.random() * 30) + 70
      },
      estimatedAnnualSavings: Math.floor(Math.random() * 500) + 200,
      insuranceDiscount: Math.floor(Math.random() * 15) + 5,
      marketValueImpact: '+$' + (Math.floor(Math.random() * 10000) + 2000),
      recommendations: [
        'Install smart leak detectors',
        'Upgrade to water-efficient fixtures',
        'Schedule preventive maintenance'
      ]
    }

    this.logAPICall(customer.customerId, APIProduct.PROPERTY_SCORE, cost, true)

    return {
      success: true,
      data: propertyScore,
      cost,
      creditsRemaining: customer.credits
    }
  }

  /**
   * Call Bulk Analytics API (for Utilities/Government)
   */
  static async getBulkAnalytics(
    apiKey: string,
    region: string,
    analysisType: 'consumption' | 'infrastructure' | 'forecasting'
  ): Promise<{
    success: boolean
    data?: any
    cost: number
    creditsRemaining: number
  }> {
    const customer = this.findCustomerByApiKey(apiKey)
    if (!customer) {
      throw new Error('Invalid API key')
    }

    const cost = API_PRICING[APIProduct.BULK_ANALYTICS]
    
    if (customer.credits < cost) {
      throw new Error('Insufficient credits')
    }

    customer.credits -= cost
    customer.totalCalls++

    const analytics = {
      region,
      analysisType,
      totalProperties: Math.floor(Math.random() * 10000) + 5000,
      totalConsumption: Math.floor(Math.random() * 1000000) + 500000,
      averagePerProperty: Math.floor(Math.random() * 200) + 100,
      leakRate: (Math.random() * 5 + 2).toFixed(2) + '%',
      infrastructureHealth: Math.floor(Math.random() * 30) + 60,
      predictedFailures: Math.floor(Math.random() * 50) + 10,
      potentialSavings: Math.floor(Math.random() * 5000000) + 1000000,
      recommendations: [
        'Focus on aging infrastructure in zone 3',
        'Implement demand response program',
        'Upgrade 50 highest-risk properties'
      ]
    }

    this.logAPICall(customer.customerId, APIProduct.BULK_ANALYTICS, cost, true)

    return {
      success: true,
      data: analytics,
      cost,
      creditsRemaining: customer.credits
    }
  }

  /**
   * Get customer API usage statistics
   */
  static getCustomerStats(customerId: string): {
    customerId: string
    customerName: string
    subscriptionTier: string
    totalCalls: number
    totalSpent: number
    creditsRemaining: number
    topAPIs: Array<{ api: string; calls: number }>
    averageResponseTime: number
  } {
    const customer = this.customers.get(customerId)
    if (!customer) {
      throw new Error('Customer not found')
    }

    const customerCalls = this.callLogs.filter(log => log.customerId === customerId)
    const totalSpent = customerCalls.reduce((sum, log) => sum + log.costSatoshis, 0)

    const apiCounts: Record<string, number> = {}
    customerCalls.forEach(log => {
      apiCounts[log.apiProduct] = (apiCounts[log.apiProduct] || 0) + 1
    })

    const topAPIs = Object.entries(apiCounts)
      .map(([api, calls]) => ({ api, calls }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 5)

    const avgResponseTime = customerCalls.length > 0
      ? customerCalls.reduce((sum, log) => sum + log.responseTime, 0) / customerCalls.length
      : 0

    return {
      customerId,
      customerName: customer.customerName,
      subscriptionTier: customer.subscriptionTier,
      totalCalls: customer.totalCalls,
      totalSpent,
      creditsRemaining: customer.credits,
      topAPIs,
      averageResponseTime: Math.round(avgResponseTime)
    }
  }

  /**
   * Get marketplace-wide statistics
   */
  static getMarketplaceStats(): {
    totalCustomers: number
    totalAPICalls: number
    totalRevenue: number
    customersByType: Record<string, number>
    popularAPIs: Array<{ api: string; calls: number }>
    averageRevenuePerCustomer: number
  } {
    const customersByType: Record<string, number> = {}
    
    this.customers.forEach(customer => {
      customersByType[customer.customerType] = (customersByType[customer.customerType] || 0) + 1
    })

    const apiCalls: Record<string, number> = {}
    this.callLogs.forEach(log => {
      apiCalls[log.apiProduct] = (apiCalls[log.apiProduct] || 0) + 1
    })

    const popularAPIs = Object.entries(apiCalls)
      .map(([api, calls]) => ({ api, calls }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10)

    const totalRevenue = this.callLogs.reduce((sum, log) => sum + log.costSatoshis, 0)
    const avgRevenuePerCustomer = this.customers.size > 0 
      ? totalRevenue / this.customers.size 
      : 0

    return {
      totalCustomers: this.customers.size,
      totalAPICalls: this.callLogs.length,
      totalRevenue,
      customersByType,
      popularAPIs,
      averageRevenuePerCustomer: Math.round(avgRevenuePerCustomer)
    }
  }

  /**
   * Helper: Find customer by API key
   */
  private static findCustomerByApiKey(apiKey: string): APICustomer | undefined {
    for (const customer of this.customers.values()) {
      if (customer.apiKey === apiKey) {
        return customer
      }
    }
    return undefined
  }

  /**
   * Helper: Log API call
   */
  private static logAPICall(
    customerId: string,
    apiProduct: APIProduct,
    cost: number,
    success: boolean
  ): string {
    const callId = `call_${crypto.randomBytes(12).toString('hex')}`
    const bsvTxId = `bsv_${crypto.randomBytes(16).toString('hex')}`

    const log: APICallLog = {
      callId,
      customerId,
      apiProduct,
      timestamp: new Date(),
      costSatoshis: cost,
      bsvTxId,
      responseTime: Math.floor(Math.random() * 500) + 50,
      dataPoints: Math.floor(Math.random() * 1000) + 100,
      success
    }

    this.callLogs.push(log)
    this.totalRevenue += cost

    return callId
  }
}
