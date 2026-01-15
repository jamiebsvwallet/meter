/**
 * API Service Layer
 * Centralized API client for frontend communication with backend
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001'

export const apiService = {
  // ========== Health & Status ==========

  async getHealth() {
    const res = await fetch(`${API_BASE}/health`)
    return res.json()
  },

  async getStatus() {
    const res = await fetch(`${API_BASE}/status`)
    return res.json()
  },

  // ========== IoT Data ==========

  async submitReading(reading: {
    deviceId: string
    propertyId: string
    pressure: number
    flowRate: number
    temperature: number
    recordedBy: string
  }) {
    const res = await fetch(`${API_BASE}/api/iot/reading`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reading)
    })
    return res.json()
  },

  async submitBatch(readings: any[]) {
    const res = await fetch(`${API_BASE}/api/iot/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readings })
    })
    return res.json()
  },

  async getReadings(propertyId: string) {
    const res = await fetch(`${API_BASE}/api/iot/property/${propertyId}/readings`)
    return res.json()
  },

  async getReadingsHistory(propertyId: string, startTime?: number, endTime?: number) {
    const params = new URLSearchParams()
    if (startTime) params.append('startTime', startTime.toString())
    if (endTime) params.append('endTime', endTime.toString())
    
    const res = await fetch(`${API_BASE}/api/iot/property/${propertyId}/readings/history?${params}`)
    return res.json()
  },

  async getAlerts(propertyId: string) {
    const res = await fetch(`${API_BASE}/api/iot/property/${propertyId}/alerts`)
    return res.json()
  },

  async getStats(propertyId: string) {
    const res = await fetch(`${API_BASE}/api/iot/property/${propertyId}/stats`)
    return res.json()
  },

  async registerDevice(device: {
    deviceId: string
    propertyId: string
    deviceType: string
    location: string
  }) {
    const res = await fetch(`${API_BASE}/api/iot/device/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(device)
    })
    return res.json()
  },

  async updateDeviceStatus(deviceId: string, status: string) {
    const res = await fetch(`${API_BASE}/api/iot/device/${deviceId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    return res.json()
  },

  // ========== Jobs ==========

  async createJob(job: {
    propertyId: string
    customerId: string
    description: string
    priority: string
  }) {
    const res = await fetch(`${API_BASE}/api/jobs/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job)
    })
    return res.json()
  },

  async getJob(jobId: string) {
    const res = await fetch(`${API_BASE}/api/jobs/${jobId}`)
    return res.json()
  },

  async getPropertyJobs(propertyId: string) {
    const res = await fetch(`${API_BASE}/api/jobs/property/${propertyId}`)
    return res.json()
  },

  async getPendingJobs(plumberId: string) {
    const res = await fetch(`${API_BASE}/api/jobs/plumber/${plumberId}/pending`)
    return res.json()
  },

  async completeJob(jobId: string, report: {
    workPerformed: string[]
    partsUsed: Array<{ name: string; cost: number; quantity: number }>
    totalCost: number
  }) {
    const res = await fetch(`${API_BASE}/api/jobs/${jobId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    })
    return res.json()
  },

  async approveJob(jobId: string) {
    const res = await fetch(`${API_BASE}/api/jobs/${jobId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    return res.json()
  },

  async getPlumberRevenue(plumberId: string) {
    const res = await fetch(`${API_BASE}/api/jobs/plumber/${plumberId}/revenue`)
    return res.json()
  },

  // ========== Consent Management ==========

  async setupConsent(propertyId: string, customerId: string) {
    const res = await fetch(`${API_BASE}/api/consent/${propertyId}/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId })
    })
    return res.json()
  },

  async getConsentSummary(propertyId: string) {
    const res = await fetch(`${API_BASE}/api/consent/${propertyId}/summary`)
    return res.json()
  },

  async grantWaterCompanyAccess(propertyId: string, companyId: string, expiresAt?: string) {
    const res = await fetch(`${API_BASE}/api/consent/${propertyId}/grant-water-company`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, expiresAt })
    })
    return res.json()
  },

  async revokeWaterCompanyAccess(propertyId: string, companyId: string) {
    const res = await fetch(`${API_BASE}/api/consent/${propertyId}/water-company/${companyId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
    return res.json()
  },

  async checkAccess(propertyId: string, entityId: string, entityType: string) {
    const res = await fetch(`${API_BASE}/api/consent/${propertyId}/access/${entityId}/${entityType}`)
    return res.json()
  },

  async getAuditTrail(propertyId: string) {
    const res = await fetch(`${API_BASE}/api/consent/${propertyId}/audit-trail`)
    return res.json()
  },

  // ========== Heatmap & Analytics ==========

  async getHeatmapData(hours: number = 24) {
    const res = await fetch(`${API_BASE}/api/heatmap?hours=${hours}`)
    return res.json()
  },

  // ========== Documentation ==========

  async getDocs() {
    const res = await fetch(`${API_BASE}/api/docs`)
    return res.json()
  },

  async getExamples() {
    const res = await fetch(`${API_BASE}/api/examples`)
    return res.json()
  }
}
