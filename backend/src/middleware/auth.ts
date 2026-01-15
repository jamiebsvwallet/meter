/**
 * Authentication Middleware
 * JWT token verification and user authentication
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
        iat: number
      }
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * Middleware to verify JWT token
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized: Missing token' })
    return
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Invalid token format' })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' })
  }
}

/**
 * Middleware to verify role
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: User not found' })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' })
      return
    }

    next()
  }
}

/**
 * Generate JWT token
 */
export const generateToken = (user: { id: string; email: string; role: string }): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' })
}

/**
 * Verify token
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}
