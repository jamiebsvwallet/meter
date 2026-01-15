import React, { useState, useEffect } from 'react'
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tab,
  Tabs,
  Alert,
  Chip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'

interface JobReport {
  jobId: string
  propertyId: string
  customerId: string
  description: string
  status: 'pending' | 'completed' | 'approved'
  totalCost: number
  workPerformed: string[]
  partsUsed: Array<{ name: string; cost: number; quantity: number }>
  photos: string[]
  startTime: Date
  completionTime?: Date
  customerSignature?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Plumber Portal - Manage jobs, submit reports, view customer properties
 */
export const PlumberPortal: React.FC<{ plumberId: string }> = ({ plumberId }) => {
  const [tabValue, setTabValue] = useState(0)
  const [pendingJobs, setPendingJobs] = useState<JobReport[]>([])
  const [completedJobs, setCompletedJobs] = useState<JobReport[]>([])
  const [propertyStats, setPropertyStats] = useState<any>({})
  const [newJobDialog, setNewJobDialog] = useState(false)
  const [editJobDialog, setEditJobDialog] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobReport | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [workPerformed, setWorkPerformed] = useState<string[]>([])
  const [currentWork, setCurrentWork] = useState('')
  const [partsUsed, setPartsUsed] = useState<any[]>([])
  const [totalCost, setTotalCost] = useState('')
  const [photos, setPhotos] = useState<string[]>([])

  useEffect(() => {
    loadPendingJobs()
    loadCompletedJobs()
  }, [plumberId])

  const loadPendingJobs = async () => {
    try {
      const res = await fetch(`/api/jobs/plumber/${plumberId}/pending`)
      const data = await res.json()
      setPendingJobs(data)
    } catch (error) {
      console.error('Error loading pending jobs:', error)
    }
  }

  const loadCompletedJobs = async () => {
    try {
      const res = await fetch(`/api/jobs/plumber/${plumberId}/completed`)
      const data = await res.json()
      setCompletedJobs(data)
    } catch (error) {
      console.error('Error loading completed jobs:', error)
    }
  }

  const handleCreateJob = async () => {
    try {
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          customerId,
          plumberId,
          description: jobDescription
        })
      })

      if (res.ok) {
        setNewJobDialog(false)
        setPropertyId('')
        setCustomerId('')
        setJobDescription('')
        loadPendingJobs()
      }
    } catch (error) {
      console.error('Error creating job:', error)
    }
  }

  const handleCompleteJob = async () => {
    if (!selectedJob) return

    try {
      const res = await fetch(`/api/jobs/${selectedJob.jobId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workPerformed,
          partsUsed,
          totalCost: parseFloat(totalCost),
          photos
        })
      })

      if (res.ok) {
        setEditJobDialog(false)
        setSelectedJob(null)
        setWorkPerformed([])
        setPartsUsed([])
        setTotalCost('')
        setPhotos([])
        loadPendingJobs()
        loadCompletedJobs()
      }
    } catch (error) {
      console.error('Error completing job:', error)
    }
  }

  const handleAddWork = () => {
    if (currentWork.trim()) {
      setWorkPerformed([...workPerformed, currentWork])
      setCurrentWork('')
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Plumber Dashboard</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setNewJobDialog(true)}
        >
          New Job
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_: React.SyntheticEvent, newValue: number) => setTabValue(newValue)}>
          <Tab label={`Pending Jobs (${pendingJobs.length})`} />
          <Tab label={`Completed Jobs (${completedJobs.length})`} />
        </Tabs>
      </Box>

      {/* Pending Jobs Tab */}
      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Property</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Customer</strong></TableCell>
                <TableCell><strong>Created</strong></TableCell>
                <TableCell><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingJobs.map(job => (
                <TableRow key={job.jobId}>
                  <TableCell>{job.propertyId}</TableCell>
                  <TableCell>{job.description}</TableCell>
                  <TableCell>{job.customerId}</TableCell>
                  <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setSelectedJob(job)
                        setEditJobDialog(true)
                      }}
                    >
                      Complete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pendingJobs.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">No pending jobs</Typography>
            </Box>
          )}
        </TableContainer>
      )}

      {/* Completed Jobs Tab */}
      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Property</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Cost</strong></TableCell>
                <TableCell><strong>Completed</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {completedJobs.map(job => (
                <TableRow key={job.jobId}>
                  <TableCell>{job.propertyId}</TableCell>
                  <TableCell>{job.description}</TableCell>
                  <TableCell>${job.totalCost.toFixed(2)}</TableCell>
                  <TableCell>{job.completionTime ? new Date(job.completionTime).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={job.status}
                      color={job.status === 'approved' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {completedJobs.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">No completed jobs</Typography>
            </Box>
          )}
        </TableContainer>
      )}

      {/* New Job Dialog */}
      <Dialog open={newJobDialog} onClose={() => setNewJobDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Job</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Property ID"
            value={propertyId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPropertyId(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Customer ID"
            value={customerId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerId(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Job Description"
            value={jobDescription}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setJobDescription(e.target.value)}
            multiline
            rows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewJobDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateJob} variant="contained">
            Create Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Job Dialog */}
      {selectedJob && (
        <Dialog open={editJobDialog} onClose={() => setEditJobDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Complete Job: {selectedJob.jobId}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Work Performed
            </Typography>
            <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                label="Add work item"
                value={currentWork}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentWork(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAddWork()}
              />
              <Button onClick={handleAddWork} variant="outlined">
                Add
              </Button>
            </Box>
            <Box sx={{ mb: 2 }}>
              {workPerformed.map((work, idx) => (
                <Chip
                  key={idx}
                  label={work}
                  onDelete={() => setWorkPerformed(workPerformed.filter((_, i) => i !== idx))}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>

            <TextField
              fullWidth
              label="Total Cost ($)"
              type="number"
              value={totalCost}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTotalCost(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" gutterBottom>
              Photos (URLs)
            </Typography>
            <TextField
              fullWidth
              label="Photo URL"
              placeholder="https://example.com/photo.jpg"
              sx={{ mb: 2 }}
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && (e.currentTarget && e.currentTarget.value)) {
                  setPhotos([...photos, (e.currentTarget.value as string)])
                  e.currentTarget.value = ''
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditJobDialog(false)}>Cancel</Button>
            <Button onClick={handleCompleteJob} variant="contained">
              Complete Job
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  )
}
