# Platform Architecture - Complete System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PLUMBING IoT BSV PLATFORM                            │
│                           with AI, 3D & VR Capabilities                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + Three.js)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  Customer   │  │   Plumber   │  │    Water    │  │  AI Monitor │       │
│  │  Dashboard  │  │   Portal    │  │   Company   │  │  Dashboard  │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                              │
│  ┌───────────────────────────────┐  ┌───────────────────────────────┐      │
│  │     🏠 3D DIGITAL TWIN        │  │     🥽 VR TRAINING GAME       │      │
│  ├───────────────────────────────┤  ├───────────────────────────────┤      │
│  │ • Real-time property viz      │  │ • Level 1: Valve Control      │      │
│  │ • Live IoT sensor overlay     │  │ • Level 2: Joint Repair       │      │
│  │ • Leak visualization          │  │ • Level 3: Fixture Install    │      │
│  │ • Zone mapping                │  │ • Level 4: Leak Detection     │      │
│  │ • Acoustic camera heatmaps    │  │ • Level 5: Emergency          │      │
│  │ • Interactive controls        │  │ • Level 6: Complex Diagnosis  │      │
│  │ • Multi-floor support         │  │ • Level 7: Master Cert        │      │
│  │                               │  │ • WebXR VR headset support    │      │
│  └───────────────────────────────┘  └───────────────────────────────┘      │
│                      ↓                              ↓                        │
│              Three.js Renderer              Three.js + WebXR                │
│                                                                              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       │ REST API + WebSocket
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│                        BACKEND (Node.js + TypeScript)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                        API ROUTES (Express)                        │     │
│  ├───────────────────────────────────────────────────────────────────┤     │
│  │ /api/iot/*          IoT device readings & management              │     │
│  │ /api/jobs/*         Job creation, assignments, completion         │     │
│  │ /api/consent/*      Customer consent & privacy                    │     │
│  │ /api/agent/*        AI agent control & status (13 endpoints)      │     │
│  │ /api/zones/*        Zone config & acoustic analysis (9 endpoints) │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                      AI & ML SERVICES                              │     │
│  ├───────────────────────────────────────────────────────────────────┤     │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐        │     │
│  │  │  MLPredictionService    │  │  AgenticAIService       │        │     │
│  │  ├─────────────────────────┤  ├─────────────────────────┤        │     │
│  │  │ • Polynomial regression │  │ • 30s monitoring cycles │        │     │
│  │  │ • Leak probability      │  │ • Autonomous decisions  │        │     │
│  │  │ • Anomaly detection     │  │ • Job creation          │        │     │
│  │  │ • Predictive failure    │  │ • Alert generation      │        │     │
│  │  │ • Confidence scoring    │  │ • Maintenance scheduling│        │     │
│  │  └─────────────────────────┘  └─────────────────────────┘        │     │
│  │                                                                    │     │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐        │     │
│  │  │ ZoneIdentificationSvc   │  │  AcousticCameraSvc      │        │     │
│  │  ├─────────────────────────┤  ├─────────────────────────┤        │     │
│  │  │ • Triangulation         │  │ • Frequency analysis    │        │     │
│  │  │ • 2-4 sensor fusion     │  │ • 50x50 heatmaps        │        │     │
│  │  │ • 3D coordinates        │  │ • Pattern detection     │        │     │
│  │  │ • Confidence scoring    │  │ • Severity classification│       │     │
│  │  └─────────────────────────┘  └─────────────────────────┘        │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                      REALTIME SERVICE                              │     │
│  ├───────────────────────────────────────────────────────────────────┤     │
│  │ • WebSocket Server (Socket.io)                                    │     │
│  │ • 5-second broadcast intervals                                    │     │
│  │ • Events: iot_update, predictions_update, agent_status            │     │
│  │ • Property-specific rooms                                         │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       │ MongoDB Driver
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│                          DATABASE (MongoDB)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  iot_readings          IoT sensor data (pressure, flow, temp, acoustic)    │
│  zones                 Zone configurations with sensor positions            │
│  acoustic_readings     Acoustic sensor frequency/amplitude data             │
│  leak_locations        Triangulated leak positions (x,y,z)                  │
│  agent_actions         AI agent decision history                            │
│  maintenance_schedule  Automated maintenance tasks                          │
│  jobs                  Plumber job assignments                              │
│  alerts                High-risk alerts and notifications                   │
│  payment_flags         Payment anomaly flags                                │
│                                                                              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       │ BSV SDK
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│                       BLOCKCHAIN (Bitcoin SV)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Smart Contracts:                                                           │
│  • ConsentManager      Customer privacy consent records                     │
│  • IoTDataProof        Immutable IoT data proofs                            │
│  • JobReport           Plumber job completion verification                  │
│  • PropertyRegistry    Property ownership & configuration                   │
│  • Meter               Payment & usage tracking                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA FLOW EXAMPLES                                │
└─────────────────────────────────────────────────────────────────────────────┘

Example 1: Real-Time Leak Detection & Visualization
────────────────────────────────────────────────────

  IoT Sensor → Backend API → MLPredictionService → AgenticAIService
     (acoustic)    (/api/iot)    (85% leak prob)    (create alert/job)
                                         ↓
                                    MongoDB Store
                                   (leak_locations)
                                         ↓
                                  RealtimeService
                             (WebSocket broadcast)
                                         ↓
                               ┌─────────┴─────────┐
                               ↓                   ↓
                      3D Digital Twin      AI Monitoring Dashboard
                    (leak marker appears)   (alert notification)


Example 2: VR Training Session
───────────────────────────────

  User → AppV2 (click "🥽 VR Training") → PlumbingEducationGameVR
           ↓
    Level loads (Three.js scene)
           ↓
    User clicks valve (raycaster)
           ↓
    Score increases, task completed
           ↓
    Timer expires → Results calculated
           ↓
    [Future] Store completion → MongoDB → BSV blockchain certificate


Example 3: Zone-Based Acoustic Analysis
────────────────────────────────────────

  4 Acoustic Sensors → /api/zones/acoustic/analyze
     (frequency data)           ↓
                      ZoneIdentificationService
                        (triangulation)
                               ↓
                      AcousticCameraService
                        (50x50 heatmap)
                               ↓
                         MongoDB Store
                    (acoustic_readings, zones)
                               ↓
                         3D Digital Twin
                    (heatmap overlay on building)


┌─────────────────────────────────────────────────────────────────────────────┐
│                         TECHNOLOGY STACK SUMMARY                             │
└─────────────────────────────────────────────────────────────────────────────┘

Frontend:
  • React 18.3.1
  • TypeScript 5.7.2
  • Material-UI 6.3.1
  • Three.js 0.182.0 (3D rendering)
  • Socket.io-client 4.8.3 (WebSocket)
  • Webpack 5.104.1

Backend:
  • Node.js + TypeScript
  • Express 4.21.2
  • Socket.io 4.7.4
  • ml-regression 6.1.2 (ML library)
  • ml-matrix 6.11.1
  • MongoDB Driver 6.12.0

Blockchain:
  • BSV SDK 2.1.3
  • sCrypt 1.4.2

Database:
  • MongoDB (local instance)

VR/XR:
  • WebXR Device API
  • Three.js XR integration


┌─────────────────────────────────────────────────────────────────────────────┐
│                           FEATURE MATRIX                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┬────────┬──────────────────────────────────┐
│ Feature                         │ Status │ Implementation                    │
├─────────────────────────────────┼────────┼──────────────────────────────────┤
│ Customer Dashboard              │   ✅   │ CustomerDashboard.tsx             │
│ Plumber Portal                  │   ✅   │ PlumberPortal.tsx                 │
│ Water Company Dashboard         │   ✅   │ WaterCompanyDashboard.tsx         │
│ AI Monitoring Dashboard         │   ✅   │ AIMonitoringDashboard.tsx         │
│ 3D Digital Twin                 │   ✅   │ DigitalTwin3D.tsx                 │
│ VR Training Game (7 levels)     │   ✅   │ PlumbingEducationGameVR.tsx       │
│ ML Leak Prediction              │   ✅   │ ml-prediction.ts                  │
│ Agentic AI Monitoring           │   ✅   │ agentic-ai.ts                     │
│ Zone Identification             │   ✅   │ zone-acoustic.ts                  │
│ Acoustic Camera                 │   ✅   │ zone-acoustic.ts                  │
│ Real-time WebSocket             │   ✅   │ realtime.ts                       │
│ IoT Device Management           │   ✅   │ iot.routes.ts                     │
│ Job Management                  │   ✅   │ jobs.routes.ts                    │
│ Consent Management              │   ✅   │ consent.routes.ts                 │
│ BSV Blockchain Integration      │   ✅   │ blockchain.ts + contracts/        │
│ WebXR VR Support                │   ✅   │ Built into PlumbingEducationGameVR│
│ Multi-level Progression         │   ✅   │ GAME_LEVELS array                 │
│ Interactive 3D Controls         │   ✅   │ Zoom/rotation sliders             │
│ Live Data Polling               │   ✅   │ 5-second intervals                │
│ Haptic Feedback                 │   ⏳   │ Planned Phase 2                   │
│ Hand Tracking                   │   ⏳   │ Planned Phase 2                   │
│ AR Mode                         │   ⏳   │ Planned Phase 3                   │
│ Blockchain Certifications       │   ⏳   │ Planned Phase 2                   │
└─────────────────────────────────┴────────┴──────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                              PORT ASSIGNMENTS                                │
└─────────────────────────────────────────────────────────────────────────────┘

3000  →  Frontend (React Development Server)
3001  →  Backend API (Express + REST)
3001  →  WebSocket Server (Socket.io, same port as API)
27017 →  MongoDB Database


┌─────────────────────────────────────────────────────────────────────────────┐
│                           STARTUP SEQUENCE                                   │
└─────────────────────────────────────────────────────────────────────────────┘

1. MongoDB starts (Docker or local service)
2. Backend server starts (npm run dev)
   ├─ Express API initialized
   ├─ MongoDB connection established
   ├─ WebSocket server attached
   ├─ ML model trained with historical data
   ├─ Agentic AI service started (30s cycles)
   └─ Real-time broadcast service started (5s intervals)
3. Frontend starts (npm start)
   ├─ React app loads
   ├─ Socket.io connects to backend
   └─ User selects role/view


┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER ROLE CAPABILITIES                               │
└─────────────────────────────────────────────────────────────────────────────┘

Customer:
  • View property IoT readings
  • Monitor water usage
  • Receive leak alerts
  • Review job history
  • Manage consent settings

Plumber:
  • View assigned jobs
  • Update job status
  • Access property details
  • Submit job reports
  • Request certifications

Water Company:
  • Monitor all properties
  • Review system metrics
  • Analyze usage patterns
  • Compliance tracking

AI Monitor:
  • View AI agent status
  • Real-time predictions
  • Agent action history
  • System statistics
  • Training controls

Digital Twin Viewer:
  • 3D property visualization
  • Live sensor overlay
  • Leak detection display
  • Zone mapping
  • Interactive controls

VR Trainer:
  • Access 7 training levels
  • Progressive skill building
  • VR headset support
  • Score tracking
  • Certification path


┌─────────────────────────────────────────────────────────────────────────────┐
│                              DOCUMENTATION                                   │
└─────────────────────────────────────────────────────────────────────────────┘

README.md                              Main project overview
DIGITAL_TWIN_VR_COMPLETE.md           ✅ Status & quick reference
VR_DIGITAL_TWIN_GUIDE.md              📚 Comprehensive VR/3D guide
VR_STATUS.md                          📊 Feature summary
AI_IMPLEMENTATION.md                   🤖 AI/ML documentation
FEATURES_COMPLETE.md                   📝 Complete feature list
IMPLEMENTATION_SUMMARY_COMPLETE.md     📋 Full implementation details
GETTING_STARTED.md                     🚀 Setup instructions
QUICK_START.md                         ⚡ Fast setup guide
ARCHITECTURE_DIAGRAMS.md               🏗️ System architecture


┌─────────────────────────────────────────────────────────────────────────────┐
│                           PERFORMANCE TARGETS                                │
└─────────────────────────────────────────────────────────────────────────────┘

Desktop Mode:
  • Frame Rate: 60 FPS
  • Load Time: <3 seconds
  • API Response: <200ms
  • Memory: <300 MB

VR Mode:
  • Frame Rate: 90 FPS (11ms frame budget)
  • Load Time: <2 seconds per level
  • Latency: <20ms
  • Memory: <500 MB


┌─────────────────────────────────────────────────────────────────────────────┐
│                            DEPLOYMENT STATUS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Development:  ✅ READY
Testing:      ✅ PASSING
Build:        ✅ SUCCESS
Documentation:✅ COMPLETE
Production:   ✅ DEPLOYABLE


───────────────────────────────────────────────────────────────────────────────
End of Architecture Diagram
Last Updated: January 2024
Version: 1.0.0
Status: Production Ready ✅
───────────────────────────────────────────────────────────────────────────────
