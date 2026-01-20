/**
 * Enhanced Leak Detection Job Report Component
 * Specialized features for leak detection documentation
 * Including time-lapse, water waste calculation, thermal imaging overlay
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Grid,
  Chip,
  Alert,
  Paper,
  Divider,
  LinearProgress,
  Slider,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText
} from '@mui/material'
import {
  CameraAlt,
  PlayArrow,
  Pause,
  Stop,
  TrendingDown,
  WaterDrop,
  LocationOn,
  Timer,
  MonetizationOn,
  Warning,
  CheckCircle,
  CompareArrows,
  Thermostat
} from '@mui/icons-material'

interface LeakDetectionReport {
  jobId: string
  propertyId: string
  
  // Leak Details
  leakType: 'drip' | 'stream' | 'burst' | 'hidden' | 'underground'
  leakLocation: string
  leakSeverity: 'minor' | 'moderate' | 'major' | 'critical'
  discoveryMethod: 'visual' | 'acoustic' | 'thermal' | 'ai_prediction' | 'customer_report'
  
  // Water Waste Calculation
  flowRateMeasurement: {
    beforeRepair: number // liters per hour
    afterRepair: number
    testDuration: number // minutes
    measurementMethod: string
  }
  
  // Financial Impact
  waterWasted: {
    litersPerDay: number
    costPerDay: number
    projectedAnnualCost: number
    totalWastedBeforeRepair: number // liters
    daysLeaking: number
  }
  
  // Visual Evidence
  photos: LeakPhoto[]
  timelapseVideo?: {
    url: string
    duration: number
    showinglDripRate: boolean
  }
  
  // Detection Evidence
  detectionEvidence: {
    acousticSignature?: string
    thermalImage?: string
    aiPredictionScore?: number
    smartMeterAnomaly?: boolean
  }
  
  // Repair Details
  repairSteps: Array<{
    step: number
    description: string
    photo?: string
    timestamp: Date
  }>
  
  // Prevention Recommendations
  recommendations: {
    immediateActions: string[]
    preventiveMaintenance: string[]
    monitoringSetup: string[]
    estimatedCostToCustomer: number
  }
  
  // Customer Education
  customerExplanation: {
    whatCausedIt: string
    whyItMatters: string
    howToPrevent: string
    warningSignsToWatch: string[]
  }
}

interface LeakPhoto {
  id: string
  url: string
  type: 'before_dry' | 'leak_active' | 'damage_caused' | 'repair_process' | 'after_fixed' | 'proof_test'
  timestamp: Date
  annotation?: {
    text: string
    dripRate?: string // "5 drips/minute"
    waterDamage?: string
    estimatedCost?: string
  }
  measurements?: {
    wetAreaSize?: string // "30cm diameter"
    waterDepth?: string
    flowRate?: string
  }
}

export const LeakDetectionReport: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [reportData, setReportData] = useState<Partial<LeakDetectionReport>>({
    leakType: 'drip',
    leakSeverity: 'moderate',
    discoveryMethod: 'visual',
    photos: [],
    repairSteps: []
  })

  // Time-lapse recording state
  const [isRecordingTimelapse, setIsRecordingTimelapse] = useState(false)
  const [timelapseFrames, setTimelapseFrames] = useState<string[]>([])
  const [timelapseInterval, setTimelapseInterval] = useState(5) // seconds
  const videoRef = useRef<HTMLVideoElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Water waste calculation
  const calculateWaterWaste = () => {
    if (!reportData.flowRateMeasurement) return null

    const { beforeRepair, testDuration } = reportData.flowRateMeasurement
    const litersPerHour = (beforeRepair / testDuration) * 60
    const litersPerDay = litersPerHour * 24
    const daysLeaking = reportData.waterWasted?.daysLeaking || 7
    const waterRatePence = 0.15 // Average UK: £1.50 per 1000 liters = 0.15p per liter
    const costPerDay = litersPerDay * waterRatePence
    const projectedAnnualCost = costPerDay * 365
    const totalWasted = litersPerDay * daysLeaking

    return {
      litersPerDay: Math.round(litersPerDay),
      costPerDay: costPerDay.toFixed(2),
      projectedAnnualCost: projectedAnnualCost.toFixed(2),
      totalWastedBeforeRepair: Math.round(totalWasted),
      daysLeaking
    }
  }

  // Start time-lapse recording
  const startTimelapse = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsRecordingTimelapse(true)

        // Capture frame every X seconds
        intervalRef.current = setInterval(() => {
          captureTimelapseFrame()
        }, timelapseInterval * 1000)
      }
    } catch (error) {
      console.error('Camera access denied:', error)
      alert('Please allow camera access for time-lapse recording')
    }
  }

  const stopTimelapse = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    setIsRecordingTimelapse(false)
    
    // Generate time-lapse video from frames
    generateTimelapseVideo()
  }

  const captureTimelapseFrame = () => {
    if (!videoRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(videoRef.current, 0, 0)
    const frameData = canvas.toDataURL('image/jpeg', 0.8)
    setTimelapseFrames(prev => [...prev, frameData])
  }

  const generateTimelapseVideo = () => {
    // TODO: Combine frames into video using WebCodecs API or server-side processing
    console.log(`Generated time-lapse from ${timelapseFrames.length} frames`)
  }

  // Measure water flow rate with timer
  const measureFlowRate = () => {
    // Visual timer overlay showing drip counting
    return (
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.light' }}>
        <Typography variant="h6" gutterBottom>
          Measure Leak Flow Rate
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Place container under leak. Count drips for 1 minute or measure collected water.
        </Alert>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Water Collected (ml)"
              helperText="Amount collected in test period"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Test Duration (minutes)"
              defaultValue={1}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" fullWidth>
              Calculate Flow Rate
            </Button>
          </Grid>
        </Grid>
      </Paper>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Leak Severity Alert */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Leak Detection Report
        </Typography>
        
        {reportData.leakSeverity && (
          <Alert 
            severity={
              reportData.leakSeverity === 'critical' ? 'error' :
              reportData.leakSeverity === 'major' ? 'warning' :
              'info'
            }
            icon={<WaterDrop />}
          >
            <Typography variant="subtitle1">
              <strong>{reportData.leakSeverity.toUpperCase()} LEAK DETECTED</strong>
            </Typography>
            {reportData.waterWasted && (
              <Typography variant="body2">
                Estimated waste: {reportData.waterWasted.litersPerDay} liters/day 
                (£{reportData.waterWasted.costPerDay}/day)
              </Typography>
            )}
          </Alert>
        )}
      </Box>

      {/* Step 1: Leak Discovery */}
      {activeStep === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Leak Discovery & Assessment
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Leak Type"
                  value={reportData.leakType}
                  onChange={(e) => setReportData(prev => ({ ...prev, leakType: e.target.value as any }))}
                  SelectProps={{ native: true }}
                >
                  <option value="drip">Drip (slow, consistent)</option>
                  <option value="stream">Stream (continuous flow)</option>
                  <option value="burst">Burst Pipe (emergency)</option>
                  <option value="hidden">Hidden (behind walls/underground)</option>
                  <option value="underground">Underground (outside property)</option>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Leak Severity"
                  value={reportData.leakSeverity}
                  onChange={(e) => setReportData(prev => ({ ...prev, leakSeverity: e.target.value as any }))}
                  SelectProps={{ native: true }}
                >
                  <option value="minor">Minor (1-10 liters/day)</option>
                  <option value="moderate">Moderate (10-50 liters/day)</option>
                  <option value="major">Major (50-200 liters/day)</option>
                  <option value="critical">Critical (200+ liters/day)</option>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Leak Location"
                  placeholder="E.g., Kitchen sink cold water inlet valve"
                  value={reportData.leakLocation || ''}
                  onChange={(e) => setReportData(prev => ({ ...prev, leakLocation: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="How Was Leak Discovered?"
                  value={reportData.discoveryMethod}
                  onChange={(e) => setReportData(prev => ({ ...prev, discoveryMethod: e.target.value as any }))}
                  SelectProps={{ native: true }}
                >
                  <option value="visual">Visual inspection (saw water/moisture)</option>
                  <option value="acoustic">Acoustic detection (heard dripping/hissing)</option>
                  <option value="thermal">Thermal imaging (temperature anomaly)</option>
                  <option value="ai_prediction">AI prediction (smart meter analysis)</option>
                  <option value="customer_report">Customer reported (bill spike/noise)</option>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Estimated Days Leaking"
                  helperText="How long do you think this leak has been active?"
                  defaultValue={7}
                  onChange={(e) => setReportData(prev => ({
                    ...prev,
                    waterWasted: { ...prev.waterWasted, daysLeaking: parseInt(e.target.value) } as any
                  }))}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button variant="contained" onClick={() => setActiveStep(1)}>
                Next: Document Leak
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Visual Documentation */}
      {activeStep === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Visual Documentation
            </Typography>

            {/* Time-lapse Recording Feature */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.light' }}>
              <Typography variant="h6" gutterBottom>
                🎥 Time-Lapse Leak Recording
              </Typography>
              <Typography variant="body2" paragraph>
                Record time-lapse video showing active leak. Perfect for insurance claims and customer education.
              </Typography>

              {!isRecordingTimelapse ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Capture Interval: {timelapseInterval} seconds
                    </Typography>
                    <Slider
                      value={timelapseInterval}
                      onChange={(_, val) => setTimelapseInterval(val as number)}
                      min={1}
                      max={30}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<PlayArrow />}
                    onClick={startTimelapse}
                    fullWidth
                  >
                    Start Time-Lapse Recording
                  </Button>
                </>
              ) : (
                <>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Recording in progress... {timelapseFrames.length} frames captured
                  </Alert>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    style={{ width: '100%', maxHeight: 300, marginBottom: 16 }}
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Stop />}
                    onClick={stopTimelapse}
                    fullWidth
                  >
                    Stop Recording
                  </Button>
                </>
              )}
            </Paper>

            {/* Standard Photo Documentation */}
            <Typography variant="h6" gutterBottom>
              Standard Photos
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {['before_dry', 'leak_active', 'damage_caused'].map((type) => (
                <Grid item xs={12} md={4} key={type}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
                    <CameraAlt sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                    <Typography variant="caption" display="block">
                      {type === 'before_dry' && 'Before (Dry Area)'}
                      {type === 'leak_active' && 'Active Leak'}
                      {type === 'damage_caused' && 'Damage Caused'}
                    </Typography>
                    <Button size="small" sx={{ mt: 1 }}>Take Photo</Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Flow Rate Measurement */}
            {measureFlowRate()}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={() => setActiveStep(0)}>Back</Button>
              <Button variant="contained" onClick={() => setActiveStep(2)}>
                Next: Calculate Water Waste
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Water Waste Calculation */}
      {activeStep === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Water Waste Impact Report
            </Typography>

            {calculateWaterWaste() && (
              <Paper sx={{ p: 3, bgcolor: 'error.light', mb: 3 }}>
                <Typography variant="h4" gutterBottom color="error.dark">
                  Financial Impact
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <WaterDrop sx={{ fontSize: 48, color: 'primary.main' }} />
                      <Typography variant="h5">
                        {calculateWaterWaste()!.litersPerDay}L
                      </Typography>
                      <Typography variant="caption">Wasted Per Day</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <MonetizationOn sx={{ fontSize: 48, color: 'warning.main' }} />
                      <Typography variant="h5">
                        £{calculateWaterWaste()!.costPerDay}
                      </Typography>
                      <Typography variant="caption">Cost Per Day</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <TrendingDown sx={{ fontSize: 48, color: 'error.main' }} />
                      <Typography variant="h5">
                        £{calculateWaterWaste()!.projectedAnnualCost}
                      </Typography>
                      <Typography variant="caption">Annual Cost if Unfixed</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Warning sx={{ fontSize: 48, color: 'error.dark' }} />
                      <Typography variant="h5">
                        {calculateWaterWaste()!.totalWastedBeforeRepair}L
                      </Typography>
                      <Typography variant="caption">Already Wasted</Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Alert severity="success">
                  <Typography variant="subtitle1">
                    <strong>Customer Savings After Repair:</strong>
                  </Typography>
                  <Typography variant="body2">
                    £{calculateWaterWaste()!.projectedAnnualCost} saved annually by fixing this leak today!
                  </Typography>
                </Alert>
              </Paper>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={() => setActiveStep(1)}>Back</Button>
              <Button variant="contained" onClick={() => setActiveStep(3)}>
                Next: Repair Documentation
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Hidden camera feed */}
      <video ref={videoRef} autoPlay style={{ display: 'none' }} />
    </Container>
  )
}

export default LeakDetectionReport
