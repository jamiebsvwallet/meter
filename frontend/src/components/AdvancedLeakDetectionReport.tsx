/**
 * Advanced Leak Detection Report with 5 Breakthrough Features
 * 
 * 1. Smart Water Data Overlay - Real-time consumption correlation
 * 2. Neighborhood Leak Mapping - Cross-property leak intelligence  
 * 3. 3D Pipe Infrastructure - Complete digital twin of plumbing
 * 4. Acoustic Signature Analysis - AI-powered leak identification
 * 5. Failure Hotspot Heat Map - Predictive maintenance zones
 * 
 * All data timestamped and stored on BSV blockchain
 */

import React, { useState, useRef, useEffect } from 'react';
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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  CameraAlt,
  Mic,
  WaterDrop,
  Map,
  AccountTree,
  Whatshot,
  Lock,
  Link,
  CheckCircle,
  Timeline,
  Group,
  Warning,
  TrendingDown,
  CompareArrows
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`feature-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdvancedLeakDetectionReport: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [jobDetails, setJobDetails] = useState({
    jobId: '',
    propertyId: '',
    leakDescription: '',
    leakLocation: { x: 0, y: 0, z: 0 }
  });

  // Consent Management
  const [consents, setConsents] = useState({
    smartMeterAccess: false,
    neighborhoodDataSharing: false,
    waterCompanyAccess: false,
    researchDataSharing: false,
    predictionModeling: false,
    thirdPartyPartners: false
  });

  // Smart Meter Data
  const [smartMeterData, setSmartMeterData] = useState<any>(null);
  const [loadingSmartMeter, setLoadingSmartMeter] = useState(false);

  // Neighborhood Leak Map
  const [neighborhoodData, setNeighborhoodData] = useState<any>(null);
  const [loadingNeighborhood, setLoadingNeighborhood] = useState(false);

  // 3D Pipe Infrastructure
  const [pipeInfrastructure, setPipeInfrastructure] = useState<any>(null);
  const [loadingPipeMap, setLoadingPipeMap] = useState(false);

  // Acoustic Analysis
  const [audioRecording, setAudioRecording] = useState<Blob | null>(null);
  const [acousticAnalysis, setAcousticAnalysis] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Failure Hotspot
  const [hotspotData, setHotspotData] = useState<any>(null);
  const [loadingHotspot, setLoadingHotspot] = useState(false);

  // Blockchain Submission
  const [blockchainTxid, setBlockchainTxid] = useState<string | null>(null);
  const [submittingToBlockchain, setSubmittingToBlockchain] = useState(false);

  // ==========================================
  // 1. SMART METER DATA OVERLAY
  // ==========================================
  const loadSmartMeterData = async () => {
    setLoadingSmartMeter(true);
    try {
      const response = await fetch('/api/advanced-leak-detection/smart-meter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: jobDetails.propertyId,
          jobId: jobDetails.jobId,
          leakDetectionStartTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          leakRepairEndTime: new Date()
        })
      });
      const data = await response.json();
      setSmartMeterData(data);
    } catch (error) {
      console.error('Error loading smart meter data:', error);
    }
    setLoadingSmartMeter(false);
  };

  const renderSmartMeterOverlay = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WaterDrop color="primary" />
        Smart Water Data Overlay
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Real-time consumption data proves leak existence and repair effectiveness
      </Typography>

      {!consents.smartMeterAccess && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Smart meter access not granted. Enable in Consent Settings to unlock this feature.
        </Alert>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={consents.smartMeterAccess}
            onChange={(e) => setConsents({ ...consents, smartMeterAccess: e.target.checked })}
          />
        }
        label="Allow smart meter data access"
      />

      {consents.smartMeterAccess && (
        <>
          <Button
            variant="contained"
            onClick={loadSmartMeterData}
            disabled={loadingSmartMeter}
            sx={{ mt: 2 }}
          >
            {loadingSmartMeter ? 'Loading...' : 'Load Smart Meter Data'}
          </Button>

          {smartMeterData && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Consumption Analysis
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, bgcolor: '#ffebee' }}>
                      <Typography variant="caption" color="text.secondary">
                        Before Repair
                      </Typography>
                      <Typography variant="h4">
                        {smartMeterData.consumptionComparison.avgBeforeLeak.toFixed(1)}
                      </Typography>
                      <Typography variant="caption">L/min</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, bgcolor: '#fff3e0' }}>
                      <Typography variant="caption" color="text.secondary">
                        During Leak
                      </Typography>
                      <Typography variant="h4">
                        {smartMeterData.consumptionComparison.avgDuringLeak.toFixed(1)}
                      </Typography>
                      <Typography variant="caption">L/min</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                      <Typography variant="caption" color="text.secondary">
                        After Repair
                      </Typography>
                      <Typography variant="h4">
                        {smartMeterData.consumptionComparison.avgAfterRepair.toFixed(1)}
                      </Typography>
                      <Typography variant="caption">L/min</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Savings Impact
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Water Saved Per Day"
                      secondary={`${smartMeterData.consumptionComparison.waterSavedPerDay.toFixed(0)} liters`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Cost Saved Per Year"
                      secondary={`£${smartMeterData.consumptionComparison.costSavedPerYear.toFixed(2)}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="CO2 Reduction"
                      secondary={`${smartMeterData.consumptionComparison.co2ReductionKg.toFixed(1)} kg/year`}
                    />
                  </ListItem>
                </List>

                <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 2 }}>
                  <strong>Leak Proof:</strong> Consumption spike detected with{' '}
                  {smartMeterData.proofOfLeak.confidenceScore}% confidence
                </Alert>

                <Chip
                  label={`Data Hash: ${smartMeterData.dataHash.substring(0, 16)}...`}
                  size="small"
                  icon={<Link />}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );

  // ==========================================
  // 2. NEIGHBORHOOD LEAK MAPPING
  // ==========================================
  const loadNeighborhoodData = async () => {
    setLoadingNeighborhood(true);
    try {
      const response = await fetch('/api/advanced-leak-detection/neighborhood-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: jobDetails.propertyId,
          jobId: jobDetails.jobId,
          propertyLocation: { lat: 51.5074, lng: -0.1278 }, // TODO: Get real coordinates
          radiusMeters: 500
        })
      });
      const data = await response.json();
      setNeighborhoodData(data);
    } catch (error) {
      console.error('Error loading neighborhood data:', error);
    }
    setLoadingNeighborhood(false);
  };

  const renderNeighborhoodMap = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Map color="primary" />
        Neighborhood Leak Intelligence
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Discover leak patterns across nearby properties (with consent only)
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Network Effect:</strong> Your anonymized leak data helps neighbors identify issues 
        early. Water companies pay for this intelligence.
      </Alert>

      <FormControlLabel
        control={
          <Switch
            checked={consents.neighborhoodDataSharing}
            onChange={(e) => setConsents({ ...consents, neighborhoodDataSharing: e.target.checked })}
          />
        }
        label="Share anonymized leak data with neighbors"
      />

      {consents.neighborhoodDataSharing && (
        <>
          <Button
            variant="contained"
            onClick={loadNeighborhoodData}
            disabled={loadingNeighborhood}
            sx={{ mt: 2 }}
          >
            {loadingNeighborhood ? 'Loading...' : 'Load Neighborhood Map'}
          </Button>

          {neighborhoodData && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h3" color="primary">
                        {neighborhoodData.totalLeaksFound}
                      </Typography>
                      <Typography variant="caption">Total Leaks</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h3" color="warning.main">
                        {neighborhoodData.leaksLast30Days}
                      </Typography>
                      <Typography variant="caption">Last 30 Days</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h3" color="error">
                        {neighborhoodData.patterns.correlationScore}%
                      </Typography>
                      <Typography variant="caption">Correlation</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h3" color="success.main">
                        {neighborhoodData.networkEffectScore}
                      </Typography>
                      <Typography variant="caption">Network Value</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Nearby Leaks (500m radius)
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Distance</TableCell>
                        <TableCell>Leak Type</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {neighborhoodData.nearbyLeaks.slice(0, 5).map((leak: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{leak.distance.toFixed(0)}m</TableCell>
                          <TableCell>{leak.leakType}</TableCell>
                          <TableCell>
                            <Chip
                              label={leak.severity}
                              size="small"
                              color={
                                leak.severity === 'critical' ? 'error' :
                                leak.severity === 'major' ? 'warning' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {leak.repairedDate ? (
                              <Chip label="Repaired" size="small" color="success" />
                            ) : (
                              <Chip label="Active" size="small" color="error" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Alert severity="warning" sx={{ mt: 2 }}>
                  <strong>Pattern Detected:</strong> Most common leak type in area is{' '}
                  <strong>{neighborhoodData.patterns.mostCommonLeakType}</strong> during{' '}
                  <strong>{neighborhoodData.patterns.peakLeakSeason}</strong>
                </Alert>

                <Chip
                  label={`Data Hash: ${neighborhoodData.dataHash.substring(0, 16)}...`}
                  size="small"
                  icon={<Link />}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );

  // ==========================================
  // 3. 3D PIPE INFRASTRUCTURE MAPPING
  // ==========================================
  const loadPipeInfrastructure = async () => {
    setLoadingPipeMap(true);
    try {
      const response = await fetch('/api/advanced-leak-detection/pipe-infrastructure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: jobDetails.propertyId,
          jobId: jobDetails.jobId
        })
      });
      const data = await response.json();
      setPipeInfrastructure(data);
    } catch (error) {
      console.error('Error loading pipe infrastructure:', error);
    }
    setLoadingPipeMap(false);
  };

  const renderPipeInfrastructure = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountTree color="primary" />
        3D Pipe Infrastructure Map
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Complete digital twin of property plumbing built from all job reports
      </Typography>

      <Button
        variant="contained"
        onClick={loadPipeInfrastructure}
        disabled={loadingPipeMap}
        sx={{ mt: 2 }}
      >
        {loadingPipeMap ? 'Loading...' : 'Load Pipe Map'}
      </Button>

      {pipeInfrastructure && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h3" color="primary">
                    {pipeInfrastructure.totalSegments}
                  </Typography>
                  <Typography variant="caption">Pipe Segments Mapped</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h3" color="secondary">
                    {pipeInfrastructure.totalLength.toFixed(1)}m
                  </Typography>
                  <Typography variant="caption">Total Pipe Length</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Material Breakdown
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Chip
                  label={`Copper: ${pipeInfrastructure.materials.copper.toFixed(1)}m`}
                  color="primary"
                />
              </Grid>
              <Grid item xs={4}>
                <Chip
                  label={`PEX: ${pipeInfrastructure.materials.pex.toFixed(1)}m`}
                  color="secondary"
                />
              </Grid>
              <Grid item xs={4}>
                <Chip
                  label={`PVC: ${pipeInfrastructure.materials.pvc.toFixed(1)}m`}
                  color="default"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Age Analysis
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Average Pipe Age"
                  secondary={`${pipeInfrastructure.ageAnalysis.avgAge.toFixed(1)} years`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Oldest Pipe"
                  secondary={new Date(pipeInfrastructure.ageAnalysis.oldestPipe).toLocaleDateString()}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Newest Pipe"
                  secondary={new Date(pipeInfrastructure.ageAnalysis.newestPipe).toLocaleDateString()}
                />
              </ListItem>
            </List>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <strong>Risk Analysis:</strong>{' '}
              {pipeInfrastructure.riskAnalysis.highRiskJoints} high-risk joints,{' '}
              {pipeInfrastructure.riskAnalysis.poorConditionSegments} poor condition segments
            </Alert>

            {pipeInfrastructure.riskAnalysis.replacementPriority.length > 0 && (
              <Alert severity="error" sx={{ mt: 1 }}>
                <strong>Replacement Priority:</strong>{' '}
                {pipeInfrastructure.riskAnalysis.replacementPriority.join(', ')}
              </Alert>
            )}

            <Button
              variant="outlined"
              href={pipeInfrastructure.digitalTwinIntegration.twinUrl}
              target="_blank"
              sx={{ mt: 2 }}
            >
              View in 3D Digital Twin
            </Button>

            <Chip
              label={`Data Hash: ${pipeInfrastructure.dataHash.substring(0, 16)}...`}
              size="small"
              icon={<Link />}
              sx={{ mt: 2, ml: 1 }}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );

  // ==========================================
  // 4. ACOUSTIC LEAK SIGNATURE ANALYSIS
  // ==========================================
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioRecording(audioBlob);
        analyzeAcousticSignature(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting audio recording:', error);
      alert('Microphone access denied');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const analyzeAcousticSignature = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('propertyId', jobDetails.propertyId);
      formData.append('jobId', jobDetails.jobId);
      formData.append('location', JSON.stringify(jobDetails.leakLocation));

      const response = await fetch('/api/advanced-leak-detection/acoustic-analysis', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setAcousticAnalysis(data);
    } catch (error) {
      console.error('Error analyzing acoustic signature:', error);
    }
  };

  const renderAcousticAnalysis = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Mic color="primary" />
        Acoustic Leak Signature Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        AI analyzes audio recording to identify leak type and location
      </Typography>

      <Box sx={{ mt: 2 }}>
        {!isRecording ? (
          <Button
            variant="contained"
            startIcon={<Mic />}
            onClick={startAudioRecording}
          >
            Start Recording Leak Sound
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            onClick={stopAudioRecording}
          >
            Stop Recording
          </Button>
        )}
      </Box>

      {acousticAnalysis && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Alert
              severity={acousticAnalysis.analysis.leakDetected ? 'warning' : 'success'}
              icon={acousticAnalysis.analysis.leakDetected ? <Warning /> : <CheckCircle />}
              sx={{ mb: 2 }}
            >
              <strong>
                {acousticAnalysis.analysis.leakDetected
                  ? `Leak Detected: ${acousticAnalysis.analysis.leakType}`
                  : 'No leak detected'}
              </strong>{' '}
              ({acousticAnalysis.analysis.confidence}% confidence)
            </Alert>

            <Typography variant="h6" gutterBottom>
              Frequency Analysis
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Frequency (Hz)</TableCell>
                    <TableCell>Amplitude (dB)</TableCell>
                    <TableCell>Duration (s)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {acousticAnalysis.frequencies.map((freq: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{freq.frequency}</TableCell>
                      <TableCell>{freq.amplitude}</TableCell>
                      <TableCell>{freq.duration.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              AI Model Performance
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Model Version"
                  secondary={acousticAnalysis.aiModel.modelVersion}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Training Data Size"
                  secondary={`${acousticAnalysis.aiModel.trainingDataSize.toLocaleString()} samples`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Model Accuracy"
                  secondary={`${acousticAnalysis.aiModel.accuracy}%`}
                />
              </ListItem>
            </List>

            {acousticAnalysis.analysis.locationEstimate && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Estimated Location:</strong>{' '}
                {acousticAnalysis.analysis.locationEstimate.distance.toFixed(1)}m{' '}
                {acousticAnalysis.analysis.locationEstimate.direction}{' '}
                ({acousticAnalysis.analysis.locationEstimate.accuracy}% accuracy)
              </Alert>
            )}

            <Chip
              label={`Data Hash: ${acousticAnalysis.dataHash.substring(0, 16)}...`}
              size="small"
              icon={<Link />}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );

  // ==========================================
  // 5. FAILURE HOTSPOT HEAT MAP
  // ==========================================
  const loadHotspotData = async () => {
    setLoadingHotspot(true);
    try {
      const response = await fetch('/api/advanced-leak-detection/hotspot-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: jobDetails.propertyId,
          jobId: jobDetails.jobId
        })
      });
      const data = await response.json();
      setHotspotData(data);
    } catch (error) {
      console.error('Error loading hotspot data:', error);
    }
    setLoadingHotspot(false);
  };

  const renderFailureHotspot = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning color="error" />
        Failure Hotspot Heat Map
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Predictive analysis identifies zones at risk of future failures
      </Typography>

      <Button
        variant="contained"
        onClick={loadHotspotData}
        disabled={loadingHotspot}
        sx={{ mt: 2 }}
      >
        {loadingHotspot ? 'Loading...' : 'Generate Heat Map'}
      </Button>

      {hotspotData && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, bgcolor: '#ffebee' }}>
                  <Typography variant="h3" color="error">
                    {hotspotData.overallRiskAssessment.highRiskZones}
                  </Typography>
                  <Typography variant="caption">High Risk Zones</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, bgcolor: '#fff3e0' }}>
                  <Typography variant="h3" color="warning.main">
                    {hotspotData.overallRiskAssessment.mediumRiskZones}
                  </Typography>
                  <Typography variant="caption">Medium Risk Zones</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                  <Typography variant="h3" color="success.main">
                    {hotspotData.overallRiskAssessment.lowRiskZones}
                  </Typography>
                  <Typography variant="caption">Low Risk Zones</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Hotspot Zones
            </Typography>
            {hotspotData.hotspots.map((zone: any) => (
              <Card key={zone.zoneId} sx={{ mb: 2, border: zone.riskScore > 70 ? '2px solid red' : 'none' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">{zone.zoneName}</Typography>
                    <Chip
                      label={`Risk: ${zone.riskScore}%`}
                      color={zone.riskScore > 70 ? 'error' : zone.riskScore > 40 ? 'warning' : 'success'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {zone.failureCount} failures in this zone
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg time between failures: {zone.averageTimeBetweenFailures} days
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last failure: {new Date(zone.lastFailureDate).toLocaleDateString()}
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Recommendations:
                  </Typography>
                  <List dense>
                    {zone.recommendations.map((rec: string, idx: number) => (
                      <ListItem key={idx}>
                        <ListItemText primary={`• ${rec}`} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            ))}

            {hotspotData.overallRiskAssessment.nextPredictedFailure && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <strong>Next Predicted Failure:</strong>{' '}
                {hotspotData.overallRiskAssessment.nextPredictedFailure.zoneId} on{' '}
                {new Date(hotspotData.overallRiskAssessment.nextPredictedFailure.estimatedDate).toLocaleDateString()}{' '}
                ({hotspotData.overallRiskAssessment.nextPredictedFailure.confidence}% confidence)
              </Alert>
            )}

            <Chip
              label={`Data Hash: ${hotspotData.dataHash.substring(0, 16)}...`}
              size="small"
              icon={<Link />}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );

  // ==========================================
  // CONSENT MANAGEMENT TAB
  // ==========================================
  const renderConsentManagement = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Lock color="primary" />
        Data Sharing Consent
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Control who can access your water usage data. All changes are recorded on BSV blockchain.
      </Typography>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Consent Settings
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={consents.smartMeterAccess}
                onChange={(e) => setConsents({ ...consents, smartMeterAccess: e.target.checked })}
              />
            }
            label="Allow smart meter data access"
          />
          <Typography variant="caption" display="block" sx={{ ml: 4, mb: 2 }}>
            Enables consumption analysis in job reports
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={consents.neighborhoodDataSharing}
                onChange={(e) => setConsents({ ...consents, neighborhoodDataSharing: e.target.checked })}
              />
            }
            label="Share anonymized leak data with neighbors"
          />
          <Typography variant="caption" display="block" sx={{ ml: 4, mb: 2 }}>
            Helps community identify infrastructure problems early
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={consents.waterCompanyAccess}
                onChange={(e) => setConsents({ ...consents, waterCompanyAccess: e.target.checked })}
              />
            }
            label="Allow water company access"
          />
          <Typography variant="caption" display="block" sx={{ ml: 4, mb: 2 }}>
            Water companies may offer rebates for verified repairs
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={consents.researchDataSharing}
                onChange={(e) => setConsents({ ...consents, researchDataSharing: e.target.checked })}
              />
            }
            label="Share anonymized data for research"
          />
          <Typography variant="caption" display="block" sx={{ ml: 4, mb: 2 }}>
            Contribute to water conservation research
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={consents.predictionModeling}
                onChange={(e) => setConsents({ ...consents, predictionModeling: e.target.checked })}
              />
            }
            label="Use data to train AI prediction models"
          />
          <Typography variant="caption" display="block" sx={{ ml: 4, mb: 2 }}>
            Improves leak prediction accuracy for all users
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={consents.thirdPartyPartners}
                onChange={(e) => setConsents({ ...consents, thirdPartyPartners: e.target.checked })}
              />
            }
            label="Share with vetted third-party partners"
          />
          <Typography variant="caption" display="block" sx={{ ml: 4, mb: 2 }}>
            Insurance companies, housing associations (vetted only)
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Alert severity="info">
            <strong>GDPR Compliant:</strong> All consent changes are timestamped and verified on BSV blockchain. 
            You can revoke consent at any time.
          </Alert>

          <Button variant="contained" sx={{ mt: 2 }}>
            Save Consent Preferences
          </Button>
        </CardContent>
      </Card>
    </Box>
  );

  // ==========================================
  // BLOCKCHAIN SUBMISSION
  // ==========================================
  const submitToBlockchain = async () => {
    setSubmittingToBlockchain(true);
    try {
      const response = await fetch('/api/advanced-leak-detection/submit-to-blockchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: jobDetails.jobId,
          propertyId: jobDetails.propertyId,
          smartMeterHash: smartMeterData?.dataHash,
          neighborLeakHash: neighborhoodData?.dataHash,
          pipeInfraHash: pipeInfrastructure?.dataHash,
          acousticHash: acousticAnalysis?.dataHash,
          hotspotHash: hotspotData?.dataHash,
          consents
        })
      });
      const data = await response.json();
      setBlockchainTxid(data.txid);
    } catch (error) {
      console.error('Error submitting to blockchain:', error);
    }
    setSubmittingToBlockchain(false);
  };

  const renderBlockchainSubmission = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Link color="primary" />
        BSV Blockchain Verification
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        All 5 advanced features are hashed and stored immutably on BSV blockchain
      </Typography>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Data Hashes
          </Typography>
          <List dense>
            {smartMeterData && (
              <ListItem>
                <ListItemText
                  primary="Smart Meter Data"
                  secondary={smartMeterData.dataHash}
                />
              </ListItem>
            )}
            {neighborhoodData && (
              <ListItem>
                <ListItemText
                  primary="Neighborhood Leak Map"
                  secondary={neighborhoodData.dataHash}
                />
              </ListItem>
            )}
            {pipeInfrastructure && (
              <ListItem>
                <ListItemText
                  primary="Pipe Infrastructure"
                  secondary={pipeInfrastructure.dataHash}
                />
              </ListItem>
            )}
            {acousticAnalysis && (
              <ListItem>
                <ListItemText
                  primary="Acoustic Signature"
                  secondary={acousticAnalysis.dataHash}
                />
              </ListItem>
            )}
            {hotspotData && (
              <ListItem>
                <ListItemText
                  primary="Failure Hotspot Map"
                  secondary={hotspotData.dataHash}
                />
              </ListItem>
            )}
          </List>

          <Divider sx={{ my: 2 }} />

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={submitToBlockchain}
            disabled={submittingToBlockchain || blockchainTxid !== null}
            startIcon={<Link />}
          >
            {submittingToBlockchain ? 'Submitting...' : blockchainTxid ? 'Submitted' : 'Submit to BSV Blockchain'}
          </Button>

          {blockchainTxid && (
            <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 2 }}>
              <strong>Blockchain Verified!</strong>
              <Typography variant="body2">
                Transaction ID: {blockchainTxid}
              </Typography>
              <Button
                size="small"
                href={`https://whatsonchain.com/tx/${blockchainTxid}`}
                target="_blank"
                sx={{ mt: 1 }}
              >
                View on WhatsOnChain
              </Button>
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Advanced Leak Detection Report
        </Typography>
        <Typography variant="body1" color="text.secondary">
          5 breakthrough features that competitors can't replicate
        </Typography>
        <Alert severity="success" sx={{ mt: 2 }}>
          <strong>BSV Blockchain Verified:</strong> All data timestamped and stored immutably
        </Alert>
      </Box>

      {/* Job Details Input */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Job ID"
                value={jobDetails.jobId}
                onChange={(e) => setJobDetails({ ...jobDetails, jobId: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Property ID"
                value={jobDetails.propertyId}
                onChange={(e) => setJobDetails({ ...jobDetails, propertyId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Leak Description"
                value={jobDetails.leakDescription}
                onChange={(e) => setJobDetails({ ...jobDetails, leakDescription: e.target.value })}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Feature Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<WaterDrop />} label="Smart Meter" />
          <Tab icon={<Map />} label="Neighborhood" />
          <Tab icon={<AccountTree />} label="Pipe Map" />
          <Tab icon={<Mic />} label="Acoustic" />
          <Tab icon={<Warning />} label="Hotspot" />
          <Tab icon={<Lock />} label="Consent" />
          <Tab icon={<Link />} label="Blockchain" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          {renderSmartMeterOverlay()}
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          {renderNeighborhoodMap()}
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          {renderPipeInfrastructure()}
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          {renderAcousticAnalysis()}
        </TabPanel>
        <TabPanel value={activeTab} index={4}>
          {renderFailureHotspot()}
        </TabPanel>
        <TabPanel value={activeTab} index={5}>
          {renderConsentManagement()}
        </TabPanel>
        <TabPanel value={activeTab} index={6}>
          {renderBlockchainSubmission()}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AdvancedLeakDetectionReport;
