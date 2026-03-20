/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { capture } from '../lib/analytics'
import { logger } from '../utils/logger'
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../lib/storage'
import { detectRegion } from '../constants/towns'

// Default location: Martha's Vineyard center (between Vineyard Haven, Oak Bluffs, Edgartown)
const DEFAULT_LOCATION = {
  lat: 41.43,
  lng: -70.56,
}

const LocationContext = createContext(null)

export function LocationProvider({ children }) {
  // Start with default location immediately - don't block on geolocation
  const [location, setLocation] = useState(DEFAULT_LOCATION)
  const [radius, setRadiusState] = useState(() => {
    const saved = getStorageItem(STORAGE_KEYS.RADIUS)
    if (saved !== null && saved !== undefined) {
      const parsed = parseInt(saved, 10)
      // 0 = Anywhere (no distance limit), 1-250 = miles
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 250) {
        return parsed
      }
    }
    return 5
  })

  // Wrap setRadius to track filter changes and persist to localStorage
  const setRadius = useCallback((newRadius) => {
    setRadiusState(prevRadius => {
      if (newRadius !== prevRadius) {
        capture('filter_applied', {
          filter_type: 'radius',
          radius_miles: newRadius,
          previous_radius: prevRadius,
        })
        setStorageItem(STORAGE_KEYS.RADIUS, String(newRadius))
      }
      return newRadius
    })
  }, [])

  // Town filter state (null = All Island)
  const [town, setTownState] = useState(() => {
    const saved = getStorageItem(STORAGE_KEYS.TOWN)
    // Return null if empty string or not set (All Island)
    return saved || null
  })

  // Wrap setTown to track filter changes and persist to localStorage
  const setTown = useCallback((newTown) => {
    setTownState(prevTown => {
      if (newTown !== prevTown) {
        capture('filter_applied', {
          filter_type: 'town',
          town: newTown || 'all',
          previous_town: prevTown || 'all',
        })
        setStorageItem(STORAGE_KEYS.TOWN, newTown || '')
      }
      return newTown
    })
  }, [])

  // Auto-detect region from coordinates
  const [region, setRegion] = useState(() => detectRegion(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng))

  useEffect(() => {
    if (location) {
      setRegion(detectRegion(location.lat, location.lng))
    }
  }, [location])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [permissionState, setPermissionState] = useState('prompt') // 'prompt' | 'granted' | 'denied' | 'unsupported'
  const [hasAskedBefore, setHasAskedBefore] = useState(false)

  // Check if we've asked before
  useEffect(() => {
    const asked = getStorageItem(STORAGE_KEYS.LOCATION_PERMISSION)
    if (asked) {
      setHasAskedBefore(true)
    }
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setPermissionState('unsupported')
      setLocation(DEFAULT_LOCATION)
      return
    }

    setLoading(true)
    setError(null)
    setStorageItem(STORAGE_KEYS.LOCATION_PERMISSION, 'true')
    setHasAskedBefore(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setPermissionState('granted')
        setLoading(false)
        setError(null)
      },
      (err) => {
        logger.warn('Geolocation error:', err.message)
        setPermissionState('denied')
        setError('denied')
        setLocation(DEFAULT_LOCATION)
        setLoading(false)
      },
      {
        enableHighAccuracy: false,
        timeout: 5000, // 5 second timeout - don't make users wait
        maximumAge: 300000, // Cache for 5 minutes
      }
    )
  }, [])

  // Check permission state on mount and auto-request location if already granted
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionState('unsupported')
      return
    }

    let permissionStatus = null
    let handlePermissionChange = null

    // Check permission API if available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        permissionStatus = result
        setPermissionState(result.state)

        // Auto-request only if permission was previously granted
        if (result.state === 'granted') {
          requestLocation()
        }

        // Listen for permission changes
        handlePermissionChange = () => {
          setPermissionState(result.state)
          if (result.state === 'granted') {
            requestLocation()
          }
        }

        result.addEventListener('change', handlePermissionChange)
      }).catch(() => {
        // Permission API not supported, will prompt on request
      })
    }

    // Cleanup function to remove listener when component unmounts
    return () => {
      if (permissionStatus && handlePermissionChange) {
        permissionStatus.removeEventListener('change', handlePermissionChange)
      }
    }
  }, [requestLocation])

  const useDefaultLocation = useCallback(() => {
    setLocation(DEFAULT_LOCATION)
    setError(null)
    setLoading(false)
  }, [])

  // Components call this to trigger location permission on demand.
  // Won't re-prompt if user already denied — avoids nagging.
  const promptForLocation = useCallback(() => {
    if (permissionState === 'denied' || permissionState === 'unsupported') {
      return
    }
    if (permissionState === 'granted') {
      // Already granted — just refresh the position
      requestLocation()
      return
    }
    requestLocation()
  }, [permissionState, requestLocation])

  const isUsingDefault = location?.lat === DEFAULT_LOCATION.lat && location?.lng === DEFAULT_LOCATION.lng

  return (
    <LocationContext.Provider value={{
      location,
      radius,
      setRadius,
      town,
      setTown,
      region,
      loading,
      error,
      permissionState,
      hasAskedBefore,
      requestLocation,
      promptForLocation,
      useDefaultLocation,
      isUsingDefault,
    }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocationContext() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider')
  }
  return context
}
