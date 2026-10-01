import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { logger } from '../utils/logger'
import { getUserMessage, getUserFacingMessage } from '../utils/errorHandler'
import { validateUserContent } from '../lib/reviewBlocklist'
import { restaurantsApi } from '../api/restaurantsApi'
import { adminApi } from '../api/adminApi'
import { restaurantManagerApi } from '../api/restaurantManagerApi'
import { ALL_CATEGORIES } from '../constants/categories'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { AMATIC_TITLE, CARD_STYLE, INPUT_CLASS, INPUT_FOCUS_CLASS, INPUT_STYLE, LABEL_CLASS, LABEL_STYLE, PAGE_INPUT_STYLE, PRIMARY_BUTTON_CLASS, ROW_ACTION_CLASS, SECONDARY_BUTTON_CLASS, SECONDARY_BUTTON_STYLE } from '../constants/styles'

const INPUT_BASE_CLASS = 'w-full rounded-xl text-sm ' + INPUT_FOCUS_CLASS
const META_STYLE = { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-tertiary)' }

function primaryStyle(busy) {
  return { background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', opacity: busy ? 0.7 : 1 }
}

function SectionTitle({ as: Tag = 'h2', size = 24, children }) {
  return (
    <Tag className="mb-3" style={{ ...AMATIC_TITLE, fontSize: `${size}px` }}>
      {children}
    </Tag>
  )
}

function AdminDishRow({ dish, isEditing, isLast, onEdit, onDelete }) {
  return (
    <div
      className="px-4 py-2 flex items-center justify-between gap-2"
      style={{
        background: isEditing ? 'var(--color-primary-muted)' : 'transparent',
        outline: isEditing ? '1px solid var(--color-primary)' : 'none',
        outlineOffset: '-1px',
        borderBottom: isLast ? 'none' : '1px solid var(--color-divider)',
      }}
    >
      <div className="flex-1 min-w-0 py-1">
        <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
          {dish.name}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
          {dish.restaurants?.name} · {dish.category}{dish.price != null ? ` · $${dish.price}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2 -mr-3 flex-shrink-0">
        <button onClick={() => onEdit(dish)} className={ROW_ACTION_CLASS} style={{ color: 'var(--color-accent-gold)' }}>
          Edit
        </button>
        <button onClick={() => onDelete(dish.id, dish.name)} className={ROW_ACTION_CLASS} style={{ color: 'var(--color-danger)' }}>
          Delete
        </button>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div role="status" className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div
        className="spinner"
      />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export function Admin() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [recentDishes, setRecentDishes] = useState([])

  // Admin status from database (matches RLS)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckDone, setAdminCheckDone] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [lastSearched, setLastSearched] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  // Edit mode state
  const [editingDishId, setEditingDishId] = useState(null)

  // Restaurant manager state
  const [inviteRestaurantId, setInviteRestaurantId] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [generating, setGenerating] = useState(false)
  const [managers, setManagers] = useState([])
  const [managersLoading, setManagersLoading] = useState(false)
  const [managersError, setManagersError] = useState(null)
  const managersReqRef = useRef(null)
  const [inviteSearch, setInviteSearch] = useState('')
  const [inviteDropdownOpen, setInviteDropdownOpen] = useState(false)
  const inviteSearchRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (inviteSearchRef.current && !inviteSearchRef.current.contains(e.target)) {
        setInviteDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Form state
  const [restaurantId, setRestaurantId] = useState('')
  const [dishName, setDishName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')

  // Check admin status from database (matches RLS policies)
  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      setAdminCheckDone(true)
      return
    }

    async function checkAdmin() {
      const result = await adminApi.isAdmin()
      setIsAdmin(result)
      setAdminCheckDone(true)
    }
    checkAdmin()
  }, [user])

  // Fetch restaurants on mount
  useEffect(() => {
    fetchRestaurants()
    fetchRecentDishes()
  }, [])

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))

  async function fetchRestaurants() {
    try {
      const data = await restaurantsApi.getOpen()
      setRestaurants(data)
    } catch (error) {
      logger.error('Error fetching restaurants:', error)
      toast.error(getUserMessage(error, 'loading restaurants'))
    } finally {
      setLoading(false)
    }
  }

  async function fetchRecentDishes() {
    try {
      const data = await adminApi.getRecentDishes(10)
      setRecentDishes(data)
    } catch (error) {
      logger.error('Error fetching recent dishes:', error)
    }
  }

  async function handleSearch(e) {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) {
      setSearchResults([])
      setLastSearched('')
      return
    }

    setSearching(true)
    try {
      const results = await adminApi.searchDishes(query)
      setSearchResults(results)
      setLastSearched(query)
    } catch (error) {
      logger.error('Error searching dishes:', error)
      toast.error(getUserMessage(error, 'searching dishes'))
    } finally {
      setSearching(false)
    }
  }

  function handleEdit(dish) {
    setEditingDishId(dish.id)
    setRestaurantId(dish.restaurant_id || dish.restaurants?.id || '')
    setDishName(dish.name || '')
    setCategory(dish.category || '')
    setPrice(dish.price != null ? String(dish.price) : '')
    setPhotoUrl(dish.photo_url || '')
    setFormError(null)
    // Scroll to form
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }

  function resetForm() {
    setRestaurantId('')
    setDishName('')
    setCategory('')
    setPrice('')
    setPhotoUrl('')
    setFormError(null)
  }

  function handleCancelEdit() {
    setEditingDishId(null)
    resetForm()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return

    const name = dishName.trim()
    if (!restaurantId || !name || !category) {
      setFormError('Please fill in restaurant, dish name, and category')
      return
    }

    const contentError = validateUserContent(name, 'Dish name')
    if (contentError) {
      setFormError(contentError)
      return
    }

    // Validate price is a valid number if provided
    if (price && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
      setFormError('Please enter a valid price (positive number)')
      return
    }

    // Validate photo URL format if provided
    if (photoUrl) {
      try {
        const url = new URL(photoUrl)
        if (!['http:', 'https:'].includes(url.protocol)) {
          setFormError('Photo URL must use http or https protocol')
          return
        }
      } catch {
        setFormError('Please enter a valid photo URL')
        return
      }
    }

    setSubmitting(true)
    setFormError(null)

    try {
      const params = {
        restaurantId,
        name,
        category,
        price: price ? parseFloat(price) : null,
        photoUrl,
      }
      if (editingDishId) {
        await adminApi.updateDish(editingDishId, params)
        toast.success(`Updated "${name}"`)
        setEditingDishId(null)
      } else {
        await adminApi.addDish(params)
        toast.success(`Added "${name}"`)
      }
      resetForm()
      // Refresh lists
      fetchRecentDishes()
      if (lastSearched) {
        const results = await adminApi.searchDishes(lastSearched)
        setSearchResults(results)
      }
    } catch (error) {
      logger.error('Error saving dish:', error)
      toast.error(getUserFacingMessage(error, 'saving the dish'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(dishId, deletedDishName) {
    if (!confirm(`Delete "${deletedDishName}"? This cannot be undone.`)) return

    try {
      await adminApi.deleteDish(dishId)
      toast.success(`Deleted "${deletedDishName}"`)
      fetchRecentDishes()
      // Also refresh search results if searching
      if (lastSearched) {
        const results = await adminApi.searchDishes(lastSearched)
        setSearchResults(results)
      }
      // Clear edit mode if deleting the dish being edited
      if (editingDishId === dishId) {
        handleCancelEdit()
      }
    } catch (error) {
      logger.error('Error deleting dish:', error)
      toast.error(getUserFacingMessage(error, 'deleting the dish'))
    }
  }

  async function handleGenerateInvite() {
    if (generating) return
    if (!inviteRestaurantId) {
      toast.error('Select a restaurant first')
      return
    }

    setGenerating(true)
    try {
      const { token } = await restaurantManagerApi.createInvite(inviteRestaurantId)
      const link = `${window.location.origin}/invite/${token}`
      setInviteLink(link)
      toast.success('Invite link generated')
    } catch (error) {
      logger.error('Error generating invite:', error)
      toast.error(getUserFacingMessage(error, 'generating the invite'))
    } finally {
      setGenerating(false)
    }
  }

  function handleCopyInvite() {
    // Use a temporary textarea for maximum compatibility.
    // navigator.clipboard.writeText loses user-gesture context
    // on mobile Safari when called with async/await.
    const ta = document.createElement('textarea')
    ta.value = inviteLink
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    let copied = false
    try {
      // execCommand returns false (rather than throwing) when the copy is blocked
      copied = document.execCommand('copy')
    } catch {
      copied = false
    }
    document.body.removeChild(ta)
    if (copied) {
      toast.success('Invite link copied')
    } else {
      toast.error('Copy failed. Long-press the link to copy it.')
    }
  }

  async function fetchManagers(selectedRestaurantId) {
    managersReqRef.current = selectedRestaurantId
    setManagersError(null)
    if (!selectedRestaurantId) {
      setManagers([])
      setManagersLoading(false)
      return
    }

    setManagersLoading(true)
    try {
      const data = await restaurantManagerApi.getManagersForRestaurant(selectedRestaurantId)
      // Ignore responses for a restaurant that is no longer selected
      if (managersReqRef.current !== selectedRestaurantId) return
      setManagers(data)
    } catch (err) {
      if (managersReqRef.current !== selectedRestaurantId) return
      logger.error('Error fetching managers:', err)
      setManagersError(err)
    } finally {
      if (managersReqRef.current === selectedRestaurantId) setManagersLoading(false)
    }
  }

  function clearInviteSelection() {
    managersReqRef.current = null
    setInviteRestaurantId('')
    setInviteLink('')
    setManagers([])
    setManagersError(null)
    setManagersLoading(false)
  }

  async function handleRevokeManager(managerId, name) {
    if (!confirm(`Revoke manager access for ${name || 'this user'}?`)) return

    try {
      await restaurantManagerApi.removeManager(managerId)
      setManagers(prev => prev.filter(m => m.id !== managerId))
      toast.success('Manager access revoked')
    } catch (error) {
      logger.error('Error revoking manager:', error)
      toast.error(getUserFacingMessage(error, 'revoking access'))
    }
  }

  // Show loading while checking auth or admin status
  if (authLoading || loading || !adminCheckDone) {
    return <Spinner />
  }

  // Unauthorized (the route is wrapped in ProtectedRoute, so the user is signed in)
  if (!isAdmin) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: 'var(--color-bg)', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
      >
        <PageHeader onBack={goBack} standalone />
        {/* Emoji → title → subtitle → action, all from EmptyState; the h1 is for screen readers */}
        <div className="flex-1 flex items-center justify-center px-4">
          <h1 className="sr-only">Access denied</h1>
          <EmptyState
            emoji="🔒"
            title="Access denied"
            subtitle="You don't have permission to access the admin area."
            action={
              <button onClick={() => navigate('/')} className={PRIMARY_BUTTON_CLASS} style={primaryStyle(false)}>
                Go home
              </button>
            }
          />
        </div>
      </div>
    )
  }

  const inviteQuery = inviteSearch.trim().toLowerCase()
  const filteredRestaurants = inviteQuery
    ? restaurants.filter(r => r.name.toLowerCase().includes(inviteQuery) || (r.address || '').toLowerCase().includes(inviteQuery))
    : restaurants
  const categoryIsUnlisted = category && !ALL_CATEGORIES.some(c => c.id === category)

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--color-bg)', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
    >
      {/* Header */}
      <PageHeader
        title="Admin"
        meta={editingDishId ? 'Edit dish' : 'Add dishes'}
        onBack={goBack}
        standalone
        contained
        actions={editingDishId && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className={SECONDARY_BUTTON_CLASS}
            style={SECONDARY_BUTTON_STYLE}
          >
            Cancel edit
          </button>
        )}
      />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Add / Edit Dish Form */}
        <form onSubmit={handleSubmit} className="rounded-xl p-4 space-y-4" style={CARD_STYLE}>
          {/* Restaurant */}
          <div>
            <label htmlFor="admin-restaurant" className={LABEL_CLASS} style={LABEL_STYLE}>
              Restaurant *
            </label>
            <select
              id="admin-restaurant"
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
              required
            >
              <option value="">Select a restaurant…</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}{r.address ? ` - ${r.address}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Dish Name */}
          <div>
            <label htmlFor="admin-dish-name" className={LABEL_CLASS} style={LABEL_STYLE}>
              Dish name *
            </label>
            <input
              id="admin-dish-name"
              type="text"
              autoComplete="off"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="e.g., Chicken Tendys"
              className={INPUT_CLASS}
              style={INPUT_STYLE}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="admin-category" className={LABEL_CLASS} style={LABEL_STYLE}>
              Category *
            </label>
            <select
              id="admin-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
              required
            >
              <option value="">Select a category…</option>
              {categoryIsUnlisted && <option value={category}>{category}</option>}
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label htmlFor="admin-price" className={LABEL_CLASS} style={LABEL_STYLE}>
              Price ($)
            </label>
            <input
              id="admin-price"
              type="number"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 12.99"
              step="0.01"
              min="0"
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
          </div>

          {/* Photo URL */}
          <div>
            <label htmlFor="admin-photo-url" className={LABEL_CLASS} style={LABEL_STYLE}>
              Photo URL (optional)
            </label>
            <input
              id="admin-photo-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              aria-describedby="admin-photo-url-help"
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
            <p id="admin-photo-url-help" className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Use a Supabase storage or Unsplash link. Other hosts won't display. Leave blank to use the category image.
            </p>
          </div>

          {formError && (
            <p role="alert" className="text-sm" style={{ color: 'var(--color-danger)' }}>{formError}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full ${PRIMARY_BUTTON_CLASS}`}
            style={primaryStyle(submitting)}
          >
            {submitting
              ? (editingDishId ? 'Updating…' : 'Adding…')
              : (editingDishId ? 'Update dish' : 'Add dish')
            }
          </button>
        </form>

        {/* Search Dishes */}
        <section className="mt-8">
          <SectionTitle>Search dishes</SectionTitle>
          <form onSubmit={handleSearch} role="search" className="flex gap-2 mb-3">
            <div className="relative flex-1 min-w-0">
              <label htmlFor="admin-search" className="sr-only">Search dishes</label>
              <svg
                className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-text-tertiary)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="admin-search"
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (!e.target.value.trim()) {
                    setSearchResults([])
                    setLastSearched('')
                  }
                }}
                placeholder="Search by dish name…"
                className={`${INPUT_BASE_CLASS} pl-10 pr-4 py-3`}
                style={PAGE_INPUT_STYLE}
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className={`flex-shrink-0 ${PRIMARY_BUTTON_CLASS}`}
              style={primaryStyle(searching)}
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mb-6">
              <p className="mb-2" style={META_STYLE}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{lastSearched}"
              </p>
              <div className="rounded-xl overflow-hidden" style={CARD_STYLE}>
                {searchResults.map((dish, index) => (
                  <AdminDishRow
                    key={dish.id}
                    dish={dish}
                    isEditing={editingDishId === dish.id}
                    isLast={index === searchResults.length - 1}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
          {lastSearched && !searching && searchResults.length === 0 && (
            <EmptyState emoji="🔍" title={`No dishes match "${lastSearched}"`} />
          )}
        </section>

        {/* Recent Dishes */}
        <section className="mt-8">
          <SectionTitle>Recent dishes</SectionTitle>
          {recentDishes.length > 0 ? (
            <div className="rounded-xl overflow-hidden" style={CARD_STYLE}>
              {recentDishes.map((dish, index) => (
                <AdminDishRow
                  key={dish.id}
                  dish={dish}
                  isEditing={editingDishId === dish.id}
                  isLast={index === recentDishes.length - 1}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No dishes yet" />
          )}
        </section>

        {/* Restaurant Managers Section */}
        <section className="mt-8 pt-8" style={{ borderTop: '1px solid var(--color-divider)' }}>
          <SectionTitle>Restaurant managers</SectionTitle>

          {/* Restaurant selector (searchable) */}
          <div className="mb-4" ref={inviteSearchRef}>
            <label htmlFor="invite-restaurant" className={LABEL_CLASS} style={LABEL_STYLE}>
              Restaurant
            </label>
            <div className="relative">
              <input
                id="invite-restaurant"
                type="text"
                autoComplete="off"
                value={inviteSearch}
                onChange={(e) => {
                  setInviteSearch(e.target.value)
                  setInviteDropdownOpen(true)
                  if (inviteRestaurantId) clearInviteSelection()
                }}
                onFocus={() => setInviteDropdownOpen(true)}
                placeholder="Search restaurants…"
                className={`${INPUT_BASE_CLASS} pl-4 pr-11 py-3`}
                style={PAGE_INPUT_STYLE}
              />
              {inviteRestaurantId && (
                <button
                  type="button"
                  aria-label="Clear restaurant"
                  onClick={() => {
                    clearInviteSelection()
                    setInviteSearch('')
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {inviteDropdownOpen && !inviteRestaurantId && (
                <div
                  className="absolute left-0 top-full z-10 w-full mt-1 max-h-64 overflow-y-auto overscroll-contain rounded-xl"
                  style={{
                    background: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-divider)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  }}
                >
                  {filteredRestaurants.map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => {
                        setInviteRestaurantId(r.id)
                        setInviteSearch(r.name)
                        setInviteDropdownOpen(false)
                        setInviteLink('')
                        setManagers([])
                        fetchManagers(r.id)
                      }}
                      className="w-full text-left px-4 py-3 min-h-[44px] text-sm"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      <span className="font-medium">{r.name}</span>
                      {r.address && (
                        <span className="ml-1" style={{ color: 'var(--color-text-tertiary)' }}>- {r.address}</span>
                      )}
                    </button>
                  ))}
                  {filteredRestaurants.length === 0 && (
                    <p className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                      No restaurants found
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Generate Invite */}
          {inviteRestaurantId && (
            <div className="mb-6">
              <button
                onClick={handleGenerateInvite}
                disabled={generating}
                className={PRIMARY_BUTTON_CLASS}
                style={primaryStyle(generating)}
              >
                {generating ? 'Generating…' : 'Generate invite link'}
              </button>

              {inviteLink && (
                <div className="mt-3 rounded-xl p-4" style={CARD_STYLE}>
                  <label htmlFor="invite-link" className="block mb-1.5" style={META_STYLE}>
                    Invite link (expires in 7 days)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="invite-link"
                      type="text"
                      readOnly
                      value={inviteLink}
                      onFocus={(e) => e.target.select()}
                      className={`flex-1 min-w-0 ${INPUT_CLASS}`}
                      style={INPUT_STYLE}
                    />
                    <button
                      onClick={handleCopyInvite}
                      className={`flex-shrink-0 ${PRIMARY_BUTTON_CLASS}`}
                      style={primaryStyle(false)}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Current Managers */}
          {inviteRestaurantId && (
            <div>
              <SectionTitle as="h3" size={22}>Current managers</SectionTitle>
              {managersLoading ? (
                <div className="space-y-3 animate-pulse" role="status" aria-label="Loading managers">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-16 rounded-xl" style={{ background: 'var(--color-divider)' }} />
                  ))}
                </div>
              ) : managersError ? (
                <div className="py-4">
                  <p role="alert" className="text-sm mb-3" style={{ color: 'var(--color-danger)' }}>
                    {getUserMessage(managersError, 'loading managers')}
                  </p>
                  <button
                    onClick={() => fetchManagers(inviteRestaurantId)}
                    className={PRIMARY_BUTTON_CLASS}
                    style={primaryStyle(false)}
                  >
                    Try again
                  </button>
                </div>
              ) : managers.length > 0 ? (
                <div className="rounded-xl overflow-hidden" style={CARD_STYLE}>
                  {managers.map((mgr, index) => (
                    <div
                      key={mgr.id}
                      className="px-4 py-2 flex items-center justify-between gap-2"
                      style={{ borderBottom: index < managers.length - 1 ? '1px solid var(--color-divider)' : 'none' }}
                    >
                      <div className="flex-1 min-w-0 py-1">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {mgr.profiles?.display_name || 'Unknown'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          {mgr.role} · joined {mgr.accepted_at ? new Date(mgr.accepted_at).toLocaleDateString() : 'pending'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRevokeManager(mgr.id, mgr.profiles?.display_name)}
                        className={`${ROW_ACTION_CLASS} -mr-3 flex-shrink-0`}
                        style={{ color: 'var(--color-danger)' }}
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No managers assigned yet" />
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
