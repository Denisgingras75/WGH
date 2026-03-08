import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useRestaurantSearch } from '../hooks/useRestaurantSearch'
import { useLocationContext } from '../context/LocationContext'
import { useAuth } from '../context/AuthContext'
import { restaurantsApi } from '../api/restaurantsApi'
import { dishesApi } from '../api/dishesApi'
import { placesApi } from '../api/placesApi'
import { ALL_CATEGORIES } from '../constants/categories'
import { validateUserContent } from '../lib/reviewBlocklist'
import { capture } from '../lib/analytics'
import { logger } from '../utils/logger'
import { LoginModal } from './Auth/LoginModal'

const STEPS = { SEARCH: 'search', DETAILS: 'details', DISH: 'dish' }

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

export function AddRestaurantModal({ isOpen, onClose, initialQuery = '' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { location, permissionState, isUsingDefault } = useLocationContext()
  const containerRef = useFocusTrap(isOpen, onClose)

  const [step, setStep] = useState(STEPS.SEARCH)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  // Restaurant details form
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [town, setTown] = useState('')
  const [phone, setPhone] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [menuUrl, setMenuUrl] = useState('')
  const [googlePlaceId, setGooglePlaceId] = useState(null)
  const [toastSlug, setToastSlug] = useState(null)
  const [orderUrl, setOrderUrl] = useState(null)

  // Optional first dish
  const [dishName, setDishName] = useState('')
  const [dishCategory, setDishCategory] = useState('')
  const [dishPrice, setDishPrice] = useState('')

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
      setSelectedPlace(null)
      setError(null)
      setName('')
      setAddress('')
      setLat(null)
      setLng(null)
      setTown('')
      setPhone('')
      setWebsiteUrl('')
      setMenuUrl('')
      setGooglePlaceId(null)
      setToastSlug(null)
      setOrderUrl(null)
      setDishName('')
      setDishCategory('')
      setDishPrice('')
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

  const handleSelectLocal = (restaurant) => {
    // Already exists — navigate to it
    onClose()
    navigate(`/restaurants/${restaurant.id}`)
  }

  const handleSelectExternal = async (prediction) => {
    setError(null)

    // Check if this Google Place already exists in DB
    const existing = await restaurantsApi.findByGooglePlaceId(prediction.placeId)
    if (existing) {
      onClose()
      navigate(`/restaurants/${existing.id}`)
      return
    }

    // Fetch details from Google Places
    try {
      setSelectedPlace(prediction)
      const details = await placesApi.getDetails(prediction.placeId)
      if (details) {
        setName(details.name || prediction.name)
        setAddress(details.address || prediction.address || '')
        setLat(details.lat)
        setLng(details.lng)
        setPhone(details.phone || '')
        setWebsiteUrl(details.websiteUrl || '')
        setMenuUrl(details.menuUrl || '')
        setGooglePlaceId(prediction.placeId)
        // Auto-detect Toast slug or ordering URL from website
        var ordering = detectOrderingInfo(details.websiteUrl)
        if (!ordering.toastSlug && !ordering.orderUrl) {
          ordering = detectOrderingInfo(details.menuUrl)
        }
        setToastSlug(ordering.toastSlug)
        setOrderUrl(ordering.orderUrl)
        // Try to extract town from address
        const parts = (details.address || '').split(',')
        if (parts.length >= 2) {
          setTown(parts[parts.length - 2].trim().replace(/\s+\d{5}(-\d{4})?$/, ''))
        }
      } else {
        setName(prediction.name)
        setAddress(prediction.address || '')
        setGooglePlaceId(prediction.placeId)
      }
      setStep(STEPS.DETAILS)
    } catch (err) {
      logger.error('Error fetching place details:', err)
      setName(prediction.name)
      setAddress(prediction.address || '')
      setGooglePlaceId(prediction.placeId)
      setStep(STEPS.DETAILS)
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

  const handleDetailsNext = () => {
    if (!name.trim()) {
      setError('Restaurant name is required')
      return
    }
    // Content validation
    const contentError = validateUserContent(name.trim(), 'Restaurant name')
    if (contentError) {
      setError(contentError)
      return
    }
    if (!address.trim()) {
      setError('Address is required')
      return
    }
    if (lat == null || lng == null) {
      // Fall back to device GPS
      if (hasLocation && location) {
        setLat(location.lat)
        setLng(location.lng)
      } else {
        setError('Location coordinates are required. Please enable location access.')
        return
      }
    }
    setError(null)
    setStep(STEPS.DISH)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      // Create restaurant
      const restaurant = await restaurantsApi.create({
        name: name.trim(),
        address: address.trim(),
        lat,
        lng,
        town: town.trim() || null,
        googlePlaceId,
        websiteUrl: websiteUrl.trim() || null,
        menuUrl: menuUrl.trim() || null,
        phone: phone.trim() || null,
        toastSlug: toastSlug || null,
        orderUrl: orderUrl || null,
      })

      capture('restaurant_created', {
        restaurant_id: restaurant.id,
        source: googlePlaceId ? 'google_places' : 'manual',
        has_first_dish: !!dishName.trim(),
        has_toast: !!toastSlug,
        has_order_url: !!orderUrl,
      })

      // Optionally create first dish
      if (dishName.trim() && dishCategory) {
        try {
          await dishesApi.create({
            restaurantId: restaurant.id,
            name: dishName.trim(),
            category: dishCategory,
            price: dishPrice ? parseFloat(dishPrice) : null,
          })

          capture('dish_created_by_user', {
            restaurant_id: restaurant.id,
            category: dishCategory,
          })
        } catch (dishErr) {
          logger.error('Error creating first dish (restaurant was created):', dishErr)
          // Don't block — restaurant was created successfully
        }
      }

      onClose()
      navigate(`/restaurants/${restaurant.id}`)
    } catch (err) {
      logger.error('Error creating restaurant:', err)
      setError(err?.message || 'Failed to create restaurant. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkipDish = async () => {
    setDishName('')
    setDishCategory('')
    setDishPrice('')
    await handleSubmit()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      >
        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Add a restaurant"
          className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-divider)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b sticky top-0 z-10"
            style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
          >
            <h2
              className="font-bold text-lg"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {step === STEPS.SEARCH ? 'Add a Restaurant' : step === STEPS.DETAILS ? 'Confirm Details' : 'Add First Dish'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="mx-5 mt-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
              {error}
            </div>
          )}

          {/* Step 1: Search */}
          {step === STEPS.SEARCH && (
            <div className="p-5">
              <input
                type="text"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by restaurant name..."
                autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'var(--color-bg)',
                  border: '1.5px solid var(--color-divider)',
                  color: 'var(--color-text-primary)',
                }}
              />

              {/* Search results */}
              <div className="mt-3 space-y-1">
                {searchLoading && (
                  <div className="py-4 text-center">
                    <div className="animate-spin w-5 h-5 border-2 rounded-full mx-auto" style={{ borderColor: 'var(--color-divider)', borderTopColor: 'var(--color-primary)' }} />
                  </div>
                )}

                {/* Local DB results */}
                {localResults.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider px-1 py-2" style={{ color: 'var(--color-text-tertiary)' }}>
                      Already on WGH
                    </p>
                    {localResults.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelectLocal(r)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors"
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-elevated)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-rating)', color: 'white', fontSize: '12px', fontWeight: 700 }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{r.name}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>{r.address}</p>
                        </div>
                        <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}

                {/* Google Places results */}
                {externalResults.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider px-1 py-2" style={{ color: 'var(--color-text-tertiary)' }}>
                      From Google
                    </p>
                    {externalResults.map((p) => (
                      <button
                        key={p.placeId}
                        onClick={() => handleSelectExternal(p)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors"
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-elevated)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-accent-gold)', fontSize: '14px' }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{p.name}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>{p.address}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Manual add option */}
                {searchQuery.trim().length >= 2 && !searchLoading && (
                  <button
                    onClick={handleManualAdd}
                    className="w-full flex items-center gap-3 px-3 py-3 mt-2 rounded-lg text-left border border-dashed transition-colors"
                    style={{ borderColor: 'var(--color-accent-gold)', color: 'var(--color-accent-gold)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-accent-gold-muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-accent-gold-muted)' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm"
                  style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-divider)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Address *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm"
                  style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-divider)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>City/Town</label>
                <input
                  type="text"
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  placeholder="e.g. Oak Bluffs, Boston"
                  className="w-full px-4 py-2.5 rounded-lg text-sm"
                  style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-divider)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg text-sm"
                    style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-divider)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Website</label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-lg text-sm"
                    style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-divider)', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>

              <button
                onClick={handleDetailsNext}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
                style={{ background: 'var(--color-primary)', color: 'white' }}
              >
                Next
              </button>
              <button
                onClick={() => setStep(STEPS.SEARCH)}
                className="w-full py-2 text-sm font-medium"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Back to search
              </button>
            </div>
          )}

          {/* Step 3: Add First Dish (optional) */}
          {step === STEPS.DISH && (
            <div className="p-5 space-y-4">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Add the first dish to <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{name}</span> — be the first to review!
              </p>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Dish Name</label>
                <input
                  type="text"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Margherita Pizza"
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-lg text-sm"
                  style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-divider)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Category</label>
                <select
                  value={dishCategory}
                  onChange={(e) => setDishCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm appearance-none"
                  style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-divider)', color: dishCategory ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
                >
                  <option value="">Select a category...</option>
                  {ALL_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Price (optional)</label>
                <input
                  type="number"
                  value={dishPrice}
                  onChange={(e) => setDishPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 rounded-lg text-sm"
                  style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-divider)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !dishName.trim() || !dishCategory}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ background: 'var(--color-primary)', color: 'white' }}
              >
                {submitting ? 'Creating...' : 'Create Restaurant + Dish'}
              </button>
              <button
                onClick={handleSkipDish}
                disabled={submitting}
                className="w-full py-2 text-sm font-medium disabled:opacity-50"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {submitting ? 'Creating...' : 'Skip — just create the restaurant'}
              </button>
              <button
                onClick={() => setStep(STEPS.DETAILS)}
                disabled={submitting}
                className="w-full py-2 text-sm font-medium disabled:opacity-50"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </>
  )
}
