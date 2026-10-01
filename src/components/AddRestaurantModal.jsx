import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useRestaurantSearch } from '../hooks/useRestaurantSearch'
import { useLocationContext } from '../context/LocationContext'
import { useAuth } from '../context/AuthContext'
import { restaurantsApi } from '../api/restaurantsApi'
import { placesApi } from '../api/placesApi'
import { PoweredByGoogle } from './PoweredByGoogle'
import { menuImportApi } from '../api'
import { validateUserContent } from '../lib/reviewBlocklist'
import { capture } from '../lib/analytics'
import { logger } from '../utils/logger'
import { getUserMessage } from '../utils/errorHandler'
import { LoginModal } from './Auth/LoginModal'

const STEPS = { SEARCH: 'search', DETAILS: 'details' }
const COORDS_ERROR = 'Could not determine location. Please enable location access and try again.'
const COORDS_BLOCKED_ERROR = 'Location is blocked. Enable it in your browser settings, then try again.'

/**
 * Auto-detect Toast slug or ordering URL from a website URL.
 * Returns { toastSlug, orderUrl } — one or both may be null.
 */
function detectOrderingInfo(url) {
  if (!url) return { toastSlug: null, orderUrl: null }
  var lower = url.toLowerCase()

  // Direct Toast ordering link: order.toasttab.com/online/SLUG
  var toastMatch = url.match(/order\.toasttab\.com\/online\/([^/?#]+)/i)
  if (toastMatch) {
    return { toastSlug: toastMatch[1], orderUrl: null }
  }

  // Toast website (not ordering page): www.toasttab.com/SLUG
  var toastSiteMatch = url.match(/(?:www\.)?toasttab\.com\/([^/?#]+)/i)
  if (toastSiteMatch && toastSiteMatch[1] !== 'online') {
    return { toastSlug: toastSiteMatch[1], orderUrl: null }
  }

  // Common ordering platforms → save as order_url
  if (
    lower.includes('doordash.com') ||
    lower.includes('grubhub.com') ||
    lower.includes('ubereats.com') ||
    lower.includes('seamless.com') ||
    lower.includes('postmates.com') ||
    lower.includes('chownow.com') ||
    lower.includes('order.online') ||
    lower.includes('ordering.app')
  ) {
    return { toastSlug: null, orderUrl: url }
  }

  return { toastSlug: null, orderUrl: null }
}

function createErrorMessage(err) {
  return err?.type === 'RATE_LIMIT' ? err.message : getUserMessage(err, 'adding this restaurant')
}

export function AddRestaurantModal({ isOpen, onClose, initialQuery = '' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { location, permissionState, isUsingDefault, requestLocation } = useLocationContext()
  const containerRef = useFocusTrap(isOpen, onClose)

  const [step, setStep] = useState(STEPS.SEARCH)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [submitting, setSubmitting] = useState(false)
  // Synchronous double-submit guard — state updates land too late for a fast second tap
  const submittingRef = useRef(false)
  const [error, setError] = useState(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  // Restaurant details form
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [googlePlaceId, setGooglePlaceId] = useState(null)

  const hasLocation = permissionState === 'granted'
  // Don't pass location when on MV default — let Google search globally, not biased to MV
  const placesLat = isUsingDefault ? null : location?.lat
  const placesLng = isUsingDefault ? null : location?.lng
  const { localResults, externalResults, loading: searchLoading } = useRestaurantSearch(
    searchQuery, placesLat, placesLng, isOpen && step === STEPS.SEARCH
  )

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(STEPS.SEARCH)
      setSearchQuery(initialQuery)
      setError(null)
      setName('')
      setAddress('')
      setLat(null)
      setLng(null)
      setGooglePlaceId(null)
    }
  }, [isOpen, initialQuery])

  if (!isOpen) return null

  // Auth gate
  if (!user) {
    return (
      <LoginModal
        isOpen={true}
        onClose={onClose}
        pendingAction="add a restaurant"
      />
    )
  }

  const startSubmitting = () => {
    if (submittingRef.current) return false
    submittingRef.current = true
    setSubmitting(true)
    return true
  }

  const stopSubmitting = () => {
    submittingRef.current = false
    setSubmitting(false)
  }

  const handleSelectLocal = (restaurant) => {
    // Already exists — navigate to it
    onClose()
    navigate(`/restaurants/${restaurant.id}`)
  }

  const handleSelectExternal = async (prediction) => {
    if (!startSubmitting()) return
    setError(null)

    // Check if this Google Place already exists in DB
    let existing = null
    try {
      existing = await restaurantsApi.findByGooglePlaceId(prediction.placeId)
    } catch (err) {
      logger.error('Failed to check existing restaurant:', err)
      setError('Could not verify whether this restaurant already exists. Please try again.')
      stopSubmitting()
      return
    }
    if (existing) {
      stopSubmitting()
      onClose()
      navigate(`/restaurants/${existing.id}`)
      return
    }

    // Fetch details from Google Places — only this failure falls back to the manual form
    let details = null
    try {
      details = await placesApi.getDetails(prediction.placeId)
    } catch (err) {
      logger.error('Error fetching Google Places details:', err)
    }
    if (!details || !details.lat || !details.lng) {
      // Fallback: no lat/lng from Google — show manual form
      setName(prediction.name)
      setAddress(prediction.address || '')
      setGooglePlaceId(prediction.placeId)
      stopSubmitting()
      setStep(STEPS.DETAILS)
      return
    }

    // Extract town from address
    // Google Places format: "Street, City, State Zip, Country" (4 parts) or "Street, City, State Zip" (3 parts)
    var extractedTown = ''
    const parts = (details.address || '').split(',').map(p => p.trim())
    // Find the part that looks like "State Zip" (2 letters + 5-digit zip)
    const stateZipIdx = parts.findIndex(p => /^[A-Z]{2}\s+\d{5}(-\d{4})?$/.test(p))
    if (stateZipIdx > 0) {
      // City is the part just before State Zip
      extractedTown = parts[stateZipIdx - 1]
    } else if (parts.length >= 2) {
      // Fallback: second-to-last part (minus any trailing zip)
      extractedTown = parts[parts.length - 2].replace(/\s+\d{5}(-\d{4})?$/, '')
    }
    // Auto-detect Toast slug or ordering URL
    var ordering = detectOrderingInfo(details.websiteUrl)
    if (!ordering.toastSlug && !ordering.orderUrl) {
      ordering = detectOrderingInfo(details.menuUrl)
    }
    // Content validation
    const contentErr = validateUserContent(details.name || prediction.name, 'Restaurant name')
    if (contentErr) {
      setError(contentErr)
      stopSubmitting()
      return
    }

    // Create restaurant directly — skip confirm details
    try {
      const restaurant = await restaurantsApi.create({
        name: (details.name || prediction.name).trim(),
        address: (details.address || prediction.address || '').trim(),
        lat: details.lat,
        lng: details.lng,
        town: extractedTown || null,
        googlePlaceId: prediction.placeId,
        websiteUrl: details.websiteUrl || null,
        menuUrl: details.menuUrl || null,
        phone: details.phone || null,
        toastSlug: ordering.toastSlug || null,
        orderUrl: ordering.orderUrl || null,
      })
      capture('restaurant_created', {
        restaurant_id: restaurant.id,
        source: 'google_places',
        has_first_dish: false,
        has_toast: !!ordering.toastSlug,
        has_order_url: !!ordering.orderUrl,
      })
      // Fire-and-forget: auto-import menu
      menuImportApi.createJob(restaurant.id, 'initial').catch(err => logger.warn('Menu import enqueue failed', { restaurantId: restaurant.id, error: err?.message || String(err) }))
      stopSubmitting()
      onClose()
      navigate('/restaurants/' + restaurant.id)
    } catch (err) {
      logger.error('Error creating restaurant from Google Places:', err)
      setError(createErrorMessage(err))
      stopSubmitting()
    }
  }

  const handleManualAdd = () => {
    setName(searchQuery)
    // Use device GPS if available
    if (hasLocation && location) {
      setLat(location.lat)
      setLng(location.lng)
    }
    setStep(STEPS.DETAILS)
  }

  const handleDetailsNext = async () => {
    if (!startSubmitting()) return
    const fail = (message) => {
      setError(message)
      stopSubmitting()
    }

    if (!name.trim()) {
      fail('Restaurant name is required')
      return
    }
    // Content validation
    const contentError = validateUserContent(name.trim(), 'Restaurant name')
    if (contentError) {
      fail(contentError)
      return
    }
    if (!address.trim()) {
      fail('Address is required')
      return
    }
    const addressError = validateUserContent(address.trim(), 'Address')
    if (addressError) {
      fail(addressError)
      return
    }
    let resolvedLat = lat
    let resolvedLng = lng
    if (resolvedLat == null || resolvedLng == null) {
      // Try fetching coordinates from Google Place ID first
      if (googlePlaceId) {
        try {
          const details = await placesApi.getDetails(googlePlaceId)
          if (details && details.lat && details.lng) {
            resolvedLat = details.lat
            resolvedLng = details.lng
            setLat(details.lat)
            setLng(details.lng)
          }
        } catch {
          // Fall through to GPS
        }
      }
      // Fall back to device GPS
      if (resolvedLat == null || resolvedLng == null) {
        if (hasLocation && location) {
          resolvedLat = location.lat
          resolvedLng = location.lng
          setLat(location.lat)
          setLng(location.lng)
        } else {
          fail(permissionState === 'denied' ? COORDS_BLOCKED_ERROR : COORDS_ERROR)
          return
        }
      }
    }
    setError(null)
    handleSubmit({ lat: resolvedLat, lng: resolvedLng })
  }

  const handleSubmit = async ({ lat: overrideLat, lng: overrideLng } = {}) => {
    submittingRef.current = true
    setSubmitting(true)
    setError(null)

    const finalLat = overrideLat ?? lat
    const finalLng = overrideLng ?? lng

    try {
      // Create restaurant
      const restaurant = await restaurantsApi.create({
        name: name.trim(),
        address: address.trim(),
        lat: finalLat,
        lng: finalLng,
        town: null,
        googlePlaceId,
        websiteUrl: null,
        menuUrl: null,
        phone: null,
        toastSlug: null,
        orderUrl: null,
      })

      capture('restaurant_created', {
        restaurant_id: restaurant.id,
        source: googlePlaceId ? 'google_places' : 'manual',
        has_toast: false,
        has_order_url: false,
      })

      // Fire-and-forget: auto-discover website + import menu
      // Edge Function handles everything: Google Places lookup → website probe → menu extraction
      menuImportApi.createJob(restaurant.id, 'initial').catch(err => logger.warn('Menu import enqueue failed', { restaurantId: restaurant.id, error: err?.message || String(err) }))

      onClose()
      navigate(`/restaurants/${restaurant.id}`)
    } catch (err) {
      logger.error('Error creating restaurant:', err)
      setError(createErrorMessage(err))
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }


  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in-up">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-restaurant-title"
        className="relative rounded-3xl max-w-md w-full overflow-y-auto shadow-xl"
        style={{
          background: 'var(--color-surface-elevated)',
          maxHeight: '85dvh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b sticky top-0 z-10"
          style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface-elevated)' }}
        >
          <h2
            id="add-restaurant-title"
            className="font-bold text-lg"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {step === STEPS.SEARCH ? 'Add a Restaurant' : 'Confirm Details'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'transparent', color: 'var(--color-text-primary)' }}
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div className="mx-5 mt-4">
            <p role="alert" className="text-sm" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
            {error === COORDS_ERROR && permissionState === 'prompt' && (
              <button
                type="button"
                onClick={function () { requestLocation() }}
                className="mt-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-divider)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Enable location
              </button>
            )}
          </div>
        )}

        {/* Step 1: Search */}
        {step === STEPS.SEARCH && (
          <div className="p-5">
            <label htmlFor="add-restaurant-search" className="sr-only">Restaurant name</label>
            <div className="relative">
              <svg
                aria-hidden="true"
                className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-tertiary)' }}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                id="add-restaurant-search"
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search by restaurant name…"
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--color-bg)',
                  border: searchFocused ? '2px solid var(--color-primary)' : '2px solid var(--color-divider)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            {/* Search results */}
            <div className="mt-3 space-y-1">
              {searchLoading && (
                <div role="status" className="py-4 flex justify-center">
                  <div
                    className="spinner"
                  />
                  <span className="sr-only">Searching restaurants</span>
                </div>
              )}

              {/* Local DB results */}
              {localResults.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider px-1 py-2" style={{ color: 'var(--color-text-tertiary)' }}>
                    Already on WGH
                  </p>
                  {localResults.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelectLocal(r)}
                      disabled={submitting}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all active:scale-[0.98] disabled:opacity-60"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-success)', color: 'var(--color-text-on-primary)' }}>
                        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{r.name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>{r.address}</p>
                      </div>
                      <svg aria-hidden="true" className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              {/* Google Places results */}
              {externalResults.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider px-1 py-2" style={{ color: 'var(--color-text-tertiary)' }}>
                    From Google
                  </p>
                  {externalResults.map((p) => (
                    <button
                      key={p.placeId}
                      type="button"
                      onClick={() => handleSelectExternal(p)}
                      disabled={submitting}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all active:scale-[0.98] disabled:opacity-60"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-surface)', color: 'var(--color-accent-gold)', fontSize: '14px' }}>
                        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{p.name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>{p.address}</p>
                      </div>
                    </button>
                  ))}
                  <div className="px-1 pt-2">
                    <PoweredByGoogle />
                  </div>
                </div>
              )}

              {/* Manual add option */}
              {searchQuery.trim().length >= 2 && !searchLoading && (
                <button
                  type="button"
                  onClick={handleManualAdd}
                  disabled={submitting}
                  className="w-full flex items-center gap-3 px-3 py-3 mt-2 rounded-xl text-left min-h-[44px] transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ border: '1px dashed var(--color-divider)', color: 'var(--color-primary)' }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
                    <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Add "{searchQuery.trim()}" manually</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Not found in Google Places</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Confirm Details */}
        {step === STEPS.DETAILS && (
          <form
            noValidate
            className="p-5 space-y-4"
            onSubmit={function (e) {
              e.preventDefault()
              handleDetailsNext()
            }}
          >
            {googlePlaceId && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--color-surface)' }}>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Pre-filled from Google Maps
                </span>
                <PoweredByGoogle />
              </div>
            )}
            <div>
              <label htmlFor="add-restaurant-name" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Name <span aria-hidden="true">*</span>
              </label>
              <input
                id="add-restaurant-name"
                type="text"
                required
                aria-required="true"
                autoComplete="off"
                enterKeyHint="next"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--color-bg)',
                  color: 'var(--color-text-primary)',
                  border: focusedField === 'name' ? '2px solid var(--color-primary)' : '2px solid var(--color-divider)',
                }}
              />
            </div>
            <div>
              <label htmlFor="add-restaurant-address" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Address <span aria-hidden="true">*</span>
              </label>
              <input
                id="add-restaurant-address"
                type="text"
                required
                aria-required="true"
                autoComplete="street-address"
                enterKeyHint="done"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onFocus={() => setFocusedField('address')}
                onBlur={() => setFocusedField(null)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--color-bg)',
                  color: 'var(--color-text-primary)',
                  border: focusedField === 'address' ? '2px solid var(--color-primary)' : '2px solid var(--color-divider)',
                }}
              />
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              We'll find the website, menu, and phone number automatically.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(STEPS.SEARCH)}
                className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all active:scale-[0.98]"
                style={{
                  fontSize: '15px',
                  background: 'transparent',
                  border: '1px solid var(--color-divider)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all active:scale-[0.98]"
                style={{
                  fontSize: '15px',
                  background: 'var(--color-primary)',
                  color: 'var(--color-text-on-primary)',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Adding…' : 'Add restaurant'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
