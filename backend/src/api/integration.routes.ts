/**
 * Integration Hub API Routes
 * SCADA, GIS, ERP, and LoRaWAN connectivity
 * 
 * Copyright © 2026 - All Rights Reserved
 * Created: January 20, 2026
 */

import { Router, Request, Response } from 'express';
import { IntegrationHubService } from '../services/integration-hub.js';

const router = Router();
const integrationHub = new IntegrationHubService();

// ==================== Integration Status ====================

/**
 * GET /api/integration/status
 * Get status of all integrations
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await integrationHub.getIntegrationStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== LoRaWAN Endpoints ====================

/**
 * POST /api/integration/lorawan/register
 * Register new LoRaWAN device
 */
router.post('/lorawan/register', async (req: Request, res: Response) => {
  try {
    const device = req.body;
    const success = await integrationHub.registerLoRaWANDevice(device);
    res.json({ success, deviceEUI: device.deviceEUI });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/integration/lorawan/message
 * Process incoming LoRaWAN message (webhook from TTN/Chirpstack)
 */
router.post('/lorawan/message', async (req: Request, res: Response) => {
  try {
    const message = req.body;
    await integrationHub.processLoRaWANMessage(message);
    res.json({ success: true, processed: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ERP Endpoints ====================

/**
 * POST /api/integration/erp/sync
 * Trigger ERP synchronization
 */
router.post('/erp/sync', async (req: Request, res: Response) => {
  try {
    await integrationHub.syncWithERP();
    res.json({ success: true, syncedAt: new Date() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/integration/erp/work-order
 * Create work order in ERP
 */
router.post('/erp/work-order', async (req: Request, res: Response) => {
  try {
    const { type, priority, assetId, description, detectedAt } = req.body;
    const workOrderId = await integrationHub.createERPWorkOrder({
      type,
      priority,
      assetId,
      description,
      detectedAt: new Date(detectedAt)
    });
    res.json({ success: true, workOrderId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SCADA Endpoints ====================

/**
 * GET /api/integration/scada/read/:pointId
 * Read value from SCADA system
 */
router.get('/scada/read/:pointId', async (req: Request, res: Response) => {
  try {
    const { pointId } = req.params;
    const value = await integrationHub.readFromSCADA(pointId);
    res.json({ pointId, value, timestamp: new Date() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/integration/scada/write
 * Write value to SCADA system
 */
router.post('/scada/write', async (req: Request, res: Response) => {
  try {
    const { pointId, value } = req.body;
    await integrationHub.sendToSCADA({
      pointId,
      value,
      timestamp: new Date()
    });
    res.json({ success: true, pointId, value });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== GIS Endpoints ====================

/**
 * GET /api/integration/gis/asset/:assetId
 * Get asset location from GIS
 */
router.get('/gis/asset/:assetId', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const location = await integrationHub.getAssetLocation(assetId);
    res.json({ assetId, location });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/integration/gis/optimize-route
 * Optimize technician route using GIS
 */
router.post('/gis/optimize-route', async (req: Request, res: Response) => {
  try {
    const { workOrderIds } = req.body;
    const optimizedRoute = await integrationHub.optimizeTechnicianRoute(workOrderIds);
    res.json({ optimizedRoute });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Unified Data Flow ====================

/**
 * POST /api/integration/reading
 * Process unified reading from any source
 */
router.post('/reading', async (req: Request, res: Response) => {
  try {
    const { source, reading } = req.body;
    await integrationHub.processUnifiedReading(source, reading);
    res.json({ success: true, source, processedAt: new Date() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
