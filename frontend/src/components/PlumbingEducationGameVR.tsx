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
  const handCursorRef = useRef<THREE.Group | null>(null)
  const draggedObjectRef = useRef<THREE.Mesh | null>(null)
  
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
  const [clipboardText, setClipboardText] = useState<string[]>([])
  const [showClipboard, setShowClipboard] = useState(true)
  const [availableFittings, setAvailableFittings] = useState<string[]>([])
  
  const interactableObjects = useRef<THREE.Mesh[]>([])
  const fittingObjects = useRef<THREE.Mesh[]>([])
  const targetZones = useRef<THREE.Mesh[]>([])

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

      // Update 3D hand cursor position
      if (handCursorRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera)
        const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), -10)
        const intersection = new THREE.Vector3()
        raycasterRef.current.ray.intersectPlane(planeZ, intersection)
        handCursorRef.current.position.copy(intersection)

        // If dragging, move object with hand
        if (draggedObjectRef.current) {
          draggedObjectRef.current.position.copy(intersection)
        }
      }
    }

    const onPointerDown = () => {
      if (!isPlaying) return

      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const fittingIntersects = raycasterRef.current.intersectObjects(fittingObjects.current)

      if (fittingIntersects.length > 0) {
        // Pick up fitting
        const fitting = fittingIntersects[0].object as THREE.Mesh
        draggedObjectRef.current = fitting
        fitting.scale.set(1.2, 1.2, 1.2) // Slightly enlarge when picked up
        if (handCursorRef.current) {
          handCursorRef.current.children[0].scale.set(0.8, 0.8, 0.8) // Close hand
        }
      } else {
        const intersects = raycasterRef.current.intersectObjects(interactableObjects.current)
        if (intersects.length > 0) {
          handleInteraction(intersects[0].object as THREE.Mesh)
        }
      }
    }

    const onPointerUp = () => {
      if (!isPlaying || !draggedObjectRef.current) return

      // Check if fitting is placed in correct target zone
      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const targetIntersects = raycasterRef.current.intersectObjects(targetZones.current)

      if (targetIntersects.length > 0) {
        const target = targetIntersects[0].object as THREE.Mesh
        const fitting = draggedObjectRef.current

        // Check if correct fitting for this zone
        if (target.userData.requiredFitting === fitting.userData.fittingType) {
          // Correct placement!
          fitting.position.copy(target.position)
          fitting.scale.set(1, 1, 1)
          target.material = new THREE.MeshStandardMaterial({ color: 0x00ff00, opacity: 0.3, transparent: true })
          setScore(prev => prev + 100)
          setCompletedTasks(prev => prev + 1)
          fittingObjects.current = fittingObjects.current.filter(f => f !== fitting)
        } else {
          // Wrong fitting!
          fitting.scale.set(1, 1, 1)
          setScore(prev => Math.max(0, prev - 50))
        }
      } else {
        // Not placed in zone, reset
        if (draggedObjectRef.current) {
          draggedObjectRef.current.scale.set(1, 1, 1)
        }
      }

      draggedObjectRef.current = null
      if (handCursorRef.current) {
        handCursorRef.current.children[0].scale.set(1, 1, 1) // Open hand
      }
    }

    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)

    // Create 3D hand cursor
    const handCursor = create3DHandCursor()
    scene.add(handCursor)
    handCursorRef.current = handCursor

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
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [currentLevel, isPlaying])

  const create3DHandCursor = (): THREE.Group => {
    const handGroup = new THREE.Group()
    
    // Palm
    const palmGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.2)
    const handMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffdbac, 
      roughness: 0.7,
      metalness: 0.1 
    })
    const palm = new THREE.Mesh(palmGeometry, handMaterial)
    handGroup.add(palm)

    // Fingers
    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8),
        handMaterial
      )
      finger.position.set(-0.2 + i * 0.15, 0.35, 0)
      finger.rotation.z = Math.PI / 2
      handGroup.add(finger)
    }

    // Thumb
    const thumb = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.4, 8),
      handMaterial
    )
    thumb.position.set(-0.4, -0.1, 0)
    thumb.rotation.z = Math.PI / 4
    handGroup.add(thumb)

    handGroup.scale.set(0.5, 0.5, 0.5)
    return handGroup
  }

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
    fittingObjects.current = []
    targetZones.current = []
    scene.children = scene.children.filter(child => 
      child instanceof THREE.Light || 
      child.name === 'room-floor' || 
      child.name.startsWith('room-wall') ||
      child === handCursorRef.current
    )

    const level = GAME_LEVELS.find(l => l.id === levelId)
    if (!level) return

    switch (levelId) {
      case 1:
        setClipboardText([
          '⚠️ EMERGENCY: 5 VALVES LEAKING',
          '',
          'Problem:',
          '- Multiple shut-off valves are open',
          '- Water is flooding the property',
          '- Customer is panicking',
          '',
          'Your Task:',
          '✓ Click each red valve to close it',
          '✓ Close all 5 valves within 30 seconds',
          '✓ Prevent further water damage'
        ])
        setAvailableFittings([])
        createLevel1ValveControl(scene)
        setTotalTasks(5)
        break
      case 2:
        setClipboardText([
          '🔧 REPAIR ORDER: PIPE JOINTS',
          '',
          'Problem:',
          '- 4 pipe joints are damaged and leaking',
          '- Old compression fittings have failed',
          '- Need immediate repair',
          '',
          'Available Fittings:',
          '• Compression Fitting (brass)',
          '• Push-Fit Connector',
          '• Copper Coupling',
          '• Slip Joint',
          '',
          'Your Task:',
          '✓ Pick up the correct fitting',
          '✓ Drag it to the damaged joint',
          '✓ Match fitting type to pipe size',
          '✓ Complete all 4 repairs'
        ])
        setAvailableFittings(['Compression', 'Push-Fit', 'Coupling', 'Slip Joint'])
        createLevel2PipeJointRepair(scene)
        setTotalTasks(4)
        break
      case 3:
        setClipboardText([
          '🚿 INSTALLATION: BATHROOM FIXTURES',
          '',
          'Problem:',
          '- New bathroom needs fixtures installed',
          '- Must follow plumbing codes',
          '- Ensure proper sealing',
          '',
          'Required Fixtures:',
          '• Faucet with aerator',
          '• Shower head assembly',
          '• Toilet flush valve',
          '',
          'Your Task:',
          '✓ Pick up each fixture',
          '✓ Install in correct location',
          '✓ Check for leaks',
          '✓ Pass code inspection'
        ])
        setAvailableFittings(['Faucet', 'Shower Head', 'Flush Valve'])
        createLevel3FixtureInstallation(scene)
        setTotalTasks(3)
        break
      case 4:
        setClipboardText([
          '🎧 LEAK DETECTION CHALLENGE',
          '',
          'Problem:',
          '- Customer hears water running',
          '- No visible leaks found',
          '- Hidden leaks suspected',
          '',
          'Equipment:',
          '• Acoustic Leak Sensor',
          '',
          'Your Task:',
          '✓ Use sensor to detect sound',
          '✓ Find 3 hidden leaks',
          '✓ Mark leak locations'
        ])
        setAvailableFittings([])
        createLevel4LeakDetection(scene)
        setTotalTasks(3)
        break
      default:
        setClipboardText(['Level ' + levelId, '', 'More content coming soon...'])
        setAvailableFittings([])
        setTotalTasks(1)
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
    const fittingTypes = ['Compression', 'Push-Fit', 'Coupling', 'Slip Joint']
    const positions = [
      { x: -6, y: 3, z: 0, required: 'Compression' },
      { x: -2, y: 4, z: -3, required: 'Push-Fit' },
      { x: 3, y: 2, z: 2, required: 'Coupling' },
      { x: 7, y: 3.5, z: -1, required: 'Slip Joint' }
    ]

    // Create target zones (damaged joints needing repair)
    positions.forEach((pos, i) => {
      const targetZone = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.2, 16, 32),
        new THREE.MeshStandardMaterial({
          color: 0xff6600,
          emissive: 0xff6600,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.7
        })
      )
      targetZone.position.set(pos.x, pos.y, pos.z)
      targetZone.userData = { type: 'target-zone', requiredFitting: pos.required, levelId: 2, taskId: i }
      targetZones.current.push(targetZone)
      scene.add(targetZone)

      // Leak particles around damaged joint
      for (let j = 0; j < 15; j++) {
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.05),
          new THREE.MeshBasicMaterial({ color: 0x0088ff })
        )
        particle.position.set(
          pos.x + Math.random() * 0.5 - 0.25,
          pos.y + Math.random() * 1.5,
          pos.z + Math.random() * 0.5 - 0.25
        )
        particle.name = `leak-${i}`
        scene.add(particle)
      }
    })

    // Create draggable fittings on workbench
    fittingTypes.forEach((type, i) => {
      const fitting = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16),
        new THREE.MeshStandardMaterial({
          color: 0xFFD700,
          metalness: 0.7,
          roughness: 0.3
        })
      )
      fitting.position.set(-8 + i * 4, 0.5, 8)
      fitting.userData = { fittingType: type, draggable: true }
      fittingObjects.current.push(fitting)
      scene.add(fitting)

      // Label
      const labelCanvas = document.createElement('canvas')
      labelCanvas.width = 128
      labelCanvas.height = 64
      const ctx = labelCanvas.getContext('2d')!
      ctx.fillStyle = 'white'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(type, 64, 32)
      const labelTexture = new THREE.CanvasTexture(labelCanvas)
      const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true })
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 1),
        labelMaterial
      )
      label.position.set(0, 1, 0)
      fitting.add(label)
    })

    // Workbench
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.2, 3),
      new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    )
    bench.position.set(0, 0, 8)
    scene.add(bench)
  }

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
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Clipboard Overlay */}
        {isPlaying && showClipboard && (
          <Paper
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              width: 280,
              maxHeight: 400,
              overflow: 'auto',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              p: 2,
              zIndex: 10,
              boxShadow: 3
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                📋 Work Order
              </Typography>
              <Button size="small" onClick={() => setShowClipboard(false)}>✕</Button>
            </Box>
            {clipboardText.map((line, idx) => (
              <Typography
                key={idx}
                variant="body2"
                sx={{
                  fontSize: '0.75rem',
                  fontFamily: line.startsWith('✓') || line.startsWith('•') ? 'monospace' : 'inherit',
                  fontWeight: line.includes('Problem:') || line.includes('Task:') || line.includes('Available') ? 'bold' : 'normal',
                  color: line.startsWith('⚠️') || line.startsWith('🔧') || line.startsWith('🚿') || line.startsWith('🎧') ? 'error.main' : 'text.primary',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {line}
              </Typography>
            ))}
          </Paper>
        )}

        {!showClipboard && isPlaying && (
          <Button
            sx={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}
            variant="contained"
            size="small"
            onClick={() => setShowClipboard(true)}
          >
            📋 Show Work Order
          </Button>
        )}

        {/* Available Fittings Panel */}
        {isPlaying && availableFittings.length > 0 && (
          <Paper
            sx={{
              position: 'absolute',
              bottom: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
              p: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              zIndex: 10
            }}
          >
            <Typography variant="caption" sx={{ alignSelf: 'center', mr: 1, fontWeight: 'bold' }}>
              Fittings:
            </Typography>
            {availableFittings.map((fitting, idx) => (
              <Button
                key={idx}
                variant="outlined"
                size="small"
                sx={{ minWidth: 80, fontSize: '0.7rem' }}
              >
                {fitting}
              </Button>
            ))}
          </Paper>
        )}

        {/* Hand Cursor Info */}
        {isPlaying && (
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              p: 1,
              borderRadius: 1,
              zIndex: 10
            }}
          >
            🖐️ Use mouse to control 3D hand
            <br />
            Click & drag to pick up fittings
          </Typography>
        )}
      </Box>

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
