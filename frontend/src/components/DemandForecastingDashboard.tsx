/**
 * Demand Forecasting Dashboard
 * Real-time water consumption forecasting and demand analytics
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ShowChartIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material'

interface ForecastData {
  timestamp: Date
  predictedConsumption: number
  confidence: number
  trend: 'increasing' | 'decreasing' | 'stable'
  peakHours: number[]
  anomalyScore: number
}

interface UsagePattern {
  avgDailyConsumption: number
  peakUsageHour: number
  weekdayAvg: number
  weekendAvg: number
  seasonalVariation: { [key: string]: number }
  growthRate: number
}

interface PeakDemand {
  timestamp: Date
  totalDemand: number
  peakTime: Date
  peakDemand: number
}

export const DemandForecastingDashboard: React.FC<{ propertyId: string }> = ({ propertyId }) => {
  const [forecasts, setForecasts] = useState<ForecastData[]>([])
  const [patterns, setPatterns] = useState<UsagePattern | null>(null)
  const [peakDemand, setPeakDemand] = useState<PeakDemand[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAnomalies, setHasAnomalies] = useState(false)
  const [hoursAhead, setHoursAhead] = useState(24)

  useEffect(() => {
    loadAllData()
    const interval = setInterval(loadAllData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [propertyId, hoursAhead])

  const loadAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        loadForecasts(),
        loadPatterns(),
        checkAnomalies()
      ])
    } catch (err: any) {
      setError(err.message || 'Failed to load forecasting data')
    } finally {
      setLoading(false)
    }
  }

  const loadForecasts = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/forecast/predict/${propertyId}?hours=${hoursAhead}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'demo_token'}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch forecasts')

      const data = await response.json()
      setForecasts(data.forecasts.map((f: any) => ({
        ...f,
        timestamp: new Date(f.timestamp)
      })))
    } catch (err) {
      console.warn('Forecast error:', err)
      // Set mock data for demo
      setForecasts(generateMockForecasts())
    }
  }

  const loadPatterns = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/forecast/patterns/${propertyId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'demo_token'}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch patterns')

      const data = await response.json()
      setPatterns(data.patterns)
    } catch (err) {
      console.warn('Patterns error:', err)
      // Set mock data
      setPatterns({
        avgDailyConsumption: 285,
        peakUsageHour: 19,
        weekdayAvg: 275,
        weekendAvg: 310,
        seasonalVariation: {
          winter: 0.9,
          spring: 1.0,
          summer: 1.3,
          fall: 1.05
        },
        growthRate: 3.5
      })
    }
  }

  const checkAnomalies = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/forecast/anomalies/${propertyId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'demo_token'}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to check anomalies')

      const data = await response.json()
      setHasAnomalies(data.anomalyDetected)
    } catch (err) {
      setHasAnomalies(false)
    }
  }

  const trainModel = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `http://localhost:3001/api/forecast/train/${propertyId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'demo_token'}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) throw new Error('Failed to train model')

      await loadAllData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const generateMockForecasts = (): ForecastData[] => {
    const now = new Date()
    const forecasts: ForecastData[] = []

    for (let i = 0; i < hoursAhead; i++) {
      const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000)
      const hour = timestamp.getHours()

      // Simulate usage pattern (higher in morning/evening)
      let baseConsumption = 10
      if (hour >= 6 && hour <= 9) baseConsumption = 25
      if (hour >= 17 && hour <= 21) baseConsumption = 30
      if (hour >= 22 || hour <= 5) baseConsumption = 5

      forecasts.push({
        timestamp,
        predictedConsumption: baseConsumption + Math.random() * 5,
        confidence: 0.7 + Math.random() * 0.2,
        trend: Math.random() > 0.5 ? 'increasing' : 'stable',
        peakHours: [7, 8, 18, 19, 20],
        anomalyScore: Math.random() * 0.3
      })
    }

    return forecasts
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return <TrendingUpIcon color="error" />
    if (trend === 'decreasing') return <TrendingDownIcon color="success" />
    return <ShowChartIcon color="info" />
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success'
    if (confidence >= 0.6) return 'warning'
    return 'error'
  }

  const avgForecast = forecasts.length > 0
    ? forecasts.reduce((sum, f) => sum + f.predictedConsumption, 0) / forecasts.length
    : 0

  const maxForecast = forecasts.length > 0
    ? Math.max(...forecasts.map(f => f.predictedConsumption))
    : 0

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">📊 Demand Forecasting</Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={() => setHoursAhead(24)}
            disabled={hoursAhead === 24}
            sx={{ mr: 1 }}
          >
            24h
          </Button>
          <Button
            variant="outlined"
            onClick={() => setHoursAhead(72)}
            disabled={hoursAhead === 72}
            sx={{ mr: 1 }}
          >
            72h
          </Button>
          <Button
            variant="outlined"
            onClick={() => setHoursAhead(168)}
            disabled={hoursAhead === 168}
            sx={{ mr: 1 }}
          >
            7 days
          </Button>
          <Button variant="contained" onClick={trainModel} disabled={loading}>
            Retrain Model
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {hasAnomalies && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningIcon />}>
          Consumption anomaly detected! Usage patterns deviate significantly from normal.
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Forecast ({hoursAhead}h)
              </Typography>
              <Typography variant="h4">{avgForecast.toFixed(1)}</Typography>
              <Typography variant="body2" color="textSecondary">
                gallons/hour
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Peak Forecast
              </Typography>
              <Typography variant="h4">{maxForecast.toFixed(1)}</Typography>
              <Typography variant="body2" color="textSecondary">
                gallons/hour
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Growth Rate
              </Typography>
              <Typography variant="h4">
                {patterns?.growthRate?.toFixed(1) || '0.0'}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {patterns && patterns.growthRate > 0 ? 'Increasing' : 'Decreasing'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Status
              </Typography>
              <Typography variant="h4">
                {hasAnomalies ? (
                  <WarningIcon color="warning" fontSize="large" />
                ) : (
                  <CheckCircleIcon color="success" fontSize="large" />
                )}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {hasAnomalies ? 'Anomaly' : 'Normal'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Usage Patterns */}
      {patterns && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Usage Patterns
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">
                Peak Usage Hour
              </Typography>
              <Typography variant="h5">
                {patterns.peakUsageHour}:00
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">
                Weekday Average
              </Typography>
              <Typography variant="h5">
                {patterns.weekdayAvg.toFixed(0)} gal/day
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">
                Weekend Average
              </Typography>
              <Typography variant="h5">
                {patterns.weekendAvg.toFixed(0)} gal/day
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Seasonal Variation
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {Object.entries(patterns.seasonalVariation).map(([season, factor]) => (
                <Chip
                  key={season}
                  label={`${season}: ${(factor * 100).toFixed(0)}%`}
                  color={factor > 1.1 ? 'warning' : 'default'}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Forecast Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Hourly Forecast
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell align="right">Predicted (gal/h)</TableCell>
              <TableCell align="center">Confidence</TableCell>
              <TableCell align="center">Trend</TableCell>
              <TableCell align="center">Risk</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {forecasts.slice(0, 24).map((forecast, index) => (
              <TableRow key={index}>
                <TableCell>
                  {forecast.timestamp.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell align="right">
                  {forecast.predictedConsumption.toFixed(1)}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${(forecast.confidence * 100).toFixed(0)}%`}
                    size="small"
                    color={getConfidenceColor(forecast.confidence) as any}
                  />
                </TableCell>
                <TableCell align="center">{getTrendIcon(forecast.trend)}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={forecast.anomalyScore > 0.5 ? 'High' : 'Low'}
                    size="small"
                    color={forecast.anomalyScore > 0.5 ? 'warning' : 'success'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}

export default DemandForecastingDashboard
