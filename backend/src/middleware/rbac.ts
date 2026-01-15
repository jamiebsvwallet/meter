/**
 * Role-Based Access Control (RBAC) Middleware
 * Granular permissions for different user roles
 */

import { Request, Response, NextFunction } from 'express'
import { complianceService, AuditEventType } from '../services/compliance.js'

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  WATER_COMPANY = 'water_company',
  PLUMBER = 'plumber',
  CUSTOMER = 'customer',
  IOT_DEVICE = 'iot_device',
  AI_MONITOR = 'ai_monitor',
  READONLY = 'readonly'
}

export enum Permission {
  // User management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Property management
  PROPERTY_CREATE = 'property:create',
  PROPERTY_READ = 'property:read',
  PROPERTY_UPDATE = 'property:update',
  PROPERTY_DELETE = 'property:delete',

  // IoT device management
  DEVICE_CREATE = 'device:create',
  DEVICE_READ = 'device:read',
  DEVICE_UPDATE = 'device:update',
  DEVICE_DELETE = 'device:delete',
  DEVICE_WRITE_DATA = 'device:write_data',

  // Job management
  JOB_CREATE = 'job:create',
  JOB_READ = 'job:read',
  JOB_UPDATE = 'job:update',
  JOB_ASSIGN = 'job:assign',
  JOB_COMPLETE = 'job:complete',

  // AI/ML operations
  AI_READ = 'ai:read',
  AI_CONFIGURE = 'ai:configure',
  AI_TRAIN = 'ai:train',
  AI_DEPLOY = 'ai:deploy',

  // Demand forecasting
  FORECAST_READ = 'forecast:read',
  FORECAST_CREATE = 'forecast:create',

  // Analytics
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_EXPORT = 'analytics:export',

  // System administration
  SYSTEM_CONFIGURE = 'system:configure',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_AUDIT = 'system:audit',

  // Compliance
  COMPLIANCE_READ = 'compliance:read',
  COMPLIANCE_MANAGE = 'compliance:manage',

  // Consent management
  CONSENT_READ = 'consent:read',
  CONSENT_MANAGE = 'consent:manage'
}

// Role to permissions mapping
const ROLE_PERMISSIONS: Map<UserRole, Permission[]> = new Map([
  [UserRole.SUPER_ADMIN, [
    // Super admin has all permissions
    ...Object.values(Permission)
  ]],

  [UserRole.ADMIN, [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.PROPERTY_CREATE,
    Permission.PROPERTY_READ,
    Permission.PROPERTY_UPDATE,
    Permission.DEVICE_CREATE,
    Permission.DEVICE_READ,
    Permission.DEVICE_UPDATE,
    Permission.JOB_CREATE,
    Permission.JOB_READ,
    Permission.JOB_UPDATE,
    Permission.JOB_ASSIGN,
    Permission.AI_READ,
    Permission.AI_CONFIGURE,
    Permission.FORECAST_READ,
    Permission.FORECAST_CREATE,
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_EXPORT,
    Permission.SYSTEM_LOGS,
    Permission.COMPLIANCE_READ,
    Permission.CONSENT_MANAGE
  ]],

  [UserRole.WATER_COMPANY, [
    Permission.PROPERTY_READ,
    Permission.DEVICE_READ,
    Permission.JOB_CREATE,
    Permission.JOB_READ,
    Permission.JOB_ASSIGN,
    Permission.AI_READ,
    Permission.FORECAST_READ,
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_EXPORT,
    Permission.COMPLIANCE_READ
  ]],

  [UserRole.PLUMBER, [
    Permission.PROPERTY_READ,
    Permission.DEVICE_READ,
    Permission.JOB_READ,
    Permission.JOB_UPDATE,
    Permission.JOB_COMPLETE
  ]],

  [UserRole.CUSTOMER, [
    Permission.PROPERTY_READ,
    Permission.DEVICE_READ,
    Permission.JOB_READ,
    Permission.CONSENT_READ,
    Permission.CONSENT_MANAGE,
    Permission.ANALYTICS_READ
  ]],

  [UserRole.IOT_DEVICE, [
    Permission.DEVICE_WRITE_DATA,
    Permission.DEVICE_READ
  ]],

  [UserRole.AI_MONITOR, [
    Permission.AI_READ,
    Permission.FORECAST_READ,
    Permission.ANALYTICS_READ,
    Permission.DEVICE_READ,
    Permission.PROPERTY_READ
  ]],

  [UserRole.READONLY, [
    Permission.PROPERTY_READ,
    Permission.DEVICE_READ,
    Permission.JOB_READ,
    Permission.ANALYTICS_READ
  ]]
])

/**
 * Extended Request interface with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string | UserRole
    propertyIds?: string[]
    permissions?: Permission[]
    iat: number
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS.get(role)
  return permissions ? permissions.includes(permission) : false
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission))
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission))
}

/**
 * Middleware to require authentication
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    complianceService.logSecurityEvent(
      AuditEventType.UNAUTHORIZED_ACCESS,
      {
        path: req.path,
        ip: req.ip,
        method: req.method
      },
      'medium'
    )

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    })
  }

  const token = authHeader.substring(7)

  // In production: verify JWT token
  // For now, decode mock token
  try {
    // Mock user extraction (replace with actual JWT verification)
    const mockUser = {
      id: 'user_123',
      email: 'demo@plumbing.local',
      role: UserRole.ADMIN,
      propertyIds: ['prop_001'],
      permissions: ROLE_PERMISSIONS.get(UserRole.ADMIN),
      iat: Math.floor(Date.now() / 1000)
    }

    req.user = mockUser
    next()
  } catch (error) {
    complianceService.logSecurityEvent(
      AuditEventType.UNAUTHORIZED_ACCESS,
      {
        error: 'Invalid token',
        path: req.path,
        ip: req.ip
      },
      'high'
    )

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    })
  }
}

/**
 * Middleware to require specific permission
 */
export const requirePermission = (permission: Permission) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      })
    }

    // Convert string role to UserRole enum if needed
    const userRole = typeof req.user.role === 'string' 
      ? (req.user.role as UserRole) 
      : req.user.role

    const userPermissions = ROLE_PERMISSIONS.get(userRole) || []

    if (!userPermissions.includes(permission)) {
      complianceService.logSecurityEvent(
        AuditEventType.UNAUTHORIZED_ACCESS,
        {
          userId: req.user.id,
          requiredPermission: permission,
          userRole: req.user.role,
          path: req.path
        },
        'medium'
      )

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        requiredPermission: permission
      })
    }

    next()
  }
}

/**
 * Middleware to require any of the specified permissions
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      })
    }

    // Convert string role to UserRole enum if needed
    const userRole = typeof req.user.role === 'string' 
      ? (req.user.role as UserRole) 
      : req.user.role

    const userPermissions = ROLE_PERMISSIONS.get(userRole) || []
    const hasAccess = permissions.some(p => userPermissions.includes(p))

    if (!hasAccess) {
      complianceService.logSecurityEvent(
        AuditEventType.UNAUTHORIZED_ACCESS,
        {
          userId: req.user.id,
          requiredPermissions: permissions,
          userRole: req.user.role,
          path: req.path
        },
        'medium'
      )

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        requiredPermissions: permissions
      })
    }

    next()
  }
}

/**
 * Middleware to require specific role
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      })
    }

    // Convert string role to UserRole enum if needed
    const userRole = typeof req.user.role === 'string' 
      ? (req.user.role as UserRole) 
      : req.user.role

    if (!allowedRoles.includes(userRole)) {
      complianceService.logSecurityEvent(
        AuditEventType.UNAUTHORIZED_ACCESS,
        {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          path: req.path
        },
        'medium'
      )

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access restricted to specific roles',
        requiredRoles: allowedRoles
      })
    }

    next()
  }
}

/**
 * Middleware to check property ownership
 */
export const requirePropertyOwnership = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    })
  }

  const propertyId = req.params.propertyId || req.body.propertyId

  // Convert string role to UserRole enum if needed
  const userRole = typeof req.user.role === 'string' 
    ? (req.user.role as UserRole) 
    : req.user.role

  // Super admins and water companies can access all properties
  if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.WATER_COMPANY) {
    return next()
  }

  // Check if user owns the property
  if (!req.user.propertyIds?.includes(propertyId)) {
    complianceService.logSecurityEvent(
      AuditEventType.UNAUTHORIZED_ACCESS,
      {
        userId: req.user.id,
        propertyId,
        userPropertyIds: req.user.propertyIds,
        path: req.path
      },
      'high'
    )

    return res.status(403).json({
      error: 'Forbidden',
      message: 'Property access denied'
    })
  }

  next()
}

/**
 * Get user permissions
 */
export function getUserPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS.get(role) || []
}

export default {
  UserRole,
  Permission,
  requireAuth,
  requirePermission,
  requireAnyPermission,
  requireRole,
  requirePropertyOwnership,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions
}
