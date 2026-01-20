/**
 * Advanced Leak Detection API Routes
 * 
 * Endpoints for:
 * 1. Smart meter data overlay
 * 2. Neighborhood leak mapping
 * 3. 3D pipe infrastructure
 * 4. Acoustic signature analysis
 * 5. Failure hotspot heat map
 * 6. Consent management
 * 7. BSV blockchain submission
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import {
  SmartMeterService,
  NeighborhoodLeakService,
  PipeInfrastructureService,
  AcousticAnalysisService,
  FailureHotspotService,
  AdvancedLeakDetectionService
} from '../services/advanced-leak-detection';
import { ConsentManagementService } from '../services/consent-management';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================
// 1. SMART METER DATA OVERLAY
// ==========================================

/**
 * POST /api/advanced-leak-detection/smart-meter
 * Get smart meter consumption overlay for job
 */
router.post('/smart-meter', async (req: Request, res: Response) => {
  try {
    const { propertyId, jobId, leakDetectionStartTime, leakRepairEndTime } = req.body;

    if (!propertyId || !jobId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check consent
    const consentStatus = await ConsentManagementService.getConsentStatus(propertyId);
    if (!consentStatus.smartMeterAllowed) {
      return res.status(403).json({ 
        error: 'Smart meter access not granted',
        message: 'Customer must grant smart meter data access consent'
      });
    }

    const overlay = await SmartMeterService.getSmartMeterOverlay(
      propertyId,
      jobId,
      new Date(leakDetectionStartTime),
      new Date(leakRepairEndTime)
    );

    res.json(overlay);
  } catch (error: any) {
    console.error('Smart meter API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. NEIGHBORHOOD LEAK MAPPING
// ==========================================

/**
 * POST /api/advanced-leak-detection/neighborhood-map
 * Get neighborhood leak intelligence map
 */
router.post('/neighborhood-map', async (req: Request, res: Response) => {
  try {
    const { propertyId, jobId, propertyLocation, radiusMeters } = req.body;

    if (!propertyId || !jobId || !propertyLocation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check consent
    const consentStatus = await ConsentManagementService.getConsentStatus(propertyId);
    if (!consentStatus.neighborhoodSharingAllowed) {
      return res.status(403).json({ 
        error: 'Neighborhood data sharing not granted',
        message: 'Customer must consent to neighborhood leak mapping'
      });
    }

    const map = await NeighborhoodLeakService.getNeighborhoodLeakMap(
      propertyId,
      jobId,
      propertyLocation,
      radiusMeters || 500
    );

    res.json(map);
  } catch (error: any) {
    console.error('Neighborhood map API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. 3D PIPE INFRASTRUCTURE MAPPING
// ==========================================

/**
 * POST /api/advanced-leak-detection/pipe-infrastructure
 * Get 3D pipe infrastructure map
 */
router.post('/pipe-infrastructure', async (req: Request, res: Response) => {
  try {
    const { propertyId, jobId } = req.body;

    if (!propertyId || !jobId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const map = await PipeInfrastructureService.getPipeInfrastructureMap(
      propertyId,
      jobId
    );

    res.json(map);
  } catch (error: any) {
    console.error('Pipe infrastructure API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. ACOUSTIC SIGNATURE ANALYSIS
// ==========================================

/**
 * POST /api/advanced-leak-detection/acoustic-analysis
 * Analyze audio recording for leak signature
 */
router.post('/acoustic-analysis', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const { propertyId, jobId, location } = req.body;
    const audioFile = req.file;

    if (!propertyId || !jobId || !audioFile) {
      return res.status(400).json({ error: 'Missing required fields or audio file' });
    }

    const locationData = JSON.parse(location);
    const signature = await AcousticAnalysisService.analyzeAcousticSignature(
      propertyId,
      jobId,
      audioFile.buffer,
      locationData
    );

    res.json(signature);
  } catch (error: any) {
    console.error('Acoustic analysis API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. FAILURE HOTSPOT HEAT MAP
// ==========================================

/**
 * POST /api/advanced-leak-detection/hotspot-map
 * Generate failure hotspot heat map
 */
router.post('/hotspot-map', async (req: Request, res: Response) => {
  try {
    const { propertyId, jobId } = req.body;

    if (!propertyId || !jobId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const map = await FailureHotspotService.generateFailureHotspotMap(
      propertyId,
      jobId
    );

    res.json(map);
  } catch (error: any) {
    console.error('Hotspot map API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. GENERATE COMPLETE ADVANCED REPORT
// ==========================================

/**
 * POST /api/advanced-leak-detection/generate-report
 * Generate comprehensive report with all 5 features
 */
router.post('/generate-report', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const {
      jobId,
      propertyId,
      customerId,
      plumberId,
      leakDescription,
      leakLocation,
      detectedAt,
      repairedAt,
      propertyLocation,
      consents
    } = req.body;

    if (!jobId || !propertyId || !customerId || !plumberId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const parsedConsents = JSON.parse(consents);
    const parsedLeakLocation = JSON.parse(leakLocation);
    const parsedPropertyLocation = JSON.parse(propertyLocation);

    const audioBuffer = req.file ? req.file.buffer : null;

    const report = await AdvancedLeakDetectionService.generateAdvancedReport(
      jobId,
      propertyId,
      customerId,
      plumberId,
      {
        description: leakDescription,
        location: parsedLeakLocation,
        detectedAt: new Date(detectedAt),
        repairedAt: new Date(repairedAt)
      },
      parsedPropertyLocation,
      audioBuffer,
      {
        smartMeterAccess: parsedConsents.smartMeterAccess,
        neighborhoodDataSharing: parsedConsents.neighborhoodDataSharing,
        waterCompanyAccess: parsedConsents.waterCompanyAccess
      }
    );

    // TODO: Save report to MongoDB

    res.json(report);
  } catch (error: any) {
    console.error('Generate report API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 7. BLOCKCHAIN SUBMISSION
// ==========================================

/**
 * POST /api/advanced-leak-detection/submit-to-blockchain
 * Submit all data hashes to BSV blockchain
 */
router.post('/submit-to-blockchain', async (req: Request, res: Response) => {
  try {
    const {
      jobId,
      propertyId,
      smartMeterHash,
      neighborLeakHash,
      pipeInfraHash,
      acousticHash,
      hotspotHash,
      consents
    } = req.body;

    if (!jobId || !propertyId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // TODO: Fetch full report from MongoDB
    // For now, create mock report with provided hashes
    const mockReport: any = {
      jobId,
      propertyId,
      blockchainProof: {
        smartMeterHash: smartMeterHash || '',
        neighborLeakHash: neighborLeakHash || '',
        pipeInfraHash: pipeInfraHash || '',
        acousticHash: acousticHash || '',
        hotspotHash: hotspotHash || '',
        combinedHash: '',
        txid: null,
        blockHeight: null
      }
    };

    const txid = await AdvancedLeakDetectionService.submitToBlockchain(mockReport);

    res.json({
      success: true,
      txid,
      blockHeight: mockReport.blockchainProof.blockHeight,
      message: 'Successfully submitted to BSV blockchain'
    });
  } catch (error: any) {
    console.error('Blockchain submission API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 8. CONSENT MANAGEMENT ENDPOINTS
// ==========================================

/**
 * POST /api/advanced-leak-detection/consent/create
 * Create initial consent record
 */
router.post('/consent/create', async (req: Request, res: Response) => {
  try {
    const {
      propertyId,
      customerId,
      consents,
      ipAddress,
      deviceInfo,
      consentVersion
    } = req.body;

    if (!propertyId || !customerId || !consents) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const record = await ConsentManagementService.createConsentRecord(
      propertyId,
      customerId,
      consents,
      {
        ipAddress: ipAddress || req.ip || 'unknown',
        deviceInfo: deviceInfo || req.headers['user-agent'] || 'unknown',
        consentVersion: consentVersion || 'v1.0'
      }
    );

    res.json(record);
  } catch (error: any) {
    console.error('Create consent API error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/advanced-leak-detection/consent/:id
 * Update consent preferences
 */
router.put('/consent/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { customerId, updates, reason } = req.body;

    if (!customerId || !updates) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const record = await ConsentManagementService.updateConsent(
      id,
      customerId,
      updates,
      {
        ipAddress: req.ip || 'unknown',
        reason: reason || 'User preference update'
      }
    );

    res.json(record);
  } catch (error: any) {
    console.error('Update consent API error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/advanced-leak-detection/consent/:id
 * Revoke all consents (GDPR right to withdraw)
 */
router.delete('/consent/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { customerId, reason } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Missing customerId' });
    }

    const record = await ConsentManagementService.revokeAllConsents(
      id,
      customerId,
      {
        ipAddress: req.ip || 'unknown',
        reason: reason || 'User requested revocation'
      }
    );

    res.json(record);
  } catch (error: any) {
    console.error('Revoke consent API error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/advanced-leak-detection/consent/status/:propertyId
 * Get consent status for property
 */
router.get('/consent/status/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;

    const status = await ConsentManagementService.getConsentStatus(propertyId);

    res.json(status);
  } catch (error: any) {
    console.error('Get consent status API error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced-leak-detection/consent/:id/authorize-party
 * Authorize third party access
 */
router.post('/consent/:id/authorize-party', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { customerId, party } = req.body;

    if (!customerId || !party) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const record = await ConsentManagementService.authorizeParty(
      id,
      customerId,
      party
    );

    res.json(record);
  } catch (error: any) {
    console.error('Authorize party API error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/advanced-leak-detection/consent/:id/party/:partyId
 * Revoke party access
 */
router.delete('/consent/:id/party/:partyId', async (req: Request, res: Response) => {
  try {
    const { id, partyId } = req.params;
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Missing customerId' });
    }

    const record = await ConsentManagementService.revokePartyAccess(
      id,
      customerId,
      partyId
    );

    res.json(record);
  } catch (error: any) {
    console.error('Revoke party API error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/advanced-leak-detection/consent/export/:customerId
 * Export customer consent history (GDPR data portability)
 */
router.get('/consent/export/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    const exportData = await ConsentManagementService.exportConsentHistory(customerId);

    res.json(exportData);
  } catch (error: any) {
    console.error('Export consent API error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/advanced-leak-detection/consent/customer/:customerId
 * Delete customer data (GDPR right to erasure)
 */
router.delete('/consent/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    const result = await ConsentManagementService.deleteCustomerData(customerId);

    res.json(result);
  } catch (error: any) {
    console.error('Delete customer data API error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
