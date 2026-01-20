/**
 * Feature History View
 * Shows detailed history and analytics for each dashboard feature
 * 
 * Copyright © 2026 - All Rights Reserved
 */

import React, { useState, useEffect } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material'
import {
  ArrowBack,
  Download,
  FilterList,
  Refresh
} from '@mui/icons-material'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

interface FeatureHistoryProps {
  featureId: string
  userId?: string
  onBack: () => void
}

interface HistoryEntry {
  id: string
  timestamp: string
  type: string
  amount?: number
  description: string
  status: 'completed' | 'pending' | 'failed'
  metadata?: any
}

const FeatureHistory: React.FC<FeatureHistoryProps> = ({ featureId, userId, onBack }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadHistory()
    loadStats()
  }, [featureId, userId])

  const loadHistory = async () => {
    setLoading(true)
    
    // In production, fetch from API:
    // const response = await fetch(`/api/${featureId}/history?userId=${userId}`)
    // const data = await response.json()
    
    // Mock data for demonstration
    const mockHistory = generateMockHistory(featureId)
    setHistory(mockHistory)
    setLoading(false)
  }

  const loadStats = async () => {
    // In production:
    // const response = await fetch(`/api/${featureId}/stats?userId=${userId}`)
    // const data = await response.json()
    
    const mockStats = generateMockStats(featureId)
    setStats(mockStats)
  }

  const generateMockHistory = (featureId: string): HistoryEntry[] => {
    switch (featureId) {
      case 'rewards':
        return [
          { id: '1', timestamp: '2026-01-20 10:30', type: 'payout', amount: 45.20, description: 'Monthly conservation payout', status: 'completed' },
          { id: '2', timestamp: '2026-01-19 15:20', type: 'bonus', amount: 5.00, description: 'Gold tier bonus', status: 'completed' },
          { id: '3', timestamp: '2026-01-18 09:15', type: 'milestone', amount: 10.00, description: '1000 gallons saved milestone', status: 'completed' },
          { id: '4', timestamp: '2026-01-15 14:45', type: 'daily', amount: 1.50, description: 'Daily conservation reward', status: 'completed' },
          { id: '5', timestamp: '2026-01-10 11:00', type: 'payout', amount: 38.75, description: 'Bi-weekly payout', status: 'completed' }
        ]
      
      case 'water-credits':
        return [
          { id: '1', timestamp: '2026-01-20 14:00', type: 'earned', amount: 150, description: 'Conservation credits earned', status: 'completed' },
          { id: '2', timestamp: '2026-01-19 10:30', type: 'sold', amount: -200, description: 'Sold credits to marketplace at £0.055/credit', status: 'completed' },
          { id: '3', timestamp: '2026-01-18 16:45', type: 'earned', amount: 125, description: 'Weekly conservation credits', status: 'completed' },
          { id: '4', timestamp: '2026-01-15 09:00', type: 'purchased', amount: 300, description: 'Bought credits for bill payment', status: 'completed' },
          { id: '5', timestamp: '2026-01-12 11:20', type: 'transferred', amount: -50, description: 'Transferred to neighbor', status: 'completed' }
        ]
      
      case 'bills':
        return [
          { id: '1', timestamp: '2026-01-20 08:00', type: 'water', amount: 89.40, description: 'Water bill - January 2026', status: 'pending' },
          { id: '2', timestamp: '2026-01-15 10:30', type: 'electricity', amount: 124.50, description: 'Electricity bill - Paid with BSV', status: 'completed' },
          { id: '3', timestamp: '2026-01-10 14:15', type: 'water', amount: 95.20, description: 'Water bill - December 2025', status: 'completed' },
          { id: '4', timestamp: '2026-01-05 09:00', type: 'gas', amount: 78.30, description: 'Gas bill - Paid with credits', status: 'completed' },
          { id: '5', timestamp: '2025-12-20 11:45', type: 'water', amount: 102.15, description: 'Water bill - November 2025', status: 'completed' }
        ]
      
      case 'blockchain':
        return [
          { id: '1', timestamp: '2026-01-20 15:45', type: 'iot_proof', amount: 100, description: 'IoT reading proof', status: 'completed', metadata: { txId: 'taal_tx_1234567890', confirmations: 6 } },
          { id: '2', timestamp: '2026-01-20 14:30', type: 'payment', amount: 5000, description: 'Bill payment transaction', status: 'completed', metadata: { txId: 'taal_tx_1234567891', confirmations: 12 } },
          { id: '3', timestamp: '2026-01-20 12:15', type: 'data_hash', amount: 50, description: 'Data marketplace transaction', status: 'completed', metadata: { txId: 'taal_tx_1234567892', confirmations: 24 } },
          { id: '4', timestamp: '2026-01-20 10:00', type: 'iot_proof', amount: 100, description: 'Sensor data proof', status: 'completed', metadata: { txId: 'taal_tx_1234567893', confirmations: 48 } },
          { id: '5', timestamp: '2026-01-20 08:45', type: 'reward_payout', amount: 4520, description: 'Conservation reward payout', status: 'completed', metadata: { txId: 'taal_tx_1234567894', confirmations: 72 } }
        ]
      
      case 'ai-predictions':
        return [
          { id: '1', timestamp: '2026-01-20 16:00', type: 'leak_warning', description: 'Potential leak detected - Bathroom (78% confidence)', status: 'pending' },
          { id: '2', timestamp: '2026-01-19 09:30', type: 'anomaly', description: 'Unusual usage pattern - Kitchen sink', status: 'completed' },
          { id: '3', timestamp: '2026-01-18 14:15', type: 'forecast', description: 'High demand forecast for next 3 days', status: 'completed' },
          { id: '4', timestamp: '2026-01-15 11:00', type: 'resolved', description: 'Leak warning resolved - False alarm', status: 'completed' },
          { id: '5', timestamp: '2026-01-12 08:45', type: 'leak_warning', description: 'Drip detected - Outdoor faucet (92% confidence)', status: 'completed' }
        ]
      
      case 'social-intelligence':
        return [
          { id: '1', timestamp: '2026-01-20 17:00', type: 'alert', description: 'Elderly customer - No usage for 36 hours', status: 'pending' },
          { id: '2', timestamp: '2026-01-19 12:30', type: 'alert', description: 'Disabled customer - Spike in usage (possible leak)', status: 'completed' },
          { id: '3', timestamp: '2026-01-18 10:15', type: 'resolved', description: 'Welfare check completed - Customer OK', status: 'completed' },
          { id: '4', timestamp: '2026-01-15 14:45', type: 'alert', description: 'Low-income family - Bill payment overdue', status: 'completed' },
          { id: '5', timestamp: '2026-01-10 09:00', type: 'intervention', description: 'Crisis team dispatched - Medical emergency detected', status: 'completed' }
        ]
      
      default:
        return []
    }
  }

  const generateMockStats = (featureId: string): any => {
    switch (featureId) {
      case 'rewards':
        return {
          totalEarnings: '£342.50',
          currentTier: 'Gold',
          monthlyAverage: '£45.20',
          chartData: [
            { month: 'Jul', earnings: 28 },
            { month: 'Aug', earnings: 32 },
            { month: 'Sep', earnings: 38 },
            { month: 'Oct', earnings: 42 },
            { month: 'Nov', earnings: 39 },
            { month: 'Dec', earnings: 45 },
            { month: 'Jan', earnings: 45 }
          ]
        }
      
      case 'water-credits':
        return {
          currentBalance: '1,250 credits',
          totalEarned: '4,850 credits',
          totalSpent: '3,600 credits',
          chartData: [
            { month: 'Jul', earned: 650, spent: 420 },
            { month: 'Aug', earned: 720, spent: 580 },
            { month: 'Sep', earned: 680, spent: 450 },
            { month: 'Oct', earned: 750, spent: 620 },
            { month: 'Nov', earned: 710, spent: 530 },
            { month: 'Dec', earned: 690, spent: 480 },
            { month: 'Jan', earned: 650, spent: 520 }
          ]
        }
      
      case 'bills':
        return {
          totalPaid: '£1,847.50',
          averageBill: '£92.40',
          bsvSavings: '£36.95',
          chartData: [
            { month: 'Jul', water: 95, electricity: 120, gas: 65 },
            { month: 'Aug', water: 102, electricity: 135, gas: 45 },
            { month: 'Sep', water: 89, electricity: 110, gas: 72 },
            { month: 'Oct', water: 98, electricity: 125, gas: 85 },
            { month: 'Nov', water: 92, electricity: 140, gas: 95 },
            { month: 'Dec', water: 87, electricity: 155, gas: 110 },
            { month: 'Jan', water: 89, electricity: 125, gas: 78 }
          ]
        }
      
      case 'blockchain':
        return {
          totalProofs: '1,847',
          totalConfirmations: '24,582',
          averageFee: '50 sats',
          chartData: [
            { date: 'Jan 14', proofs: 245 },
            { date: 'Jan 15', proofs: 268 },
            { date: 'Jan 16', proofs: 252 },
            { date: 'Jan 17', proofs: 289 },
            { date: 'Jan 18', proofs: 274 },
            { date: 'Jan 19', proofs: 261 },
            { date: 'Jan 20', proofs: 258 }
          ]
        }
      
      case 'ai-predictions':
        return {
          totalPredictions: '47',
          accuracy: '94.2%',
          leaksDetected: '12',
          chartData: [
            { type: 'Leak Warnings', count: 12 },
            { type: 'Anomalies', count: 18 },
            { type: 'Forecasts', count: 15 },
            { type: 'False Alarms', count: 2 }
          ]
        }
      
      default:
        return null
    }
  }

  const getFeatureTitle = (featureId: string): string => {
    const titles: { [key: string]: string } = {
      'rewards': 'Conservation Rewards History',
      'water-credits': 'Water Credits Trading History',
      'bills': 'Utility Bill Payment History',
      'wallet': 'BSV Wallet Transactions',
      'conservation': 'Conservation Goals Progress',
      'marketplace': 'Data Marketplace Analytics',
      'integrations': 'System Integration Logs',
      'devices': 'IoT Device Activity',
      'ai-predictions': 'AI Predictions & Alerts',
      'blockchain': 'Blockchain Proof History',
      'taal': 'TAAL Transaction History',
      'social-intelligence': 'Social Intelligence Alerts'
    }
    return titles[featureId] || 'Feature History'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'pending': return 'warning'
      case 'failed': return 'error'
      default: return 'default'
    }
  }

  const formatAmount = (amount: number | undefined, type: string) => {
    if (!amount) return '-'
    
    if (type.includes('credit')) {
      return `${amount > 0 ? '+' : ''}${amount} credits`
    } else if (type.includes('blockchain') || type.includes('taal')) {
      return `${amount} sats`
    } else {
      return `£${Math.abs(amount).toFixed(2)}`
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight={600}>
            {getFeatureTitle(featureId)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View detailed history and analytics
          </Typography>
        </Box>
        <Button startIcon={<Download />} variant="outlined" sx={{ mr: 1 }}>
          Export
        </Button>
        <IconButton onClick={loadHistory}>
          <Refresh />
        </IconButton>
      </Box>

      {/* Stats Summary */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Object.entries(stats)
            .filter(([key]) => !key.includes('chartData'))
            .map(([key, value]) => (
              <Grid item xs={12} sm={6} md={3} key={key}>
                <Card>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      {key.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {value as string}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="History" />
          <Tab label="Analytics" />
          <Tab label="Insights" />
        </Tabs>
      </Paper>

      {/* History Table */}
      {activeTab === 0 && (
        <TableContainer component={Paper}>
          {loading && <LinearProgress />}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>{entry.timestamp}</TableCell>
                  <TableCell>
                    <Chip label={entry.type} size="small" />
                  </TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell align="right">
                    {formatAmount(entry.amount, entry.type)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.status}
                      size="small"
                      color={getStatusColor(entry.status) as any}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Analytics Charts */}
      {activeTab === 1 && stats?.chartData && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Trend Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                {Array.isArray(stats.chartData) && stats.chartData[0]?.month ? (
                  <LineChart data={stats.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {Object.keys(stats.chartData[0])
                      .filter(key => key !== 'month' && key !== 'date')
                      .map((key, index) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={['#8884d8', '#82ca9d', '#ffc658'][index]}
                          strokeWidth={2}
                        />
                      ))}
                  </LineChart>
                ) : (
                  <BarChart data={stats.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Insights Tab */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Key Insights
          </Typography>
          <Box sx={{ mt: 2 }}>
            {featureId === 'rewards' && (
              <>
                <Typography variant="body1" paragraph>
                  • You're in the top 15% of water savers in your area
                </Typography>
                <Typography variant="body1" paragraph>
                  • Your conservation efforts have saved 2,450 gallons this month
                </Typography>
                <Typography variant="body1" paragraph>
                  • You're £12.30 away from reaching Platinum tier
                </Typography>
              </>
            )}
            {featureId === 'bills' && (
              <>
                <Typography variant="body1" paragraph>
                  • Paying with BSV saved you £36.95 in rewards (2% back)
                </Typography>
                <Typography variant="body1" paragraph>
                  • Your water usage is 18% lower than neighborhood average
                </Typography>
                <Typography variant="body1" paragraph>
                  • Setting up auto-pay could save you £5/month in late fees
                </Typography>
              </>
            )}
            {featureId === 'blockchain' && (
              <>
                <Typography variant="body1" paragraph>
                  • All 1,847 proofs successfully confirmed on BSV blockchain
                </Typography>
                <Typography variant="body1" paragraph>
                  • Average confirmation time: 4.2 seconds
                </Typography>
                <Typography variant="body1" paragraph>
                  • Total fees paid: 0.000925 BSV (~£0.03)
                </Typography>
              </>
            )}
          </Box>
        </Paper>
      )}
    </Container>
  )
}

export default FeatureHistory
