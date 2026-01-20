/**
 * Job Report Media API Routes
 * Handles photo/video uploads, annotations, and blockchain verification
 */

import { Router } from 'express'
import multer from 'multer'
import { JobReportMediaService } from '../services/job-report-media'

const router = Router()

// Configure multer for file uploads (10MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true)
    } else {
      cb(new Error('Only images and videos allowed'))
    }
  }
})

/**
 * POST /api/job-reports/:jobId/photos
 * Upload photo for job report
 */
router.post('/:jobId/photos', upload.single('photo'), async (req, res) => {
  try {
    const { jobId } = req.params
    const { type, annotation, digitalTwinLocation } = req.body

    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' })
    }

    const db = (req as any).db
    const mediaService = new JobReportMediaService(db)

    const photo = await mediaService.uploadPhoto(
      jobId,
      req.file.buffer,
      type,
      annotation ? JSON.parse(annotation) : undefined,
      digitalTwinLocation ? JSON.parse(digitalTwinLocation) : undefined
    )

    res.json({
      success: true,
      photo
    })

  } catch (error) {
    console.error('Photo upload error:', error)
    res.status(500).json({ error: 'Failed to upload photo' })
  }
})

/**
 * POST /api/job-reports/:jobId/videos
 * Upload video for job report
 */
router.post('/:jobId/videos', upload.single('video'), async (req, res) => {
  try {
    const { jobId } = req.params
    const { type } = req.body

    if (!req.file) {
      return res.status(400).json({ error: 'No video uploaded' })
    }

    const db = (req as any).db
    const mediaService = new JobReportMediaService(db)

    const video = await mediaService.uploadVideo(
      jobId,
      req.file.buffer,
      type
    )

    res.json({
      success: true,
      video
    })

  } catch (error) {
    console.error('Video upload error:', error)
    res.status(500).json({ error: 'Failed to upload video' })
  }
})

/**
 * GET /api/job-reports/:jobId/media
 * Get all media for a job
 */
router.get('/:jobId/media', async (req, res) => {
  try {
    const { jobId } = req.params

    const db = (req as any).db
    const mediaService = new JobReportMediaService(db)

    const media = await mediaService.getJobMedia(jobId)

    if (!media) {
      return res.status(404).json({ error: 'Job media not found' })
    }

    res.json({
      success: true,
      media
    })

  } catch (error) {
    console.error('Error fetching job media:', error)
    res.status(500).json({ error: 'Failed to fetch media' })
  }
})

/**
 * PATCH /api/job-reports/photos/:photoId/annotate
 * Add annotation to photo
 */
router.patch('/photos/:photoId/annotate', async (req, res) => {
  try {
    const { photoId } = req.params
    const { annotation } = req.body

    const db = (req as any).db
    const mediaService = new JobReportMediaService(db)

    await mediaService.annotatePhoto(photoId, annotation)

    res.json({
      success: true,
      message: 'Annotation added'
    })

  } catch (error) {
    console.error('Annotation error:', error)
    res.status(500).json({ error: 'Failed to add annotation' })
  }
})

/**
 * PATCH /api/job-reports/photos/:photoId/digital-twin
 * Link photo to digital twin location
 */
router.patch('/photos/:photoId/digital-twin', async (req, res) => {
  try {
    const { photoId } = req.params
    const { location } = req.body

    const db = (req as any).db
    const mediaService = new JobReportMediaService(db)

    await mediaService.linkPhotoToDigitalTwin(photoId, location)

    res.json({
      success: true,
      message: 'Photo linked to digital twin'
    })

  } catch (error) {
    console.error('Digital twin link error:', error)
    res.status(500).json({ error: 'Failed to link photo' })
  }
})

/**
 * GET /api/job-reports/:jobId/comparison
 * Get before/after photo comparison
 */
router.get('/:jobId/comparison', async (req, res) => {
  try {
    const { jobId } = req.params

    const db = (req as any).db
    const mediaService = new JobReportMediaService(db)

    const comparison = await mediaService.generateComparison(jobId)

    res.json({
      success: true,
      comparison
    })

  } catch (error) {
    console.error('Comparison error:', error)
    res.status(500).json({ error: 'Failed to generate comparison' })
  }
})

/**
 * POST /api/job-reports/:jobId/verify-blockchain
 * Verify job media on blockchain
 */
router.post('/:jobId/verify-blockchain', async (req, res) => {
  try {
    const { jobId } = req.params

    const db = (req as any).db
    const mediaService = new JobReportMediaService(db)

    const txId = await mediaService.verifyOnBlockchain(jobId)

    res.json({
      success: true,
      message: 'Job report verified on blockchain',
      txId
    })

  } catch (error) {
    console.error('Blockchain verification error:', error)
    res.status(500).json({ error: 'Failed to verify on blockchain' })
  }
})

/**
 * DELETE /api/job-reports/photos/:photoId
 * Delete photo
 */
router.delete('/photos/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params

    const db = (req as any).db
    const mediaService = new JobReportMediaService(db)

    await mediaService.deletePhoto(photoId)

    res.json({
      success: true,
      message: 'Photo deleted'
    })

  } catch (error) {
    console.error('Delete photo error:', error)
    res.status(500).json({ error: 'Failed to delete photo' })
  }
})

/**
 * GET /api/job-reports/:jobId/pdf
 * Generate PDF report with photos
 */
router.get('/:jobId/pdf', async (req, res) => {
  try {
    const { jobId } = req.params

    const db = (req as any).db
    const mediaService = new JobReportMediaService(db)

    const pdfBuffer = await mediaService.generatePDFReport(jobId)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="job-report-${jobId}.pdf"`)
    res.send(pdfBuffer)

  } catch (error) {
    console.error('PDF generation error:', error)
    res.status(500).json({ error: 'Failed to generate PDF' })
  }
})

/**
 * POST /api/job-reports/:jobId/export
 * Export job report to cloud storage
 */
router.post('/:jobId/export', async (req, res) => {
  try {
    const { jobId } = req.params
    const { provider } = req.body

    const db = (req as any).db
    const mediaService = new JobReportMediaService(db)

    const url = await mediaService.exportToCloud(jobId, provider || 'aws')

    res.json({
      success: true,
      url,
      message: 'Job report exported to cloud'
    })

  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({ error: 'Failed to export job report' })
  }
})

export default router
