import { Router, Request, Response } from 'express'
import { Db } from 'mongodb'
import { PlumbingService } from '../lookup-services/PlumbingService.js'

/**
 * Job Report API Routes
 * Handles job creation, completion, and approval
 */
export function createJobRouter(db: Db): Router {
  const router = Router()
  const service = new PlumbingService(db)

  /**
   * POST /api/jobs/create
   * Create new job
   */
  router.post('/create', async (req: Request, res: Response) => {
    try {
      const { propertyId, customerId, plumberId, description } = req.body

      if (!propertyId || !customerId || !plumberId || !description) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const jobId = await service.createJob(propertyId, customerId, plumberId, description)

      res.json({
        success: true,
        jobId,
        status: 'pending',
        createdAt: new Date()
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * GET /api/jobs/:jobId
   * Get job details
   */
  router.get('/:jobId', async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params

      const job = await service.getJob(jobId)

      if (!job) {
        return res.status(404).json({ error: 'Job not found' })
      }

      res.json(job)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * GET /api/jobs/property/:propertyId
   * Get all jobs for property
   */
  router.get('/property/:propertyId', async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params
      const { status } = req.query

      const jobs = await service.getPropertyJobs(propertyId, status as string)
      res.json(jobs)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * GET /api/jobs/plumber/:plumberId/pending
   * Get pending jobs for plumber
   */
  router.get('/plumber/:plumberId/pending', async (req: Request, res: Response) => {
    try {
      const { plumberId } = req.params

      const jobs = await service.getPlumberPendingJobs(plumberId)
      res.json(jobs)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * GET /api/jobs/plumber/:plumberId/completed
   * Get completed jobs for plumber
   */
  router.get('/plumber/:plumberId/completed', async (req: Request, res: Response) => {
    try {
      const { plumberId } = req.params

      const jobs = await service.getCustomerCompletedJobs(plumberId)
      res.json(jobs)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * POST /api/jobs/:jobId/complete
   * Mark job as completed and generate report hash
   */
  router.post('/:jobId/complete', async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params
      const { workPerformed, partsUsed, totalCost, photos } = req.body

      if (!workPerformed || !totalCost) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const { reportHash } = await service.completeJob(
        jobId,
        workPerformed,
        partsUsed || [],
        totalCost,
        photos || []
      )

      res.json({
        success: true,
        jobId,
        status: 'completed',
        reportHash,
        // This hash should be submitted to blockchain
        blockchainSubmission: {
          contractType: 'JobReport',
          reportHash,
          timestamp: Date.now(),
          jobId,
          cost: totalCost
        }
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * POST /api/jobs/:jobId/approve
   * Customer approves completed job
   */
  router.post('/:jobId/approve', async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params
      const { customerSignature } = req.body

      if (!customerSignature) {
        return res.status(400).json({ error: 'Signature required' })
      }

      await service.approveJob(jobId, customerSignature)

      res.json({
        success: true,
        jobId,
        status: 'approved'
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * GET /api/jobs/plumber/:plumberId/revenue
   * Get plumber revenue for period
   */
  router.get('/plumber/:plumberId/revenue', async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate required' })
      }

      const revenue = await service.getRevenue(
        new Date(startDate as string),
        new Date(endDate as string)
      )

      res.json(revenue)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  return router
}
