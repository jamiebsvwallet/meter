/**
 * Comprehensive Security Middleware
 * Implements industry-standard security practices for production deployment
 */

import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { body, param, query, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import compression from 'compression'
import hpp from 'hpp'
// @ts-ignore - hpp doesn't have type definitions

/**
 * Security Headers Middleware (Helmet)
 * Protects against common vulnerabilities
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
})

/**
 * Rate Limiting - API Abuse Prevention
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: any, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((req.rateLimit?.resetTime || Date.now()) / 1000)
    })
  }
})

/**
 * Strict Rate Limiting for Authentication Endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true
})

/**
 * CORS Configuration
 */
export const corsOptions = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ]
    
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
  maxAge: 86400 // 24 hours
})

/**
 * HTTP Parameter Pollution Protection
 */
export const httpPollutionProtection = hpp({
  whitelist: ['propertyId', 'deviceId', 'status', 'type', 'severity']
})

/**
 * Response Compression
 */
export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  },
  level: 6
})

/**
 * Input Validation Middleware
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    })
  }
  next()
}

/**
 * Sanitize Input - Remove dangerous characters
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Common Validation Rules
 */
export const validationRules = {
  propertyId: param('propertyId')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid property ID format'),

  deviceId: param('deviceId')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid device ID format'),

  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),

  password: body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),

  readingValue: body('value')
    .isNumeric()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Reading value must be between 0 and 10000'),

  coordinates: [
    body('x').isNumeric().isFloat({ min: -1000, max: 1000 }),
    body('y').isNumeric().isFloat({ min: -1000, max: 1000 }),
    body('z').isNumeric().isFloat({ min: -1000, max: 1000 })
  ],

  dateRange: [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date')
  ],

  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
  ]
}

/**
 * SQL Injection Prevention
 */
export const preventSQLInjection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
    /(--|\#|\/\*|\*\/)/,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i
  ]

  const checkString = (str: string): boolean => {
    return sqlPatterns.some(pattern => pattern.test(str))
  }

  const checkObject = (obj: any): boolean => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && checkString(obj[key])) {
        return true
      }
      if (typeof obj[key] === 'object' && checkObject(obj[key])) {
        return true
      }
    }
    return false
  }

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Potential SQL injection detected'
    })
  }

  next()
}

/**
 * XSS Protection
 */
export const preventXSS = (req: Request, res: Response, next: NextFunction) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ]

  const sanitizeString = (str: string): string => {
    let sanitized = str
    xssPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '')
    })
    return sanitized
  }

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj)
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject)
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {}
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key])
      }
      return sanitized
    }
    return obj
  }

  req.body = sanitizeObject(req.body)
  req.query = sanitizeObject(req.query)
  req.params = sanitizeObject(req.params)

  next()
}

/**
 * Request Size Limiter (DoS Protection)
 */
export const requestSizeLimiter = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10)
    const maxBytes = parseSize(maxSize)

    if (contentLength > maxBytes) {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: `Request body exceeds ${maxSize}`
      })
    }

    next()
  }
}

function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  }

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)?$/)
  if (!match) return 0

  const value = parseFloat(match[1])
  const unit = match[2] || 'b'

  return value * units[unit]
}

/**
 * Security Headers for API Responses
 */
export const secureResponseHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.removeHeader('X-Powered-By')
  next()
}

/**
 * API Key Validation (for IoT devices)
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string

  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required'
    })
  }

  // In production, validate against database
  // For now, accept any key starting with 'meter_'
  if (!apiKey.startsWith('meter_')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API key'
    })
  }

  next()
}

/**
 * GDPR Compliance Headers
 */
export const gdprHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Data-Processing', 'consent-required')
  res.setHeader('X-Privacy-Policy', '/privacy')
  res.setHeader('X-Data-Retention', '90-days')
  next()
}

export default {
  securityHeaders,
  apiLimiter,
  authLimiter,
  corsOptions,
  httpPollutionProtection,
  compressionMiddleware,
  validateRequest,
  sanitizeInput,
  validationRules,
  preventSQLInjection,
  preventXSS,
  requestSizeLimiter,
  secureResponseHeaders,
  validateApiKey,
  gdprHeaders
}
