/**
 * Job Report API Routes
 * Endpoints for creating, managing, and storing plumber job reports
 * 
 * Copyright © 2026 - All Rights Reserved
 */

import { Router } from 'express'
import { Db } from 'mongodb'
import { JobReportStorageService } from '../services/job-report-storage'

export function createJobReportRoutes(db: Db, blockchainService: any): Router {
  const router = Router()
  const jobReportService = new JobReportStorageService(db, blockchainService)

  /**
   * Create a new job report
   * POST /api/job-reports/create
   */
  router.post('/create', async (req, res) => {
    try {
      const reportData = req.body
      const reportId = await jobReportService.createJobReport(reportData)
      
      res.json({
        success: true,
        reportId,
        message: 'Job report created successfully'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * Complete a job
   * POST /api/job-reports/:jobId/complete
   */
  router.post('/:jobId/complete', async (req, res) => {
    try {
      const { jobId } = req.params
      const completionData = req.body
      
      await jobReportService.completeJob(jobId, completionData)
      
      res.json({
        success: true,
        message: 'Job completed successfully'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * Approve job report (customer)
   * POST /api/job-reports/:jobId/approve
   */
  router.post('/:jobId/approve', async (req, res) => {
    try {
      const { jobId } = req.params
      const { customerId, signature, rating, notes } = req.body
      
      await jobReportService.approveJobReport(jobId, customerId, signature, rating, notes)
      
      res.json({
        success: true,
        message: 'Job report approved and submitted to blockchain'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * Get job report by ID
   * GET /api/job-reports/:jobId
   */
  router.get('/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params
      const report = await jobReportService.getJobReport(jobId)
      
      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Job report not found'
        })
      }
      
      res.json({
        success: true,
        report
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * Search job reports
   * POST /api/job-reports/search
   */
  router.post('/search', async (req, res) => {
    try {
      const { filters, limit, skip } = req.body
      const reports = await jobReportService.searchJobReports(filters, limit, skip)
      
      res.json({
        success: true,
        reports,
        count: reports.length
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * Get property job history
   * GET /api/job-reports/property/:propertyId
   */
  router.get('/property/:propertyId', async (req, res) => {
    try {
      const { propertyId } = req.params
      const reports = await jobReportService.getPropertyJobHistory(propertyId)
      
      res.json({
        success: true,
        reports,
        count: reports.length
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * Get plumber job history
   * GET /api/job-reports/plumber/:plumberId
   */
  router.get('/plumber/:plumberId', async (req, res) => {
    try {
      const { plumberId } = req.params
      const reports = await jobReportService.getPlumberJobHistory(plumberId)
      
      res.json({
        success: true,
        reports,
        count: reports.length
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * Get job report statistics
   * POST /api/job-reports/stats
   */
  router.post('/stats', async (req, res) => {
    try {
      const { filters } = req.body
      const stats = await jobReportService.getJobReportStats(filters)
      
      res.json({
        success: true,
        stats
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * Add photo to job report
   * POST /api/job-reports/:jobId/photo
   */
  router.post('/:jobId/photo', async (req, res) => {
    try {
      const { jobId } = req.params
      const photo = req.body
      
      await jobReportService.addPhotoToReport(jobId, photo)
      
      res.json({
        success: true,
        message: 'Photo added to job report'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  return router
}
