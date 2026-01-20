/**
 * Social Intelligence Dashboard Component
 * React component for displaying social impact metrics and vulnerability alerts
 */
/**
 * Social Intelligence & Guardian Angel System - Dashboard
 * Copyright © 2026 - All Rights Reserved
 * 
 * CONFIDENTIAL AND PROPRIETARY
 * Created: January 18, 2026
 *//**
 * Social Intelligence & Guardian Angel System - Dashboard
 * Copyright © 2026 - All Rights Reserved
 * 
 * CONFIDENTIAL AND PROPRIETARY
 * Created: January 18, 2026 08:59:38 UTC
 * Git Commit: 222fa4c7b18c49341ce43ce4a93882d908ec8e6a
 */
import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material'
import {
  TrendingUp,
  Warning,
  CheckCircle,
  People,
  AttachMoney,
  Favorite,
  LocalHospital
} from '@mui/icons-material'

interface DashboardStats {
  overview: {
    totalAlerts: number
    activeMonitoring: number
    livesSaved: number
    socialValue: number
  }
  urgency: {
    immediate: number
    urgent: number
    monitor: number
    routine: number
  }
  categories: {
    healthEmergency: number
    financialHardship: number
    isolation: number
    other: number
  }
  trends: {
    weekOverWeek: string
    monthOverMonth: string
    direction: string
  }
  impact: {
    nhsSavings: number
    evictionsPrevented: number
    hospitalAdmissionsPrevented: number
    ofwatScoreImpact: number
  }
}

interface VulnerabilityAlert {
  alertId: string
  propertyId: string
  alertType: string
  urgency: string
  confidenceScore: number
  detectedAt: Date
  suggestedInterventions: string[]
}

export const SocialIntelligenceDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [alerts, setAlerts] = useState<VulnerabilityAlert[]>([])
  const [selectedAlert, setSelectedAlert] = useState<VulnerabilityAlert | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        fetch('/api/social/dashboard-stats'),
        fetch('/api/social/alerts?limit=10')
      ])

      const statsData = await statsRes.json()
      const alertsData = await alertsRes.json()

      setStats(statsData.data)
      setAlerts(alertsData.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'error'
      case 'urgent': return 'warning'
      case 'monitor': return 'info'
      default: return 'default'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(value)
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/social/acknowledge-alert/${alertId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acknowledgedBy: 'current_user',
          notes: 'Reviewed and actioned'
        })
      })
      fetchDashboardData()
    } catch (error) {
      console.error('Error acknowledging alert:', error)
    }
  }

  if (loading) {
    return <LinearProgress />
  }

  if (!stats) {
    return <Alert severity="error">Failed to load dashboard data</Alert>
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          🌟 Social Intelligence Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          AI-Powered Vulnerable Customer Early Warning System
        </Typography>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Favorite color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Lives Saved</Typography>
              </Box>
              <Typography variant="h3" color="error.main">
                {stats.overview.livesSaved}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Estimated through early intervention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">People Helped</Typography>
              </Box>
              <Typography variant="h3" color="primary.main">
                {stats.overview.totalAlerts}
              </Typography>
              <Typography variant="caption" color="success.main">
                {stats.trends.weekOverWeek} vs last week
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoney color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Social Value</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {formatCurrency(stats.overview.socialValue)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Generated this period
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocalHospital color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Monitoring</Typography>
              </Box>
              <Typography variant="h3" color="warning.main">
                {stats.overview.activeMonitoring}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Properties under Guardian Angel
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Urgency Breakdown */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Alert Urgency Breakdown
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Immediate</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.urgency.immediate}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.urgency.immediate / stats.overview.totalAlerts) * 100} 
                    color="error"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Urgent</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.urgency.urgent}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.urgency.urgent / stats.overview.totalAlerts) * 100} 
                    color="warning"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Monitor</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.urgency.monitor}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.urgency.monitor / stats.overview.totalAlerts) * 100} 
                    color="info"
                  />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Routine</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.urgency.routine}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.urgency.routine / stats.overview.totalAlerts) * 100} 
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Social Impact Highlights
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2">NHS Savings</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {formatCurrency(stats.impact.nhsSavings)}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2">Evictions Prevented</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats.impact.evictionsPrevented}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2">Hospital Admissions Prevented</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats.impact.hospitalAdmissionsPrevented}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2">Ofwat C-MeX Score Impact</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    +{stats.impact.ofwatScoreImpact} points
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Alerts Table */}
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Vulnerability Alerts
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Property</TableCell>
                  <TableCell>Alert Type</TableCell>
                  <TableCell>Urgency</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Detected</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.alertId}>
                    <TableCell>{alert.propertyId}</TableCell>
                    <TableCell>
                      <Chip 
                        label={alert.alertType.replace(/_/g, ' ')} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={alert.urgency} 
                        color={getUrgencyColor(alert.urgency) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{alert.confidenceScore}%</TableCell>
                    <TableCell>
                      {new Date(alert.detectedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        onClick={() => setSelectedAlert(alert)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Alert Detail Dialog */}
      <Dialog 
        open={!!selectedAlert} 
        onClose={() => setSelectedAlert(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedAlert && (
          <>
            <DialogTitle>
              Alert Details - {selectedAlert.propertyId}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Alert Type
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedAlert.alertType.replace(/_/g, ' ')}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Urgency Level
                </Typography>
                <Chip 
                  label={selectedAlert.urgency} 
                  color={getUrgencyColor(selectedAlert.urgency) as any}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Confidence Score
                </Typography>
                <Typography variant="body1">
                  {selectedAlert.confidenceScore}%
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Suggested Interventions
                </Typography>
                {selectedAlert.suggestedInterventions.map((intervention, idx) => (
                  <Alert key={idx} severity="info" sx={{ mb: 1 }}>
                    {intervention}
                  </Alert>
                ))}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedAlert(null)}>
                Close
              </Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  handleAcknowledgeAlert(selectedAlert.alertId)
                  setSelectedAlert(null)
                }}
              >
                Acknowledge & Take Action
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default SocialIntelligenceDashboard
