/**
 * Pilot Program Signup Page
 * For recruiting initial customers to test water management platform
 */

import React, { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Grid,
  Alert,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel
} from '@mui/material'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import SecurityIcon from '@mui/icons-material/Security'

interface PilotSignupForm {
  // Contact Information
  fullName: string
  email: string
  phone: string
  
  // Property Information
  propertyAddress: string
  propertyType: 'house' | 'flat' | 'commercial' | 'multi-unit'
  numberOfOccupants: string
  
  // Current Water Situation
  estimatedMonthlyBill: string
  knownLeaks: 'yes' | 'no' | 'unsure'
  previousLeakIssues: string
  
  // Smart Meter
  hasSmartMeter: 'yes' | 'no' | 'unsure'
  meterType: string
  
  // Consent
  agreeToTerms: boolean
  agreeToDataSharing: boolean
}

export const PilotSignup: React.FC = () => {
  const [formData, setFormData] = useState<PilotSignupForm>({
    fullName: '',
    email: '',
    phone: '',
    propertyAddress: '',
    propertyType: 'house',
    numberOfOccupants: '',
    estimatedMonthlyBill: '',
    knownLeaks: 'no',
    previousLeakIssues: '',
    hasSmartMeter: 'unsure',
    meterType: '',
    agreeToTerms: false,
    agreeToDataSharing: false
  })

  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions')
      return
    }

    if (!formData.agreeToDataSharing) {
      setError('Data sharing consent required for pilot program')
      return
    }

    try {
      // Submit to backend
      const response = await fetch('/api/pilot/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Signup failed')

      setSubmitted(true)
    } catch (err) {
      setError('Failed to submit signup. Please try again or contact us directly.')
      console.error(err)
    }
  }

  const handleChange = (field: keyof PilotSignupForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (submitted) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card sx={{ textAlign: 'center', p: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Thank You for Signing Up!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            We've received your application for our FREE 3-month Water Management Pilot Program.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>What happens next:</strong>
          </Typography>
          <Box sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto', mb: 3 }}>
            <Typography variant="body2" paragraph>
              1. We'll call you within 24-48 hours to schedule installation<br/>
              2. Quick 15-minute site survey (check smart meter access)<br/>
              3. Platform activation (usually same day)<br/>
              4. Start seeing leak alerts and savings within 24 hours
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Questions? Call us: <strong>07XXX XXX XXX</strong> or email: <strong>pilot@yourcompany.com</strong>
          </Typography>
        </Card>
      </Container>
    )
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <WaterDropIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" gutterBottom fontWeight="bold">
            FREE 3-Month Water Management Pilot
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            Save £50-200 on your water bill. Detect leaks before they cause damage.
          </Typography>
        </Box>

        {/* Benefits */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 3 }}>
              <TrendingDownIcon sx={{ fontSize: 50, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Reduce Water Bills</Typography>
              <Typography variant="body2" color="text.secondary">
                Average savings: £150/year through leak detection and usage insights
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 3 }}>
              <SecurityIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Prevent Damage</Typography>
              <Typography variant="body2" color="text.secondary">
                AI detects leaks early - avoid £1,000+ emergency repair costs
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 3 }}>
              <CheckCircleIcon sx={{ fontSize: 50, color: 'info.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Zero Installation</Typography>
              <Typography variant="body2" color="text.secondary">
                No hardware required. Works with your existing smart meter.
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Signup Form */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Join Our Pilot Program
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Limited to 20 properties. Priority given to existing customers.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Contact Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Contact Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Full Name"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    type="email"
                    label="Email Address"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="07XXX XXX XXX"
                  />
                </Grid>

                {/* Property Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Property Information
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={2}
                    label="Property Address"
                    value={formData.propertyAddress}
                    onChange={(e) => handleChange('propertyAddress', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl component="fieldset" fullWidth>
                    <FormLabel>Property Type</FormLabel>
                    <RadioGroup
                      value={formData.propertyType}
                      onChange={(e) => handleChange('propertyType', e.target.value)}
                    >
                      <FormControlLabel value="house" control={<Radio />} label="House" />
                      <FormControlLabel value="flat" control={<Radio />} label="Flat/Apartment" />
                      <FormControlLabel value="commercial" control={<Radio />} label="Commercial" />
                      <FormControlLabel value="multi-unit" control={<Radio />} label="Multi-Unit Building" />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Number of Occupants"
                    type="number"
                    value={formData.numberOfOccupants}
                    onChange={(e) => handleChange('numberOfOccupants', e.target.value)}
                  />
                </Grid>

                {/* Water Situation */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Current Water Situation
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Estimated Monthly Water Bill (£)"
                    type="number"
                    value={formData.estimatedMonthlyBill}
                    onChange={(e) => handleChange('estimatedMonthlyBill', e.target.value)}
                    helperText="Approximate is fine"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl component="fieldset" fullWidth>
                    <FormLabel>Do you have known leaks?</FormLabel>
                    <RadioGroup
                      value={formData.knownLeaks}
                      onChange={(e) => handleChange('knownLeaks', e.target.value)}
                    >
                      <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                      <FormControlLabel value="no" control={<Radio />} label="No" />
                      <FormControlLabel value="unsure" control={<Radio />} label="Not sure" />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Previous Leak Issues (Optional)"
                    value={formData.previousLeakIssues}
                    onChange={(e) => handleChange('previousLeakIssues', e.target.value)}
                    helperText="Any history of burst pipes, hidden leaks, or water damage?"
                  />
                </Grid>

                {/* Smart Meter */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Smart Meter Information
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl component="fieldset" fullWidth>
                    <FormLabel>Do you have a smart water meter?</FormLabel>
                    <RadioGroup
                      value={formData.hasSmartMeter}
                      onChange={(e) => handleChange('hasSmartMeter', e.target.value)}
                    >
                      <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                      <FormControlLabel value="no" control={<Radio />} label="No" />
                      <FormControlLabel value="unsure" control={<Radio />} label="Not sure" />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Meter Type/Brand (if known)"
                    value={formData.meterType}
                    onChange={(e) => handleChange('meterType', e.target.value)}
                    helperText="E.g., Elster, Sensus, Itron - leave blank if unsure"
                  />
                </Grid>

                {/* Consent */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Program Agreement
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.agreeToTerms}
                        onChange={(e) => handleChange('agreeToTerms', e.target.checked)}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I agree to participate in the 3-month pilot program and understand this is a FREE trial with no obligation to continue after the pilot period.
                      </Typography>
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.agreeToDataSharing}
                        onChange={(e) => handleChange('agreeToDataSharing', e.target.checked)}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I consent to sharing my anonymized water usage data for AI training and leak detection accuracy improvement. Your personal information remains private.
                      </Typography>
                    }
                  />
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{ mt: 2, py: 1.5 }}
                  >
                    Join Free Pilot Program
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                    By submitting this form, you'll be contacted within 24-48 hours to schedule setup.
                    Questions? Call 07XXX XXX XXX
                  </Typography>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Frequently Asked Questions
          </Typography>
          
          <Card sx={{ mb: 2, p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              What's included in the pilot?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • AI leak detection and alerts<br/>
              • Daily water usage monitoring<br/>
              • Monthly savings reports<br/>
              • Priority repair service (if leaks found)<br/>
              • Personalized water conservation tips
            </Typography>
          </Card>

          <Card sx={{ mb: 2, p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Do I need to install anything?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No! If you have a smart meter, we access data remotely (with your permission). 
              If not, we'll discuss options - often we can work with your existing meter.
            </Typography>
          </Card>

          <Card sx={{ mb: 2, p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              What happens after 3 months?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You decide! If you love it, continue for £5-10/month. If not, no obligation to continue. 
              We'll provide a full report of your savings and water conservation.
            </Typography>
          </Card>

          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Why is this free?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We're gathering real-world data to improve our AI and demonstrate value to water companies. 
              Your participation helps us prove the technology works - and you get free leak protection!
            </Typography>
          </Card>
        </Box>
      </Container>
    </Box>
  )
}

export default PilotSignup
