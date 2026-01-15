/**
 * Custom React Hooks for API Communication
 */

import { useState, useCallback, useEffect } from 'react'
import { apiService } from '../services/api'

/**
 * Hook to fetch IoT readings
 */
export const useIoTReadings = (propertyId: string, pollInterval: number = 5000) => {
  const [readings, setReadings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReadings = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiService.getReadings(propertyId)
      setReadings(data.readings || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    fetchReadings()
    const interval = setInterval(fetchReadings, pollInterval)
    return () => clearInterval(interval)
  }, [fetchReadings, pollInterval])

  return { readings, loading, error, refetch: fetchReadings }
}

/**
 * Hook to fetch job data
 */
export const useJobs = (jobId?: string) => {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      if (jobId) {
        const data = await apiService.getJob(jobId)
        setJobs([data])
      }
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    if (jobId) {
      fetchJobs()
    }
  }, [jobId, fetchJobs])

  return { jobs, loading, error, refetch: fetchJobs }
}

/**
 * Hook to manage consent
 */
export const useConsent = (propertyId: string) => {
  const [consent, setConsent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConsent = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiService.getConsentSummary(propertyId)
      setConsent(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  const grantAccess = useCallback(
    async (companyId: string, expiresAt?: string) => {
      try {
        setLoading(true)
        const result = await apiService.grantWaterCompanyAccess(propertyId, companyId, expiresAt)
        await fetchConsent()
        return result
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [propertyId, fetchConsent]
  )

  const revokeAccess = useCallback(
    async (companyId: string) => {
      try {
        setLoading(true)
        const result = await apiService.revokeWaterCompanyAccess(propertyId, companyId)
        await fetchConsent()
        return result
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [propertyId, fetchConsent]
  )

  useEffect(() => {
    fetchConsent()
  }, [fetchConsent])

  return {
    consent,
    loading,
    error,
    grantAccess,
    revokeAccess,
    refetch: fetchConsent
  }
}

/**
 * Hook to fetch alerts
 */
export const useAlerts = (propertyId: string) => {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiService.getAlerts(propertyId)
      setAlerts(data.alerts || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 10000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  return { alerts, loading, error, refetch: fetchAlerts }
}

/**
 * Hook to fetch blockchain proofs
 */
export const useBlockchainProofs = (propertyId: string) => {
  const [proofs, setProofs] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProofs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiService.getHeatmapData(24)
      setProofs(data.proofs || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    fetchProofs()
  }, [fetchProofs])

  return { proofs, stats, loading, error, refetch: fetchProofs }
}
