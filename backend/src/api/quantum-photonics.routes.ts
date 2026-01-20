/**
 * Quantum Photonics API Routes
 * Endpoints for quantum sensor management and measurements
 * 
 * Copyright © 2026 - All Rights Reserved
 */

import { Router } from 'express'
import { Db } from 'mongodb'
import { QuantumPhotonicsService } from '../services/quantum-photonics'

export function createQuantumPhotonicsRoutes(db: Db): Router {
  const router = Router()
  const quantumService = new QuantumPhotonicsService(db)

  /**
   * Register a quantum photonics sensor
   * POST /api/quantum-photonics/register
   */
  router.post('/register', async (req, res) => {
    try {
      const sensor = req.body
      const sensorId = await quantumService.registerPhotonicSensor(sensor)
      
      res.json({
        success: true,
        sensorId,
        message: 'Quantum photonics sensor registered successfully'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * Perform quantum photonic measurement
   * POST /api/quantum-photonics/measure
   */
  router.post('/measure', async (req, res) => {
    try {
      const { sensorId, propertyId } = req.body
      const measurement = await quantumService.performPhotonicMeasurement(sensorId, propertyId)
      
      res.json({
        success: true,
        measurement
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * Setup entangled sensor pair
   * POST /api/quantum-photonics/entangle
   */
  router.post('/entangle', async (req, res) => {
    try {
      const { sensor1Id, sensor2Id, propertyId } = req.body
      const result = await quantumService.setupEntangledSensorPair(sensor1Id, sensor2Id, propertyId)
      
      res.json({
        success: true,
        ...result
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * Perform quantum interferometry
   * POST /api/quantum-photonics/interferometry
   */
  router.post('/interferometry', async (req, res) => {
    try {
      const { propertyId, sensorId } = req.body
      const result = await quantumService.performQuantumInterferometry(propertyId, sensorId)
      
      res.json({
        success: true,
        ...result
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * Use squeezed light sensing
   * POST /api/quantum-photonics/squeezed-light
   */
  router.post('/squeezed-light', async (req, res) => {
    try {
      const { propertyId } = req.body
      const result = await quantumService.useSqueezedLightSensing(propertyId)
      
      res.json({
        success: true,
        ...result
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * Get quantum photonics statistics
   * GET /api/quantum-photonics/stats/:propertyId
   */
  router.get('/stats/:propertyId', async (req, res) => {
    try {
      const { propertyId } = req.params
      const stats = await quantumService.getQuantumPhotonicsStats(propertyId)
      
      res.json({
        success: true,
        stats
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  return router
}
