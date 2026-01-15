/**
 * ML Prediction Service
 * Provides machine learning models for leak prediction and anomaly detection
 */

// @ts-ignore - ml-regression doesn't have TypeScript definitions
import { SimpleLinearRegression, PolynomialRegression } from 'ml-regression'
import { Matrix } from 'ml-matrix'

interface IoTReading {
  propertyId: string
  deviceId: string
  flowRate: number
  pressure: number
  temperature: number
  timestamp: Date
}

interface PredictionResult {
  propertyId: string
  deviceId: string
  leakProbability: number
  anomalyScore: number
  predictedFailureTime?: Date
  confidence: number
  factors: {
    flowRateAnomaly: number
    pressureAnomaly: number
    temperatureAnomaly: number
    patternAnomaly: number
  }
  recommendation: string
}

interface TrainingData {
  features: number[][]
  labels: number[]
}

export class MLPredictionService {
  private leakModel: PolynomialRegression | null = null
  private flowRateBaselines: Map<string, number> = new Map()
  private pressureBaselines: Map<string, number> = new Map()
  private temperatureBaselines: Map<string, number> = new Map()
  private historicalData: Map<string, IoTReading[]> = new Map()
  private isModelTrained = false

  /**
   * Train the leak prediction model with historical data
   */
  async trainModel(historicalReadings: IoTReading[]): Promise<void> {
    console.log(`Training ML model with ${historicalReadings.length} historical readings...`)

    if (historicalReadings.length < 10) {
      console.warn('Insufficient data for training. Need at least 10 readings.')
      return
    }

    // Group by device
    const deviceReadings = new Map<string, IoTReading[]>()
    for (const reading of historicalReadings) {
      const key = `${reading.propertyId}-${reading.deviceId}`
      if (!deviceReadings.has(key)) {
        deviceReadings.set(key, [])
      }
      deviceReadings.get(key)!.push(reading)
    }

    // Calculate baselines for each device
    for (const [deviceKey, readings] of deviceReadings.entries()) {
      const sortedReadings = readings.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      // Calculate normal baselines (using median to be robust against outliers)
      const flowRates = sortedReadings.map(r => r.flowRate).sort((a, b) => a - b)
      const pressures = sortedReadings.map(r => r.pressure).sort((a, b) => a - b)
      const temperatures = sortedReadings.map(r => r.temperature).sort((a, b) => a - b)

      const median = (arr: number[]) => arr[Math.floor(arr.length / 2)]

      this.flowRateBaselines.set(deviceKey, median(flowRates))
      this.pressureBaselines.set(deviceKey, median(pressures))
      this.temperatureBaselines.set(deviceKey, median(temperatures))

      this.historicalData.set(deviceKey, sortedReadings)
    }

    // Train polynomial regression model for leak prediction
    const trainingData = this.prepareTrainingData(historicalReadings)
    if (trainingData.features.length > 0) {
      this.leakModel = new PolynomialRegression(trainingData.features, trainingData.labels, 2)
      this.isModelTrained = true
      console.log('✓ ML model trained successfully')
    }
  }

  /**
   * Prepare training data from historical readings
   */
  private prepareTrainingData(readings: IoTReading[]): TrainingData {
    const features: number[][] = []
    const labels: number[] = []

    for (let i = 0; i < readings.length - 1; i++) {
      const current = readings[i]
      const next = readings[i + 1]

      // Skip if different devices
      if (current.deviceId !== next.deviceId) continue

      const deviceKey = `${current.propertyId}-${current.deviceId}`
      const flowBaseline = this.flowRateBaselines.get(deviceKey) || current.flowRate
      const pressureBaseline = this.pressureBaselines.get(deviceKey) || current.pressure

      // Features: normalized deviations
      const flowDeviation = Math.abs(current.flowRate - flowBaseline) / flowBaseline
      const pressureDeviation = Math.abs(current.pressure - pressureBaseline) / pressureBaseline
      const temperatureChange = Math.abs(current.temperature - next.temperature)

      features.push([
        flowDeviation,
        pressureDeviation,
        temperatureChange,
        current.flowRate,
        current.pressure
      ])

      // Label: 1 if next reading shows leak indicators, 0 otherwise
      const nextFlowDeviation = Math.abs(next.flowRate - flowBaseline) / flowBaseline
      const isLeak = nextFlowDeviation > 0.3 || next.pressure < pressureBaseline * 0.7 ? 1 : 0
      labels.push(isLeak)
    }

    return { features, labels }
  }

  /**
   * Predict leak probability and anomalies for a reading
   */
  async predictLeakProbability(reading: IoTReading, recentReadings: IoTReading[]): Promise<PredictionResult> {
    const deviceKey = `${reading.propertyId}-${reading.deviceId}`

    // Get baselines
    const flowBaseline = this.flowRateBaselines.get(deviceKey) || reading.flowRate
    const pressureBaseline = this.pressureBaselines.get(deviceKey) || reading.pressure
    const temperatureBaseline = this.temperatureBaselines.get(deviceKey) || reading.temperature

    // Calculate anomaly scores
    const flowRateAnomaly = Math.abs(reading.flowRate - flowBaseline) / Math.max(flowBaseline, 0.01)
    const pressureAnomaly = Math.abs(reading.pressure - pressureBaseline) / Math.max(pressureBaseline, 0.01)
    const temperatureAnomaly = Math.abs(reading.temperature - temperatureBaseline) / Math.max(temperatureBaseline, 0.01)

    // Pattern-based anomaly detection
    const patternAnomaly = this.detectPatternAnomaly(reading, recentReadings)

    // Calculate overall anomaly score
    const anomalyScore = (
      flowRateAnomaly * 0.4 +
      pressureAnomaly * 0.3 +
      temperatureAnomaly * 0.1 +
      patternAnomaly * 0.2
    )

    // Predict leak probability using ML model
    let leakProbability = anomalyScore
    let confidence = 0.6

    if (this.isModelTrained && this.leakModel) {
      try {
        const features = [
          flowRateAnomaly,
          pressureAnomaly,
          temperatureAnomaly - (recentReadings[0]?.temperature || reading.temperature),
          reading.flowRate,
          reading.pressure
        ]
        const prediction = this.leakModel.predict(features)
        leakProbability = Math.max(0, Math.min(1, prediction))
        confidence = 0.85
      } catch (err) {
        console.warn('ML prediction failed, using anomaly-based fallback')
      }
    }

    // Predict failure time if high risk
    let predictedFailureTime: Date | undefined
    if (leakProbability > 0.7) {
      const hoursUntilFailure = Math.max(1, Math.floor(72 * (1 - leakProbability)))
      predictedFailureTime = new Date(Date.now() + hoursUntilFailure * 60 * 60 * 1000)
    }

    // Generate recommendation
    const recommendation = this.generateRecommendation(leakProbability, anomalyScore, {
      flowRateAnomaly,
      pressureAnomaly,
      temperatureAnomaly,
      patternAnomaly
    })

    return {
      propertyId: reading.propertyId,
      deviceId: reading.deviceId,
      leakProbability,
      anomalyScore,
      predictedFailureTime,
      confidence,
      factors: {
        flowRateAnomaly,
        pressureAnomaly,
        temperatureAnomaly,
        patternAnomaly
      },
      recommendation
    }
  }

  /**
   * Detect pattern-based anomalies
   */
  private detectPatternAnomaly(current: IoTReading, recentReadings: IoTReading[]): number {
    if (recentReadings.length < 3) return 0

    // Check for sudden changes
    const recentFlowRates = recentReadings.slice(0, 5).map(r => r.flowRate)
    const avgRecentFlow = recentFlowRates.reduce((a, b) => a + b, 0) / recentFlowRates.length
    const flowVariance = recentFlowRates.reduce((sum, val) => sum + Math.pow(val - avgRecentFlow, 2), 0) / recentFlowRates.length

    // High variance indicates instability
    const varianceScore = Math.min(1, flowVariance / 100)

    // Check for monotonic increases (leak pattern)
    let increasingCount = 0
    for (let i = 0; i < recentReadings.length - 1; i++) {
      if (recentReadings[i].flowRate < recentReadings[i + 1].flowRate) {
        increasingCount++
      }
    }
    const trendScore = increasingCount / (recentReadings.length - 1)

    return (varianceScore * 0.5 + trendScore * 0.5)
  }

  /**
   * Generate actionable recommendation
   */
  private generateRecommendation(
    leakProbability: number,
    anomalyScore: number,
    factors: PredictionResult['factors']
  ): string {
    if (leakProbability > 0.9) {
      return 'CRITICAL: Immediate inspection required. High probability of active leak.'
    } else if (leakProbability > 0.7) {
      return 'HIGH RISK: Schedule urgent inspection within 24 hours. Leak likely developing.'
    } else if (leakProbability > 0.5) {
      return 'MODERATE RISK: Monitor closely and schedule inspection within 48 hours.'
    } else if (leakProbability > 0.3) {
      return 'LOW RISK: Continue monitoring. Consider routine inspection within a week.'
    } else if (anomalyScore > 0.4) {
      return 'ANOMALY DETECTED: Unusual pattern detected but no immediate leak risk.'
    } else {
      return 'NORMAL: System operating within expected parameters.'
    }
  }

  /**
   * Batch predict for multiple readings
   */
  async batchPredict(readings: IoTReading[]): Promise<PredictionResult[]> {
    const results: PredictionResult[] = []
    
    const deviceReadings = new Map<string, IoTReading[]>()
    for (const reading of readings) {
      const key = `${reading.propertyId}-${reading.deviceId}`
      if (!deviceReadings.has(key)) {
        deviceReadings.set(key, [])
      }
      deviceReadings.get(key)!.push(reading)
    }

    for (const [deviceKey, deviceData] of deviceReadings.entries()) {
      const sortedData = deviceData.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      
      const latest = sortedData[0]
      const recent = sortedData.slice(1, 11)
      
      const prediction = await this.predictLeakProbability(latest, recent)
      results.push(prediction)
    }

    return results
  }

  /**
   * Get model status
   */
  getModelStatus(): { trained: boolean; baselineCount: number; historicalDataPoints: number } {
    let totalDataPoints = 0
    for (const readings of this.historicalData.values()) {
      totalDataPoints += readings.length
    }

    return {
      trained: this.isModelTrained,
      baselineCount: this.flowRateBaselines.size,
      historicalDataPoints: totalDataPoints
    }
  }

  /**
   * Retrain model with new data
   */
  async updateModel(newReadings: IoTReading[]): Promise<void> {
    console.log('Updating ML model with new readings...')
    
    // Add new readings to historical data
    for (const reading of newReadings) {
      const deviceKey = `${reading.propertyId}-${reading.deviceId}`
      if (!this.historicalData.has(deviceKey)) {
        this.historicalData.set(deviceKey, [])
      }
      this.historicalData.get(deviceKey)!.push(reading)
    }

    // Retrain if we have enough data
    const allReadings: IoTReading[] = []
    for (const readings of this.historicalData.values()) {
      allReadings.push(...readings)
    }

    if (allReadings.length >= 10) {
      await this.trainModel(allReadings)
    }
  }
}

// Singleton instance
export const mlPredictionService = new MLPredictionService()
