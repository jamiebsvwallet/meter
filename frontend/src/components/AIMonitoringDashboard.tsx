/**
 * AI Monitoring Dashboard
 * Real-time monitoring with agentic AI, predictions, and automated actions
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  LinearProgress,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material'
import {
  SmartToy as AIIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Bolt as BoltIcon,
  TrendingUp as TrendingIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material'
import { io, Socket } from 'socket.io-client'

interface AgentStatus {
  enabled: boolean
  monitoring: boolean
  config: any
  activeAlerts: number
  pendingActions: number
  executedActions: number
}

interface AgentAction {
  id: string
  timestamp: Date
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  propertyId: string
  deviceId?: string
  reason: string
  status: 'pending' | 'executed' | 'failed'
}

interface Prediction {
  propertyId: string
  deviceId: string
  leakProbability: number
  anomalyScore: number
  confidence: number
  recommendation: string
  predictedFailureTime?: Date
}

export const AIMonitoringDashboard: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null)
  const [recentActions, setRecentActions] = useState<AgentAction[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      path: '/realtime',
      transports: ['websocket']
    })

    newSocket.on('connect', () => {
      console.log('Connected to real-time service')
      setConnected(true)
      
      // Subscribe to global updates
      newSocket.emit('subscribe', 'global')
      
      // Request initial status
      newSocket.emit('request_agent_status')
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from real-time service')
      setConnected(false)
    })

    // Listen for agent status updates
    newSocket.on('agent_status', (data: any) => {
      setAgentStatus(data.status)
      if (data.recentActions) {
        setRecentActions(data.recentActions)
      }
    })

    // Listen for predictions
    newSocket.on('predictions_update', (data: any) => {
      if (data.predictions) {
        setPredictions(prev => {
          const updated = [...prev]
          for (const pred of data.predictions) {
            const index = updated.findIndex(
              p => p.propertyId === pred.propertyId && p.deviceId === pred.deviceId
            )
            if (index >= 0) {
              updated[index] = pred
            } else {
              updated.push(pred)
            }
          }
          return updated.slice(0, 20) // Keep only latest 20
        })
      }
    })

    // Listen for high risk alerts
    newSocket.on('high_risk_alert', (data: any) => {
      console.log('HIGH RISK ALERT:', data)
      // Could trigger browser notification here
    })

    // Listen for agent actions
    newSocket.on('agent_action', (data: any) => {
      setRecentActions(prev => [data.action, ...prev].slice(0, 20))
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  // Fetch agent status and statistics
  const fetchAgentData = useCallback(async () => {
    try {
      const [statusRes, statsRes] = await Promise.all([
        fetch('http://localhost:3001/api/agent/status'),
        fetch('http://localhost:3001/api/agent/statistics')
      ])

      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setAgentStatus(statusData.agent)
        if (statusData.recentActions) {
          setRecentActions(statusData.recentActions)
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStatistics(statsData.statistics)
      }
    } catch (error) {
      console.error('Error fetching agent data:', error)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchAgentData()
    const interval = setInterval(fetchAgentData, 10000) // Update every 10s
    return () => clearInterval(interval)
  }, [fetchAgentData])

  // Toggle monitoring
  const toggleMonitoring = async () => {
    try {
      const endpoint = isMonitoring ? '/api/agent/stop' : '/api/agent/start'
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        setIsMonitoring(!isMonitoring)
        await fetchAgentData()
      }
    } catch (error) {
      console.error('Error toggling monitoring:', error)
    }
  }

  // Train model
  const trainModel = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/agent/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Model trained successfully with ${data.trainingDataPoints} data points`)
        await fetchAgentData()
      }
    } catch (error) {
      console.error('Error training model:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  const getRiskColor = (probability: number) => {
    if (probability > 0.9) return 'error'
    if (probability > 0.7) return 'warning'
    if (probability > 0.5) return 'info'
    return 'success'
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon fontSize="large" />
          Agentic AI Monitoring
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip 
            icon={connected ? <CheckIcon /> : <ErrorIcon />}
            label={connected ? 'Real-time Connected' : 'Disconnected'}
            color={connected ? 'success' : 'error'}
          />
          <Button variant="outlined" onClick={trainModel}>
            Train Model
          </Button>
          <FormControlLabel
            control={
              <Switch 
                checked={isMonitoring || (agentStatus?.monitoring ?? false)}
                onChange={toggleMonitoring}
              />
            }
            label="Autonomous Monitoring"
          />
        </Box>
      </Box>

      {/* Status Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Alerts
              </Typography>
              <Typography variant="h3" color="error">
                {agentStatus?.activeAlerts ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Actions
              </Typography>
              <Typography variant="h3" color="warning.main">
                {agentStatus?.pendingActions ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Executed Actions
              </Typography>
              <Typography variant="h3" color="success.main">
                {agentStatus?.executedActions ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Success Rate
              </Typography>
              <Typography variant="h3" color="primary">
                {statistics?.actions?.successRate ?? 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Real-time Predictions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingIcon />
          Real-time Leak Predictions
        </Typography>
        
        {predictions.length === 0 ? (
          <Alert severity="info">No recent predictions. Waiting for IoT data...</Alert>
        ) : (
          <Grid container spacing={2}>
            {predictions.slice(0, 6).map((pred, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2">
                        {pred.deviceId}
                      </Typography>
                      <Chip 
                        label={`${(pred.leakProbability * 100).toFixed(1)}%`}
                        color={getRiskColor(pred.leakProbability)}
                        size="small"
                      />
                    </Box>
                    
                    <LinearProgress 
                      variant="determinate" 
                      value={pred.leakProbability * 100}
                      color={getRiskColor(pred.leakProbability)}
                      sx={{ mb: 1 }}
                    />
                    
                    <Typography variant="body2" color="textSecondary">
                      {pred.recommendation}
                    </Typography>
                    
                    {pred.predictedFailureTime && (
                      <Typography variant="caption" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        <ScheduleIcon fontSize="small" />
                        Failure predicted: {new Date(pred.predictedFailureTime).toLocaleString()}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Recent Agent Actions */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BoltIcon />
          Recent Autonomous Actions
        </Typography>

        {recentActions.length === 0 ? (
          <Alert severity="info">No recent agent actions</Alert>
        ) : (
          <List>
            {recentActions.slice(0, 10).map((action, index) => (
              <React.Fragment key={action.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemIcon>
                    {action.priority === 'critical' ? (
                      <ErrorIcon color="error" />
                    ) : action.priority === 'high' ? (
                      <WarningIcon color="warning" />
                    ) : action.status === 'executed' ? (
                      <CheckIcon color="success" />
                    ) : (
                      <NotificationIcon color="info" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {action.reason}
                        </Typography>
                        <Chip 
                          label={action.type.replace(/_/g, ' ')}
                          size="small"
                          variant="outlined"
                        />
                        <Chip 
                          label={action.priority}
                          size="small"
                          color={getPriorityColor(action.priority) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Property: {action.propertyId} {action.deviceId && `| Device: ${action.deviceId}`}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(action.timestamp).toLocaleString()} • Status: {action.status}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  )
}
