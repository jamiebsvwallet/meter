/**
 * Unified Platform Dashboard
 * Main entry point showing all platform features with easy navigation
 * Click any card to see detailed history and analytics
 * 
 * Copyright © 2026 - All Rights Reserved
 */

import React, { useState, useEffect } from 'react'
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  Avatar,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Badge
} from '@mui/material'
import { styled } from '@mui/system'
import {
  WaterDrop,
  AccountBalanceWallet,
  Receipt,
  Psychology,
  Warning,
  Security,
  DevicesOther,
  Store,
  EmojiEvents,
  Timeline,
  IntegrationInstructions,
  CloudUpload,
  CameraAlt,
  SportsEsports,
  BugReport
} from '@mui/icons-material'

// Styled Components
const DashboardContainer = styled(Container)({
  paddingTop: '2em',
  paddingBottom: '2em'
})

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
  }
}))

const StatBox = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '1em'
})

const CategoryHeader = styled(Typography)({
  fontWeight: 600,
  marginTop: '2em',
  marginBottom: '1em',
  color: '#1976d2'
})

interface DashboardFeature {
  id: string
  title: string
  description: string
  icon: React.ReactElement
  color: string
  stats?: {
    label: string
    value: string | number
  }
  badge?: number
  path: string
  category: 'consumer' | 'business' | 'technical' | 'social'
}

interface UnifiedDashboardProps {
  userId?: string
  userType: 'consumer' | 'business' | 'admin'
  onFeatureSelect: (featureId: string) => void
}

const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  userId,
  userType,
  onFeatureSelect
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [features, setFeatures] = useState<DashboardFeature[]>([])
  const [loading, setLoading] = useState(true)

  // Define all platform features
  const allFeatures: DashboardFeature[] = [
    // Consumer Features
    {
      id: 'rewards',
      title: 'Conservation Rewards',
      description: 'Earn money by saving water. Track your tier and monthly earnings.',
      icon: <EmojiEvents fontSize="large" />,
      color: '#FFD700',
      stats: {
        label: 'Monthly Earnings',
        value: '£45.20'
      },
      badge: 3, // New rewards available
      path: '/rewards/history',
      category: 'consumer'
    },
    {
      id: 'water-credits',
      title: 'Water Credits',
      description: 'Buy, sell, and trade water credits. View your credit balance and marketplace.',
      icon: <WaterDrop fontSize="large" />,
      color: '#2196F3',
      stats: {
        label: 'Credit Balance',
        value: '1,250 credits'
      },
      path: '/credits/trading',
      category: 'consumer'
    },
    {
      id: 'bills',
      title: 'Utility Bills',
      description: 'Pay water, electricity, and gas bills. View payment history and split payments.',
      icon: <Receipt fontSize="large" />,
      color: '#4CAF50',
      stats: {
        label: 'Next Bill Due',
        value: '£89.40'
      },
      badge: 1, // Bill due soon
      path: '/bills/history',
      category: 'consumer'
    },
    {
      id: 'wallet',
      title: 'BSV Wallet',
      description: 'Manage your Bitcoin SV wallet. Send and receive micropayments.',
      icon: <AccountBalanceWallet fontSize="large" />,
      color: '#FF9800',
      stats: {
        label: 'Balance',
        value: '0.0245 BSV'
      },
      path: '/wallet/transactions',
      category: 'consumer'
    },
    {
      id: 'conservation',
      title: 'Conservation Goals',
      description: 'Set and track water conservation goals. Compete with neighbors.',
      icon: <Timeline fontSize="large" />,
      color: '#00BCD4',
      stats: {
        label: 'This Month',
        value: '12% savings'
      },
      path: '/conservation/goals',
      category: 'consumer'
    },

    // Business Features
    {
      id: 'photo-job-report',
      title: 'Photo Job Reports',
      description: 'Professional photo documentation with blockchain verification. Before/after photos with digital twin mapping.',
      icon: <CameraAlt fontSize="large" />,
      color: '#4CAF50',
      stats: {
        label: 'Reports Created',
        value: '0'
      },
      badge: 0,
      path: '/job-reports/photo',
      category: 'business'
    },
    {
      id: 'advanced-leak-detection',
      title: 'Advanced Leak Detection',
      description: '5 breakthrough features: Smart meter overlay, neighborhood mapping, 3D infrastructure, acoustic analysis, hotspot prediction.',
      icon: <WaterDrop fontSize="large" />,
      color: '#2196F3',
      stats: {
        label: 'Reports',
        value: '0'
      },
      badge: 0,
      path: '/leak-detection/advanced',
      category: 'business'
    },
    {
      id: 'pilot-signup',
      title: 'Pilot Program Signup',
      description: 'Recruit customers for water management pilot. Track signups and conversions.',
      icon: <EmojiEvents fontSize="large" />,
      color: '#FF9800',
      stats: {
        label: 'Signups',
        value: '0'
      },
      path: '/pilot/signup',
      category: 'business'
    },
    {
      id: 'vr-training-game',
      title: '3D Education Game',
      description: '7-level VR/XR plumbing training game. Progressive skill-based learning with immersive support.',
      icon: <SportsEsports fontSize="large" />,
      color: '#9C27B0',
      stats: {
        label: 'Levels',
        value: '7 available'
      },
      path: '/training/vr-game',
      category: 'business'
    },
    {
      id: 'vulnerability-monitoring',
      title: 'Vulnerability Monitoring',
      description: 'Guardian Angel system - Detect vulnerable customers, payment anomalies, crisis situations.',
      icon: <BugReport fontSize="large" />,
      color: '#F44336',
      stats: {
        label: 'Alerts',
        value: '0'
      },
      badge: 0,
      path: '/monitoring/vulnerability',
      category: 'business'
    },
    {
      id: 'marketplace',
      title: 'Data Marketplace',
      description: 'Sell water data or buy analytics. API usage and revenue tracking.',
      icon: <Store fontSize="large" />,
      color: '#9C27B0',
      stats: {
        label: 'Monthly Revenue',
        value: '£1,240'
      },
      path: '/marketplace/analytics',
      category: 'business'
    },
    {
      id: 'integrations',
      title: 'System Integrations',
      description: 'Connect SCADA, GIS, ERP, LoRaWAN. Manage data flows.',
      icon: <IntegrationInstructions fontSize="large" />,
      color: '#3F51B5',
      stats: {
        label: 'Active Connections',
        value: '8 systems'
      },
      path: '/integrations/dashboard',
      category: 'business'
    },
    {
      id: 'devices',
      title: 'IoT Devices',
      description: 'Manage smart meters, sensors, and leak detectors. Device health monitoring.',
      icon: <DevicesOther fontSize="large" />,
      color: '#607D8B',
      stats: {
        label: 'Active Devices',
        value: '23 devices'
      },
      badge: 2, // Devices need attention
      path: '/devices/management',
      category: 'business'
    },

    // Technical Features
    {
      id: 'ai-predictions',
      title: 'AI Predictions',
      description: 'Leak predictions, demand forecasting, and anomaly detection.',
      icon: <Psychology fontSize="large" />,
      color: '#E91E63',
      stats: {
        label: 'Active Alerts',
        value: '2 warnings'
      },
      badge: 2,
      path: '/ai/predictions',
      category: 'technical'
    },
    {
      id: 'blockchain',
      title: 'Blockchain Proofs',
      description: 'View transaction history on BSV. TAAL and Metastream activity.',
      icon: <Security fontSize="large" />,
      color: '#795548',
      stats: {
        label: 'Total Proofs',
        value: '1,847'
      },
      path: '/blockchain/proofs',
      category: 'technical'
    },
    {
      id: 'taal',
      title: 'TAAL Transactions',
      description: 'Enterprise BSV transaction processing. Confirmations and status.',
      icon: <CloudUpload fontSize="large" />,
      color: '#00897B',
      stats: {
        label: 'This Month',
        value: '342 txs'
      },
      path: '/taal/transactions',
      category: 'technical'
    },

    // Social Features
    {
      id: 'social-intelligence',
      title: 'Social Intelligence',
      description: 'Guardian Angel system. Vulnerable customer protection and crisis detection.',
      icon: <Warning fontSize="large" />,
      color: '#F44336',
      stats: {
        label: 'At-Risk Customers',
        value: '5 alerts'
      },
      badge: 5, // Urgent alerts
      path: '/social/dashboard',
      category: 'social'
    }
  ]

  useEffect(() => {
    // Load features based on user type
    loadFeatures()
  }, [userId, userType])

  const loadFeatures = async () => {
    setLoading(true)
    
    // Filter features based on user type
    let filteredFeatures = allFeatures
    
    if (userType === 'consumer') {
      filteredFeatures = allFeatures.filter(f => 
        f.category === 'consumer' || f.category === 'technical'
      )
    } else if (userType === 'business') {
      filteredFeatures = allFeatures
    }

    // Load real-time stats for each feature
    // In production, this would fetch from APIs
    // const statsPromises = filteredFeatures.map(async (feature) => {
    //   const stats = await fetch(`/api/${feature.id}/stats`)
    //   return { ...feature, stats: await stats.json() }
    // })
    // const featuresWithStats = await Promise.all(statsPromises)

    setFeatures(filteredFeatures)
    setLoading(false)
  }

  const handleCategoryChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedCategory(newValue)
  }

  const filteredFeatures = selectedCategory === 'all'
    ? features
    : features.filter(f => f.category === selectedCategory)

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'consumer': return 'Consumer'
      case 'business': return 'Business'
      case 'technical': return 'Technical'
      case 'social': return 'Social Impact'
      default: return 'All Features'
    }
  }

  return (
    <DashboardContainer maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom fontWeight={600}>
          Platform Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Click any feature to view detailed history and analytics
        </Typography>
      </Box>

      {/* Category Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedCategory}
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Features" value="all" />
          <Tab label="Consumer" value="consumer" />
          <Tab label="Business" value="business" />
          <Tab label="Technical" value="technical" />
          <Tab label="Social Impact" value="social" />
        </Tabs>
      </Paper>

      {/* Feature Cards Grid */}
      <Grid container spacing={3}>
        {filteredFeatures.map((feature) => (
          <Grid item xs={12} sm={6} md={4} key={feature.id}>
            <FeatureCard elevation={3}>
              <CardActionArea 
                onClick={() => onFeatureSelect(feature.id)}
                sx={{ height: '100%', p: 2 }}
              >
                <CardContent>
                  {/* Icon with Badge */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Badge 
                      badgeContent={feature.badge} 
                      color="error"
                      sx={{ mr: 2 }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: feature.color,
                          width: 56,
                          height: 56
                        }}
                      >
                        {feature.icon}
                      </Avatar>
                    </Badge>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {feature.title}
                      </Typography>
                      <Chip
                        label={getCategoryLabel(feature.category)}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {feature.description}
                  </Typography>

                  {/* Stats */}
                  {feature.stats && (
                    <StatBox>
                      <Typography variant="caption" color="text.secondary">
                        {feature.stats.label}
                      </Typography>
                      <Typography variant="h6" fontWeight={600} color={feature.color}>
                        {feature.stats.value}
                      </Typography>
                    </StatBox>
                  )}
                </CardContent>
              </CardActionArea>
            </FeatureCard>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {filteredFeatures.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No features available in this category
          </Typography>
        </Box>
      )}
    </DashboardContainer>
  )
}

export default UnifiedDashboard
