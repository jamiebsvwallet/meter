import { Router, Request, Response } from 'express'
import { Db } from 'mongodb'
import { PlumbingService } from '../lookup-services/PlumbingService.js'

/**
 * Consent & Access Control API Routes
 * Manages permissions and audit trails
 */
export function createConsentRouter(db: Db): Router {
  const router = Router()
  const service = new PlumbingService(db)

  /**
   * POST /api/consent/:propertyId/setup
   * Initialize consent for new property
   */
  router.post('/:propertyId/setup', async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params
      const { customerId, plumberId } = req.body

      if (!customerId || !plumberId) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      await service.setupPropertyConsent(propertyId, customerId, plumberId)

      res.json({
        success: true,
        propertyId,
        setup: true
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * GET /api/consent/:propertyId/summary
   * Get consent summary for customer
   */
  router.get('/:propertyId/summary', async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params

      const summary = await service.getConsentSummary(propertyId)
      res.json(summary)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * POST /api/consent/:propertyId/grant-water-company
   * Customer grants water company access
   */
  router.post('/:propertyId/grant-water-company', async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params
      const { companyId, reason, expirationDays } = req.body

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID required' })
      }

      // Verify customer is owner
      const entityId = (req as any).user?.id
      const allowed = await service.checkAccess(propertyId, entityId, 'customer')

      if (!allowed) {
        return res.status(403).json({ error: 'Only customer can grant access' })
      }

      await service.grantWaterCompanyAccess(propertyId, companyId, reason, expirationDays)

      res.json({
        success: true,
        propertyId,
        companyId,
        grantedAt: new Date()
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * DELETE /api/consent/:propertyId/water-company/:companyId
   * Customer revokes water company access
   */
  router.delete('/:propertyId/water-company/:companyId', async (req: Request, res: Response) => {
    try {
      const { propertyId, companyId } = req.params

      // Verify customer is owner
      const entityId = (req as any).user?.id
      const allowed = await service.checkAccess(propertyId, entityId, 'customer')

      if (!allowed) {
        return res.status(403).json({ error: 'Only customer can revoke access' })
      }

      await service.revokeWaterCompanyAccess(propertyId, companyId)

      res.json({
        success: true,
        propertyId,
        companyId,
        revokedAt: new Date()
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * GET /api/consent/:propertyId/access/:entityId/:entityType
   * Check if entity has access
   */
  router.get('/:propertyId/access/:entityId/:entityType', async (req: Request, res: Response) => {
    try {
      const { propertyId, entityId, entityType } = req.params

      const hasAccess = await service.checkAccess(
        propertyId,
        entityId,
        entityType as 'customer' | 'plumber' | 'water_company'
      )

      res.json({
        propertyId,
        entityId,
        entityType,
        hasAccess
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * GET /api/consent/:propertyId/audit-trail
   * Get consent audit trail
   */
  router.get('/:propertyId/audit-trail', async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params

      const trail = await service.getConsentAuditTrail(propertyId)
      res.json(trail)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * GET /api/water-company/:companyId/properties
   * Get all properties water company has access to
   */
  router.get('/water-company/:companyId/properties', async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params

      const properties = await service.getWaterCompanyProperties(companyId)
      res.json(properties)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  return router
}
