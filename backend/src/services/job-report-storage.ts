/**
 * Job Report Storage Service
 * Complete system for creating, storing, and managing plumber job reports
 * Integrates with blockchain for immutable proof
 * 
 * Copyright © 2026 - All Rights Reserved
 */

import { Db, ObjectId } from 'mongodb'
import crypto from 'crypto'

export interface JobReportData {
  jobId: string;
  propertyId: string;
  customerId: string;
  plumberId: string;
  
  // Job Details
  jobType: 'leak_repair' | 'installation' | 'maintenance' | 'emergency' | 'inspection';
  description: string;
  workPerformed: string[];
  
  // Time Tracking
  scheduledAt: number;
  startedAt: number;
  completedAt: number;
  durationMinutes: number;
  
  // Materials & Costs
  materials: {
    name: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];
  laborCost: number;
  totalCost: number;
  
  // Documentation
  photos: {
    photoId: string;
    url: string;
    caption: string;
    timestamp: number;
    type: 'before' | 'during' | 'after' | 'issue';
  }[];
  notes: string;
  
  // Approvals
  customerApproved: boolean;
  customerSignature?: string;
  approvedAt?: number;
  
  // Quality
  qualityRating?: number; // 1-5 stars
  qualityNotes?: string;
  followUpRequired: boolean;
  warrantyPeriod?: number; // days
  
  // Blockchain
  reportHash?: string;
  blockchainTxId?: string;
  blockchainProofSubmitted: boolean;
}

export interface JobReportSearchFilters {
  propertyId?: string;
  customerId?: string;
  plumberId?: string;
  jobType?: string;
  startDate?: number;
  endDate?: number;
  approved?: boolean;
  minCost?: number;
  maxCost?: number;
}

export class JobReportStorageService {
  constructor(
    private db: Db,
    private blockchainService: any // BlockchainService
  ) {}

  /**
   * Create a new job report
   * Generates report hash and stores in database
   */
  async createJobReport(reportData: JobReportData): Promise<string> {
    try {
      const reportsCollection = this.db.collection('JobReports')
      
      // Generate unique report hash
      const reportHash = this.generateReportHash(reportData)
      
      const report = {
        ...reportData,
        reportId: `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        reportHash,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        status: 'pending',
        blockchainProofSubmitted: false
      }

      const result = await reportsCollection.insertOne(report)
      
      console.log(`✓ Job report created: ${report.reportId}`)
      console.log(`  Job type: ${reportData.jobType}`)
      console.log(`  Property: ${reportData.propertyId}`)
      console.log(`  Total cost: £${reportData.totalCost.toFixed(2)}`)
      
      return result.insertedId.toString()
    } catch (error) {
      console.error('Error creating job report:', error)
      throw error
    }
  }

  /**
   * Complete a job and mark as ready for approval
   */
  async completeJob(
    jobId: string,
    completionData: {
      workPerformed: string[];
      photos: JobReportData['photos'];
      materials: JobReportData['materials'];
      laborCost: number;
      notes: string;
    }
  ): Promise<void> {
    try {
      const reportsCollection = this.db.collection('JobReports')
      
      const completedAt = Date.now()
      const report = await reportsCollection.findOne({ jobId })
      
      if (!report) {
        throw new Error(`Job not found: ${jobId}`)
      }

      const durationMinutes = Math.floor((completedAt - report.startedAt) / 60000)
      const totalMaterialsCost = completionData.materials.reduce((sum, m) => sum + m.totalCost, 0)
      const totalCost = totalMaterialsCost + completionData.laborCost

      const update = {
        $set: {
          ...completionData,
          completedAt,
          durationMinutes,
          totalCost,
          status: 'completed',
          updatedAt: Date.now()
        }
      }

      await reportsCollection.updateOne({ jobId }, update)
      
      console.log(`✓ Job completed: ${jobId}`)
      console.log(`  Duration: ${durationMinutes} minutes`)
      console.log(`  Total cost: £${totalCost.toFixed(2)}`)
      
    } catch (error) {
      console.error('Error completing job:', error)
      throw error
    }
  }

  /**
   * Customer approves job report
   */
  async approveJobReport(
    jobId: string,
    customerId: string,
    signature: string,
    rating?: number,
    notes?: string
  ): Promise<void> {
    try {
      const reportsCollection = this.db.collection('JobReports')
      
      const report = await reportsCollection.findOne({ jobId, customerId })
      
      if (!report) {
        throw new Error(`Job not found or customer mismatch: ${jobId}`)
      }

      if (report.status !== 'completed') {
        throw new Error(`Job must be completed before approval: ${jobId}`)
      }

      const approvedAt = Date.now()

      const update = {
        $set: {
          customerApproved: true,
          customerSignature: signature,
          approvedAt,
          qualityRating: rating,
          qualityNotes: notes,
          status: 'approved',
          updatedAt: Date.now()
        }
      }

      await reportsCollection.updateOne({ jobId }, update)

      // Submit to blockchain for immutable proof
      await this.submitToBlockchain(jobId)
      
      console.log(`✓ Job approved: ${jobId}`)
      console.log(`  Rating: ${rating}/5 stars`)
      console.log(`  Blockchain proof submitted`)
      
    } catch (error) {
      console.error('Error approving job report:', error)
      throw error
    }
  }

  /**
   * Submit job report proof to blockchain
   */
  private async submitToBlockchain(jobId: string): Promise<void> {
    try {
      const reportsCollection = this.db.collection('JobReports')
      const report = await reportsCollection.findOne({ jobId })

      if (!report) {
        throw new Error(`Report not found: ${jobId}`)
      }

      // Submit to blockchain service
      const blockchainProof = await this.blockchainService.submitJobProof(
        report.propertyId,
        report.reportHash,
        report.completedAt,
        report.jobId
      )

      // Update report with blockchain proof
      await reportsCollection.updateOne(
        { jobId },
        {
          $set: {
            blockchainTxId: blockchainProof.txId,
            blockchainProofSubmitted: true,
            blockchainSubmittedAt: Date.now(),
            updatedAt: Date.now()
          }
        }
      )

      console.log(`✓ Job report submitted to blockchain`)
      console.log(`  TX ID: ${blockchainProof.txId}`)
    } catch (error) {
      console.error('Error submitting to blockchain:', error)
      throw error
    }
  }

  /**
   * Get job report by ID
   */
  async getJobReport(jobId: string): Promise<JobReportData | null> {
    try {
      const reportsCollection = this.db.collection('JobReports')
      const report = await reportsCollection.findOne({ jobId })
      
      return report as any
    } catch (error) {
      console.error('Error getting job report:', error)
      throw error
    }
  }

  /**
   * Search job reports
   */
  async searchJobReports(
    filters: JobReportSearchFilters,
    limit: number = 50,
    skip: number = 0
  ): Promise<JobReportData[]> {
    try {
      const reportsCollection = this.db.collection('JobReports')
      
      const query: any = {}
      
      if (filters.propertyId) query.propertyId = filters.propertyId
      if (filters.customerId) query.customerId = filters.customerId
      if (filters.plumberId) query.plumberId = filters.plumberId
      if (filters.jobType) query.jobType = filters.jobType
      if (filters.approved !== undefined) query.customerApproved = filters.approved
      
      if (filters.startDate || filters.endDate) {
        query.completedAt = {}
        if (filters.startDate) query.completedAt.$gte = filters.startDate
        if (filters.endDate) query.completedAt.$lte = filters.endDate
      }
      
      if (filters.minCost || filters.maxCost) {
        query.totalCost = {}
        if (filters.minCost) query.totalCost.$gte = filters.minCost
        if (filters.maxCost) query.totalCost.$lte = filters.maxCost
      }

      const reports = await reportsCollection
        .find(query)
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()

      return reports as any[]
    } catch (error) {
      console.error('Error searching job reports:', error)
      throw error
    }
  }

  /**
   * Get job reports for a property
   */
  async getPropertyJobHistory(propertyId: string): Promise<JobReportData[]> {
    return this.searchJobReports({ propertyId }, 100, 0)
  }

  /**
   * Get job reports for a plumber
   */
  async getPlumberJobHistory(plumberId: string): Promise<JobReportData[]> {
    return this.searchJobReports({ plumberId }, 100, 0)
  }

  /**
   * Generate statistics for job reports
   */
  async getJobReportStats(filters: JobReportSearchFilters): Promise<{
    totalJobs: number;
    completedJobs: number;
    approvedJobs: number;
    totalRevenue: number;
    averageJobCost: number;
    averageRating: number;
    averageDuration: number;
    jobTypeBreakdown: { [key: string]: number };
  }> {
    try {
      const reportsCollection = this.db.collection('JobReports')
      
      const query = this.buildSearchQuery(filters)
      
      const reports = await reportsCollection.find(query).toArray()
      
      const stats = {
        totalJobs: reports.length,
        completedJobs: reports.filter(r => r.status === 'completed' || r.status === 'approved').length,
        approvedJobs: reports.filter(r => r.customerApproved).length,
        totalRevenue: reports.reduce((sum, r) => sum + (r.totalCost || 0), 0),
        averageJobCost: 0,
        averageRating: 0,
        averageDuration: 0,
        jobTypeBreakdown: {} as { [key: string]: number }
      }

      if (stats.totalJobs > 0) {
        stats.averageJobCost = stats.totalRevenue / stats.totalJobs
        
        const ratedReports = reports.filter(r => r.qualityRating)
        if (ratedReports.length > 0) {
          stats.averageRating = ratedReports.reduce((sum, r) => sum + r.qualityRating, 0) / ratedReports.length
        }
        
        const completedReports = reports.filter(r => r.durationMinutes)
        if (completedReports.length > 0) {
          stats.averageDuration = completedReports.reduce((sum, r) => sum + r.durationMinutes, 0) / completedReports.length
        }
      }

      // Job type breakdown
      reports.forEach(r => {
        stats.jobTypeBreakdown[r.jobType] = (stats.jobTypeBreakdown[r.jobType] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('Error getting job report stats:', error)
      throw error
    }
  }

  /**
   * Add photo to job report
   */
  async addPhotoToReport(
    jobId: string,
    photo: JobReportData['photos'][0]
  ): Promise<void> {
    try {
      const reportsCollection = this.db.collection('JobReports')
      
      await reportsCollection.updateOne(
        { jobId },
        {
          $push: { photos: photo },
          $set: { updatedAt: Date.now() }
        }
      )

      console.log(`✓ Photo added to job report: ${jobId}`)
    } catch (error) {
      console.error('Error adding photo to report:', error)
      throw error
    }
  }

  /**
   * Generate report hash for blockchain
   */
  private generateReportHash(reportData: JobReportData): string {
    const dataToHash = {
      jobId: reportData.jobId,
      propertyId: reportData.propertyId,
      customerId: reportData.customerId,
      plumberId: reportData.plumberId,
      workPerformed: reportData.workPerformed,
      materials: reportData.materials,
      totalCost: reportData.totalCost,
      completedAt: reportData.completedAt
    }

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(dataToHash))
      .digest('hex')
  }

  /**
   * Build MongoDB query from filters
   */
  private buildSearchQuery(filters: JobReportSearchFilters): any {
    const query: any = {}
    
    if (filters.propertyId) query.propertyId = filters.propertyId
    if (filters.customerId) query.customerId = filters.customerId
    if (filters.plumberId) query.plumberId = filters.plumberId
    if (filters.jobType) query.jobType = filters.jobType
    if (filters.approved !== undefined) query.customerApproved = filters.approved
    
    if (filters.startDate || filters.endDate) {
      query.completedAt = {}
      if (filters.startDate) query.completedAt.$gte = filters.startDate
      if (filters.endDate) query.completedAt.$lte = filters.endDate
    }
    
    if (filters.minCost || filters.maxCost) {
      query.totalCost = {}
      if (filters.minCost) query.totalCost.$gte = filters.minCost
      if (filters.maxCost) query.totalCost.$lte = filters.maxCost
    }

    return query
  }
}
