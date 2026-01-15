/**
 * Water Data Marketplace Dashboard
 * B2B API gateway for utilities, insurance, real estate, and enterprise customers
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  Tabs,
  Tab,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Business as BusinessIcon,
  ShowChart as ShowChartIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  LocalAtm as LocalAtmIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material'

interface APICustomer {
  customerId: string
  customerName: string
  customerType: string
  apiKey: string
  subscriptionTier: string
  creditsRemaining: number
  totalCalls: number
  totalSpent: number
}

interface APIProduct {
  name: string
  description: string
  cost: number
  endpoint: string
}

interface WaterCredit {
  creditId: string
  creditType: string
  gallonsSaved: number
  pricePerGallon: number
  totalValue: number
  issuedDate: string
  forSale: boolean
}

interface PredictionAlert {
  componentId: string
  componentType: string
  riskLevel: string
  hoursUntilFailure: number
  estimatedCost: number
  predictedFailureTime: string
}

export const MarketplaceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [customer, setCustomer] = useState<APICustomer | null>(null)
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [creditPurchaseOpen, setCreditPurchaseOpen] = useState(false)
  const [portfolio, setPortfolio] = useState<WaterCredit[]>([])
  const [marketListings, setMarketListings] = useState<WaterCredit[]>([])
  const [predictions, setPredictions] = useState<PredictionAlert[]>([])
  const [usageStats, setUsageStats] = useState<any>(null)
  const [roiData, setROIData] = useState<any>(null)

  // Form states
  const [customerName, setCustomerName] = useState('')
  const [customerType, setCustomerType] = useState('utility')
  const [bsvWallet, setBsvWallet] = useState('')
  const [satoshiAmount, setSatoshiAmount] = useState(10000)
  const [bsvTxId, setBsvTxId] = useState('')

  const API_PRODUCTS: APIProduct[] = [
    {
      name: 'Usage Data API',
      description: 'Real-time water consumption data',
      cost: 100,
      endpoint: '/api/marketplace/data/usage'
    },
    {
      name: 'Leak Detection API',
      description: 'AI-powered leak identification',
      cost: 500,
      endpoint: '/api/marketplace/data/leak-detection'
    },
    {
      name: 'Predictive Maintenance API',
      description: '72-hour failure prediction',
      cost: 1000,
      endpoint: '/api/marketplace/data/predictive-maintenance'
    },
    {
      name: 'Property Score API',
      description: 'Water infrastructure health score for real estate',
      cost: 2000,
      endpoint: '/api/marketplace/data/property-score'
    },
    {
      name: 'Bulk Analytics API',
      description: 'City-wide infrastructure analytics',
      cost: 5000,
      endpoint: '/api/marketplace/data/bulk-analytics'
    }
  ]

  const CUSTOMER_TYPES = [
    { value: 'utility', label: '💧 Water Utility', revenue: '$10K-$500K/year' },
    { value: 'insurance', label: '🛡️ Insurance Company', revenue: '$50K-$1M/year' },
    { value: 'real_estate', label: '🏠 Real Estate Platform', revenue: '$100K-$500K/year' },
    { value: 'smart_home', label: '🏡 Smart Home Provider', revenue: '$500K-$5M/year' },
    { value: 'construction', label: '🏗️ Construction/Engineering', revenue: '$20K-$200K/year' },
    { value: 'government', label: '🏛️ Government/Municipality', revenue: '$50K-$5M/year' },
    { value: 'esg_platform', label: '♻️ ESG/Sustainability Platform', revenue: '$100K-$2M/year' },
    { value: 'iot_platform', label: '📡 IoT Platform Provider', revenue: '$10K-$100K/year' },
    { value: 'research', label: '🔬 Research Institution', revenue: '$5K-$50K/year' }
  ]

  useEffect(() => {
    loadCustomerData()
    loadPredictions()
    loadROIData()
  }, [])

  const loadCustomerData = async () => {
    // Load customer profile if registered
    const savedCustomerId = localStorage.getItem('marketplace_customer_id')
    if (savedCustomerId) {
      try {
        const response = await fetch(`/api/marketplace/stats/customer/${savedCustomerId}`)
        const data = await response.json()
        setCustomer(data)
        setUsageStats(data)
        
        // Load portfolio
        const portfolioResponse = await fetch(`/api/marketplace/credits/portfolio/${savedCustomerId}`)
        const portfolioData = await portfolioResponse.json()
        setPortfolio(portfolioData.credits || [])
      } catch (error) {
        console.error('Failed to load customer data:', error)
      }
    }
  }

  const loadPredictions = async () => {
    // Mock predictions for demo
    setPredictions([
      {
        componentId: 'pipe_001',
        componentType: 'main_pipe',
        riskLevel: 'critical',
        hoursUntilFailure: 18,
        estimatedCost: 85000,
        predictedFailureTime: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString()
      },
      {
        componentId: 'valve_047',
        componentType: 'valve',
        riskLevel: 'high',
        hoursUntilFailure: 36,
        estimatedCost: 12000,
        predictedFailureTime: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString()
      }
    ])
  }

  const loadROIData = async () => {
    try {
      const response = await fetch('/api/marketplace/predict/roi-analysis', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      const data = await response.json()
      setROIData(data)
    } catch (error) {
      console.error('Failed to load ROI data:', error)
    }
  }

  const handleRegistration = async () => {
    try {
      const response = await fetch('/api/marketplace/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerType,
          bsvWalletAddress: bsvWallet
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        localStorage.setItem('marketplace_customer_id', data.customerId)
        localStorage.setItem('marketplace_api_key', data.apiKey)
        setCustomer(data)
        setRegistrationOpen(false)
        alert(`✅ Registered! Your API Key: ${data.apiKey}`)
      } else {
        alert('Registration failed: ' + data.error)
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('Registration failed')
    }
  }

  const handleCreditPurchase = async () => {
    try {
      const customerId = localStorage.getItem('marketplace_customer_id')
      const response = await fetch('/api/marketplace/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          satoshiAmount,
          bsvTxId
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setCreditPurchaseOpen(false)
        loadCustomerData()
        alert(`✅ Purchased ${data.creditsAdded} credits!`)
      } else {
        alert('Purchase failed: ' + data.error)
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Purchase failed')
    }
  }

  const handleListForSale = async (creditId: string, price: number) => {
    try {
      const response = await fetch('/api/marketplace/credits/list-for-sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          creditId,
          pricePerGallon: price
        })
      })

      if (response.ok) {
        loadCustomerData()
        alert('✅ Credit listed for sale!')
      }
    } catch (error) {
      console.error('List error:', error)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
          💰 Water Data Marketplace
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          B2B API Gateway • Predictive Infrastructure AI • Water Credits Trading
        </Typography>
      </Box>

      {/* Customer Status Banner */}
      {customer ? (
        <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2">Customer</Typography>
              <Typography variant="h6">{customer.customerName}</Typography>
              <Chip label={customer.subscriptionTier} size="small" sx={{ mt: 1, bgcolor: 'white', color: '#764ba2' }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2">API Credits</Typography>
              <Typography variant="h4">{customer.creditsRemaining?.toLocaleString() || 0}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2">Total API Calls</Typography>
              <Typography variant="h4">{customer.totalCalls?.toLocaleString() || 0}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2">Total Spent</Typography>
              <Typography variant="h4">{customer.totalSpent?.toLocaleString() || 0} sats</Typography>
            </Grid>
          </Grid>
          <Button
            variant="contained"
            startIcon={<LocalAtmIcon />}
            onClick={() => setCreditPurchaseOpen(true)}
            sx={{ mt: 2, bgcolor: 'white', color: '#764ba2', '&:hover': { bgcolor: '#f0f0f0' } }}
          >
            Purchase Credits
          </Button>
        </Paper>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Get Started with B2B API Access</Typography>
          <Typography>Register your company to access water data APIs, predictive maintenance, and water credits trading.</Typography>
          <Button
            variant="contained"
            startIcon={<BusinessIcon />}
            onClick={() => setRegistrationOpen(true)}
            sx={{ mt: 2 }}
          >
            Register Your Company
          </Button>
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable">
          <Tab label="🛒 API Products" />
          <Tab label="💧 Water Credits" />
          <Tab label="🔮 Predictions" />
          <Tab label="📊 Analytics" />
        </Tabs>
      </Paper>

      {/* Tab 0: API Products */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {API_PRODUCTS.map((product, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>{product.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {product.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      icon={<LocalAtmIcon />}
                      label={`${product.cost} satoshis/call`}
                      color="primary"
                    />
                    <Button variant="outlined" size="small" disabled={!customer}>
                      Test API
                    </Button>
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 2, fontFamily: 'monospace' }}>
                    {product.endpoint}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tab 1: Water Credits */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>💼 Your Portfolio</Typography>
              {portfolio.length === 0 ? (
                <Alert severity="info">No water credits yet. Earn credits by saving water!</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Gallons</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {portfolio.map((credit) => (
                      <TableRow key={credit.creditId}>
                        <TableCell>{credit.creditType}</TableCell>
                        <TableCell align="right">{credit.gallonsSaved.toLocaleString()}</TableCell>
                        <TableCell align="right">${credit.totalValue.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          {credit.forSale ? (
                            <Chip label="For Sale" size="small" color="success" />
                          ) : (
                            <Button size="small" onClick={() => handleListForSale(credit.creditId, 0.06)}>
                              Sell
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>🛍️ Marketplace</Typography>
              {marketListings.length === 0 ? (
                <Alert severity="info">No credits available for purchase</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Gallons</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {marketListings.map((credit) => (
                      <TableRow key={credit.creditId}>
                        <TableCell>{credit.creditType}</TableCell>
                        <TableCell align="right">{credit.gallonsSaved.toLocaleString()}</TableCell>
                        <TableCell align="right">${credit.totalValue.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="contained" disabled={!customer}>
                            Buy
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Alert severity="success">
              <Typography variant="h6">Water Credits = Carbon Credits for Water 🌍</Typography>
              <Typography>Trade tokenized conservation credits on the BSV blockchain. ESG-compliant, auditable, transparent.</Typography>
            </Alert>
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Predictions */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>⚠️ Infrastructure Failure Predictions</Typography>
          {predictions.map((pred, index) => (
            <Paper
              key={index}
              sx={{
                p: 3,
                mb: 2,
                borderLeft: pred.riskLevel === 'critical' ? '4px solid #f44336' : '4px solid #ff9800'
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">Component</Typography>
                  <Typography variant="h6">{pred.componentId}</Typography>
                  <Chip label={pred.componentType} size="small" sx={{ mt: 1 }} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography variant="subtitle2" color="text.secondary">Risk Level</Typography>
                  <Chip
                    label={pred.riskLevel.toUpperCase()}
                    color={pred.riskLevel === 'critical' ? 'error' : 'warning'}
                    icon={<WarningIcon />}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography variant="subtitle2" color="text.secondary">Time Until Failure</Typography>
                  <Typography variant="h5" color="error">{pred.hoursUntilFailure}h</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">Estimated Repair Cost</Typography>
                  <Typography variant="h5">${(pred.estimatedCost / 1000).toFixed(0)}K</Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button variant="contained" color="error" fullWidth disabled={!customer}>
                    Schedule Repair
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          ))}
          
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="h6">72-Hour Advance Warning System 🔮</Typography>
            <Typography>Quantum ML + classical ML ensemble predicts failures before they happen. Save $50K-$500K in emergency repairs.</Typography>
          </Alert>
        </Box>
      )}

      {/* Tab 3: Analytics */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>📊 Usage Statistics</Typography>
                {usageStats ? (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography>Total API Calls</Typography>
                      <Typography variant="h6">{usageStats.totalCalls?.toLocaleString() || 0}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography>Total Spent</Typography>
                      <Typography variant="h6">{usageStats.totalSpent?.toLocaleString() || 0} sats</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography>Avg Response Time</Typography>
                      <Typography variant="h6">{usageStats.averageResponseTime || 'N/A'}ms</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info">Register to see analytics</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>💰 ROI Analysis</Typography>
                {roiData ? (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography>Potential Savings</Typography>
                      <Typography variant="h6" color="success.main">
                        ${(roiData.potentialSavings / 1000).toFixed(0)}K
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography>Preventive Costs</Typography>
                      <Typography variant="h6">${(roiData.preventiveCosts / 1000).toFixed(0)}K</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography>High Risk Components</Typography>
                      <Typography variant="h6" color="error">{roiData.highRiskComponents}</Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">Net Savings</Typography>
                      <Typography variant="h5" color="success.main">
                        ${((roiData.potentialSavings - roiData.preventiveCosts) / 1000).toFixed(0)}K
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info">No ROI data available</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>💎 Revenue Potential by Customer Type</Typography>
              <Grid container spacing={2}>
                {CUSTOMER_TYPES.map((type) => (
                  <Grid item xs={12} sm={6} md={4} key={type.value}>
                    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                      <Typography variant="subtitle2">{type.label}</Typography>
                      <Typography variant="h6" color="primary">{type.revenue}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Registration Dialog */}
      <Dialog open={registrationOpen} onClose={() => setRegistrationOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Register Your Company</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Company Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Company Type</InputLabel>
            <Select value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
              {CUSTOMER_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label} - {type.revenue}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="BSV Wallet Address"
            value={bsvWallet}
            onChange={(e) => setBsvWallet(e.target.value)}
            helperText="For micropayment billing"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegistrationOpen(false)}>Cancel</Button>
          <Button onClick={handleRegistration} variant="contained" disabled={!customerName || !bsvWallet}>
            Register
          </Button>
        </DialogActions>
      </Dialog>

      {/* Credit Purchase Dialog */}
      <Dialog open={creditPurchaseOpen} onClose={() => setCreditPurchaseOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Purchase API Credits</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Satoshi Amount"
            value={satoshiAmount}
            onChange={(e) => setSatoshiAmount(Number(e.target.value))}
            sx={{ mb: 2, mt: 1 }}
            helperText={`= ${satoshiAmount.toLocaleString()} API credits (1:1 ratio)`}
          />
          <TextField
            fullWidth
            label="BSV Transaction ID"
            value={bsvTxId}
            onChange={(e) => setBsvTxId(e.target.value)}
            helperText="Send payment to company BSV address, then paste txId"
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Payment Instructions:</strong><br />
              1. Send {satoshiAmount} satoshis to company wallet<br />
              2. Copy the transaction ID<br />
              3. Paste it above to verify payment
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreditPurchaseOpen(false)}>Cancel</Button>
          <Button onClick={handleCreditPurchase} variant="contained" disabled={!bsvTxId}>
            Verify & Purchase
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
