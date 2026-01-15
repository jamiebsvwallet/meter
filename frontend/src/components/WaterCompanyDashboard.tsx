import React, { useState, useEffect } from 'react'
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Alert
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import BlockIcon from '@mui/icons-material/Block'
import PublicIcon from '@mui/icons-material/Public'

interface ConsentRecord {
  propertyId: string
  customerId: string
  plumberId: string
  waterCompanyAccess: Array<{
    companyId: string
    grantedAt: string
    reason?: string
    isActive: boolean
    revokedAt?: string
  }>
}

interface WaterCompanyProperty {
  propertyId: string
  address: string
  customerId: string
  alertCount: number
  lastDataUpdate: string
  consentStatus: 'active' | 'expired' | 'revoked'
}

/**
 * Water Company Dashboard - Access consented data
 */
export const WaterCompanyDashboard: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [properties, setProperties] = useState<WaterCompanyProperty[]>([])
  const [selectedProperty, setSelectedProperty] = useState<WaterCompanyProperty | null>(null)
  const [consentDetails, setConsentDetails] = useState<ConsentRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProperties()
  }, [companyId])

  const loadProperties = async () => {
    try {
      const res = await fetch(`/api/water-company/${companyId}/properties`)
      const data = await res.json()
      setProperties(data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading properties:', error)
      setLoading(false)
    }
  }

  const handlePropertySelect = async (property: WaterCompanyProperty) => {
    setSelectedProperty(property)

    try {
      const res = await fetch(`/api/consent/${property.propertyId}/summary`)
      const data = await res.json()
      setConsentDetails(data)
    } catch (error) {
      console.error('Error loading consent details:', error)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Water Company Portal
      </Typography>

      <Grid container spacing={3}>
        {/* Properties List */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title={`Properties with Access (${properties.length})`}
              avatar={<PublicIcon />}
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Property ID</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {properties.map(property => (
                      <TableRow
                        key={property.propertyId}
                        onClick={() => handlePropertySelect(property)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: selectedProperty?.propertyId === property.propertyId ? '#f5f5f5' : 'transparent',
                          '&:hover': { backgroundColor: '#fafafa' }
                        }}
                      >
                        <TableCell>{property.propertyId}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={property.consentStatus}
                            color={property.consentStatus === 'active' ? 'success' : 'error'}
                            icon={property.consentStatus === 'active' ? <CheckCircleIcon /> : <BlockIcon />}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="primary">
                            View
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {properties.length === 0 && (
                <Alert severity="info">
                  No properties with active consent
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Property Details */}
        {selectedProperty && consentDetails && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title={`Property: ${selectedProperty.propertyId}`}
                subheader={`Customer: ${selectedProperty.customerId}`}
              />
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    CONSENT DETAILS
                  </Typography>
                  <Typography variant="body2">
                    <strong>Plumber:</strong> {consentDetails.plumberId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> Active
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    RECENT ALERTS
                  </Typography>
                  <Chip
                    label={`${selectedProperty.alertCount} alerts in 24h`}
                    color={selectedProperty.alertCount > 0 ? 'error' : 'success'}
                    variant="outlined"
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    LAST DATA UPDATE
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedProperty.lastDataUpdate).toLocaleString()}
                  </Typography>
                </Box>

                <Alert severity="info" sx={{ mt: 2 }}>
                  You can view real-time data for this property while consent is active.
                  Customer can revoke access at any time.
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Data Access Notice */}
      {properties.length > 0 && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            Data Access Agreement
          </Typography>
          <Typography variant="body2">
            You have been granted access to real-time water system data by property owners.
            This data is provided for leak prevention and water conservation purposes only.
            Unauthorized use or sharing of this data is prohibited.
          </Typography>
        </Alert>
      )}
    </Container>
  )
}
