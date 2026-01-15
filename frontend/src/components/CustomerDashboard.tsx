import React, { useState, useEffect } from 'react'
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import PersonIcon from '@mui/icons-material/Person'

interface IoTReading {
  deviceId: string
  propertyId: string
  timestamp: number
  pressure: number
  flowRate: number
  temperature: number
  alerts: string[]
  recordedBy: string
}

interface PropertyStats {
  avgPressure: number
  avgFlowRate: number
  avgTemperature: number
  maxPressure: number
  minPressure: number
  alertCount: number
  readingCount: number
}

/**
 * Customer Dashboard - View real-time IoT data and manage access
 */
export const CustomerDashboard: React.FC<{ propertyId: string }> = ({ propertyId }) => {
  const [readings, setReadings] = useState<IoTReading[]>([])
  const [stats, setStats] = useState<PropertyStats | null>(null)
  const [alerts, setAlerts] = useState<IoTReading[]>([])
  const [loading, setLoading] = useState(true)
  const [waterCompanyDialog, setWaterCompanyDialog] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState('')
  const [consentReason, setConsentReason] = useState('')
  const [expirationDays, setExpirationDays] = useState('30')

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [propertyId])

  const loadData = async () => {
    try {
      // Fetch latest readings
      const readingsRes = await fetch(`/api/iot/property/${propertyId}/readings?limit=100`)
      const readingsData = await readingsRes.json()
      setReadings(readingsData)

      // Fetch stats
      const statsRes = await fetch(`/api/iot/property/${propertyId}/stats?hours=24`)
      const statsData = await statsRes.json()
      setStats(statsData)

      // Fetch alerts
      const alertsRes = await fetch(`/api/iot/property/${propertyId}/alerts`)
      const alertsData = await alertsRes.json()
      setAlerts(alertsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGrantWaterCompanyAccess = async () => {
    try {
      await fetch(`/api/consent/${propertyId}/grant-water-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany,
          reason: consentReason,
          expirationDays: parseInt(expirationDays)
        })
      })

      setWaterCompanyDialog(false)
      setSelectedCompany('')
      setConsentReason('')
      setExpirationDays('30')

      // Refresh consent data
      loadData()
    } catch (error) {
      console.error('Error granting access:', error)
    }
  }

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Water System
      </Typography>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {alerts.length} Active Alert{alerts.length !== 1 ? 's' : ''}
          </Typography>
          {alerts.map(alert => (
            <Typography key={`${alert.timestamp}`} variant="body2">
              {alert.alerts.join(', ')} at {new Date(alert.timestamp).toLocaleTimeString()}
            </Typography>
          ))}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Current Status Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pressure (PSI)
              </Typography>
              <Typography variant="h4">
                {readings[0]?.pressure.toFixed(1) || '-'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg: {stats?.avgPressure.toFixed(1) || '-'} PSI
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Flow Rate (GPM)
              </Typography>
              <Typography variant="h4">
                {readings[0]?.flowRate.toFixed(2) || '-'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg: {stats?.avgFlowRate.toFixed(2) || '-'} GPM
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Temperature (°C)
              </Typography>
              <Typography variant="h4">
                {readings[0]?.temperature.toFixed(1) || '-'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg: {stats?.avgTemperature.toFixed(1) || '-'}°C
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                System Health
              </Typography>
              <Typography variant="h4">
                {alerts.length === 0 ? (
                  <CheckCircleIcon sx={{ color: 'green', fontSize: 40 }} />
                ) : (
                  <ErrorIcon sx={{ color: 'red', fontSize: 40 }} />
                )}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {alerts.length === 0 ? 'Normal' : `${alerts.length} Alert${alerts.length !== 1 ? 's' : ''}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pressure Chart */}
      {readings.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Pressure Trend (Last 24 Hours)" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={readings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(time: number) => new Date(time).toLocaleTimeString()}
                />
                <YAxis label={{ value: 'PSI', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  labelFormatter={(time: number | undefined) => (time ? new Date(time).toLocaleString() : '')}
                  formatter={(value: number | undefined) => (typeof value === 'number' ? value.toFixed(2) : '')}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="pressure"
                  stroke="#8884d8"
                  name="Pressure (PSI)"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Access Control */}
      <Card>
        <CardHeader title="Data Access & Permissions" />
        <CardContent>
          <Typography variant="body2" paragraph>
            Control who can view your water system data
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Chip label="You" icon={<PersonIcon />} color="primary" />
            <Chip label="Assigned Plumber" sx={{ ml: 1 }} />
          </Box>

          <Button
            variant="outlined"
            onClick={() => setWaterCompanyDialog(true)}
          >
            Grant Water Company Access
          </Button>
        </CardContent>
      </Card>

      {/* Water Company Access Dialog */}
      <Dialog open={waterCompanyDialog} onClose={() => setWaterCompanyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Grant Water Company Access</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Water Company</InputLabel>
            <Select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany((e.target as any).value as string)}
              label="Water Company"
            >
              <MenuItem value="water-corp-1">Water Corporation</MenuItem>
              <MenuItem value="water-board-2">City Water Board</MenuItem>
              <MenuItem value="utility-3">Water Utility</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Reason for Access"
            placeholder="e.g., Leak prevention audit, water quality monitoring"
            value={consentReason}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setConsentReason(e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth>
            <InputLabel>Access Duration</InputLabel>
            <Select
              value={expirationDays}
              onChange={(e) => setExpirationDays((e.target as any).value as string)}
              label="Access Duration"
            >
              <MenuItem value="7">7 Days</MenuItem>
              <MenuItem value="30">30 Days</MenuItem>
              <MenuItem value="90">90 Days</MenuItem>
              <MenuItem value="365">1 Year</MenuItem>
              <MenuItem value="0">Indefinite</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWaterCompanyDialog(false)}>Cancel</Button>
          <Button onClick={handleGrantWaterCompanyAccess} variant="contained">
            Grant Access
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
