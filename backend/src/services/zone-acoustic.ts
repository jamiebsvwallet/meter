/**
 * Zone Identification & Acoustic Leak Detection Service
 * Advanced leak pinpointing using zone triangulation and acoustic signatures
 */

import type { Db } from 'mongodb'

interface ZoneConfig {
  zoneId: string
  propertyId: string
  zoneName: string
  sensors: string[] // Device IDs in this zone
  boundaries: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
  pipingLayout: PipeSegment[]
}

interface PipeSegment {
  segmentId: string
  startPoint: { x: number; y: number; z: number }
  endPoint: { x: number; y: number; z: number }
  diameter: number // inches
  material: 'copper' | 'pvc' | 'steel' | 'pex'
}

interface AcousticReading {
  deviceId: string
  propertyId: string
  zoneId: string
  timestamp: Date
  frequency: number // Hz
  amplitude: number // dB
  signature: number[] // Acoustic signature array
  noiseFloor: number
}

interface LeakLocation {
  propertyId: string
  zoneId: string
  zoneName: string
  estimatedLocation: {
    x: number
    y: number
    z: number
    confidence: number
  }
  detectedBy: string[] // Sensor IDs that detected it
  acousticSignature: {
    frequency: number
    amplitude: number
    pattern: 'drip' | 'stream' | 'burst' | 'seepage'
  }
  distanceFromSensors: Array<{
    sensorId: string
    distance: number // meters
    signalStrength: number
  }>
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  timestamp: Date
}

export class ZoneIdentificationService {
  private db: Db
  private zones: Map<string, ZoneConfig> = new Map()

  constructor(db: Db) {
    this.db = db
  }

  /**
   * Register a zone configuration
   */
  async registerZone(zone: ZoneConfig): Promise<void> {
    this.zones.set(zone.zoneId, zone)
    
    await this.db.collection('zones').insertOne({
      ...zone,
      createdAt: new Date()
    })

    console.log(`✓ Zone registered: ${zone.zoneName} (${zone.sensors.length} sensors)`)
  }

  /**
   * Process acoustic readings and triangulate leak location
   */
  async processAcousticReadings(readings: AcousticReading[]): Promise<LeakLocation | null> {
    if (readings.length < 2) {
      console.log('Need at least 2 sensors for triangulation')
      return null
    }

    // Group by zone
    const zoneReadings = new Map<string, AcousticReading[]>()
    for (const reading of readings) {
      if (!zoneReadings.has(reading.zoneId)) {
        zoneReadings.set(reading.zoneId, [])
      }
      zoneReadings.get(reading.zoneId)!.push(reading)
    }

    // Process each zone
    for (const [zoneId, zoneData] of zoneReadings.entries()) {
      const zone = this.zones.get(zoneId) || await this.loadZone(zoneId)
      if (!zone) continue

      // Detect leak signature
      const leakDetected = this.detectLeakSignature(zoneData)
      if (!leakDetected) continue

      // Triangulate location
      const location = this.triangulateLeakLocation(zoneData, zone)
      if (location) {
        // Store in database
        await this.db.collection('leak_locations').insertOne(location)
        return location
      }
    }

    return null
  }

  /**
   * Detect leak from acoustic signature
   */
  private detectLeakSignature(readings: AcousticReading[]): boolean {
    for (const reading of readings) {
      // Leak frequencies typically 50-800 Hz
      // High amplitude relative to noise floor indicates leak
      const signalToNoise = reading.amplitude - reading.noiseFloor

      if (reading.frequency >= 50 && reading.frequency <= 800 && signalToNoise > 10) {
        return true
      }

      // Pattern detection
      if (this.analyzeSignaturePattern(reading.signature)) {
        return true
      }
    }

    return false
  }

  /**
   * Analyze acoustic pattern
   */
  private analyzeSignaturePattern(signature: number[]): boolean {
    if (signature.length < 10) return false

    // Calculate variance (leaks have irregular patterns)
    const mean = signature.reduce((a, b) => a + b, 0) / signature.length
    const variance = signature.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signature.length

    // High variance indicates turbulent flow (leak)
    return variance > 100
  }

  /**
   * Triangulate leak location using multiple sensors
   */
  private triangulateLeakLocation(readings: AcousticReading[], zone: ZoneConfig): LeakLocation | null {
    if (readings.length < 2) return null

    // Sort by signal strength
    const sortedReadings = readings.sort((a, b) => b.amplitude - a.amplitude)

    // Get sensor positions (simplified - in reality would use actual positions)
    const sensorPositions = sortedReadings.map((r, index) => ({
      deviceId: r.deviceId,
      x: index * 10, // Placeholder positions
      y: index * 5,
      z: 0,
      amplitude: r.amplitude
    }))

    // Calculate weighted centroid
    let totalWeight = 0
    let weightedX = 0
    let weightedY = 0
    let weightedZ = 0

    for (const pos of sensorPositions) {
      const weight = pos.amplitude
      totalWeight += weight
      weightedX += pos.x * weight
      weightedY += pos.y * weight
      weightedZ += pos.z * weight
    }

    const estimatedX = weightedX / totalWeight
    const estimatedY = weightedY / totalWeight
    const estimatedZ = weightedZ / totalWeight

    // Calculate confidence based on sensor agreement
    const confidence = this.calculateConfidence(sortedReadings)

    // Determine leak pattern
    const pattern = this.classifyLeakPattern(sortedReadings[0])

    // Determine severity
    const severity = this.determineSeverity(sortedReadings[0], pattern)

    // Calculate distances
    const distanceFromSensors = sensorPositions.map(pos => ({
      sensorId: pos.deviceId,
      distance: Math.sqrt(
        Math.pow(pos.x - estimatedX, 2) +
        Math.pow(pos.y - estimatedY, 2) +
        Math.pow(pos.z - estimatedZ, 2)
      ),
      signalStrength: pos.amplitude
    }))

    return {
      propertyId: readings[0].propertyId,
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      estimatedLocation: {
        x: estimatedX,
        y: estimatedY,
        z: estimatedZ,
        confidence
      },
      detectedBy: sortedReadings.map(r => r.deviceId),
      acousticSignature: {
        frequency: sortedReadings[0].frequency,
        amplitude: sortedReadings[0].amplitude,
        pattern
      },
      distanceFromSensors,
      severity,
      timestamp: new Date()
    }
  }

  /**
   * Calculate triangulation confidence
   */
  private calculateConfidence(readings: AcousticReading[]): number {
    if (readings.length < 2) return 0.3
    if (readings.length < 3) return 0.6
    if (readings.length < 4) return 0.8
    return 0.95
  }

  /**
   * Classify leak pattern from acoustic signature
   */
  private classifyLeakPattern(reading: AcousticReading): 'drip' | 'stream' | 'burst' | 'seepage' {
    const { frequency, amplitude } = reading

    // Burst: High amplitude, broad frequency
    if (amplitude > 80 && frequency > 500) {
      return 'burst'
    }

    // Stream: Medium-high amplitude, mid frequency
    if (amplitude > 60 && frequency > 200 && frequency < 600) {
      return 'stream'
    }

    // Drip: Lower amplitude, narrow frequency
    if (amplitude < 60 && frequency < 300) {
      return 'drip'
    }

    // Seepage: Low amplitude, low frequency
    return 'seepage'
  }

  /**
   * Determine leak severity
   */
  private determineSeverity(reading: AcousticReading, pattern: string): 'minor' | 'moderate' | 'major' | 'critical' {
    if (pattern === 'burst') return 'critical'
    if (pattern === 'stream' && reading.amplitude > 70) return 'major'
    if (pattern === 'stream') return 'moderate'
    return 'minor'
  }

  /**
   * Load zone configuration from database
   */
  private async loadZone(zoneId: string): Promise<ZoneConfig | null> {
    const zone = await this.db.collection('zones').findOne({ zoneId })
    if (zone) {
      this.zones.set(zoneId, zone as any)
      return zone as any
    }
    return null
  }

  /**
   * Get all zones for a property
   */
  async getPropertyZones(propertyId: string): Promise<ZoneConfig[]> {
    const zones = await this.db.collection('zones')
      .find({ propertyId })
      .toArray()
    
    return zones as any[]
  }

  /**
   * Get recent leak locations
   */
  async getRecentLeaks(propertyId: string, hours: number = 24): Promise<LeakLocation[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    const leaks = await this.db.collection('leak_locations')
      .find({
        propertyId,
        timestamp: { $gte: cutoff }
      })
      .sort({ timestamp: -1 })
      .toArray()

    return leaks as any[]
  }

  /**
   * Generate zone heatmap data
   */
  async generateZoneHeatmap(propertyId: string, hours: number = 24): Promise<any> {
    const leaks = await this.getRecentLeaks(propertyId, hours)
    const zones = await this.getPropertyZones(propertyId)

    const heatmap = zones.map(zone => {
      const zoneLeaks = leaks.filter(l => l.zoneId === zone.zoneId)
      const severity = zoneLeaks.reduce((sum, leak) => {
        const severityValue = { minor: 1, moderate: 2, major: 3, critical: 4 }
        return sum + (severityValue[leak.severity] || 0)
      }, 0)

      return {
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        leakCount: zoneLeaks.length,
        severityScore: severity,
        riskLevel: severity > 10 ? 'high' : severity > 5 ? 'medium' : 'low'
      }
    })

    return {
      propertyId,
      timestamp: new Date(),
      zones: heatmap,
      totalLeaks: leaks.length
    }
  }
}

/**
 * Acoustic Camera Service
 * Visual representation of acoustic data for leak detection
 */
export class AcousticCameraService {
  private db: Db

  constructor(db: Db) {
    this.db = db
  }

  /**
   * Generate acoustic visualization data
   */
  async generateAcousticImage(
    propertyId: string,
    zoneId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<AcousticImage> {
    // Get acoustic readings for the time range
    const readings = await this.db.collection('acoustic_readings')
      .find({
        propertyId,
        zoneId,
        timestamp: { $gte: timeRange.start, $lte: timeRange.end }
      })
      .toArray() as any[]

    if (readings.length === 0) {
      return this.createEmptyImage(propertyId, zoneId)
    }

    // Create frequency-amplitude grid
    const grid = this.createFrequencyGrid(readings)

    // Detect hotspots (potential leaks)
    const hotspots = this.detectHotspots(grid, readings)

    return {
      propertyId,
      zoneId,
      timestamp: new Date(),
      timeRange,
      grid,
      hotspots,
      imageData: this.generateImageData(grid)
    }
  }

  /**
   * Create frequency grid for visualization
   */
  private createFrequencyGrid(readings: AcousticReading[]): number[][] {
    const gridSize = 50
    const grid: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0))

    for (const reading of readings) {
      // Map frequency (0-1000 Hz) to grid X (0-49)
      const x = Math.min(Math.floor((reading.frequency / 1000) * gridSize), gridSize - 1)
      // Map amplitude (0-100 dB) to grid Y (0-49)
      const y = Math.min(Math.floor((reading.amplitude / 100) * gridSize), gridSize - 1)
      
      grid[y][x] += 1
    }

    // Normalize
    const max = Math.max(...grid.flat())
    if (max > 0) {
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          grid[i][j] = grid[i][j] / max
        }
      }
    }

    return grid
  }

  /**
   * Detect hotspots in acoustic data
   */
  private detectHotspots(grid: number[][], readings: AcousticReading[]): Hotspot[] {
    const hotspots: Hotspot[] = []
    const threshold = 0.7

    for (let i = 1; i < grid.length - 1; i++) {
      for (let j = 1; j < grid[i].length - 1; j++) {
        if (grid[i][j] > threshold) {
          // Check if it's a local maximum
          const isLocalMax = 
            grid[i][j] > grid[i-1][j] &&
            grid[i][j] > grid[i+1][j] &&
            grid[i][j] > grid[i][j-1] &&
            grid[i][j] > grid[i][j+1]

          if (isLocalMax) {
            hotspots.push({
              x: j,
              y: i,
              intensity: grid[i][j],
              frequency: (j / grid[i].length) * 1000,
              amplitude: (i / grid.length) * 100,
              leakProbability: grid[i][j]
            })
          }
        }
      }
    }

    return hotspots.sort((a, b) => b.intensity - a.intensity).slice(0, 10)
  }

  /**
   * Generate image data for visualization
   */
  private generateImageData(grid: number[][]): string {
    // Create color-mapped image data (heatmap)
    // Returns base64 encoded PNG data
    const colors = grid.map(row => 
      row.map(val => {
        // Color map: blue (low) -> green -> yellow -> red (high)
        if (val < 0.25) return { r: 0, g: 0, b: Math.floor(255 * val * 4) }
        if (val < 0.5) return { r: 0, g: Math.floor(255 * (val - 0.25) * 4), b: 255 }
        if (val < 0.75) return { r: Math.floor(255 * (val - 0.5) * 4), g: 255, b: 0 }
        return { r: 255, g: Math.floor(255 * (1 - val) * 4), b: 0 }
      })
    )

    // In production, would generate actual PNG
    return `data:acoustic-heatmap:${grid.length}x${grid[0].length}`
  }

  /**
   * Create empty acoustic image
   */
  private createEmptyImage(propertyId: string, zoneId: string): AcousticImage {
    return {
      propertyId,
      zoneId,
      timestamp: new Date(),
      timeRange: { start: new Date(), end: new Date() },
      grid: Array(50).fill(0).map(() => Array(50).fill(0)),
      hotspots: [],
      imageData: 'data:acoustic-heatmap:50x50:empty'
    }
  }

  /**
   * Record acoustic reading
   */
  async recordAcousticReading(reading: AcousticReading): Promise<void> {
    await this.db.collection('acoustic_readings').insertOne({
      ...reading,
      recordedAt: new Date()
    })
  }
}

interface AcousticImage {
  propertyId: string
  zoneId: string
  timestamp: Date
  timeRange: { start: Date; end: Date }
  grid: number[][]
  hotspots: Hotspot[]
  imageData: string
}

interface Hotspot {
  x: number
  y: number
  intensity: number
  frequency: number
  amplitude: number
  leakProbability: number
}

// Singleton instances
export const zoneIdentificationService = (db: Db) => new ZoneIdentificationService(db)
export const acousticCameraService = (db: Db) => new AcousticCameraService(db)
