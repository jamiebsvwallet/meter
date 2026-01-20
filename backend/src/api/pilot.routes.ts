/**
 * Pilot Program Signup API Routes
 * Handles customer signups for free water management pilot
 */

import { Router } from 'express'
import { MongoClient } from 'mongodb'

const router = Router()

interface PilotSignup {
  fullName: string
  email: string
  phone: string
  propertyAddress: string
  propertyType: 'house' | 'flat' | 'commercial' | 'multi-unit'
  numberOfOccupants: string
  estimatedMonthlyBill: string
  knownLeaks: 'yes' | 'no' | 'unsure'
  previousLeakIssues: string
  hasSmartMeter: 'yes' | 'no' | 'unsure'
  meterType: string
  agreeToTerms: boolean
  agreeToDataSharing: boolean
  signupDate?: Date
  status?: 'pending' | 'contacted' | 'scheduled' | 'active' | 'declined'
}

/**
 * POST /api/pilot/signup
 * Submit pilot program application
 */
router.post('/signup', async (req, res) => {
  try {
    const signupData: PilotSignup = req.body

    // Validation
    if (!signupData.fullName || !signupData.email || !signupData.phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, or phone'
      })
    }

    if (!signupData.agreeToTerms || !signupData.agreeToDataSharing) {
      return res.status(400).json({
        success: false,
        error: 'Terms and data sharing consent required'
      })
    }

    // Add metadata
    const fullSignup = {
      ...signupData,
      signupDate: new Date(),
      status: 'pending' as const
    }

    // Store in database
    const db = (req as any).db
    const result = await db.collection('pilot_signups').insertOne(fullSignup)

    // TODO: Send confirmation email
    // TODO: Notify admin/plumber of new signup

    res.json({
      success: true,
      message: 'Signup received! We\'ll contact you within 24-48 hours.',
      signupId: result.insertedId
    })

  } catch (error) {
    console.error('Pilot signup error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process signup'
    })
  }
})

/**
 * GET /api/pilot/signups
 * Get all pilot signups (admin only)
 */
router.get('/signups', async (req, res) => {
  try {
    const db = (req as any).db
    const signups = await db.collection('pilot_signups')
      .find({})
      .sort({ signupDate: -1 })
      .toArray()

    res.json({
      success: true,
      count: signups.length,
      signups
    })

  } catch (error) {
    console.error('Error fetching signups:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch signups'
    })
  }
})

/**
 * PATCH /api/pilot/signups/:id/status
 * Update signup status (admin only)
 */
router.patch('/signups/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    const db = (req as any).db
    const result = await db.collection('pilot_signups').updateOne(
      { _id: id },
      {
        $set: {
          status,
          notes,
          lastUpdated: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Signup not found'
      })
    }

    res.json({
      success: true,
      message: 'Status updated'
    })

  } catch (error) {
    console.error('Error updating signup:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    })
  }
})

export default router
