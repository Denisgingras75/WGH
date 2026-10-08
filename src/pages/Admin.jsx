import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logger } from '../utils/logger'
import { restaurantsApi } from '../api/restaurantsApi'
import { adminApi } from '../api/adminApi'
import { restaurantManagerApi } from '../api/restaurantManagerApi'
import { ALL_CATEGORIES } from '../constants/categories'

const INPUT_STYLE = {
  background: 'var(--color-surface-elevated)',
  border: 'var(--border-ink)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)',
  fontSize: '16px',
}
const ROW_STYLE = {
  background: 'var(--color-card)',
  border: 'var(--border-ink-thin)',
  borderRadius: 'var(--radius-md)',
}
const PILL_BTN_STYLE = {
  background: 'var(--color-card)',
  border: 'var(--border-ink-thin)',
  borderRadius: 'var(--radius-pill)',
  fontWeight: 700,
}
const LABEL_STYLE = { color: 'var(--color-text-secondary)', fontWeight: 700 }

export function Admin() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [recentDishes, setRecentDishes] = useState([])

  // Admin status from database (matches RLS)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckDone, setAdminCheckDone] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  // Edit mode state
  const [editingDishId, setEditingDishId] = useState(null)

  // Restaurant manager state
  const [inviteRestaurantId, setInviteRestaurantId] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const inviteInputRef = useRef(null)
  const [managers, setManagers] = useState([])
  const [managersLoading, setManagersLoading] = useState(false)
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

  async function fetchRestaurants() {
    try {
      const data = await restaurantsApi.getOpen()
      setRestaurants(data)
    } catch (error) {
      logger.error('Error fetching restaurants:', error)
      setMessage({ type: 'error', text: 'Failed to load restaurants' })
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
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const results = await adminApi.searchDishes(searchQuery)
      setSearchResults(results)
    } catch (error) {
      logger.error('Error searching dishes:', error)
      setMessage({ type: 'error', text: 'Search failed' })
    } finally {
      setSearching(false)
    }
  }

  function handleEdit(dish) {
    setEditingDishId(dish.id)
    setRestaurantId(dish.restaurant_id)
    setDishName(dish.name)
    setCategory(dish.category)
    setPrice(dish.price ? String(dish.price) : '')
    setPhotoUrl(dish.photo_url || '')
    // Scroll to form
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }

  function handleCancelEdit() {
    setEditingDishId(null)
    setRestaurantId('')
    setDishName('')
    setCategory('')
    setPrice('')
    setPhotoUrl('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!restaurantId || !dishName || !category) {
      setMessage({ type: 'error', text: 'Please fill in restaurant, dish name, and category' })
      return
    }

    // Validate price is a valid number if provided
    if (price && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
      setMessage({ type: 'error', text: 'Please enter a valid price (positive number)' })
      return
    }

    // Validate photo URL format if provided
    if (photoUrl) {
      try {
        const url = new URL(photoUrl)
        if (!['http:', 'https:'].includes(url.protocol)) {
          setMessage({ type: 'error', text: 'Photo URL must use http or https protocol' })
          return
        }
      } catch {
        setMessage({ type: 'error', text: 'Please enter a valid photo URL' })
        return
      }
    }

    setSubmitting(true)
    setMessage(null)

    try {
      if (editingDishId) {
        // Update existing dish
        await adminApi.updateDish(editingDishId, {
          restaurantId,
          name: dishName,
          category,
          price: price ? parseFloat(price) : null,
          photoUrl,
        })
        setMessage({ type: 'success', text: `Updated "${dishName}" successfully!` })
        setEditingDishId(null)
      } else {
        // Add new dish
        await adminApi.addDish({
          restaurantId,
          name: dishName,
          category,
          price: price ? parseFloat(price) : null,
          photoUrl,
        })
        setMessage({ type: 'success', text: `Added "${dishName}" successfully!` })
      }
      // Reset form
      setRestaurantId('')
      setDishName('')
      setCategory('')
      setPrice('')
      setPhotoUrl('')
      // Refresh lists
      fetchRecentDishes()
      if (searchQuery) {
        const results = await adminApi.searchDishes(searchQuery)
        setSearchResults(results)
      }
    } catch (error) {
      logger.error('Error saving dish:', error)
      setMessage({ type: 'error', text: `Failed to save dish: ${error.message}` })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(dishId, deletedDishName) {
    if (!confirm(`Delete "${deletedDishName}"? This cannot be undone.`)) return

    try {
      await adminApi.deleteDish(dishId)
      setMessage({ type: 'success', text: `Deleted "${deletedDishName}"` })
      fetchRecentDishes()
      // Also refresh search results if searching
      if (searchQuery) {
        const results = await adminApi.searchDishes(searchQuery)
        setSearchResults(results)
      }
      // Clear edit mode if deleting the dish being edited
      if (editingDishId === dishId) {
        handleCancelEdit()
      }
    } catch (error) {
      logger.error('Error deleting dish:', error)
      setMessage({ type: 'error', text: `Failed to delete: ${error.message}` })
    }
  }

  async function handleGenerateInvite() {
    if (!inviteRestaurantId) {
      setMessage({ type: 'error', text: 'Select a restaurant first' })
      return
    }

    try {
      const { token } = await restaurantManagerApi.createInvite(inviteRestaurantId)
      const link = `${window.location.origin}/invite/${token}`
      setInviteLink(link)
      setMessage({ type: 'success', text: 'Invite link generated!' })
    } catch (error) {
      logger.error('Error generating invite:', error)
      setMessage({ type: 'error', text: `Failed to generate invite: ${error.message}` })
    }
  }

  async function fetchManagers(selectedRestaurantId) {
    if (!selectedRestaurantId) {
      setManagers([])
      return
    }

    setManagersLoading(true)
    try {
      const data = await restaurantManagerApi.getManagersForRestaurant(selectedRestaurantId)
      setManagers(data)
    } catch (err) {
      logger.error('Error fetching managers:', err)
    } finally {
      setManagersLoading(false)
    }
  }

  async function handleRevokeManager(managerId, name) {
    if (!confirm(`Revoke manager access for ${name || 'this user'}?`)) return

    try {
      await restaurantManagerApi.removeManager(managerId)
      setManagers(prev => prev.filter(m => m.id !== managerId))
      setMessage({ type: 'success', text: 'Manager access revoked' })
    } catch (error) {
      logger.error('Error revoking manager:', error)
      setMessage({ type: 'error', text: `Failed to revoke: ${error.message}` })
    }
  }

  // Show loading while checking auth or admin status
  if (authLoading || loading || !adminCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--color-ink)' }}></div>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Unauthorized - not logged in or not an admin
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'var(--color-butter)', border: 'var(--border-ink)', boxShadow: 'var(--shadow-hard-sm)' }}>
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="mb-2" style={{ fontSize: '28px', color: 'var(--color-text-primary)' }}>
            Access Denied
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {!user
              ? "You need to be logged in to access this page."
              : "You don't have permission to access the admin area."
            }
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-ink px-6 py-3"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header className="px-4 py-4" style={{ background: 'var(--color-bg)', borderBottom: 'var(--border-ink)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="sticker-press w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-ink)', border: 'var(--border-ink)', boxShadow: 'var(--shadow-hard-sm)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 style={{ fontSize: '24px', lineHeight: 1.1, color: 'var(--color-text-primary)' }}>
              Admin - {editingDishId ? 'Edit Dish' : 'Add Dishes'}
            </h1>
          </div>
          {editingDishId && (
            <button
              onClick={handleCancelEdit}
              className="btn-ink px-3 py-1.5 text-sm"
              style={{ background: 'var(--color-card)', color: 'var(--color-ink)' }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Message */}
        {message && (
          <div
            className="mb-4 p-3 text-sm"
            style={message.type === 'error'
              ? { background: 'var(--color-danger-muted)', color: 'var(--color-danger)', border: '1.5px solid var(--color-danger)', borderRadius: 'var(--radius-md)', fontWeight: 700 }
              : { background: 'var(--color-success-muted)', color: 'var(--color-success)', border: '1.5px solid var(--color-success)', borderRadius: 'var(--radius-md)', fontWeight: 700 }
            }
          >
            {message.text}
          </div>
        )}

        {/* Add Dish Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Restaurant */}
          <div>
            <label className="block text-sm mb-1.5" style={LABEL_STYLE}>
              Restaurant *
            </label>
            <select
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className="w-full px-3 py-2"
              style={INPUT_STYLE}
              required
            >
              <option value="">Select a restaurant...</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} - {r.address}
                </option>
              ))}
            </select>
          </div>

          {/* Dish Name */}
          <div>
            <label className="block text-sm mb-1.5" style={LABEL_STYLE}>
              Dish Name *
            </label>
            <input
              type="text"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="e.g., Chicken Tendys"
              className="w-full px-3 py-2"
              style={INPUT_STYLE}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm mb-1.5" style={LABEL_STYLE}>
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2"
              style={INPUT_STYLE}
              required
            >
              <option value="">Select a category...</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm mb-1.5" style={LABEL_STYLE}>
              Price ($)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 12.99"
              step="0.01"
              min="0"
              className="w-full px-3 py-2"
              style={INPUT_STYLE}
            />
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-sm mb-1.5" style={LABEL_STYLE}>
              Photo URL (optional)
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2"
              style={INPUT_STYLE}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
              Leave blank to use category default image
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-ink w-full py-3"
            style={{ background: editingDishId ? 'var(--color-green-dark)' : 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          >
            {submitting
              ? (editingDishId ? 'Updating...' : 'Adding...')
              : (editingDishId ? 'Update Dish' : 'Add Dish')
            }
          </button>
        </form>

        {/* Search Dishes */}
        <div className="mt-8">
          <h2 className="mb-3" style={{ fontSize: '22px', color: 'var(--color-text-primary)' }}>
            Search Dishes
          </h2>
          <form onSubmit={handleSearch} className="flex gap-2 mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by dish name..."
              className="flex-1 min-w-0 px-3 py-2"
              style={INPUT_STYLE}
            />
            <button
              type="submit"
              disabled={searching}
              className="btn-ink px-4 py-2 text-sm"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
            >
              {searching ? '...' : 'Search'}
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 mb-6">
              <p className="eyebrow">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </p>
              {searchResults.map((dish) => (
                <div
                  key={dish.id}
                  className="flex items-center justify-between p-3"
                  style={{
                    ...ROW_STYLE,
                    boxShadow: editingDishId === dish.id ? '0 0 0 2px var(--color-success)' : 'none',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                      {dish.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      {dish.restaurants?.name} · {dish.category} {dish.price ? `· $${dish.price}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => handleEdit(dish)}
                      className="text-xs px-2.5 py-1" style={{ ...PILL_BTN_STYLE, color: 'var(--color-accent)' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(dish.id, dish.name)}
                      className="text-xs px-2.5 py-1" style={{ ...PILL_BTN_STYLE, color: 'var(--color-danger)' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {searchQuery && searchResults.length === 0 && !searching && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
              No dishes found for "{searchQuery}"
            </p>
          )}
        </div>

        {/* Recent Dishes */}
        <div className="mt-8">
          <h2 className="mb-3" style={{ fontSize: '22px', color: 'var(--color-text-primary)' }}>
            Recent Dishes
          </h2>
          <div className="space-y-2">
            {recentDishes.map((dish) => (
              <div
                key={dish.id}
                className="flex items-center justify-between p-3"
                style={{
                  ...ROW_STYLE,
                  boxShadow: editingDishId === dish.id ? '0 0 0 2px var(--color-success)' : 'none',
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                    {dish.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    {dish.restaurants?.name} · {dish.category} {dish.price ? `· $${dish.price}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => handleEdit(dish)}
                    className="text-xs px-2.5 py-1" style={{ ...PILL_BTN_STYLE, color: 'var(--color-accent)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(dish.id, dish.name)}
                    className="text-xs px-2.5 py-1" style={{ ...PILL_BTN_STYLE, color: 'var(--color-danger)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {recentDishes.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
                No dishes yet
              </p>
            )}
          </div>
        </div>

        {/* Restaurant Managers Section */}
        <div className="mt-8 pt-8" style={{ borderTop: 'var(--border-ink)' }}>
          <h2 className="mb-4" style={{ fontSize: '22px', color: 'var(--color-text-primary)' }}>
            Restaurant Managers
          </h2>

          {/* Restaurant selector (searchable) */}
          <div className="mb-4 relative" ref={inviteSearchRef}>
            <label className="block text-sm mb-1.5" style={LABEL_STYLE}>
              Restaurant
            </label>
            <input
              type="text"
              value={inviteSearch}
              onChange={(e) => {
                setInviteSearch(e.target.value)
                setInviteDropdownOpen(true)
                if (inviteRestaurantId) {
                  setInviteRestaurantId('')
                  setInviteLink('')
                  setManagers([])
                }
              }}
              onFocus={() => setInviteDropdownOpen(true)}
              placeholder="Search restaurants..."
              className="w-full px-3 py-2"
              style={INPUT_STYLE}
            />
            {inviteRestaurantId && (
              <button
                onClick={() => {
                  setInviteRestaurantId('')
                  setInviteSearch('')
                  setInviteLink('')
                  setManagers([])
                }}
                className="absolute right-3 top-[40px] text-sm px-1"
                style={{ color: 'var(--color-ink)', fontWeight: 800 }}
              >
                ✕
              </button>
            )}
            {inviteDropdownOpen && !inviteRestaurantId && (
              <div
                className="absolute z-10 w-full mt-2 max-h-48 overflow-y-auto"
                style={{ background: 'var(--color-card)', border: 'var(--border-ink)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-hard)' }}
              >
                {restaurants
                  .filter((r) => {
                    if (!inviteSearch.trim()) return true
                    const q = inviteSearch.toLowerCase()
                    return r.name.toLowerCase().includes(q) || (r.address || '').toLowerCase().includes(q)
                  })
                  .map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setInviteRestaurantId(r.id)
                        setInviteSearch(r.name)
                        setInviteDropdownOpen(false)
                        setInviteLink('')
                        fetchManagers(r.id)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[color:var(--color-card-hover)] transition-colors"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      <span style={{ fontWeight: 700 }}>{r.name}</span>
                      <span className="ml-1" style={{ color: 'var(--color-text-tertiary)' }}>- {r.address}</span>
                    </button>
                  ))}
                {restaurants.filter((r) => {
                  if (!inviteSearch.trim()) return true
                  const q = inviteSearch.toLowerCase()
                  return r.name.toLowerCase().includes(q) || (r.address || '').toLowerCase().includes(q)
                }).length === 0 && (
                  <p className="px-3 py-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                    No restaurants found
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Generate Invite */}
          {inviteRestaurantId && (
            <div className="mb-4">
              <button
                onClick={handleGenerateInvite}
                className="btn-ink px-4 py-2 text-sm"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
              >
                Generate Invite Link
              </button>

              {inviteLink && (
                <div className="mt-3 p-3" style={{ background: 'var(--color-butter-muted)', border: 'var(--border-ink)', borderRadius: 'var(--radius-md)' }}>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                    Invite Link (expires in 7 days):
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      ref={inviteInputRef}
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="flex-1 min-w-0 px-2 py-1 text-xs"
                      style={{ background: 'var(--color-surface-elevated)', border: 'var(--border-ink-thin)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-primary)' }}
                    />
                    <button
                      onClick={() => {
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
                        try {
                          document.execCommand('copy')
                          setMessage({ type: 'success', text: 'Link copied!' })
                        } catch {
                          setMessage({ type: 'error', text: 'Copy failed — please select and copy manually' })
                        }
                        document.body.removeChild(ta)
                      }}
                      className="btn-ink px-3 py-1 text-xs"
                      style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', boxShadow: 'var(--shadow-hard-sm)' }}
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
              <h3 className="eyebrow mb-2">
                Current Managers
              </h3>
              {managersLoading ? (
                <p className="text-sm py-2" style={{ color: 'var(--color-text-tertiary)' }}>Loading...</p>
              ) : managers.length > 0 ? (
                <div className="space-y-2">
                  {managers.map((mgr) => (
                    <div
                      key={mgr.id}
                      className="flex items-center justify-between p-3"
                      style={ROW_STYLE}
                    >
                      <div>
                        <p className="text-sm" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                          {mgr.profiles?.display_name || 'Unknown'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          {mgr.role} · joined {mgr.accepted_at ? new Date(mgr.accepted_at).toLocaleDateString() : 'pending'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRevokeManager(mgr.id, mgr.profiles?.display_name)}
                        className="text-xs px-2.5 py-1" style={{ ...PILL_BTN_STYLE, color: 'var(--color-danger)' }}
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm py-2" style={{ color: 'var(--color-text-tertiary)' }}>
                  No managers assigned yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
