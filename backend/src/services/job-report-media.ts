/**
 * Job Report Media Service
 * Handles photo/video upload, storage, processing, and blockchain verification
 */

import crypto from 'crypto'
import { MongoClient, Db, ObjectId } from 'mongodb'

interface JobPhoto {
  id: string
  jobId: string
  type: 'before' | 'during' | 'after' | 'issue' | 'parts'
  url: string
  thumbnail: string
  hash: string // SHA-256 of image data
  timestamp: Date
  annotation?: {
    text: string
    arrows: Array<{ x: number; y: number; direction: string }>
    circles: Array<{ x: number; y: number; radius: number }>
  }
  digitalTwinLocation?: {
    x: number
    y: number
    z: number
    zone: string
  }
  metadata: {
    width: number
    height: number
    size: number
    mimeType: string
  }
}

interface JobVideo {
  id: string
  jobId: string
  type: 'walkthrough' | 'demonstration' | 'issue' | 'explanation'
  url: string
  thumbnail: string
  hash: string
  duration: number
  timestamp: Date
  metadata: {
    width: number
    height: number
    size: number
    codec: string
  }
}

interface JobReportMedia {
  jobId: string
  propertyId: string
  photos: JobPhoto[]
  videos: JobVideo[]
  totalSize: number
  blockchainVerified: boolean
  blockchainTxId?: string
  createdAt: Date
  updatedAt: Date
}

export class JobReportMediaService {
  private db: Db

  constructor(db: Db) {
    this.db = db
  }

  /**
   * Upload photo for job report
   */
  async uploadPhoto(
    jobId: string,
    photoData: Buffer,
    type: JobPhoto['type'],
    annotation?: JobPhoto['annotation'],
    digitalTwinLocation?: JobPhoto['digitalTwinLocation']
  ): Promise<JobPhoto> {
    // Calculate hash
    const hash = crypto.createHash('sha256').update(photoData).digest('hex')

    // TODO: Upload to storage (S3, IPFS, or local filesystem)
    // For now, store as base64 in database (not recommended for production)
    const base64Data = photoData.toString('base64')
    const url = `data:image/jpeg;base64,${base64Data}`

    // Generate thumbnail (resize to 200x200)
    const thumbnail = url // TODO: Implement actual thumbnail generation

    const photo: JobPhoto = {
      id: new ObjectId().toHexString(),
      jobId,
      type,
      url,
      thumbnail,
      hash,
      timestamp: new Date(),
      annotation,
      digitalTwinLocation,
      metadata: {
        width: 0, // TODO: Extract from image
        height: 0,
        size: photoData.length,
        mimeType: 'image/jpeg'
      }
    }

    // Store in database
    await this.db.collection('job_photos').insertOne(photo)

    // Update job report media record
    await this.updateJobReportMedia(jobId, { $push: { photos: photo } })

    return photo
  }

  /**
   * Upload video for job report
   */
  async uploadVideo(
    jobId: string,
    videoData: Buffer,
    type: JobVideo['type']
  ): Promise<JobVideo> {
    const hash = crypto.createHash('sha256').update(videoData).digest('hex')

    // TODO: Upload to storage
    const base64Data = videoData.toString('base64')
    const url = `data:video/mp4;base64,${base64Data}`
    const thumbnail = '' // TODO: Extract first frame

    const video: JobVideo = {
      id: new ObjectId().toHexString(),
      jobId,
      type,
      url,
      thumbnail,
      hash,
      duration: 0, // TODO: Extract from video metadata
      timestamp: new Date(),
      metadata: {
        width: 1920,
        height: 1080,
        size: videoData.length,
        codec: 'h264'
      }
    }

    await this.db.collection('job_videos').insertOne(video)
    await this.updateJobReportMedia(jobId, { $push: { videos: video } })

    return video
  }

  /**
   * Get all media for a job
   */
  async getJobMedia(jobId: string): Promise<JobReportMedia | null> {
    const media = await this.db.collection('job_report_media').findOne({ jobId })
    return media as JobReportMedia | null
  }

  /**
   * Add annotation to photo
   */
  async annotatePhoto(
    photoId: string,
    annotation: JobPhoto['annotation']
  ): Promise<void> {
    await this.db.collection('job_photos').updateOne(
      { id: photoId },
      { $set: { annotation, updatedAt: new Date() } }
    )
  }

  /**
   * Link photo to digital twin location
   */
  async linkPhotoToDigitalTwin(
    photoId: string,
    location: JobPhoto['digitalTwinLocation']
  ): Promise<void> {
    await this.db.collection('job_photos').updateOne(
      { id: photoId },
      { $set: { digitalTwinLocation: location, updatedAt: new Date() } }
    )
  }

  /**
   * Generate before/after comparison
   */
  async generateComparison(
    jobId: string
  ): Promise<{ before: JobPhoto[]; after: JobPhoto[] }> {
    const photos = await this.db.collection('job_photos')
      .find({ jobId })
      .toArray() as JobPhoto[]

    return {
      before: photos.filter(p => p.type === 'before'),
      after: photos.filter(p => p.type === 'after')
    }
  }

  /**
   * Verify media on blockchain
   */
  async verifyOnBlockchain(jobId: string): Promise<string> {
    const media = await this.getJobMedia(jobId)
    if (!media) throw new Error('Job media not found')

    // Collect all hashes
    const photoHashes = media.photos.map(p => p.hash)
    const videoHashes = media.videos.map(v => v.hash)

    // Create merkle root of all hashes
    const allHashes = [...photoHashes, ...videoHashes]
    const merkleRoot = this.calculateMerkleRoot(allHashes)

    // TODO: Submit to BSV blockchain via JobReport contract
    const txId = 'tx_' + crypto.randomBytes(16).toString('hex')

    // Update media record
    await this.db.collection('job_report_media').updateOne(
      { jobId },
      { 
        $set: { 
          blockchainVerified: true,
          blockchainTxId: txId,
          updatedAt: new Date()
        } 
      }
    )

    return txId
  }

  /**
   * Calculate merkle root from array of hashes
   */
  private calculateMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) return ''
    if (hashes.length === 1) return hashes[0]

    const newLevel: string[] = []
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i]
      const right = hashes[i + 1] || left
      const combined = left + right
      const hash = crypto.createHash('sha256').update(combined).digest('hex')
      newLevel.push(hash)
    }

    return this.calculateMerkleRoot(newLevel)
  }

  /**
   * Update job report media record
   */
  private async updateJobReportMedia(
    jobId: string,
    update: any
  ): Promise<void> {
    const existing = await this.db.collection('job_report_media').findOne({ jobId })

    if (!existing) {
      // Create new record
      await this.db.collection('job_report_media').insertOne({
        jobId,
        photos: [],
        videos: [],
        totalSize: 0,
        blockchainVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    await this.db.collection('job_report_media').updateOne(
      { jobId },
      { ...update, $set: { updatedAt: new Date() } }
    )
  }

  /**
   * Delete photo
   */
  async deletePhoto(photoId: string): Promise<void> {
    const photo = await this.db.collection('job_photos').findOne({ id: photoId })
    if (!photo) return

    // TODO: Delete from storage
    await this.db.collection('job_photos').deleteOne({ id: photoId })
    
    // Update job report media
    await this.db.collection('job_report_media').updateOne(
      { jobId: photo.jobId },
      { $pull: { photos: { id: photoId } } }
    )
  }

  /**
   * Generate PDF report with photos
   */
  async generatePDFReport(jobId: string): Promise<Buffer> {
    const media = await this.getJobMedia(jobId)
    if (!media) throw new Error('Job media not found')

    // TODO: Implement PDF generation with:
    // - Job details
    // - Before/after photo comparison
    // - Work performed description
    // - Parts used
    // - Cost breakdown
    // - Customer signature
    // - Plumber signature
    // - Blockchain verification QR code

    return Buffer.from('PDF generation not implemented yet')
  }

  /**
   * Export job report to cloud storage
   */
  async exportToCloud(jobId: string, provider: 'aws' | 'google' | 'azure'): Promise<string> {
    const media = await this.getJobMedia(jobId)
    if (!media) throw new Error('Job media not found')

    // TODO: Implement cloud export
    // - Upload all photos and videos
    // - Generate shareable link
    // - Set expiration (optional)

    return 'https://cloud-storage.example.com/job-reports/' + jobId
  }
}
