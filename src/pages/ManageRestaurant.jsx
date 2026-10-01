import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useRestaurantManager } from '../hooks/useRestaurantManager'
import { restaurantManagerApi } from '../api/restaurantManagerApi'
import { logger } from '../utils/logger'
import { getUserMessage, getUserFacingMessage } from '../utils/errorHandler'
import { EmptyState } from '../components/EmptyState'
import { SpecialsManager, DishesManager, EventsManager, RestaurantInfoEditor } from '../components/restaurant-admin'
import { PageHeader } from '../components/PageHeader'
import { AMATIC_TITLE, PRIMARY_BUTTON_CLASS, PRIMARY_BUTTON_STYLE } from '../constants/styles'

const TABS = [
  { id: 'specials', label: 'Specials' },
  { id: 'events', label: 'Events' },
  { id: 'menu', label: 'Menu' },
  { id: 'info', label: 'Info' },
]

function sortDishes(list) {
  return list.slice().sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name))
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

export function ManageRestaurant() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, loading: authLoading } = useAuth()
  const {
    isManager,
    restaurant,
    loading: managerLoading,
    error: managerError,
    refetch: refetchManager,
  } = useRestaurantManager()

  const [activeTab, setActiveTab] = useState('specials')
  const [specials, setSpecials] = useState([])
  const [dishes, setDishes] = useState([])
  const [events, setEvents] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))

  // Fetch restaurant data when we know the restaurant
  useEffect(() => {
    if (!restaurant?.id) return

    let cancelled = false

    async function fetchData() {
      setDataLoading(true)
      setLoadError(null)
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
        setLoadError(error)
      } finally {
        if (!cancelled) setDataLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [restaurant?.id, reloadKey])

  // Every handler resolves to true on success, false on failure (never rethrows),
  // so child forms only reset when the save actually landed.

  // Specials handlers
  async function handleAddSpecial(params) {
    try {
      const newSpecial = await restaurantManagerApi.createSpecial(params)
      setSpecials(prev => [newSpecial, ...prev])
      toast.success('Special added')
      return true
    } catch (error) {
      logger.error('Error adding special:', error)
      toast.error(getUserFacingMessage(error, 'adding the special'))
      return false
    }
  }

  async function handleUpdateSpecial(id, updates) {
    try {
      const updated = await restaurantManagerApi.updateSpecial(id, updates)
      setSpecials(prev => prev.map(s => s.id === id ? updated : s))
      toast.success('Special updated')
      return true
    } catch (error) {
      logger.error('Error updating special:', error)
      toast.error(getUserFacingMessage(error, 'updating the special'))
      return false
    }
  }

  async function handleDeactivateSpecial(id) {
    try {
      const updated = await restaurantManagerApi.deactivateSpecial(id)
      setSpecials(prev => prev.map(s => s.id === id ? updated : s))
      toast.success('Special deactivated')
      return true
    } catch (error) {
      logger.error('Error deactivating special:', error)
      toast.error(getUserFacingMessage(error, 'deactivating the special'))
      return false
    }
  }

  // Dishes handlers
  async function handleAddDish(params) {
    try {
      const newDish = await restaurantManagerApi.addDish(params)
      setDishes(prev => sortDishes([...prev, newDish]))
      toast.success('Dish added')
      return true
    } catch (error) {
      logger.error('Error adding dish:', error)
      toast.error(getUserFacingMessage(error, 'adding the dish'))
      return false
    }
  }

  async function handleUpdateDish(dishId, updates) {
    try {
      const updated = await restaurantManagerApi.updateDish(dishId, updates)
      setDishes(prev => prev.map(d => d.id === dishId ? updated : d))
      toast.success('Dish updated')
      return true
    } catch (error) {
      logger.error('Error updating dish:', error)
      toast.error(getUserFacingMessage(error, 'updating the dish'))
      return false
    }
  }

  async function handleBulkAddDishes(dishesArray) {
    try {
      const newDishes = await restaurantManagerApi.bulkAddDishes(restaurant.id, dishesArray)
      setDishes(prev => sortDishes([...prev, ...newDishes]))
      toast.success(`${newDishes.length} ${newDishes.length === 1 ? 'dish' : 'dishes'} added`)
      return true
    } catch (error) {
      logger.error('Error bulk adding dishes:', error)
      toast.error(getUserFacingMessage(error, 'adding dishes'))
      return false
    }
  }

  async function handleDeleteDish(dishId) {
    try {
      await restaurantManagerApi.deleteDish(dishId)
      setDishes(prev => prev.filter(d => d.id !== dishId))
      toast.success('Dish removed')
      return true
    } catch (error) {
      logger.error('Error deleting dish:', error)
      toast.error(getUserFacingMessage(error, 'removing the dish'))
      return false
    }
  }

  // Restaurant info handler — write the saved row back into the manager cache so
  // the editor (and anything else reading useRestaurantManager) sees fresh values.
  async function handleUpdateInfo(updates) {
    try {
      const updated = await restaurantManagerApi.updateRestaurantInfo(restaurant.id, updates)
      queryClient.setQueryData(['restaurantManager', user?.id], old =>
        old ? { ...old, restaurant: { ...old.restaurant, ...updated } } : old
      )
      toast.success('Restaurant info updated')
      return true
    } catch (error) {
      logger.error('Error updating restaurant info:', error)
      toast.error(getUserFacingMessage(error, 'updating restaurant info'))
      return false
    }
  }

  // Events handlers
  async function handleAddEvent(params) {
    try {
      const newEvent = await restaurantManagerApi.createEvent(params)
      setEvents(prev => [newEvent, ...prev])
      toast.success('Event added')
      return true
    } catch (error) {
      logger.error('Error adding event:', error)
      toast.error(getUserFacingMessage(error, 'adding the event'))
      return false
    }
  }

  async function handleUpdateEvent(id, updates) {
    try {
      const updated = await restaurantManagerApi.updateEvent(id, updates)
      setEvents(prev => prev.map(e => e.id === id ? updated : e))
      toast.success('Event updated')
      return true
    } catch (error) {
      logger.error('Error updating event:', error)
      toast.error(getUserFacingMessage(error, 'updating the event'))
      return false
    }
  }

  async function handleDeactivateEvent(id) {
    try {
      const updated = await restaurantManagerApi.deactivateEvent(id)
      setEvents(prev => prev.map(e => e.id === id ? updated : e))
      toast.success('Event deactivated')
      return true
    } catch (error) {
      logger.error('Error deactivating event:', error)
      toast.error(getUserFacingMessage(error, 'deactivating the event'))
      return false
    }
  }

  function handleTabKeyDown(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const index = TABS.findIndex(t => t.id === activeTab)
    const step = e.key === 'ArrowRight' ? 1 : -1
    const next = TABS[(index + step + TABS.length) % TABS.length].id
    setActiveTab(next)
    requestAnimationFrame(() => {
      document.getElementById(`manage-tab-${next}`)?.focus()
    })
  }

  // Loading states
  if (authLoading || managerLoading) {
    return <Spinner />
  }

  const standaloneStyle = {
    background: 'var(--color-bg)',
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
  }

  // Couldn't determine manager status (offline, server error) — don't claim "access denied"
  if (managerError && !isManager) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center" style={standaloneStyle}>
        <h1 className="mb-3" style={{ ...AMATIC_TITLE, fontSize: '32px' }}>Manage restaurant</h1>
        <p role="alert" className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>
          {managerError.message}
        </p>
        <button onClick={() => refetchManager()} className={PRIMARY_BUTTON_CLASS} style={PRIMARY_BUTTON_STYLE}>
          Try again
        </button>
      </div>
    )
  }

  // Access denied
  if (!isManager) {
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
            subtitle="You don't have permission to manage a restaurant. Ask an admin for an invite link."
            action={
              <button onClick={() => navigate('/')} className={PRIMARY_BUTTON_CLASS} style={PRIMARY_BUTTON_STYLE}>
                Go home
              </button>
            }
          />
        </div>
      </div>
    )
  }

  const activeSpecialsCount = specials.filter(s => s.is_active).length
  const activeEventsCount = events.filter(e => e.is_active).length
  const tabCounts = dataLoading || loadError
    ? {}
    : { specials: activeSpecialsCount, events: activeEventsCount, menu: dishes.length }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--color-bg)', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
    >
      {/* Header */}
      <PageHeader title={restaurant.name} meta="Restaurant Manager" onBack={goBack} standalone contained />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Manage restaurant"
          className="flex rounded-xl p-1 mb-4"
          style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-divider)' }}
          onKeyDown={handleTabKeyDown}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id
            const count = tabCounts[tab.id]
            return (
              <button
                key={tab.id}
                role="tab"
                id={`manage-tab-${tab.id}`}
                aria-selected={active}
                aria-controls={`manage-panel-${tab.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 min-h-[44px] py-2.5 text-sm font-semibold rounded-lg whitespace-nowrap transition-all"
                style={{
                  background: active ? 'var(--color-primary)' : 'transparent',
                  color: active ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span className="ml-1 text-[11px]" style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {dataLoading ? (
          <div className="space-y-3 animate-pulse" role="status" aria-label="Loading restaurant data">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl" style={{ background: 'var(--color-divider)' }} />
            ))}
          </div>
        ) : loadError ? (
          <div className="py-8 text-center">
            <p role="alert" className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>
              {getUserMessage(loadError, 'loading your restaurant data')}
            </p>
            <button
              onClick={() => setReloadKey(k => k + 1)}
              className={PRIMARY_BUTTON_CLASS}
              style={PRIMARY_BUTTON_STYLE}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* All panels stay mounted so in-progress forms and imports survive tab switches */}
            <div role="tabpanel" id="manage-panel-specials" aria-labelledby="manage-tab-specials" hidden={activeTab !== 'specials'}>
              <SpecialsManager
                restaurantId={restaurant.id}
                specials={specials}
                onAdd={handleAddSpecial}
                onUpdate={handleUpdateSpecial}
                onDeactivate={handleDeactivateSpecial}
              />
            </div>
            <div role="tabpanel" id="manage-panel-events" aria-labelledby="manage-tab-events" hidden={activeTab !== 'events'}>
              <EventsManager
                restaurantId={restaurant.id}
                events={events}
                onAdd={handleAddEvent}
                onUpdate={handleUpdateEvent}
                onDeactivate={handleDeactivateEvent}
              />
            </div>
            <div role="tabpanel" id="manage-panel-menu" aria-labelledby="manage-tab-menu" hidden={activeTab !== 'menu'}>
              <DishesManager
                restaurantId={restaurant.id}
                dishes={dishes}
                onAdd={handleAddDish}
                onUpdate={handleUpdateDish}
                onDelete={handleDeleteDish}
                onBulkAdd={handleBulkAddDishes}
                restaurantName={restaurant.name}
              />
            </div>
            <div role="tabpanel" id="manage-panel-info" aria-labelledby="manage-tab-info" hidden={activeTab !== 'info'}>
              <RestaurantInfoEditor
                restaurant={restaurant}
                onUpdate={handleUpdateInfo}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
