/**
 * VR/XR Plumbing Education Game with Multiple Levels
 * Progressive skill-based training with immersive XR support
 */

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Box, Button, Typography, Paper, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'

interface GameLevel {
  id: number
  title: string
  description: string
  objective: string
  timeLimit: number
  passingScore: number
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

const GAME_LEVELS: GameLevel[] = [
  {
    id: 1,
    title: 'Basic Valve Control',
    description: 'Learn to identify and operate shut-off valves quickly',
    objective: 'Close 5 leaking valves within 30 seconds',
    timeLimit: 30,
    passingScore: 70,
    difficulty: 'beginner'
  },
  {
    id: 2,
    title: 'Pipe Joint Repair',
    description: 'Identify damaged joints and apply correct repair techniques',
    objective: 'Repair 4 leaking pipe joints using the right tools',
    timeLimit: 60,
    passingScore: 75,
    difficulty: 'beginner'
  },
  {
    id: 3,
    title: 'Fixture Installation',
    description: 'Install faucets and fixtures following plumbing codes',
    objective: 'Correctly install 3 fixtures with proper sealing',
    timeLimit: 90,
    passingScore: 80,
    difficulty: 'intermediate'
  },
  {
    id: 4,
    title: 'Leak Detection Challenge',
    description: 'Use acoustic sensors to locate hidden leaks',
    objective: 'Find 3 hidden leaks using sensor feedback',
    timeLimit: 120,
    passingScore: 85,
    difficulty: 'intermediate'
  },
  {
    id: 5,
    title: 'Emergency Response',
    description: 'Handle a burst pipe emergency under pressure',
    objective: 'Stop water flow and stabilize the system',
    timeLimit: 45,
    passingScore: 90,
    difficulty: 'advanced'
  },
  {
    id: 6,
    title: 'Complex System Diagnosis',
    description: 'Diagnose and fix multiple issues in a complex system',
    objective: 'Restore full system functionality',
    timeLimit: 180,
    passingScore: 90,
    difficulty: 'advanced'
  },
  {
    id: 7,
    title: 'Master Plumber Certification',
    description: 'Complete a full property inspection and repair',
    objective: 'Score 95% or higher on comprehensive assessment',
    timeLimit: 300,
    passingScore: 95,
    difficulty: 'expert'
  }
]

export const PlumbingEducationGameVR: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
  
  const [currentLevel, setCurrentLevel] = useState<number>(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [completedTasks, setCompletedTasks] = useState(0)
  const [totalTasks, setTotalTasks] = useState(5)
  const [showLevelComplete, setShowLevelComplete] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [xrSupported, setXrSupported] = useState(false)
  const [vrSession, setVRSession] = useState<XRSession | null>(null)
  
  const interactableObjects = useRef<THREE.Mesh[]>([])

  useEffect(() => {
    // Check XR support
    if ('xr' in navigator) {
      (navigator as any).xr.isSessionSupported('immersive-vr').then((supported: boolean) => {
        setXrSupported(supported)
      })
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = 600

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87ceeb)
    scene.fog = new THREE.Fog(0x87ceeb, 10, 50)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(0, 5, 15)
    camera.lookAt(0, 3, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.xr.enabled = true
    rendererRef.current = renderer
    container.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(10, 20, 10)
    dirLight.castShadow = true
    scene.add(dirLight)

    // Room
    createRoom(scene)

    // Load level
    loadLevel(currentLevel, scene)

    // Mouse interaction
    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

    const onPointerDown = () => {
      if (!isPlaying) return

      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const intersects = raycasterRef.current.intersectObjects(interactableObjects.current)

      if (intersects.length > 0) {
        handleInteraction(intersects[0].object as THREE.Mesh)
      }
    }

    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerdown', onPointerDown)

    // Animation loop
    let frameId: number
    const clock = new THREE.Clock()

    function animate() {
      const delta = clock.getDelta()

      // Highlight objects on hover
      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const intersects = raycasterRef.current.intersectObjects(interactableObjects.current)

      interactableObjects.current.forEach(obj => {
        const mat = obj.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 0
      })

      if (intersects.length > 0 && isPlaying) {
        const mat = (intersects[0].object as THREE.Mesh).material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 0.3
      }

      // Animate water particles if any
      scene.traverse((child) => {
        if (child.name.startsWith('water-particle')) {
          child.position.y -= delta * 2
          if (child.position.y < 0) {
            child.position.y = 5
          }
        }
      })

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [currentLevel, isPlaying])

  useEffect(() => {
    if (!isPlaying || isPaused) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endLevel(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isPlaying, isPaused])

  const loadLevel = (levelId: number, scene: THREE.Scene) => {
    // Clear previous level objects
    interactableObjects.current = []
    scene.children = scene.children.filter(child => 
      child instanceof THREE.Light || 
      child.name === 'room-floor' || 
      child.name.startsWith('room-wall')
    )

    const level = GAME_LEVELS.find(l => l.id === levelId)
    if (!level) return

    switch (levelId) {
      case 1:
        createLevel1ValveControl(scene)
        setTotalTasks(5)
        break
      case 2:
        createLevel2PipeJointRepair(scene)
        setTotalTasks(4)
        break
      case 3:
        createLevel3FixtureInstallation(scene)
        setTotalTasks(3)
        break
      case 4:
        createLevel4LeakDetection(scene)
        setTotalTasks(3)
        break
      case 5:
        createLevel5EmergencyResponse(scene)
        setTotalTasks(6)
        break
      case 6:
        createLevel6ComplexDiagnosis(scene)
        setTotalTasks(8)
        break
      case 7:
        createLevel7MasterCertification(scene)
        setTotalTasks(12)
        break
    }
  }

  const createRoom = (scene: THREE.Scene) => {
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xddeeff })
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa })

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      floorMaterial
    )
    floor.rotation.x = -Math.PI / 2
    floor.name = 'room-floor'
    scene.add(floor)
  }

  const createLevel1ValveControl = (scene: THREE.Scene) => {
    // Create 5 valves with pipes
    for (let i = 0; i < 5; i++) {
      const pipeGroup = new THREE.Group()

      // Pipe
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 4, 16),
        new THREE.MeshStandardMaterial({ color: 0x4488ff })
      )
      pipe.rotation.z = Math.PI / 2
      pipeGroup.add(pipe)

      // Valve
      const valve = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.8),
        new THREE.MeshStandardMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 0
        })
      )
      valve.userData = { type: 'valve', state: 'open', levelId: 1, taskId: i }
      interactableObjects.current.push(valve)
      pipeGroup.add(valve)

      // Water particles (leak indicator)
      for (let j = 0; j < 20; j++) {
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.05),
          new THREE.MeshBasicMaterial({ color: 0x0088ff })
        )
        particle.position.set(
          Math.random() * 0.5 - 0.25,
          Math.random() * 2,
          Math.random() * 0.5 - 0.25
        )
        particle.name = `water-particle-${i}`
        pipeGroup.add(particle)
      }

      pipeGroup.position.set((i - 2) * 5, 3, 0)
      scene.add(pipeGroup)
    }
  }

  const createLevel2PipeJointRepair = (scene: THREE.Scene) => {
    const positions = [
      { x: -6, y: 3, z: 0 },
      { x: -2, y: 4, z: -3 },
      { x: 3, y: 2, z: 2 },
      { x: 7, y: 3.5, z: -1 }
    ]

    positions.forEach((pos, i) => {
      // Damaged joint
      const joint = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.2, 16, 32),
        new THREE.MeshStandardMaterial({
          color: 0xff6600,
          emissive: 0xff6600,
          emissiveIntensity: 0
        })
      )
      joint.position.set(pos.x, pos.y, pos.z)
      joint.userData = { type: 'damaged-joint', repaired: false, levelId: 2, taskId: i }
      interactableObjects.current.push(joint)
      scene.add(joint)

      // Leak particles
      for (let j = 0; j < 15; j++) {
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.05),
          new THREE.MeshBasicMaterial({ color: 0x0088ff })
        )
        particle.position.set(
          pos.x + Math.random() * 0.3 - 0.15,
          pos.y + Math.random() * 2,
          pos.z + Math.random() * 0.3 - 0.15
        )
        particle.name = `water-particle-joint-${i}`
        scene.add(particle)
      }
    })
  }

  const createLevel3FixtureInstallation = (scene: THREE.Scene) => {
    const fixtures = [
      { x: -5, y: 2, z: 0, type: 'faucet' },
      { x: 0, y: 3, z: -3, type: 'valve' },
      { x: 5, y: 2.5, z: 2, type: 'sink' }
    ]

    fixtures.forEach((fixture, i) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.6, 1, 16),
        new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          metalness: 0.8,
          roughness: 0.2,
          emissive: 0xcccccc,
          emissiveIntensity: 0
        })
      )
      mesh.position.set(fixture.x, fixture.y, fixture.z)
      mesh.userData = { type: 'fixture', installed: false, fixtureType: fixture.type, levelId: 3, taskId: i }
      interactableObjects.current.push(mesh)
      scene.add(mesh)
    })
  }

  const createLevel4LeakDetection = (scene: THREE.Scene) => {
    const hiddenLeaks = [
      { x: -4, y: 1, z: -4 },
      { x: 3, y: 2.5, z: 3 },
      { x: 0, y: 4, z: -2 }
    ]

    hiddenLeaks.forEach((leak, i) => {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.3),
        new THREE.MeshBasicMaterial({
          color: 0xff00ff,
          transparent: true,
          opacity: 0.5
        })
      )
      marker.position.set(leak.x, leak.y, leak.z)
      marker.userData = { type: 'hidden-leak', detected: false, levelId: 4, taskId: i }
      interactableObjects.current.push(marker)
      scene.add(marker)
    })
  }

  const createLevel5EmergencyResponse = (scene: THREE.Scene) => {
    // Burst pipe with high-pressure spray
    const burstPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 5, 16),
      new THREE.MeshStandardMaterial({ color: 0x4488ff })
    )
    burstPipe.position.set(0, 3, 0)
    burstPipe.rotation.x = Math.PI / 4
    scene.add(burstPipe)

    // Emergency valves
    for (let i = 0; i < 3; i++) {
      const valve = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 0
        })
      )
      valve.position.set((i - 1) * 4, 2, -5)
      valve.userData = { type: 'emergency-valve', closed: false, levelId: 5, taskId: i }
      interactableObjects.current.push(valve)
      scene.add(valve)
    }

    // Main shutoff
    const mainShutoff = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff6600,
        emissiveIntensity: 0
      })
    )
    mainShutoff.position.set(0, 1, -8)
    mainShutoff.userData = { type: 'main-shutoff', closed: false, levelId: 5, taskId: 3 }
    interactableObjects.current.push(mainShutoff)
    scene.add(mainShutoff)

    // Pressure gauges
    for (let i = 0; i < 2; i++) {
      const gauge = new THREE.Mesh(
        new THREE.CircleGeometry(0.5, 32),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 0
        })
      )
      gauge.position.set(i * 8 - 4, 4, -3)
      gauge.userData = { type: 'pressure-gauge', checked: false, levelId: 5, taskId: 4 + i }
      interactableObjects.current.push(gauge)
      scene.add(gauge)
    }

    // Massive water spray
    for (let i = 0; i < 100; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.08),
        new THREE.MeshBasicMaterial({ color: 0x0088ff })
      )
      particle.position.set(
        Math.random() * 2 - 1,
        Math.random() * 5 + 2,
        Math.random() * 2 - 1
      )
      particle.name = 'water-particle-burst'
      scene.add(particle)
    }
  }

  const createLevel6ComplexDiagnosis = (scene: THREE.Scene) => {
    // Complex network with multiple issues
    setTotalTasks(8)
    // Implementation would include multiple pipe systems, valves, pressure issues, etc.
  }

  const createLevel7MasterCertification = (scene: THREE.Scene) => {
    // Comprehensive assessment
    setTotalTasks(12)
    // Implementation would include all previous elements plus code compliance checks
  }

  const handleInteraction = (object: THREE.Mesh) => {
    const userData = object.userData

    switch (userData.type) {
      case 'valve':
        if (userData.state === 'open') {
          userData.state = 'closed'
          ;(object.material as THREE.MeshStandardMaterial).color.set(0x00ff00)
          setCompletedTasks(prev => prev + 1)
          setScore(prev => prev + 20)
          
          // Remove water particles
          if (sceneRef.current) {
            sceneRef.current.children = sceneRef.current.children.filter(
              child => child.name !== `water-particle-${userData.taskId}`
            )
          }
        }
        break

      case 'damaged-joint':
        if (!userData.repaired) {
          userData.repaired = true
          ;(object.material as THREE.MeshStandardMaterial).color.set(0x00ff00)
          setCompletedTasks(prev => prev + 1)
          setScore(prev => prev + 25)
        }
        break

      case 'fixture':
        if (!userData.installed) {
          userData.installed = true
          ;(object.material as THREE.MeshStandardMaterial).emissive.set(0x00ff00)
          setCompletedTasks(prev => prev + 1)
          setScore(prev => prev + 30)
        }
        break

      case 'hidden-leak':
        if (!userData.detected) {
          userData.detected = true
          ;(object.material as THREE.MeshBasicMaterial).opacity = 1
          setCompletedTasks(prev => prev + 1)
          setScore(prev => prev + 35)
        }
        break

      case 'emergency-valve':
      case 'main-shutoff':
        if (!userData.closed) {
          userData.closed = true
          ;(object.material as THREE.MeshStandardMaterial).color.set(0x00ff00)
          setCompletedTasks(prev => prev + 1)
          setScore(prev => prev + 15)
        }
        break

      case 'pressure-gauge':
        if (!userData.checked) {
          userData.checked = true
          setCompletedTasks(prev => prev + 1)
          setScore(prev => prev + 10)
        }
        break
    }

    // Check if level complete
    if (completedTasks + 1 >= totalTasks) {
      endLevel(true)
    }
  }

  const startLevel = () => {
    const level = GAME_LEVELS.find(l => l.id === currentLevel)
    if (!level) return

    setIsPlaying(true)
    setIsPaused(false)
    setScore(0)
    setCompletedTasks(0)
    setTimeLeft(level.timeLimit)
    setShowInstructions(false)
  }

  const endLevel = (completed: boolean) => {
    setIsPlaying(false)
    setShowLevelComplete(true)
  }

  const nextLevel = () => {
    if (currentLevel < GAME_LEVELS.length) {
      setCurrentLevel(prev => prev + 1)
      setShowLevelComplete(false)
      setShowInstructions(true)
    }
  }

  const restartLevel = () => {
    setShowLevelComplete(false)
    setShowInstructions(true)
    if (sceneRef.current) {
      loadLevel(currentLevel, sceneRef.current)
    }
  }

  const enterVRMode = async () => {
    if (!rendererRef.current || !xrSupported) return

    try {
      const session = await (navigator as any).xr.requestSession('immersive-vr')
      setVRSession(session)
      await rendererRef.current.xr.setSession(session)
    } catch (error) {
      console.error('Failed to enter VR mode:', error)
    }
  }

  const level = GAME_LEVELS.find(l => l.id === currentLevel)
  if (!level) return null

  const progress = (completedTasks / totalTasks) * 100
  const levelScore = totalTasks > 0 ? (score / (totalTasks * 30)) * 100 : 0

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5">🎮 Level {level.id}: {level.title}</Typography>
            <Typography variant="caption" color="text.secondary">
              Difficulty: {level.difficulty.toUpperCase()}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6">Score: {score}</Typography>
            <Typography variant="caption">Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</Typography>
          </Box>
        </Box>

        <LinearProgress variant="determinate" value={progress} sx={{ mb: 1 }} />
        <Typography variant="caption">
          Progress: {completedTasks}/{totalTasks} tasks completed ({progress.toFixed(0)}%)
        </Typography>

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          {!isPlaying && (
            <Button variant="contained" onClick={startLevel}>
              Start Level
            </Button>
          )}
          {isPlaying && (
            <Button variant="outlined" onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          )}
          {xrSupported && (
            <Button variant="outlined" onClick={enterVRMode}>
              🥽 Enter VR Mode
            </Button>
          )}
        </Box>
      </Paper>

      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: 600,
          border: '2px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      />

      {/* Instructions Dialog */}
      <Dialog open={showInstructions} maxWidth="sm" fullWidth>
        <DialogTitle>Level {level.id}: {level.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            {level.description}
          </Typography>
          <Typography variant="h6" gutterBottom>Objective:</Typography>
          <Typography variant="body2" paragraph>
            {level.objective}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Time Limit: {level.timeLimit} seconds<br />
            Passing Score: {level.passingScore}%
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInstructions(false)}>Skip</Button>
          <Button variant="contained" onClick={startLevel}>
            Start Level
          </Button>
        </DialogActions>
      </Dialog>

      {/* Level Complete Dialog */}
      <Dialog open={showLevelComplete} maxWidth="sm" fullWidth>
        <DialogTitle>
          {levelScore >= level.passingScore ? '🎉 Level Complete!' : '❌ Level Failed'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Final Score: {levelScore.toFixed(0)}%
          </Typography>
          <Typography variant="body2" paragraph>
            Required: {level.passingScore}%
          </Typography>
          <Typography variant="body2">
            Tasks Completed: {completedTasks}/{totalTasks}<br />
            Time Remaining: {timeLeft}s<br />
            Points Earned: {score}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={restartLevel}>Retry Level</Button>
          {levelScore >= level.passingScore && currentLevel < GAME_LEVELS.length && (
            <Button variant="contained" onClick={nextLevel}>
              Next Level
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PlumbingEducationGameVR
