/**
 * Enhanced Photographic Job Report Component
 * Mobile-first photo capture, annotations, digital twin integration
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
  IconButton,
  Chip,
  Dialog,
  DialogContent,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Paper,
  Divider
} from '@mui/material'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import VideoCallIcon from '@mui/icons-material/VideoCall'
import EditIcon from '@mui/icons-material/Edit'
import CompareIcon from '@mui/icons-material/Compare'
import View3DIcon from '@mui/icons-material/ThreeDRotation'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DrawIcon from '@mui/icons-material/Draw'

interface Photo {
  id: string
  url: string
  type: 'before' | 'during' | 'after' | 'issue' | 'parts'
  timestamp: Date
  annotation?: {
    text: string
    arrows: Array<{ x: number; y: number; direction: string }>
    circles: Array<{ x: number; y: number; radius: number }>
  }
  digitalTwinLocation?: {
    x: number
    y: number
    z: number
    zone: string
  }
  thumbnail: string
}

interface JobReportData {
  jobId: string
  propertyId: string
  propertyAddress: string
  customerName: string
  plumberName: string
  jobType: 'leak_repair' | 'installation' | 'maintenance' | 'emergency' | 'inspection'
  description: string
  partsUsed: Array<{
    name: string
    quantity: number
    cost: number
  }>
  laborHours: number
  laborRate: number
  photos: Photo[]
  videos: Array<{
    id: string
    url: string
    type: string
    duration: number
    thumbnail: string
  }>
  workPerformed: string
  recommendations: string
  customerSignature?: string
  plumberSignature?: string
  status: 'draft' | 'pending_approval' | 'approved' | 'blockchain_verified'
  blockchainTxId?: string
  createdAt: Date
  completedAt?: Date
}

export const PhotoJobReport: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [jobData, setJobData] = useState<JobReportData>({
    jobId: '',
    propertyId: '',
    propertyAddress: '',
    customerName: '',
    plumberName: '',
    jobType: 'leak_repair',
    description: '',
    partsUsed: [],
    laborHours: 0,
    laborRate: 45,
    photos: [],
    videos: [],
    workPerformed: '',
    recommendations: '',
    status: 'draft',
    createdAt: new Date()
  })

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [annotationMode, setAnnotationMode] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [digitalTwinOpen, setDigitalTwinOpen] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const steps = [
    'Job Details',
    'Before Photos',
    'Work Documentation',
    'After Photos',
    'Review & Sign'
  ]

  // Initialize camera for mobile/desktop
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Use back camera on mobile
        audio: false 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Camera access denied:', error)
      alert('Please allow camera access to take photos')
    }
  }

  // Capture photo from camera
  const capturePhoto = (type: Photo['type']) => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)

    // Convert to blob
    canvas.toBlob((blob) => {
      if (!blob) return

      const url = URL.createObjectURL(blob)
      const newPhoto: Photo = {
        id: `photo_${Date.now()}`,
        url,
        type,
        timestamp: new Date(),
        thumbnail: url
      }

      setJobData(prev => ({
        ...prev,
        photos: [...prev.photos, newPhoto]
      }))
    }, 'image/jpeg', 0.95)
  }

  // Upload photo from gallery
  const uploadPhoto = (type: Photo['type']) => {
    if (!fileInputRef.current) return

    fileInputRef.current.accept = 'image/*'
    fileInputRef.current.onchange = (e: any) => {
      const file = e.target.files?.[0]
      if (!file) return

      const url = URL.createObjectURL(file)
      const newPhoto: Photo = {
        id: `photo_${Date.now()}`,
        url,
        type,
        timestamp: new Date(),
        thumbnail: url
      }

      setJobData(prev => ({
        ...prev,
        photos: [...prev.photos, newPhoto]
      }))
    }

    fileInputRef.current.click()
  }

  // Add annotation to photo
  const addAnnotation = (photoId: string, text: string) => {
    setJobData(prev => ({
      ...prev,
      photos: prev.photos.map(p => 
        p.id === photoId 
          ? { ...p, annotation: { text, arrows: [], circles: [] } }
          : p
      )
    }))
  }

  // Link photo to digital twin location
  const linkToDigitalTwin = (photoId: string, location: Photo['digitalTwinLocation']) => {
    setJobData(prev => ({
      ...prev,
      photos: prev.photos.map(p => 
        p.id === photoId 
          ? { ...p, digitalTwinLocation: location }
          : p
      )
    }))
  }

  // Generate professional PDF report
  const generatePDF = async () => {
    // TODO: Implement PDF generation with photos, signatures, blockchain proof
    console.log('Generating PDF report...')
  }

  // Submit to blockchain
  const submitToBlockchain = async () => {
    try {
      // Hash all photos
      const photoHashes = await Promise.all(
        jobData.photos.map(async (photo) => {
          const response = await fetch(photo.url)
          const blob = await response.blob()
          const arrayBuffer = await blob.arrayBuffer()
          const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
          return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        })
      )

      // Submit to blockchain
      const response = await fetch('/api/job-reports/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...jobData,
          photoHashes,
          completedAt: new Date()
        })
      })

      const result = await response.json()
      
      setJobData(prev => ({
        ...prev,
        status: 'blockchain_verified',
        blockchainTxId: result.txId,
        completedAt: new Date()
      }))

      alert('Job report verified on blockchain! Transaction ID: ' + result.txId)

    } catch (error) {
      console.error('Blockchain submission failed:', error)
      alert('Failed to submit to blockchain. Please try again.')
    }
  }

  // Render photo grid by type
  const renderPhotoSection = (type: Photo['type'], title: string) => {
    const photos = jobData.photos.filter(p => p.type === type)

    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {title} ({photos.length})
        </Typography>

        <Grid container spacing={2}>
          {photos.map(photo => (
            <Grid item xs={6} sm={4} md={3} key={photo.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover': { boxShadow: 4 }
                }}
                onClick={() => setSelectedPhoto(photo)}
              >
                <Box
                  component="img"
                  src={photo.thumbnail}
                  alt={title}
                  sx={{ 
                    width: '100%', 
                    height: 150, 
                    objectFit: 'cover' 
                  }}
                />
                {photo.annotation && (
                  <Chip
                    label="Annotated"
                    size="small"
                    color="primary"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                )}
                {photo.digitalTwinLocation && (
                  <Chip
                    icon={<View3DIcon />}
                    label="3D"
                    size="small"
                    color="secondary"
                    sx={{ position: 'absolute', top: 8, left: 8 }}
                  />
                )}
                <Box sx={{ p: 1 }}>
                  <Typography variant="caption" display="block">
                    {photo.timestamp.toLocaleTimeString()}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}

          {/* Add photo buttons */}
          <Grid item xs={6} sm={4} md={3}>
            <Paper
              sx={{
                height: 150,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '2px dashed',
                borderColor: 'primary.main',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <IconButton color="primary" onClick={() => capturePhoto(type)}>
                <CameraAltIcon sx={{ fontSize: 40 }} />
              </IconButton>
              <Typography variant="caption">Take Photo</Typography>
              
              <IconButton color="primary" onClick={() => uploadPhoto(type)}>
                <CloudUploadIcon />
              </IconButton>
              <Typography variant="caption">Upload</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Photographic Job Report
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Document your work with photos, annotations, and 3D location mapping
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Hidden camera and file input */}
      <video ref={videoRef} autoPlay style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} />

      {/* Step 1: Job Details */}
      {activeStep === 0 && (
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Property Address"
                  value={jobData.propertyAddress}
                  onChange={(e) => setJobData(prev => ({ ...prev, propertyAddress: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Customer Name"
                  value={jobData.customerName}
                  onChange={(e) => setJobData(prev => ({ ...prev, customerName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={3}
                  label="Job Description"
                  value={jobData.description}
                  onChange={(e) => setJobData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="E.g., Leaking toilet cistern, loose connection at inlet valve"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => {
                    startCamera()
                    setActiveStep(1)
                  }}
                >
                  Next: Take Before Photos
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Before Photos */}
      {activeStep === 1 && (
        <Card>
          <CardContent>
            {renderPhotoSection('before', 'Before Photos')}
            
            <Alert severity="info" sx={{ mb: 2 }}>
              Tip: Take wide shots showing the problem area, then close-ups of the specific issue
            </Alert>

            <Stack direction="row" spacing={2}>
              <Button onClick={() => setActiveStep(0)}>Back</Button>
              <Button 
                variant="contained" 
                onClick={() => setActiveStep(2)}
                disabled={jobData.photos.filter(p => p.type === 'before').length === 0}
              >
                Next: Document Work
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Work Documentation */}
      {activeStep === 2 && (
        <Card>
          <CardContent>
            {renderPhotoSection('during', 'Work in Progress')}
            {renderPhotoSection('parts', 'Parts Used')}
            
            <Divider sx={{ my: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Work Performed"
                  value={jobData.workPerformed}
                  onChange={(e) => setJobData(prev => ({ ...prev, workPerformed: e.target.value }))}
                  placeholder="Describe the work completed..."
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Labor Hours"
                  value={jobData.laborHours}
                  onChange={(e) => setJobData(prev => ({ ...prev, laborHours: parseFloat(e.target.value) }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Hourly Rate (£)"
                  value={jobData.laborRate}
                  onChange={(e) => setJobData(prev => ({ ...prev, laborRate: parseFloat(e.target.value) }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  disabled
                  label="Labor Cost (£)"
                  value={(jobData.laborHours * jobData.laborRate).toFixed(2)}
                />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button onClick={() => setActiveStep(1)}>Back</Button>
              <Button variant="contained" onClick={() => setActiveStep(3)}>
                Next: After Photos
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Step 4: After Photos */}
      {activeStep === 3 && (
        <Card>
          <CardContent>
            {renderPhotoSection('after', 'After Photos')}
            
            <Alert severity="success" sx={{ mb: 2 }}>
              Take photos from the same angles as your "Before" shots for easy comparison
            </Alert>

            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<CompareIcon />}
                onClick={() => setCompareMode(true)}
                disabled={
                  jobData.photos.filter(p => p.type === 'before').length === 0 ||
                  jobData.photos.filter(p => p.type === 'after').length === 0
                }
              >
                Compare Before/After
              </Button>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Recommendations (Optional)"
              value={jobData.recommendations}
              onChange={(e) => setJobData(prev => ({ ...prev, recommendations: e.target.value }))}
              placeholder="Future maintenance recommendations..."
            />

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button onClick={() => setActiveStep(2)}>Back</Button>
              <Button 
                variant="contained" 
                onClick={() => setActiveStep(4)}
                disabled={jobData.photos.filter(p => p.type === 'after').length === 0}
              >
                Next: Review & Sign
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Review & Sign */}
      {activeStep === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Job Report Summary
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Property</Typography>
                <Typography variant="body1">{jobData.propertyAddress}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Customer</Typography>
                <Typography variant="body1">{jobData.customerName}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Work Performed</Typography>
                <Typography variant="body1">{jobData.workPerformed}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Labor</Typography>
                <Typography variant="body1">
                  {jobData.laborHours}h × £{jobData.laborRate} = £{(jobData.laborHours * jobData.laborRate).toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Photos</Typography>
                <Typography variant="body1">{jobData.photos.length} photos captured</Typography>
              </Grid>
            </Grid>

            {jobData.status === 'blockchain_verified' ? (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Report Verified on Blockchain
                </Typography>
                <Typography variant="body2">
                  Transaction ID: {jobData.blockchainTxId}
                </Typography>
              </Alert>
            ) : (
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CheckCircleIcon />}
                  onClick={submitToBlockchain}
                >
                  Sign & Submit to Blockchain
                </Button>
                <Button
                  variant="outlined"
                  onClick={generatePDF}
                >
                  Generate PDF Report
                </Button>
              </Stack>
            )}

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button onClick={() => setActiveStep(3)}>Back</Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Photo Detail Dialog */}
      <Dialog 
        open={selectedPhoto !== null} 
        onClose={() => setSelectedPhoto(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent>
          {selectedPhoto && (
            <Box>
              <img 
                src={selectedPhoto.url} 
                alt="Job photo" 
                style={{ width: '100%', height: 'auto', marginBottom: 16 }}
              />
              
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Add Note"
                  placeholder="Describe what's shown in this photo..."
                  value={selectedPhoto.annotation?.text || ''}
                  onChange={(e) => addAnnotation(selectedPhoto.id, e.target.value)}
                />

                <Stack direction="row" spacing={2}>
                  <Button
                    startIcon={<DrawIcon />}
                    onClick={() => setAnnotationMode(true)}
                  >
                    Annotate
                  </Button>
                  <Button
                    startIcon={<View3DIcon />}
                    onClick={() => setDigitalTwinOpen(true)}
                  >
                    Link to 3D Location
                  </Button>
                  <Button
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setJobData(prev => ({
                        ...prev,
                        photos: prev.photos.filter(p => p.id !== selectedPhoto.id)
                      }))
                      setSelectedPhoto(null)
                    }}
                  >
                    Delete
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  )
}

export default PhotoJobReport
