import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRestaurantManager } from '../hooks/useRestaurantManager'
import { restaurantManagerApi } from '../api/restaurantManagerApi'
import { logger } from '../utils/logger'
import { SpecialsManager, DishesManager, EventsManager, RestaurantInfoEditor } from '../components/restaurant-admin'

export function ManageRestaurant() {
  const navigate = useNavigate()
  const { loading: authLoading } = useAuth()
  const { isManager, restaurant, loading: managerLoading } = useRestaurantManager()

  const [activeTab, setActiveTab] = useState('specials')
  const [specials, setSpecials] = useState([])
  const [dishes, setDishes] = useState([])
  const [events, setEvents] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [message, setMessage] = useState(null)

  // Fetch restaurant data when we know the restaurant
  useEffect(() => {
    if (!restaurant?.id) return

    let cancelled = false

    async function fetchData() {
      setDataLoading(true)
      try {
        const [specialsData, dishesData, eventsData] = await Promise.all([
          restaurantManagerApi.getRestaurantSpecials(restaurant.id),
          restaurantManagerApi.getRestaurantDishes(restaurant.id),
          restaurantManagerApi.getRestaurantEvents(restaurant.id),
        ])
        if (cancelled) return
        setSpecials(specialsData)
        setDishes(dishesData)
        setEvents(eventsData)
      } catch (error) {
        if (cancelled) return
        logger.error('Error fetching restaurant data:', error)
        setMessage({ type: 'error', text: 'Failed to load restaurant data' })
      } finally {
        if (!cancelled) setDataLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [restaurant?.id])

  // Specials handlers
  async function handleAddSpecial(params) {
    try {
      const newSpecial = await restaurantManagerApi.createSpecial(params)
      setSpecials(prev => [newSpecial, ...prev])
      setMessage({ type: 'success', text: 'Special added!' })
    } catch (error) {
      logger.error('Error adding special:', error)
      setMessage({ type: 'error', text: `Failed to add special: ${error.message}` })
    }
  }

  async function handleUpdateSpecial(id, updates) {
    try {
      const updated = await restaurantManagerApi.updateSpecial(id, updates)
      setSpecials(prev => prev.map(s => s.id === id ? updated : s))
      setMessage({ type: 'success', text: 'Special updated!' })
    } catch (error) {
      logger.error('Error updating special:', error)
      setMessage({ type: 'error', text: `Failed to update: ${error.message}` })
    }
  }

  async function handleDeactivateSpecial(id) {
    try {
      const updated = await restaurantManagerApi.deactivateSpecial(id)
      setSpecials(prev => prev.map(s => s.id === id ? updated : s))
      setMessage({ type: 'success', text: 'Special deactivated' })
    } catch (error) {
      logger.error('Error deactivating special:', error)
      setMessage({ type: 'error', text: `Failed to deactivate: ${error.message}` })
    }
  }

  // Dishes handlers
  async function handleAddDish(params) {
    try {
      const newDish = await restaurantManagerApi.addDish(params)
      setDishes(prev => [...prev, newDish].slice().sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name)))
      setMessage({ type: 'success', text: 'Dish added!' })
    } catch (error) {
      logger.error('Error adding dish:', error)
      setMessage({ type: 'error', text: `Failed to add dish: ${error.message}` })
    }
  }

  async function handleUpdateDish(dishId, updates) {
    try {
      const updated = await restaurantManagerApi.updateDish(dishId, updates)
      setDishes(prev => prev.map(d => d.id === dishId ? updated : d))
      setMessage({ type: 'success', text: 'Dish updated!' })
    } catch (error) {
      logger.error('Error updating dish:', error)
      setMessage({ type: 'error', text: `Failed to update: ${error.message}` })
    }
  }

  // Bulk add dishes handler
  async function handleBulkAddDishes(dishesArray) {
    try {
      const newDishes = await restaurantManagerApi.bulkAddDishes(restaurant.id, dishesArray)
      setDishes(prev => [...prev, ...newDishes].slice().sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name)))
      setMessage({ type: 'success', text: `${newDishes.length} dishes added!` })
    } catch (error) {
      logger.error('Error bulk adding dishes:', error)
      setMessage({ type: 'error', text: `Failed to add dishes: ${error.message}` })
    }
  }

  // Delete dish handler
  async function handleDeleteDish(dishId) {
    try {
      await restaurantManagerApi.deleteDish(dishId)
      setDishes(prev => prev.filter(d => d.id !== dishId))
      setMessage({ type: 'success', text: 'Dish removed' })
    } catch (error) {
      logger.error('Error deleting dish:', error)
      setMessage({ type: 'error', text: `Failed to remove dish: ${error.message}` })
    }
  }

  // Restaurant info handler
  async function handleUpdateInfo(updates) {
    try {
      await restaurantManagerApi.updateRestaurantInfo(restaurant.id, updates)
      setMessage({ type: 'success', text: 'Restaurant info updated!' })
    } catch (error) {
      logger.error('Error updating restaurant info:', error)
      setMessage({ type: 'error', text: `Failed to update: ${error.message}` })
    }
  }

  // Events handlers
  async function handleAddEvent(params) {
    try {
      const newEvent = await restaurantManagerApi.createEvent(params)
      setEvents(prev => [newEvent, ...prev])
      setMessage({ type: 'success', text: 'Event added!' })
    } catch (error) {
      logger.error('Error adding event:', error)
      setMessage({ type: 'error', text: `Failed to add event: ${error.message}` })
    }
  }

  async function handleUpdateEvent(id, updates) {
    try {
      const updated = await restaurantManagerApi.updateEvent(id, updates)
      setEvents(prev => prev.map(e => e.id === id ? updated : e))
      setMessage({ type: 'success', text: 'Event updated!' })
    } catch (error) {
      logger.error('Error updating event:', error)
      setMessage({ type: 'error', text: `Failed to update: ${error.message}` })
    }
  }

  async function handleDeactivateEvent(id) {
    try {
      const updated = await restaurantManagerApi.deactivateEvent(id)
      setEvents(prev => prev.map(e => e.id === id ? updated : e))
      setMessage({ type: 'success', text: 'Event deactivated' })
    } catch (error) {
      logger.error('Error deactivating event:', error)
      setMessage({ type: 'error', text: `Failed to deactivate: ${error.message}` })
    }
  }

  // Loading states
  if (authLoading || managerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--color-ink)' }} />
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Access denied
  if (!isManager) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'var(--color-highlight)', border: 'var(--border-default)', boxShadow: 'var(--shadow-card)' }}>
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="mb-2" style={{ fontSize: '28px', color: 'var(--color-text-primary)' }}>
            Access Denied
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            You don't have permission to manage a restaurant. Ask an admin for an invite link.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn px-6 py-3"
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
      <header className="px-4 py-4" style={{ background: 'var(--color-bg)', borderBottom: 'var(--border-default)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="press w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-ink)', border: 'var(--border-default)', boxShadow: 'var(--shadow-card)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <p className="eyebrow">Restaurant Manager</p>
            <h1 style={{ fontSize: '24px', lineHeight: 1.1, color: 'var(--color-text-primary)' }}>
              {restaurant.name}
            </h1>
          </div>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className="mx-4 mt-4">
          <div
            className="p-3 text-sm"
            style={message.type === 'error'
              ? { background: 'var(--color-danger-muted)', color: 'var(--color-danger)', border: '1.5px solid var(--color-danger)', borderRadius: 'var(--radius-md)', fontWeight: 700 }
              : { background: 'var(--color-success-muted)', color: 'var(--color-success)', border: '1.5px solid var(--color-success)', borderRadius: 'var(--radius-md)', fontWeight: 700 }
            }
          >
            {message.text}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 pt-4">
        <div
          className="flex p-1 mb-4"
          style={{
            background: 'var(--color-card)',
            border: 'var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {['specials', 'events', 'menu', 'info'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 px-1 whitespace-nowrap transition-all"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                background: activeTab === tab ? 'var(--color-ink)' : 'transparent',
                color: activeTab === tab ? 'var(--color-bg)' : 'var(--color-text-secondary)',
              }}
            >
              {tab === 'specials' ? `Specials${!dataLoading && specials.filter(s => s.is_active).length ? ` (${specials.filter(s => s.is_active).length})` : ''}` : tab === 'events' ? `Events${!dataLoading && events.filter(e => e.is_active).length ? ` (${events.filter(e => e.is_active).length})` : ''}` : tab === 'menu' ? `Menu${!dataLoading && dishes.length ? ` (${dishes.length})` : ''}` : 'Info'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4">
        {dataLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : activeTab === 'specials' ? (
          <SpecialsManager
            restaurantId={restaurant.id}
            specials={specials}
            onAdd={handleAddSpecial}
            onUpdate={handleUpdateSpecial}
            onDeactivate={handleDeactivateSpecial}
          />
        ) : activeTab === 'events' ? (
          <EventsManager
            restaurantId={restaurant.id}
            events={events}
            onAdd={handleAddEvent}
            onUpdate={handleUpdateEvent}
            onDeactivate={handleDeactivateEvent}
          />
        ) : activeTab === 'menu' ? (
          <DishesManager
            restaurantId={restaurant.id}
            dishes={dishes}
            onAdd={handleAddDish}
            onUpdate={handleUpdateDish}
            onDelete={handleDeleteDish}
            onBulkAdd={handleBulkAddDishes}
            restaurantName={restaurant.name}
          />
        ) : (
          <RestaurantInfoEditor
            restaurant={restaurant}
            onUpdate={handleUpdateInfo}
          />
        )}
      </div>
    </div>
  )
}
