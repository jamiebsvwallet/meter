/**
 * 3D Digital Twin Viewer
 * Real-time 3D visualization of property plumbing systems with live IoT data
 */

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Box, Typography, Paper, Chip, IconButton, Slider } from '@mui/material'
import { Refresh as RefreshIcon, ZoomIn, ZoomOut, Rotate90DegreesCcw } from '@mui/icons-material'

interface DigitalTwinProps {
  propertyId: string
  showLeaks?: boolean
  showSensors?: boolean
  liveData?: boolean
}

interface Sensor {
  deviceId: string
  position: { x: number; y: number; z: number }
  type: string
  status: 'normal' | 'warning' | 'critical'
  value: number
  label: string
}

interface LeakLocation {
  x: number
  y: number
  z: number
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  probability: number
}

export const DigitalTwin3D: React.FC<DigitalTwinProps> = ({
  propertyId,
  showLeaks = true,
  showSensors = true,
  liveData = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [leaks, setLeaks] = useState<LeakLocation[]>([])
  const [zoom, setZoom] = useState(15)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = 600

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.set(zoom, zoom, zoom)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    rendererRef.current = renderer
    container.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
    scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0x66ccff, 0.5, 50)
    pointLight.position.set(0, 10, 0)
    scene.add(pointLight)

    // Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x4444ff, 0x222244)
    scene.add(gridHelper)

    // Building structure (walls)
    createBuildingStructure(scene)

    // Plumbing system
    createPlumbingSystem(scene)

    // Floor layers for multi-story
    createFloorLayers(scene)

    // Sample sensors (will be replaced with real data)
    const sampleSensors: Sensor[] = [
      { deviceId: 's1', position: { x: -5, y: 2, z: -3 }, type: 'pressure', status: 'normal', value: 65, label: 'Kitchen' },
      { deviceId: 's2', position: { x: 3, y: 2, z: 4 }, type: 'flow', status: 'warning', value: 12, label: 'Bathroom' },
      { deviceId: 's3', position: { x: -2, y: 5, z: 2 }, type: 'acoustic', status: 'critical', value: 85, label: 'Master Bath' },
      { deviceId: 's4', position: { x: 5, y: 2, z: -5 }, type: 'temperature', status: 'normal', value: 18, label: 'Utility' }
    ]

    // Render sensors
    sampleSensors.forEach(sensor => {
      const sensorMesh = createSensorMesh(sensor)
      scene.add(sensorMesh)
    })
    setSensors(sampleSensors)

    // Sample leak (if any)
    const sampleLeaks: LeakLocation[] = [
      { x: 2, y: 3, z: 3, severity: 'major', probability: 0.87 }
    ]

    sampleLeaks.forEach(leak => {
      const leakViz = createLeakVisualization(leak)
      scene.add(leakViz)
    })
    setLeaks(sampleLeaks)

    // Animation loop
    let frameId: number
    const clock = new THREE.Clock()

    function animate() {
      const time = clock.getElapsedTime()

      // Rotate scene slowly
      scene.rotation.y = rotation * (Math.PI / 180) + time * 0.05

      // Pulse leak visualizations
      scene.traverse((child) => {
        if (child.name === 'leak-marker') {
          child.scale.setScalar(1 + Math.sin(time * 3) * 0.2)
        }
        if (child.name === 'sensor-pulse') {
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
          mat.opacity = 0.3 + Math.sin(time * 2) * 0.2
        }
      })

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }

    animate()

    // Handle window resize
    const handleResize = () => {
      const w = container.clientWidth
      camera.aspect = w / height
      camera.updateProjectionMatrix()
      renderer.setSize(w, height)
    }

    window.addEventListener('resize', handleResize)

    // Live data polling (if enabled)
    let pollInterval: NodeJS.Timeout | null = null
    if (liveData) {
      pollInterval = setInterval(() => {
        fetchLiveData()
      }, 5000)
    }

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
      if (pollInterval) clearInterval(pollInterval)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [propertyId, zoom, rotation, liveData])

  const fetchLiveData = async () => {
    // Fetch real sensor data and leak locations
    try {
      const [sensorsRes, leaksRes] = await Promise.all([
        fetch(`http://localhost:3001/api/iot/property/${propertyId}/readings`),
        fetch(`http://localhost:3001/api/zones/leaks/${propertyId}?hours=1`)
      ])

      if (sensorsRes.ok) {
        const data = await sensorsRes.json()
        // Update sensors state
      }

      if (leaksRes.ok) {
        const data = await leaksRes.json()
        // Update leaks state
      }
    } catch (error) {
      console.error('Error fetching live data:', error)
    }
  }

  const handleZoomChange = (_: any, value: number | number[]) => {
    const newZoom = value as number
    setZoom(newZoom)
    if (cameraRef.current) {
      cameraRef.current.position.set(newZoom, newZoom, newZoom)
      cameraRef.current.lookAt(0, 0, 0)
    }
  }

  const handleRotationChange = (_: any, value: number | number[]) => {
    setRotation(value as number)
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            🏠 Digital Twin: Property {propertyId}
          </Typography>
          <Box>
            <Chip label={`${sensors.length} Sensors`} size="small" sx={{ mr: 1 }} />
            <Chip label={`${leaks.length} Leaks Detected`} color={leaks.length > 0 ? 'error' : 'success'} size="small" sx={{ mr: 1 }} />
            <IconButton size="small" onClick={() => fetchLiveData()}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" gutterBottom>Zoom</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ZoomOut fontSize="small" />
              <Slider
                value={zoom}
                min={8}
                max={30}
                onChange={handleZoomChange}
                size="small"
              />
              <ZoomIn fontSize="small" />
            </Box>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" gutterBottom>Rotation</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rotate90DegreesCcw fontSize="small" />
              <Slider
                value={rotation}
                min={0}
                max={360}
                onChange={handleRotationChange}
                size="small"
              />
            </Box>
          </Box>
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip icon={<div style={{ width: 10, height: 10, background: '#00ff00', borderRadius: '50%' }} />} label="Normal" size="small" variant="outlined" />
          <Chip icon={<div style={{ width: 10, height: 10, background: '#ffaa00', borderRadius: '50%' }} />} label="Warning" size="small" variant="outlined" />
          <Chip icon={<div style={{ width: 10, height: 10, background: '#ff0000', borderRadius: '50%' }} />} label="Critical" size="small" variant="outlined" />
          <Chip icon={<div style={{ width: 10, height: 10, background: '#ff00ff', borderRadius: '50%' }} />} label="Leak" size="small" variant="outlined" />
        </Box>
      </Paper>

      {/* 3D Viewer */}
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: 600,
          border: '2px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative'
        }}
      />

      {/* Sensor Info Panel */}
      {sensors.length > 0 && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>Live Sensor Data</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            {sensors.map(sensor => (
              <Box key={sensor.deviceId} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2">{sensor.label}</Typography>
                <Typography variant="caption" display="block">ID: {sensor.deviceId}</Typography>
                <Typography variant="h6" color={
                  sensor.status === 'critical' ? 'error' :
                  sensor.status === 'warning' ? 'warning.main' : 'success.main'
                }>
                  {sensor.value} {sensor.type === 'pressure' ? 'PSI' : sensor.type === 'flow' ? 'GPM' : '°C'}
                </Typography>
                <Chip label={sensor.status} size="small" color={
                  sensor.status === 'critical' ? 'error' :
                  sensor.status === 'warning' ? 'warning' : 'success'
                } />
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  )
}

// Helper functions to create 3D elements

function createBuildingStructure(scene: THREE.Scene) {
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  })

  // Exterior walls
  const walls = [
    new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMaterial), // Back
    new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMaterial), // Front
    new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMaterial), // Left
    new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMaterial)  // Right
  ]

  walls[0].position.set(0, 5, -10)
  walls[1].position.set(0, 5, 10)
  walls[1].rotation.y = Math.PI

  walls[2].position.set(-10, 5, 0)
  walls[2].rotation.y = Math.PI / 2

  walls[3].position.set(10, 5, 0)
  walls[3].rotation.y = -Math.PI / 2

  walls.forEach(wall => scene.add(wall))
}

function createPlumbingSystem(scene: THREE.Scene) {
  const pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x4488ff })

  // Main vertical pipe
  const mainPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 10, 16),
    pipeMaterial
  )
  mainPipe.position.set(-4, 5, -4)
  scene.add(mainPipe)

  // Horizontal distribution pipes
  for (let i = 0; i < 3; i++) {
    const hPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 8, 16),
      pipeMaterial
    )
    hPipe.rotation.z = Math.PI / 2
    hPipe.position.set(0, 2 + i * 3, -4)
    scene.add(hPipe)
  }

  // Branch pipes to fixtures
  const branches = [
    { from: { x: -4, y: 2, z: -4 }, to: { x: -5, y: 2, z: -3 } },
    { from: { x: 3, y: 2, z: -4 }, to: { x: 3, y: 2, z: 4 } },
    { from: { x: -4, y: 5, z: -4 }, to: { x: -2, y: 5, z: 2 } }
  ]

  branches.forEach(branch => {
    const dir = new THREE.Vector3(
      branch.to.x - branch.from.x,
      branch.to.y - branch.from.y,
      branch.to.z - branch.from.z
    )
    const length = dir.length()
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, length, 12),
      pipeMaterial
    )
    pipe.position.set(
      (branch.from.x + branch.to.x) / 2,
      (branch.from.y + branch.to.y) / 2,
      (branch.from.z + branch.to.z) / 2
    )
    const axis = new THREE.Vector3(0, 1, 0)
    pipe.quaternion.setFromUnitVectors(axis, dir.normalize())
    scene.add(pipe)
  })
}

function createFloorLayers(scene: THREE.Scene) {
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x333344,
    transparent: true,
    opacity: 0.2
  })

  for (let i = 0; i < 3; i++) {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      floorMaterial
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = i * 3
    scene.add(floor)
  }
}

function createSensorMesh(sensor: Sensor): THREE.Group {
  const group = new THREE.Group()

  const color = sensor.status === 'critical' ? 0xff0000 :
                sensor.status === 'warning' ? 0xffaa00 : 0x00ff00

  // Sensor body
  const sensorMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 16),
    new THREE.MeshStandardMaterial({ color })
  )
  group.add(sensorMesh)

  // Pulsing ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.4, 0.5, 32),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
  )
  ring.name = 'sensor-pulse'
  group.add(ring)

  group.position.set(sensor.position.x, sensor.position.y, sensor.position.z)
  return group
}

function createLeakVisualization(leak: LeakLocation): THREE.Group {
  const group = new THREE.Group()

  const color = leak.severity === 'critical' ? 0xff00ff :
                leak.severity === 'major' ? 0xff0099 :
                leak.severity === 'moderate' ? 0xff6699 : 0x9966ff

  // Leak marker
  const marker = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.5),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5
    })
  )
  marker.name = 'leak-marker'
  group.add(marker)

  // Probability cone
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(leak.probability * 2, 3, 32),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      wireframe: true
    })
  )
  cone.position.y = -1.5
  group.add(cone)

  group.position.set(leak.x, leak.y, leak.z)
  return group
}

export default DigitalTwin3D
