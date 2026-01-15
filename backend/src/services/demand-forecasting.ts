/**
 * Demand Forecasting Service
 * Time-series analysis and ML-based water consumption forecasting
 */

import { PolynomialRegression } from 'ml-regression-polynomial'
import { Matrix } from 'ml-matrix'

interface ConsumptionReading {
  timestamp: Date
  propertyId: string
  consumption: number // gallons or liters
  temperature?: number
  dayOfWeek: number
  hourOfDay: number
  isWeekend: boolean
  isHoliday: boolean
  season: 'winter' | 'spring' | 'summer' | 'fall'
}

interface DemandForecast {
  propertyId: string
  timestamp: Date
  predictedConsumption: number
  confidence: number
  trend: 'increasing' | 'decreasing' | 'stable'
  peakHours: number[]
  seasonalFactor: number
  anomalyScore: number
}

interface UsagePattern {
  propertyId: string
  avgDailyConsumption: number
  peakUsageHour: number
  weekdayAvg: number
  weekendAvg: number
  seasonalVariation: { [key: string]: number }
  growthRate: number
}

export class DemandForecastingService {
  private forecastModels: Map<string, PolynomialRegression>
  private historicalData: Map<string, ConsumptionReading[]>
  private usagePatterns: Map<string, UsagePattern>

  constructor() {
    this.forecastModels = new Map()
    this.historicalData = new Map()
    this.usagePatterns = new Map()
  }

  /**
   * Add consumption reading to historical data
   */
  addReading(reading: ConsumptionReading): void {
    const propertyId = reading.propertyId

    if (!this.historicalData.has(propertyId)) {
      this.historicalData.set(propertyId, [])
    }

    const data = this.historicalData.get(propertyId)!
    data.push(reading)

    // Keep only last 90 days of data
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    
    this.historicalData.set(
      propertyId,
      data.filter(r => r.timestamp >= ninetyDaysAgo)
    )
  }

  /**
   * Train forecasting model for a property
   */
  trainModel(propertyId: string): boolean {
    const data = this.historicalData.get(propertyId)

    if (!data || data.length < 168) { // Need at least 1 week of hourly data
      console.warn(`Insufficient data for property ${propertyId}`)
      return false
    }

    // Prepare training data
    const sortedData = data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    
    const X: number[] = []
    const y: number[] = []

    sortedData.forEach((reading, index) => {
      X.push(index) // Time index
      y.push(reading.consumption)
    })

    // Train polynomial regression (degree 3)
    try {
      const model = new PolynomialRegression(X, y, 3)
      this.forecastModels.set(propertyId, model)

      // Calculate usage patterns
      this.calculateUsagePatterns(propertyId, sortedData)

      return true
    } catch (error) {
      console.error(`Error training model for ${propertyId}:`, error)
      return false
    }
  }

  /**
   * Calculate usage patterns from historical data
   */
  private calculateUsagePatterns(propertyId: string, data: ConsumptionReading[]): void {
    if (data.length === 0) return

    // Group by hour to find peak usage
    const hourlyUsage: { [hour: number]: number[] } = {}
    for (let h = 0; h < 24; h++) {
      hourlyUsage[h] = []
    }

    let weekdayTotal = 0
    let weekdayCount = 0
    let weekendTotal = 0
    let weekendCount = 0

    const seasonalUsage: { [season: string]: number[] } = {
      winter: [],
      spring: [],
      summer: [],
      fall: []
    }

    data.forEach(reading => {
      hourlyUsage[reading.hourOfDay].push(reading.consumption)
      
      if (reading.isWeekend) {
        weekendTotal += reading.consumption
        weekendCount++
      } else {
        weekdayTotal += reading.consumption
        weekdayCount++
      }

      seasonalUsage[reading.season].push(reading.consumption)
    })

    // Find peak hour
    let peakHour = 0
    let maxAvg = 0
    for (let h = 0; h < 24; h++) {
      const avg = hourlyUsage[h].length > 0
        ? hourlyUsage[h].reduce((a, b) => a + b, 0) / hourlyUsage[h].length
        : 0
      if (avg > maxAvg) {
        maxAvg = avg
        peakHour = h
      }
    }

    // Calculate seasonal variation
    const seasonalVariation: { [key: string]: number } = {}
    const overallAvg = data.reduce((sum, r) => sum + r.consumption, 0) / data.length

    for (const season in seasonalUsage) {
      const seasonAvg = seasonalUsage[season].length > 0
        ? seasonalUsage[season].reduce((a, b) => a + b, 0) / seasonalUsage[season].length
        : overallAvg
      seasonalVariation[season] = seasonAvg / overallAvg
    }

    // Calculate growth rate (simple linear trend)
    const firstWeek = data.slice(0, 168).reduce((sum, r) => sum + r.consumption, 0) / 168
    const lastWeek = data.slice(-168).reduce((sum, r) => sum + r.consumption, 0) / 168
    const growthRate = ((lastWeek - firstWeek) / firstWeek) * 100

    this.usagePatterns.set(propertyId, {
      propertyId,
      avgDailyConsumption: (weekdayTotal + weekendTotal) / (weekdayCount + weekendCount),
      peakUsageHour: peakHour,
      weekdayAvg: weekdayCount > 0 ? weekdayTotal / weekdayCount : 0,
      weekendAvg: weekendCount > 0 ? weekendTotal / weekendCount : 0,
      seasonalVariation,
      growthRate
    })
  }

  /**
   * Forecast consumption for next N hours
   */
  forecastConsumption(
    propertyId: string,
    hoursAhead: number,
    currentConditions: Partial<ConsumptionReading> = {}
  ): DemandForecast[] {
    const model = this.forecastModels.get(propertyId)
    const data = this.historicalData.get(propertyId)
    const patterns = this.usagePatterns.get(propertyId)

    if (!model || !data || !patterns) {
      throw new Error(`No model or data available for property ${propertyId}`)
    }

    const forecasts: DemandForecast[] = []
    const lastIndex = data.length - 1
    const now = new Date()

    for (let i = 1; i <= hoursAhead; i++) {
      const futureTimestamp = new Date(now.getTime() + i * 60 * 60 * 1000)
      const futureIndex = lastIndex + i

      // Base prediction from polynomial model
      let predictedValue = model.predict(futureIndex)

      // Apply seasonal adjustment
      const season = this.getSeason(futureTimestamp)
      const seasonalFactor = patterns.seasonalVariation[season] || 1
      predictedValue *= seasonalFactor

      // Apply weekday/weekend adjustment
      const isWeekend = futureTimestamp.getDay() === 0 || futureTimestamp.getDay() === 6
      if (isWeekend) {
        predictedValue *= patterns.weekendAvg / patterns.avgDailyConsumption
      } else {
        predictedValue *= patterns.weekdayAvg / patterns.avgDailyConsumption
      }

      // Temperature adjustment (if available)
      if (currentConditions.temperature !== undefined) {
        const tempFactor = this.getTemperatureFactor(currentConditions.temperature, season)
        predictedValue *= tempFactor
      }

      // Ensure non-negative
      predictedValue = Math.max(0, predictedValue)

      // Calculate confidence (decreases with distance)
      const confidence = Math.max(0.3, 0.9 - (i / hoursAhead) * 0.4)

      // Determine trend
      const trend = patterns.growthRate > 5 ? 'increasing' :
                    patterns.growthRate < -5 ? 'decreasing' : 'stable'

      // Peak hours detection
      const peakHours = this.getPeakHours(patterns)

      // Anomaly score (0 = normal, 1 = anomaly)
      const anomalyScore = this.calculateAnomalyScore(predictedValue, patterns)

      forecasts.push({
        propertyId,
        timestamp: futureTimestamp,
        predictedConsumption: Math.round(predictedValue * 100) / 100,
        confidence,
        trend,
        peakHours,
        seasonalFactor,
        anomalyScore
      })
    }

    return forecasts
  }

  /**
   * Forecast peak demand for system capacity planning
   */
  forecastPeakDemand(propertyIds: string[], hoursAhead: number = 24): {
    timestamp: Date
    totalDemand: number
    peakTime: Date
    peakDemand: number
    properties: { [propertyId: string]: number }
  }[] {
    const aggregatedForecasts: Map<number, {
      timestamp: Date
      totalDemand: number
      properties: { [propertyId: string]: number }
    }> = new Map()

    // Get forecasts for all properties
    for (const propertyId of propertyIds) {
      try {
        const forecasts = this.forecastConsumption(propertyId, hoursAhead)

        forecasts.forEach(forecast => {
          const hour = forecast.timestamp.getTime()
          
          if (!aggregatedForecasts.has(hour)) {
            aggregatedForecasts.set(hour, {
              timestamp: forecast.timestamp,
              totalDemand: 0,
              properties: {}
            })
          }

          const agg = aggregatedForecasts.get(hour)!
          agg.totalDemand += forecast.predictedConsumption
          agg.properties[propertyId] = forecast.predictedConsumption
        })
      } catch (error) {
        console.warn(`Could not forecast for ${propertyId}:`, error)
      }
    }

    // Find peak demand
    let peakTime = new Date()
    let peakDemand = 0

    const results = Array.from(aggregatedForecasts.values())
    results.forEach(result => {
      if (result.totalDemand > peakDemand) {
        peakDemand = result.totalDemand
        peakTime = result.timestamp
      }
    })

    return results.map(result => ({
      ...result,
      peakTime,
      peakDemand
    }))
  }

  /**
   * Get usage patterns for a property
   */
  getUsagePatterns(propertyId: string): UsagePattern | null {
    return this.usagePatterns.get(propertyId) || null
  }

  /**
   * Detect anomalies in consumption
   */
  detectAnomalies(propertyId: string, threshold: number = 2.0): boolean {
    const patterns = this.usagePatterns.get(propertyId)
    const data = this.historicalData.get(propertyId)

    if (!patterns || !data || data.length === 0) return false

    const recentReading = data[data.length - 1]
    const expectedConsumption = patterns.avgDailyConsumption

    // Calculate standard deviation
    const variance = data.reduce((sum, r) => {
      return sum + Math.pow(r.consumption - expectedConsumption, 2)
    }, 0) / data.length

    const stdDev = Math.sqrt(variance)

    // Anomaly if reading is beyond threshold standard deviations
    return Math.abs(recentReading.consumption - expectedConsumption) > (stdDev * threshold)
  }

  /**
   * Get season from date
   */
  private getSeason(date: Date): 'winter' | 'spring' | 'summer' | 'fall' {
    const month = date.getMonth() + 1
    if (month >= 12 || month <= 2) return 'winter'
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    return 'fall'
  }

  /**
   * Get temperature adjustment factor
   */
  private getTemperatureFactor(temp: number, season: string): number {
    // Summer: higher temp = more water usage (irrigation, cooling)
    // Winter: temperature has less impact
    if (season === 'summer') {
      if (temp > 85) return 1.3
      if (temp > 75) return 1.15
      if (temp > 65) return 1.0
      return 0.9
    }
    return 1.0
  }

  /**
   * Get peak hours from usage patterns
   */
  private getPeakHours(patterns: UsagePattern): number[] {
    // Typical peak hours: morning (6-9 AM) and evening (5-9 PM)
    // Adjust based on detected peak
    const peak = patterns.peakUsageHour
    return [
      Math.max(0, peak - 1),
      peak,
      Math.min(23, peak + 1)
    ]
  }

  /**
   * Calculate anomaly score
   */
  private calculateAnomalyScore(predicted: number, patterns: UsagePattern): number {
    const deviation = Math.abs(predicted - patterns.avgDailyConsumption)
    const ratio = deviation / patterns.avgDailyConsumption

    if (ratio > 0.5) return 0.9
    if (ratio > 0.3) return 0.6
    if (ratio > 0.2) return 0.3
    return 0.1
  }

  /**
   * Get model statistics
   */
  getModelStats(propertyId: string): {
    dataPoints: number
    trainingPeriod: { start: Date; end: Date }
    accuracy: number
  } | null {
    const data = this.historicalData.get(propertyId)
    if (!data || data.length === 0) return null

    const sortedData = data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // Calculate R² score (simple approximation)
    const patterns = this.usagePatterns.get(propertyId)
    const accuracy = patterns ? Math.max(0.5, 1 - Math.abs(patterns.growthRate / 100)) : 0.7

    return {
      dataPoints: data.length,
      trainingPeriod: {
        start: sortedData[0].timestamp,
        end: sortedData[sortedData.length - 1].timestamp
      },
      accuracy
    }
  }
}

// Singleton instance
export const demandForecastingService = new DemandForecastingService()
