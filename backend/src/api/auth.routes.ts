/**
 * Authentication Routes
 * User signup, login, and token management
 */

import express, { Router, Request, Response } from 'express'
import { Db } from 'mongodb'
import { generateToken, verifyToken } from '../middleware/auth.js'

export function createAuthRouter(db: Db): Router {
  const router = express.Router()
  const usersCollection = db.collection('users')

  /**
   * POST /auth/signup
   * Create new user account
   */
  router.post('/signup', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name, role } = req.body

      // Validate input
      if (!email || !password || !name) {
        res.status(400).json({ error: 'Missing required fields: email, password, name' })
        return
      }

      // Check if user exists
      const existingUser = await usersCollection.findOne({ email })
      if (existingUser) {
        res.status(400).json({ error: 'User already exists' })
        return
      }

      // Create user (in production, hash password with bcrypt)
      const user = {
        email,
        password, // WARNING: Store hashed passwords in production
        name,
        role: role || 'customer',
        createdAt: new Date()
      }

      const result = await usersCollection.insertOne(user)

      // Generate token
      const token = generateToken({
        id: result.insertedId.toString(),
        email,
        role: user.role
      })

      res.status(201).json({
        userId: result.insertedId,
        token,
        user: { email, name, role: user.role }
      })
    } catch (error: any) {
      console.error('Error in signup:', error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * POST /auth/login
   * Authenticate user and return JWT token
   */
  router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body

      // Validate input
      if (!email || !password) {
        res.status(400).json({ error: 'Missing email or password' })
        return
      }

      // Find user
      const user = await usersCollection.findOne({ email })
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' })
        return
      }

      // Verify password (in production, use bcrypt.compare)
      if (user.password !== password) {
        res.status(401).json({ error: 'Invalid email or password' })
        return
      }

      // Generate token
      const token = generateToken({
        id: user._id.toString(),
        email: user.email,
        role: user.role
      })

      res.json({
        userId: user._id,
        token,
        user: { email: user.email, name: user.name, role: user.role }
      })
    } catch (error: any) {
      console.error('Error in login:', error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * POST /auth/verify
   * Verify JWT token
   */
  router.post('/verify', (req: Request, res: Response): void => {
    try {
      const { token } = req.body

      if (!token) {
        res.status(400).json({ error: 'Missing token' })
        return
      }

      const decoded = verifyToken(token)
      if (!decoded) {
        res.status(401).json({ error: 'Invalid token' })
        return
      }

      res.json({ valid: true, user: decoded })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * GET /auth/profile
   * Get current user profile (requires auth)
   */
  router.get('/profile', async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(' ')[1]

      if (!token) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const decoded = verifyToken(token)
      if (!decoded) {
        res.status(401).json({ error: 'Invalid token' })
        return
      }

      // Fetch user details
      const user = await usersCollection.findOne({ email: decoded.email })
      if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      res.json({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * PUT /auth/profile
   * Update user profile
   */
  router.put('/profile', async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(' ')[1]

      if (!token) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const decoded = verifyToken(token)
      if (!decoded) {
        res.status(401).json({ error: 'Invalid token' })
        return
      }

      const { name, role } = req.body

      const user = await usersCollection.findOne({ email: decoded.email })
      if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      // Update user
      const result = await usersCollection.updateOne(
        { _id: user._id },
        { $set: { ...(name && { name }), ...(role && { role }) } }
      )

      res.json({
        message: 'Profile updated',
        modifiedCount: result.modifiedCount
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  return router
}
