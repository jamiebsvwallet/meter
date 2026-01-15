/**
 * Main Application Component
 * Routes between different user dashboards (Customer, Plumber, Water Company)
 */

import React, { useState, useEffect } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Menu,
  MenuItem,
  CircularProgress
} from '@mui/material'
import { styled } from '@mui/system'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { CustomerDashboard } from './components/CustomerDashboard'
import { PlumberPortal } from './components/PlumberPortal'
import { WaterCompanyDashboard } from './components/WaterCompanyDashboard'
import { AIMonitoringDashboard } from './components/AIMonitoringDashboard'
import { DigitalTwin3D } from './components/DigitalTwin3D'
import { PlumbingEducationGameVR } from './components/PlumbingEducationGameVR'
import { DemandForecastingDashboard } from './components/DemandForecastingDashboard'
import { QuantumSecurityDashboard } from './components/QuantumSecurityDashboard'
import { MarketplaceDashboard } from './components/MarketplaceDashboard'
import { apiService } from './services/api'

// Styled components
const StyledAppBar = styled(AppBar)({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
})

const MainContainer = styled(Container)({
  padding: '2rem 1rem',
  minHeight: 'calc(100vh - 64px)'
})

const LoadingContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 'calc(100vh - 64px)'
})

type UserRole = 'customer' | 'plumber' | 'water_company' | 'ai_monitoring' | 'digital_twin' | 'vr_training' | 'demand_forecast' | 'quantum_security' | 'marketplace' | null

interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>('customer')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  useEffect(() => {
    // Initialize app - check if user is authenticated
    const initializeApp = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        
        if (token) {
          // Verify token and get user profile
          const response = await apiService.getDocs()
          console.log('✓ API connected:', response.title)
        }

        // For demo purposes, set a default user
        const demoUser: User = {
          id: 'user_123',
          email: 'demo@plumbing.local',
          name: 'Demo User',
          role: userRole
        }
        setUser(demoUser)
      } catch (error) {
        console.error('Error initializing app:', error)
        toast.error('Failed to connect to API')
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [])

  const handleRoleChange = (newRole: UserRole) => {
    if (newRole) {
      setUserRole(newRole)
      const roles: { [key: string]: string } = {
        customer: 'Customer',
        plumber: 'Plumber',
        water_company: 'Water Company',
        ai_monitoring: 'AI Monitoring',
        digital_twin: '3D Digital Twin',
        vr_training: 'VR Training',
        demand_forecast: 'Demand Forecasting'
      }
      toast.info(`Switched to ${roles[newRole]} view`)
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
    handleMenuClose()
    toast.success('Logged out successfully')
  }

  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    )
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      <StyledAppBar position="sticky">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 'bold' }}
          >
            💧 Plumbing IoT BSV Platform
          </Typography>

          {/* Role Selector */}
          <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
            <Button
              color={userRole === 'customer' ? 'secondary' : 'inherit'}
              onClick={() => handleRoleChange('customer')}
              variant={userRole === 'customer' ? 'contained' : 'text'}
              size="small"
            >
              Customer
            </Button>
            <Button
              color={userRole === 'plumber' ? 'secondary' : 'inherit'}
              onClick={() => handleRoleChange('plumber')}
              variant={userRole === 'plumber' ? 'contained' : 'text'}
              size="small"
            >
              Plumber
            </Button>
            <Button
              color={userRole === 'water_company' ? 'secondary' : 'inherit'}
              onClick={() => handleRoleChange('water_company')}
              variant={userRole === 'water_company' ? 'contained' : 'text'}
              size="small"
            >
              Water Company
            </Button>
            <Button
              color={userRole === 'ai_monitoring' ? 'secondary' : 'inherit'}
              onClick={() => handleRoleChange('ai_monitoring')}
              variant={userRole === 'ai_monitoring' ? 'contained' : 'text'}
              size="small"
            >
              🤖 AI Monitor
            </Button>
            <Button
              color={userRole === 'digital_twin' ? 'secondary' : 'inherit'}
              onClick={() => handleRoleChange('digital_twin')}
              variant={userRole === 'digital_twin' ? 'contained' : 'text'}
              size="small"
            >
              🏠 Digital Twin
            </Button>
            <Button
              color={userRole === 'vr_training' ? 'secondary' : 'inherit'}
              onClick={() => handleRoleChange('vr_training')}
              variant={userRole === 'vr_training' ? 'contained' : 'text'}
              size="small"
            >
              🥽 VR Training
            </Button>
            <Button
              color={userRole === 'demand_forecast' ? 'secondary' : 'inherit'}
              onClick={() => handleRoleChange('demand_forecast')}
              variant={userRole === 'demand_forecast' ? 'contained' : 'text'}
              size="small"
            >
              📈 Forecasting
            </Button>
            <Button
              color={userRole === 'quantum_security' ? 'secondary' : 'inherit'}
              onClick={() => handleRoleChange('quantum_security')}
              variant={userRole === 'quantum_security' ? 'contained' : 'text'}
              size="small"
            >
              🔐 Quantum Security
            </Button>
            <Button
              color={userRole === 'marketplace' ? 'secondary' : 'inherit'}
              onClick={() => handleRoleChange('marketplace')}
              variant={userRole === 'marketplace' ? 'contained' : 'text'}
              size="small"
            >
              💰 Marketplace
            </Button>
          </Box>

          {/* User Menu */}
          <Button
            color="inherit"
            startIcon={<AccountCircleIcon />}
            onClick={handleMenuOpen}
          >
            {user?.name || 'User'}
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">{user?.email}</Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="textSecondary">
                Role: {userRole}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>

      <MainContainer maxWidth="lg">
        {userRole === 'customer' && (
          <CustomerDashboard propertyId="prop_001" />
        )}
        {userRole === 'plumber' && (
          <PlumberPortal plumberId="plumber_001" />
        )}
        {userRole === 'water_company' && (
          <WaterCompanyDashboard companyId="waterco_001" />
        )}
        {userRole === 'ai_monitoring' && (
          <AIMonitoringDashboard />
        )}
        {userRole === 'digital_twin' && (
          <DigitalTwin3D propertyId="prop_001" showLeaks={true} showSensors={true} liveData={true} />
        )}
        {userRole === 'vr_training' && (
          <PlumbingEducationGameVR />
        )}
        {userRole === 'demand_forecast' && (
          <DemandForecastingDashboard propertyId="prop_001" />
        )}
        {userRole === 'quantum_security' && (
          <QuantumSecurityDashboard />
        )}
        {userRole === 'marketplace' && (
          <MarketplaceDashboard />
        )}
      </MainContainer>
    </>
  )
}

export default App
