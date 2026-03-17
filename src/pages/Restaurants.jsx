import { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { capture } from '../lib/analytics'
import { useAuth } from '../context/AuthContext'
import { useLocationContext } from '../context/LocationContext'
import { useRestaurants } from '../hooks/useRestaurants'
import { useNearbyPlaces } from '../hooks/useNearbyPlaces'
import { RadiusSheet } from '../components/LocationPicker'
import { LocationBanner } from '../components/LocationBanner'
import { AddRestaurantModal } from '../components/AddRestaurantModal'
import { placesApi } from '../api/placesApi'
import { logger } from '../utils/logger'
import { MagnifyingGlass, CaretDown, Plus } from '@phosphor-icons/react'

var RestaurantMap = lazy(function () {
  return import('../components/restaurants/RestaurantMap').then(function (m) {
    return { default: m.RestaurantMap }
  })
})

export function Restaurants() {
  var user = useAuth().user
  var navigate = useNavigate()
  var ctx = useLocationContext()
  var location = ctx.location
  var radius = ctx.radius
  var setRadius = ctx.setRadius
  var permissionState = ctx.permissionState
  var requestLocation = ctx.requestLocation

  var [mapCollapsed, setMapCollapsed] = useState(false)
  var mapRef = useRef(null)
  var [restaurantTab, setRestaurantTab] = useState('open')
  var [searchQuery, setSearchQuery] = useState('')
  var [showRadiusSheet, setShowRadiusSheet] = useState(false)
  var [addRestaurantModalOpen, setAddRestaurantModalOpen] = useState(false)
  var [addRestaurantInitialQuery, setAddRestaurantInitialQuery] = useState('')

  // Fetch restaurants (distance-filtered when location available)
  var restData = useRestaurants(location, radius, permissionState)
  var restaurants = restData.restaurants
  var loading = restData.loading
  var fetchError = restData.error
  var isDistanceFiltered = restData.isDistanceFiltered

  // Google Place IDs already in DB (to filter from discovery)
  var existingPlaceIds = useMemo(function () {
    return []
  }, [])

  // Discover nearby restaurants from Google Places (auth only)
  var nearbyData = useNearbyPlaces({
    lat: location?.lat,
    lng: location?.lng,
    radius: radius + 5,
    isAuthenticated: !!user,
    existingPlaceIds: existingPlaceIds,
  })
  var nearbyPlaces = nearbyData.places
  var nearbyLoading = nearbyData.loading
  var nearbyError = nearbyData.error

  // Filter by open/closed tab + search, sort alphabetically
  var filteredRestaurants = useMemo(function () {
    var filtered = restaurants
      .filter(function (r) {
        return restaurantTab === 'open' ? r.is_open !== false : r.is_open === false
      })
      .filter(function (r) {
        return r.name.toLowerCase().includes(searchQuery.toLowerCase())
      })

    if (!isDistanceFiltered) {
      return filtered.slice().sort(function (a, b) { return a.name.localeCompare(b.name) })
    }
    return filtered
  }, [restaurants, restaurantTab, searchQuery, isDistanceFiltered])

  var handleRestaurantSelect = function (restaurant) {
    capture('restaurant_viewed', {
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
      restaurant_address: restaurant.address,
      dish_count: restaurant.dish_count ?? restaurant.dishCount ?? 0,
    })
    navigate('/restaurants/' + restaurant.id)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>
      <h1 className="sr-only">Restaurants</h1>

      {/* Editorial Masthead */}
      <div style={{
        textAlign: 'center',
        padding: '16px 16px 12px',
        borderBottom: '2px solid var(--color-text-primary)',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '22px',
          fontWeight: 900,
          color: 'var(--color-text-primary)',
        }}>
          The Restaurants
        </h2>
        <div style={{
          fontSize: '9px',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
          marginTop: '4px',
        }}>
          Martha&rsquo;s Vineyard Dining Guide
        </div>
      </div>

      {/* Map */}
      <div style={{
        height: mapCollapsed ? '0px' : '220px',
        overflow: 'hidden',
        transition: 'height 0.3s ease',
        background: 'var(--color-surface)',
      }}>
        {!mapCollapsed && (
          <Suspense fallback={
            <div style={{ height: '220px', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Loading map...</span>
            </div>
          }>
            <RestaurantMap
              mode="restaurant"
              restaurants={filteredRestaurants}
              userLocation={location}
              radiusMi={radius}
              permissionGranted={permissionState === 'granted'}
              compact
              mapRef={mapRef}
              onSelectRestaurant={function(restaurantId) {
                navigate('/restaurants/' + restaurantId)
              }}
            />
          </Suspense>
        )}
      </div>

      {/* Map toggle */}
      <button
        onClick={function() { setMapCollapsed(!mapCollapsed) }}
        className="w-full flex items-center justify-center gap-1"
        style={{
          padding: '6px 0',
          borderBottom: '1px solid var(--color-divider)',
          background: 'var(--color-bg)',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
          cursor: 'pointer',
          border: 'none',
        }}
      >
        {mapCollapsed ? '\u25BC Show Map' : '\u25B2 Hide Map'}
      </button>

      {/* Search + Radius */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass
              aria-hidden="true"
              size={20}
              weight="duotone"
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-tertiary)' }}
            />
            <input
              id="restaurant-search"
              name="restaurant-search"
              type="text"
              autoComplete="off"
              placeholder="Search restaurants..."
              aria-label="Search restaurants"
              value={searchQuery}
              onChange={function (e) { setSearchQuery(e.target.value) }}
              className="w-full pl-10 pr-4 py-3"
              style={{
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-divider)',
                color: 'var(--color-text-primary)',
                fontSize: '14px',
                borderRadius: '4px',
              }}
            />
          </div>

          {/* Radius chip */}
          <button
            onClick={function () { setShowRadiusSheet(true) }}
            aria-label={'Search radius: ' + radius + ' miles'}
            className="flex items-center gap-1 px-3 py-1.5 font-bold flex-shrink-0"
            style={{
              fontSize: '13px',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              border: '1.5px solid var(--color-divider)',
              borderRadius: '4px',
            }}
          >
            {radius} mi
            <CaretDown size={10} weight="bold" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">

        {/* Location permission banner */}
        <LocationBanner
          permissionState={permissionState}
          requestLocation={requestLocation}
          message="Enable location to see restaurants near you"
        />

        {/* Open / Closed Tab Switcher — Editorial */}
        <div
          className="flex mb-5"
          style={{
            border: '1.5px solid var(--color-text-primary)',
            borderRadius: '4px',
          }}
          role="tablist"
          aria-label="Restaurant status filter"
        >
          <button
            role="tab"
            aria-selected={restaurantTab === 'open'}
            onClick={function () { setRestaurantTab('open') }}
            className="flex-1 py-2 text-sm font-bold transition-all"
            style={{
              background: restaurantTab === 'open' ? 'var(--color-text-primary)' : 'transparent',
              color: restaurantTab === 'open' ? 'var(--color-bg)' : 'var(--color-text-tertiary)',
              borderRadius: '2px 0 0 2px',
            }}
          >
            Open Now
          </button>
          <button
            role="tab"
            aria-selected={restaurantTab === 'closed'}
            onClick={function () { setRestaurantTab('closed') }}
            className="flex-1 py-2 text-sm font-bold transition-all"
            style={{
              background: restaurantTab === 'closed' ? 'var(--color-text-primary)' : 'transparent',
              color: restaurantTab === 'closed' ? 'var(--color-bg)' : 'var(--color-text-tertiary)',
              borderRadius: '0 2px 2px 0',
              borderLeft: '1.5px solid var(--color-text-primary)',
            }}
          >
            Closed for Season
          </button>
        </div>

        {/* Restaurant List */}
        {fetchError ? (
          <div className="text-center py-12">
            <p role="alert" className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>
              {fetchError.message || fetchError}
            </p>
            <button
              onClick={function () { window.location.reload() }}
              className="px-5 py-2.5 text-sm font-bold rounded-lg"
              style={{ background: 'var(--color-primary)', color: 'var(--color-surface-elevated)' }}
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div>
            {[0, 1, 2, 3, 4, 5].map(function (i) {
              return (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{
                    padding: '14px 0',
                    borderBottom: '1px solid var(--color-divider)',
                  }}
                >
                  <div className="h-4 w-40" style={{ background: 'var(--color-surface)', borderRadius: '2px' }} />
                  <div className="h-3 w-56 mt-2" style={{ background: 'var(--color-surface)', borderRadius: '2px' }} />
                </div>
              )
            })}
          </div>
        ) : (
          <div>
            {filteredRestaurants.map(function (restaurant) {
              var dishCount = restaurant.dish_count ?? restaurant.dishCount ?? 0
              return (
                <button
                  key={restaurant.id}
                  onClick={function () { handleRestaurantSelect(restaurant) }}
                  className="w-full text-left transition-all active:scale-[0.98]"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '14px 0',
                    background: 'transparent',
                    borderBottom: '1px solid var(--color-divider)',
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        style={{
                          fontFamily: 'var(--font-headline)',
                          fontSize: '16px',
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {restaurant.name}
                      </h3>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: restaurant.is_open ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                      }}>
                        {restaurant.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '12px',
                      fontStyle: 'italic',
                      color: 'var(--color-text-secondary)',
                      marginTop: '2px',
                    }}>
                      {restaurant.town || 'Martha\u2019s Vineyard'}
                      {restaurant.cuisine ? ' \u00B7 ' + restaurant.cuisine : ''}
                      {dishCount > 0 ? ' \u00B7 ' + dishCount + ' dish' + (dishCount === 1 ? '' : 'es') : ''}
                      {restaurant.distance_miles != null ? ' \u00B7 ' + restaurant.distance_miles + ' mi' : ''}
                    </p>
                    {restaurant.knownFor && (
                      <p style={{
                        fontSize: '11px',
                        color: 'var(--color-text-tertiary)',
                        marginTop: '3px',
                      }}>
                        Known for{' '}
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {restaurant.knownFor.name}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Rating right-aligned */}
                  {restaurant.knownFor && (
                    <span style={{
                      fontFamily: 'var(--font-headline)',
                      fontSize: '22px',
                      fontWeight: 900,
                      color: 'var(--color-rating)',
                      flexShrink: 0,
                    }}>
                      {restaurant.knownFor.rating}
                    </span>
                  )}
                </button>
              )
            })}

            {filteredRestaurants.length === 0 && (
              <div
                className="text-center py-12"
                style={{
                  color: 'var(--color-text-tertiary)',
                }}
              >
                <p style={{
                  fontFamily: 'var(--font-headline)',
                  fontStyle: 'italic',
                  fontSize: '14px',
                  color: 'var(--color-text-tertiary)',
                }}>
                  {searchQuery
                    ? 'No restaurants found'
                    : restaurantTab === 'open'
                      ? 'No open restaurants found'
                      : 'No closed restaurants'
                  }
                </p>
                {isDistanceFiltered && (
                  <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                    Try increasing your search radius
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Discover More Restaurants — Google Places (auth only) */}
        {user && nearbyPlaces.length > 0 && (
          <div className="mt-8">
            <div style={{
              borderBottom: '1px solid var(--color-divider)',
              paddingBottom: '6px',
              marginBottom: '12px',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '16px',
                fontWeight: 700,
                fontStyle: 'italic',
                color: 'var(--color-text-primary)',
              }}>
                Discover More
              </h2>
              <p style={{
                fontSize: '9px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--color-text-tertiary)',
                marginTop: '2px',
              }}>
                Found on Google Maps &mdash; not yet on WGH
              </p>
            </div>
            <div className="space-y-2">
              {nearbyPlaces.map(function (place) {
                return (
                  <NearbyPlaceCard
                    key={place.placeId}
                    place={place}
                    onAdd={function () {
                      setAddRestaurantInitialQuery(place.name)
                      setAddRestaurantModalOpen(true)
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}
        {user && !nearbyLoading && nearbyPlaces.length === 0 && (
          <p
            className="mt-6 text-center text-xs py-3"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {nearbyError?.message || 'No additional restaurants found nearby from Google'}
          </p>
        )}
        {user && nearbyLoading && (
          <div className="mt-8 flex justify-center py-4">
            <div className="animate-spin w-5 h-5 border-2 rounded-full" style={{ borderColor: 'var(--color-divider)', borderTopColor: 'var(--color-accent-gold)' }} />
          </div>
        )}
      </div>

      {/* Add restaurant floating CTA (authenticated) */}
      {user && (
        <button
          onClick={function () {
            setAddRestaurantInitialQuery('')
            setAddRestaurantModalOpen(true)
          }}
          className="fixed bottom-20 right-4 z-10 flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all active:scale-95"
          style={{
            background: 'var(--color-accent-gold)',
            color: 'var(--color-bg)',
            border: '1.5px solid var(--color-divider)',
            borderRadius: '4px',
          }}
        >
          <Plus size={16} weight="bold" />
          Add a restaurant
        </button>
      )}

      {/* Radius Sheet */}
      <RadiusSheet
        isOpen={showRadiusSheet}
        onClose={function () { setShowRadiusSheet(false) }}
        radius={radius}
        onRadiusChange={setRadius}
      />

      <AddRestaurantModal
        isOpen={addRestaurantModalOpen}
        onClose={function () { setAddRestaurantModalOpen(false) }}
        initialQuery={addRestaurantInitialQuery}
      />
    </div>
  )
}

// Card for a discovered Google Place
function NearbyPlaceCard({ place, onAdd }) {
  var _details = useState(null)
  var details = _details[0]
  var setDetails = _details[1]
  var fetchedRef = useRef(false)

  var fetchDetails = useCallback(function () {
    if (fetchedRef.current || !place.placeId) return
    fetchedRef.current = true
    placesApi.getDetails(place.placeId)
      .then(function (d) { setDetails(d) })
      .catch(function (err) { logger.error('Place details error:', err) })
  }, [place.placeId])

  useEffect(function () {
    fetchDetails()
  }, [fetchDetails])

  return (
    <div
      className="p-4"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-divider)',
        borderRadius: '4px',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className="font-semibold truncate"
            style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}
          >
            {place.name}
          </p>
          {place.address && (
            <p
              className="text-xs truncate mt-0.5"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {place.address}
            </p>
          )}
        </div>
        <button
          onClick={onAdd}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
          style={{
            background: 'rgba(217, 167, 101, 0.12)',
            color: 'var(--color-accent-gold)',
            border: '1px solid rgba(217, 167, 101, 0.2)',
          }}
        >
          <Plus size={14} weight="bold" />
          Add to WGH
        </button>
      </div>

      {(details?.googleMapsUrl || details?.websiteUrl) && (
        <div className="flex gap-4 mt-2">
          {details.googleMapsUrl && (
            <a
              href={details.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: 'var(--color-accent-gold)' }}
            >
              Google Maps
            </a>
          )}
          {details.websiteUrl && (
            <a
              href={details.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: 'var(--color-accent-gold)' }}
            >
              Website
            </a>
          )}
        </div>
      )}
    </div>
  )
}
