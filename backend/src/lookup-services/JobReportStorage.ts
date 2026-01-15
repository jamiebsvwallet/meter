import { Collection, Db } from 'mongodb'
import { JobReport } from '../types.js'

/**
 * JobReportStorage manages plumbing job records
 * Stores work completed, costs, photos, and customer approvals
 */
export class JobReportStorage {
  private readonly reports: Collection<JobReport>

  constructor(private readonly db: Db) {
    this.reports = db.collection<JobReport>('JobReports')

    // Create indexes for efficient queries
    this.reports.createIndex({ jobId: 1 }, { unique: true })
    this.reports.createIndex({ propertyId: 1, status: 1 })
    this.reports.createIndex({ plumberId: 1, status: 1 })
    this.reports.createIndex({ customerId: 1, status: 1 })
    this.reports.createIndex({ completionTime: -1 })
    this.reports.createIndex({ reportHash: 1 }, { unique: true })
  }

  /**
   * Create a new job report
   */
  async createReport(report: JobReport): Promise<string> {
    report.createdAt = new Date()
    report.updatedAt = new Date()

    const result = await this.reports.insertOne(report)
    return result.insertedId.toString()
  }

  /**
   * Get report by ID
   */
  async getReport(jobId: string): Promise<JobReport | null> {
    return await this.reports.findOne({ jobId })
  }

  /**
   * Get reports by property
   */
  async getPropertyReports(propertyId: string, status?: string): Promise<JobReport[]> {
    const query: any = { propertyId }
    if (status) query.status = status

    return await this.reports
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()
  }

  /**
   * Get reports by plumber
   */
  async getPlumberReports(plumberId: string, status?: string): Promise<JobReport[]> {
    const query: any = { plumberId }
    if (status) query.status = status

    return await this.reports
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()
  }

  /**
   * Get reports by customer
   */
  async getCustomerReports(customerId: string, status?: string): Promise<JobReport[]> {
    const query: any = { customerId }
    if (status) query.status = status

    return await this.reports
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()
  }

  /**
   * Get pending reports (awaiting completion or approval)
   */
  async getPendingReports(): Promise<JobReport[]> {
    return await this.reports
      .find({ status: { $in: ['pending', 'completed'] } })
      .sort({ createdAt: -1 })
      .toArray()
  }

  /**
   * Update report status and completion
   */
  async completeReport(
    jobId: string,
    completionTime: Date,
    finalCost: number,
    reportHash: string
  ): Promise<void> {
    await this.reports.updateOne(
      { jobId },
      {
        $set: {
          completionTime,
          cost: finalCost,
          reportHash,
          status: 'completed',
          updatedAt: new Date()
        }
      }
    )
  }

  /**
   * Approve report as customer
   */
  async approveReport(jobId: string, customerSignature: string): Promise<void> {
    await this.reports.updateOne(
      { jobId },
      {
        $set: {
          customerSignature,
          status: 'approved',
          updatedAt: new Date()
        }
      }
    )
  }

  /**
   * Update report with photos or additional details
   */
  async updateReportDetails(
    jobId: string,
    updates: Partial<JobReport>
  ): Promise<void> {
    await this.reports.updateOne(
      { jobId },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    )
  }

  /**
   * Get completed reports (for invoicing/revenue tracking)
   */
  async getCompletedReports(startDate?: Date, endDate?: Date): Promise<JobReport[]> {
    const query: any = { status: 'approved' }

    if (startDate || endDate) {
      query.completionTime = {}
      if (startDate) query.completionTime.$gte = startDate
      if (endDate) query.completionTime.$lte = endDate
    }

    return await this.reports
      .find(query)
      .sort({ completionTime: -1 })
      .toArray()
  }

  /**
   * Calculate revenue for period
   */
  async getRevenue(startDate: Date, endDate: Date): Promise<{
    totalRevenue: number
    jobCount: number
    avgJobCost: number
  }> {
    const reports = await this.getCompletedReports(startDate, endDate)

    if (reports.length === 0) {
      return {
        totalRevenue: 0,
        jobCount: 0,
        avgJobCost: 0
      }
    }

    const totalRevenue = reports.reduce((sum, r) => sum + r.totalCost, 0)

    return {
      totalRevenue,
      jobCount: reports.length,
      avgJobCost: totalRevenue / reports.length
    }
  }

  /**
   * Find report by hash (blockchain verification)
   */
  async getReportByHash(reportHash: string): Promise<JobReport | null> {
    return await this.reports.findOne({ reportHash })
  }

  /**
   * Get report history for a property
   */
  async getPropertyJobHistory(propertyId: string): Promise<JobReport[]> {
    return await this.reports
      .find({ propertyId, status: 'approved' })
      .sort({ completionTime: -1 })
      .toArray()
  }
}
