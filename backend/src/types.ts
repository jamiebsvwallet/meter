// Original Meter types
export interface MeterRecord {
  txid: string
  outputIndex: number
  value: number
  creatorIdentityKey: string
  createdAt: Date
}

export interface UTXOReference {
  txid: string
  outputIndex: number
}

// IoT Sensor Data Types
export interface IoTReading {
  deviceId: string
  propertyId: string
  timestamp: number
  pressure: number // PSI
  flowRate: number // GPM or L/min
  temperature: number // Celsius
  alerts: AlertType[]
  recordedBy: string // Plumber's identity
}

export type AlertType = 'high_pressure' | 'low_pressure' | 'high_flow' | 'low_flow' | 'temp_anomaly' | 'leak_detected' | 'device_offline'

export interface IoTReadingBatch {
  batchId: string
  propertyId: string
  deviceIds: string[]
  readings: IoTReading[]
  dataHash: string // Hash of serialized readings for blockchain proof
  timestamp: number
  recordedBy: string
}

export interface IoTDevice {
  deviceId: string
  propertyId: string
  deviceType: 'pressure_sensor' | 'flow_meter' | 'temperature_probe' | 'hub' | 'acoustic_sensor' | 'zone_sensor'
  status: 'active' | 'inactive' | 'error'
  lastSeen: Date
  registeredAt: Date
  registeredBy: string // Plumber who installed it
  position?: {
    x: number
    y: number
    z: number
    zoneId?: string
  }
}

// Job Report Types
export interface JobReport {
  jobId: string
  propertyId: string
  customerId: string
  plumberId: string
  description: string
  workPerformed: string[]
  partsUsed: Array<{
    name: string
    cost: number
    quantity: number
  }>
  totalCost: number
  photos: string[] // URLs or IPFS hashes
  startTime: Date
  completionTime?: Date
  customerSignature?: string // Signature or approval hash
  reportHash: string // Hash of full report for blockchain
  status: 'pending' | 'completed' | 'approved'
  createdAt: Date
  updatedAt: Date
}

// Consent/Access Control Types
export interface PropertyConsent {
  propertyId: string
  customerId: string
  plumberId: string
  waterCompanyAccess: WaterCompanyConsent[]
  createdAt: Date
  updatedAt: Date
}

export interface WaterCompanyConsent {
  companyId: string
  grantedAt: Date
  revokedAt?: Date
  reason?: string
  expiresAt?: Date
  isActive: boolean
}

export interface ConsentAuditLog {
  id: string
  propertyId: string
  entityId: string
  action: 'grant' | 'revoke'
  timestamp: Date
  reason?: string
}

// BSV Account Types (for storing data on their own account)
export interface BSVAccount {
  userId: string
  identityKey: string
  issuedAt: Date
  accountType: 'customer' | 'plumber' | 'water_company'
  properties?: string[] // Property IDs they have access to
}

export interface Property {
  propertyId: string
  address: string
  ownerId: string // Customer ID
  registrationTxid?: string // Blockchain registration
  createdAt: Date
}