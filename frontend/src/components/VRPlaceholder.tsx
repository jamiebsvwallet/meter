import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const VRPlaceholder: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const startLessonRef = useRef<(() => void) | null>(null)
  const valveOpenRef = useRef(false)
  const leakActiveRef = useRef(false)
  const lessonTimerRef = useRef<number | null>(null)

  const [running, setRunning] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const c = container as HTMLDivElement

    const width = c.clientWidth || 600
    const height = 400

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f8)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 5, 12)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio || 1)

    // Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8)
    hemi.position.set(0, 20, 0)
    scene.add(hemi)

    const dir = new THREE.DirectionalLight(0xffffff, 0.6)
    dir.position.set(-3, 10, -10)
    scene.add(dir)

    // Simple plumbing-like pipe: series of cylinders
    const pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x8bb7d6 })

    const pipeGroup: THREE.Group = new THREE.Group()
    for (let i = 0; i < 6; i++) {
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 1.4, 16),
        pipeMaterial
      )
      cyl.rotation.z = Math.PI / 2
      cyl.position.set((i - 2.5) * 1.2, 0, Math.sin(i * 0.8) * 0.4)
      pipeGroup.add(cyl)
    }
    scene.add(pipeGroup)

    // A simple tap/valve (clickable)
    const valveMaterial = new THREE.MeshStandardMaterial({ color: 0xcc3333 })
    const valve = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.2, 0.7),
      valveMaterial
    )
    valve.position.set(3.2, 0.2, 0)
    valve.name = 'valve'
    scene.add(valve)

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 20),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.75
    scene.add(floor)

    // Simple particle "water" group
    const particles: THREE.Mesh[] = []
    const particleGeom = new THREE.SphereGeometry(0.06, 8, 8)
    const particleMat = new THREE.MeshStandardMaterial({ color: 0x33a1ff })

    let valveOpen = false
    let leakActive = false

    // Raycaster for clicking
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    function spawnParticle() {
      const p = new THREE.Mesh(particleGeom, particleMat)
      p.position.set(3.8, 0, 0)
      particles.push(p)
      scene.add(p)
    }

    // Lesson loop control
    let lessonTimer: any = null
    const lessonDuration = 30 // seconds

    function startLesson() {
      setScore(0)
      setTimeLeft(lessonDuration)
      setRunning(true)
      valveOpenRef.current = true
      leakActiveRef.current = true

      // Valve opens and leak starts; user must click valve to close
      lessonTimerRef.current = window.setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            if (lessonTimerRef.current) window.clearInterval(lessonTimerRef.current)
            setRunning(false)
            valveOpenRef.current = false
            leakActiveRef.current = false
            return 0
          }
          return t - 1
        })
      }, 1000)

      // After a random delay, reopen valve to create more challenges
      function scheduleReopen() {
        const delay = 2000 + Math.random() * 3000
        setTimeout(() => {
          valveOpenRef.current = true
          leakActiveRef.current = true
          scheduleReopen()
        }, delay)
      }
      scheduleReopen()
    }

    startLessonRef.current = startLesson

    // Animate loop
    let frameId: number
    const clock = new THREE.Clock()

    function animate() {
      const t = clock.getElapsedTime()
      scene.rotation.y = Math.sin(t * 0.25) * 0.06

      // Valve visual change
      valveMaterial.color.set(valveOpenRef.current ? 0x33cc33 : 0xcc3333)

      // Spawn particles while valveOpen
      if (valveOpenRef.current && Math.random() < 0.4) spawnParticle()

      // Move particles leftwards and remove when done
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.position.x -= 0.12 + Math.random() * 0.04
        p.position.y += Math.sin(t + i) * 0.002
        if (p.position.x < -3) {
          scene.remove(p)
          particles.splice(i, 1)
        }
      }

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }

    animate()

    function onPointerMove(event: PointerEvent) {
      const rect = c.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

    function onPointerDown(event: PointerEvent) {
      const rect = c.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObjects([valve], false)
      if (intersects.length) {
        // Toggle valve
        valveOpenRef.current = !valveOpenRef.current
        if (!valveOpenRef.current && leakActiveRef.current && running) {
          // user closed the valve while a leak was active -> point!
          setScore((s) => s + 1)
          leakActiveRef.current = false
        }
      }
    }

    c.addEventListener('pointermove', onPointerMove)
    c.addEventListener('pointerdown', onPointerDown)

    function handleResize() {
      const w = c.clientWidth || 600
      renderer.setSize(w, height)
      camera.aspect = w / height
      camera.updateProjectionMatrix()
    }

    window.addEventListener('resize', handleResize)

    // Provide a small cleanup and timers
    return () => {
      if (lessonTimerRef.current) window.clearInterval(lessonTimerRef.current)
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
      c.removeEventListener('pointermove', onPointerMove)
      c.removeEventListener('pointerdown', onPointerDown)
      renderer.dispose()
      if (renderer.domElement && renderer.domElement.parentNode === c) {
        c.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <div className="vr-placeholder" ref={containerRef} style={{ width: '100%', height: 400 }} />

      <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.9)', padding: '8px 12px', borderRadius: 6 }}>
        <div style={{ fontWeight: 700 }}>Plumbing Lesson</div>
        <div style={{ fontSize: 12, marginTop: 6 }}>
          <div>Score: <strong>{score}</strong></div>
          <div>Time: <strong>{timeLeft}s</strong></div>
        </div>
        <div style={{ marginTop: 8 }}>
          <button onClick={() => { if (!running && startLessonRef.current) startLessonRef.current() }} disabled={running}>Start Lesson</button>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#444' }}>
          Tip: Click the red valve to stop a leak when the lesson runs.
        </div>
      </div>
    </div>
  )
}

export default VRPlaceholder
