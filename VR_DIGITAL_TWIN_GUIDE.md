# 3D Digital Twin & VR Training System

## Overview
Your platform now includes comprehensive 3D visualization and VR training capabilities for plumbing education and real-time property monitoring.

---

## 🏠 3D Digital Twin Viewer

### Features
- **Real-time 3D Property Visualization**: Interactive Three.js-based 3D model of property plumbing systems
- **Live IoT Data Overlay**: Displays sensor readings directly on 3D elements
- **Leak Visualization**: Shows detected leaks with pulsing markers, severity indicators, and probability cones
- **Sensor Network Mapping**: Color-coded sensor spheres (green=normal, orange=warning, red=critical)
- **Multi-floor Support**: Visualizes properties across multiple stories
- **Interactive Controls**: Zoom (8-30 units) and rotation (0-360°) sliders
- **Building Structure**: Transparent walls showing interior plumbing network
- **Acoustic Camera Integration**: Displays leak hotspots from acoustic analysis

### Architecture
```
[3D Scene]
├── Building Structure (transparent walls, floors)
├── Plumbing System
│   ├── Main vertical pipe (blue)
│   ├── Horizontal distribution pipes
│   └── Branch pipes to fixtures
├── Sensor Meshes
│   ├── Sphere geometry (0.3 radius)
│   ├── Pulsing rings (animated opacity)
│   └── Color-coded by status
└── Leak Visualizations
    ├── Octahedron markers (emissive)
    ├── Probability cones (wireframe)
    └── Severity-based colors
```

### Usage
```typescript
<DigitalTwin3D 
  propertyId="prop_001"
  showLeaks={true}
  showSensors={true}
  liveData={true}
/>
```

### Data Flow
1. **Initial Load**: Fetches zone configurations from `/api/zones/property/:id`
2. **Live Polling**: Updates every 5 seconds from `/api/iot/property/:id/readings`
3. **Leak Detection**: Pulls from `/api/zones/leaks/:id?hours=1`
4. **Real-time Updates**: Animates sensor pulses and leak markers

### Camera System
- **Type**: PerspectiveCamera (60° FOV)
- **Default Position**: (zoom, zoom, zoom) looking at origin
- **Controls**: Zoom slider adjusts camera distance, rotation slider orbits scene
- **Auto-rotation**: Slow 0.05 rad/s rotation for overview effect

---

## 🥽 VR/XR Plumbing Education Game

### Game Structure
**7 Progressive Levels** with increasing difficulty and complexity:

#### Level 1: Basic Valve Control (Beginner)
- **Objective**: Close 5 leaking valves within 30 seconds
- **Passing Score**: 70%
- **Skills**: Quick identification, valve operation basics
- **Elements**: 5 valve assemblies with water particle effects

#### Level 2: Pipe Joint Repair (Beginner)
- **Objective**: Repair 4 leaking pipe joints
- **Time**: 60 seconds
- **Passing Score**: 75%
- **Skills**: Joint identification, repair technique selection
- **Elements**: 4 damaged torus joints at various locations

#### Level 3: Fixture Installation (Intermediate)
- **Objective**: Install 3 fixtures with proper sealing
- **Time**: 90 seconds
- **Passing Score**: 80%
- **Skills**: Code compliance, fixture types, sealing methods
- **Elements**: Faucet, valve, sink fixtures

#### Level 4: Leak Detection Challenge (Intermediate)
- **Objective**: Find 3 hidden leaks using sensor feedback
- **Time**: 120 seconds (2 minutes)
- **Passing Score**: 85%
- **Skills**: Acoustic analysis, sensor interpretation
- **Elements**: 3 invisible leak markers with proximity detection

#### Level 5: Emergency Response (Advanced)
- **Objective**: Handle burst pipe emergency
- **Time**: 45 seconds
- **Passing Score**: 90%
- **Skills**: Crisis management, system shutdown, pressure monitoring
- **Elements**: 
  - Burst pipe with 100 high-pressure water particles
  - 3 emergency valves
  - Main shutoff valve
  - 2 pressure gauges

#### Level 6: Complex System Diagnosis (Advanced)
- **Objective**: Diagnose and fix multiple simultaneous issues
- **Time**: 180 seconds (3 minutes)
- **Passing Score**: 90%
- **Tasks**: 8 complex diagnostics
- **Skills**: System thinking, multi-failure analysis

#### Level 7: Master Plumber Certification (Expert)
- **Objective**: Comprehensive property assessment
- **Time**: 300 seconds (5 minutes)
- **Passing Score**: 95%
- **Tasks**: 12 comprehensive assessments
- **Skills**: All previous skills + code compliance + inspection

### Game Mechanics

#### Interaction System
- **Raycasting**: Click/tap on 3D objects to interact
- **Hover Highlighting**: Objects glow when mouse/controller hovers
- **Task Completion**: Visual feedback (color change: red → green)
- **Scoring**: Points awarded per task (10-35 points depending on difficulty)

#### Visual Feedback
```typescript
Normal State: Red/Orange emissive objects
Hover State: +0.3 emissive intensity
Complete State: Green color + opacity change
```

#### Water Effects
- Particle system with spheres (0.05-0.08 radius)
- Gravity-based falling animation
- Spawning at leak points
- Removal on valve closure

### XR/WebXR Support

#### VR Mode Features
- **WebXR Integration**: `renderer.xr.enabled = true`
- **Immersive VR Session**: Supports Quest, Vive, Index headsets
- **Controller Support**: 6DOF tracking for VR controllers
- **Enter VR Button**: "🥽 Enter VR Mode" when XR available

#### Detection
```typescript
if ('xr' in navigator) {
  navigator.xr.isSessionSupported('immersive-vr')
}
```

#### Session Management
```typescript
const session = await navigator.xr.requestSession('immersive-vr')
await renderer.xr.setSession(session)
```

### Progression System

#### Scoring Algorithm
```
Level Score = (score / (totalTasks × 30)) × 100
Pass = Level Score ≥ Passing Score
```

#### Unlock Logic
- Complete current level to unlock next
- Must meet passing score threshold
- Retry unlimited times
- Progress saved locally

#### Difficulty Scaling
- **Beginner**: 30-60s time limits, 70-75% passing
- **Intermediate**: 90-120s time limits, 80-85% passing
- **Advanced**: 45-180s time limits, 90% passing
- **Expert**: 300s time limit, 95% passing

---

## 🎮 User Interface

### Digital Twin Controls
```
┌─────────────────────────────────────────┐
│ 🏠 Digital Twin: Property prop_001      │
│ [4 Sensors] [1 Leaks Detected] [↻]     │
├─────────────────────────────────────────┤
│ Zoom:  [━━━━━━●────] 🔍                 │
│ Rotate: [━━●────────] 🔄                │
├─────────────────────────────────────────┤
│ ● Normal  ● Warning  ● Critical  ● Leak │
└─────────────────────────────────────────┘
```

### VR Game HUD
```
┌─────────────────────────────────────────┐
│ 🎮 Level 5: Emergency Response          │
│ Difficulty: ADVANCED                     │
│                                          │
│ Score: 85        Time: 0:32             │
│ [████████████░░░░] 75% (4/6 tasks)      │
│                                          │
│ [Start Level] [🥽 Enter VR Mode]        │
└─────────────────────────────────────────┘
```

---

## 🚀 Integration with Existing Systems

### Backend API Connections
```typescript
// Digital Twin Data Sources
GET /api/zones/property/:id          → Zone configurations
GET /api/iot/property/:id/readings   → Real-time sensor data
GET /api/zones/leaks/:id?hours=1     → Recent leak detections
```

### WebSocket Integration
```typescript
// Subscribe to real-time updates
socket.on('iot_update', (data) => {
  updateSensorVisuals(data)
})

socket.on('predictions_update', (predictions) => {
  updateLeakProbability(predictions)
})
```

### AI Service Integration
- **ML Predictions**: Leak probability influences cone size
- **Zone Identification**: Triangulated positions displayed as 3D markers
- **Acoustic Camera**: Heatmap data overlaid on building structure

---

## 📊 Performance Considerations

### 3D Rendering Optimization
- **Geometry Instancing**: Reuse pipe/sensor geometries
- **Material Sharing**: Single material per object type
- **LOD System**: Not yet implemented (future enhancement)
- **Frame Rate Target**: 60 FPS on desktop, 90 FPS in VR

### Memory Management
- Dispose geometries/materials on unmount
- Remove event listeners properly
- Cancel animation frames in cleanup

### VR Performance
- **Target Frame Rate**: 90 FPS (11ms frame budget)
- **Draw Calls**: <100 per frame
- **Particle Count**: Limited to 20-100 depending on level

---

## 🔧 Configuration

### Digital Twin Settings
```typescript
interface DigitalTwinProps {
  propertyId: string        // Property to visualize
  showLeaks?: boolean       // Display leak markers (default: true)
  showSensors?: boolean     // Display sensor network (default: true)
  liveData?: boolean        // Enable 5s polling (default: true)
}
```

### VR Game Settings
```typescript
// Modify in GAME_LEVELS array
{
  id: number
  title: string
  description: string
  objective: string
  timeLimit: number         // seconds
  passingScore: number      // percentage
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}
```

---

## 🎯 Access Points

### Main Application Menu
Navigate to AppV2 toolbar buttons:
- **🏠 Digital Twin**: Real-time 3D property monitoring
- **🥽 VR Training**: Multi-level education game

### Direct Component Usage
```typescript
import { DigitalTwin3D } from './components/DigitalTwin3D'
import { PlumbingEducationGameVR } from './components/PlumbingEducationGameVR'
```

---

## 📱 Browser Compatibility

### Digital Twin
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 15+
- ✅ Edge 90+

### VR Mode
- ✅ Chrome with WebXR (desktop + Meta Quest browser)
- ✅ Firefox Reality
- ✅ Oculus Browser
- ⚠️ Safari (limited XR support)

---

## 🛠️ Development Roadmap

### Phase 1: Complete ✅
- [x] 3D Digital Twin with live data
- [x] 7-level VR education game
- [x] WebXR support
- [x] Multi-level progression system
- [x] Interactive 3D controls

### Phase 2: Planned
- [ ] Hand tracking for Quest
- [ ] Haptic feedback
- [ ] Multiplayer co-op training
- [ ] Voice commands
- [ ] AI instructor assistant
- [ ] Performance analytics dashboard
- [ ] Certification system with blockchain credentials
- [ ] Custom level editor

### Phase 3: Future
- [ ] AR mode for on-site diagnostics
- [ ] Photorealistic property scanning
- [ ] Cloud rendering for mobile VR
- [ ] International plumbing codes
- [ ] Multi-language support

---

## 📚 Learning Objectives

### By Completion, Students Will:
1. **Identify** common plumbing fixtures and components
2. **Operate** valves and shutoffs under time pressure
3. **Diagnose** leaks using visual and acoustic methods
4. **Repair** pipe joints with proper techniques
5. **Install** fixtures following code requirements
6. **Respond** to emergency situations effectively
7. **Assess** complex systems systematically
8. **Apply** building codes and safety standards

---

## 🎓 Certification Tracking

### Level Completion Data
```typescript
{
  userId: string
  levelId: number
  score: number
  timeRemaining: number
  tasksCompleted: number
  timestamp: Date
  passed: boolean
}
```

### Future: Blockchain Certificates
Store completion records on BSV blockchain for immutable credentials:
```
Level 7 Completion → Smart Contract → NFT Certificate → Professional Portfolio
```

---

## 🧪 Testing Recommendations

### Digital Twin Testing
```bash
# 1. Start backend
cd /workspaces/meter/backend
npm run dev

# 2. Verify endpoints
curl http://localhost:3001/api/zones/property/prop_001
curl http://localhost:3001/api/iot/property/prop_001/readings

# 3. Start frontend
cd /workspaces/meter/frontend
npm start

# 4. Navigate to Digital Twin view
```

### VR Game Testing
```bash
# Desktop mode
1. Click "🥽 VR Training" button
2. Click "Start Level" on Level 1
3. Click valves to close leaks
4. Verify score increases

# VR mode (requires VR headset)
1. Connect Quest/Vive headset
2. Open Chrome with WebXR enabled
3. Click "🥽 Enter VR Mode"
4. Use controllers to interact
```

---

## 🐛 Troubleshooting

### Digital Twin Issues
**Problem**: 3D scene not rendering
- Check browser console for WebGL errors
- Verify Three.js version compatibility
- Ensure containerRef is mounted

**Problem**: No sensor data appearing
- Check API endpoints are responding
- Verify propertyId exists in database
- Check liveData prop is true

### VR Game Issues
**Problem**: VR mode button not appearing
- Check browser supports WebXR: `navigator.xr`
- Use Chrome or Edge (Firefox has limited support)
- Enable WebXR flag: `chrome://flags/#webxr`

**Problem**: Objects not clickable
- Verify raycaster initialization
- Check interactableObjects array populated
- Ensure isPlaying is true

---

## 📞 Support

For technical issues:
1. Check browser console for errors
2. Verify backend API connectivity
3. Review component props
4. Test with demo property ID: `prop_001`

---

**Status**: ✅ COMPLETE - Both 3D Digital Twin and VR Education Game are fully implemented and integrated into the platform.
