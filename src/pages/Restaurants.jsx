import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { capture } from '../lib/analytics'
import { useAuth } from '../context/AuthContext'
import { useLocationContext } from '../context/LocationContext'
import { useRestaurants } from '../hooks/useRestaurants'
import { useNearbyPlaces } from '../hooks/useNearbyPlaces'
import { RadiusSheet } from '../components/LocationPicker'
import { LocationBanner } from '../components/LocationBanner'
import { getRatingColor } from '../utils/ranking'
import { placesApi } from '../api/placesApi'
import { logger } from '../utils/logger'

export function Restaurants() {
  var user = useAuth().user
  var navigate = useNavigate()
  var ctx = useLocationContext()
  var location = ctx.location
  var radius = ctx.radius
  var setRadius = ctx.setRadius
  var permissionState = ctx.permissionState
  var requestLocation = ctx.requestLocation

  var [restaurantTab, setRestaurantTab] = useState('open')
  var [searchQuery, setSearchQuery] = useState('')
  var [showRadiusSheet, setShowRadiusSheet] = useState(false)

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

      {/* Header */}
      <header
        className="px-4 pt-4 pb-3"
        style={{
          background: 'var(--color-bg)',
          borderBottom: '2px solid var(--color-divider)',
        }}
      >
        {/* Search bar */}
        <div className="relative">
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            id="restaurant-search"
            name="restaurant-search"
            type="text"
            autoComplete="off"
            placeholder="Search restaurants..."
            aria-label="Search restaurants"
            value={searchQuery}
            onChange={function (e) { setSearchQuery(e.target.value) }}
            className="w-full pl-10 pr-4 py-3 rounded-xl"
            style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-divider)',
              color: 'var(--color-text-primary)',
              fontSize: '14px',
            }}
          />
        </div>
      </header>

      <div className="p-4 pt-5">
        {/* Section Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="font-bold"
            style={{
              color: 'var(--color-primary)',
              fontSize: '22px',
              letterSpacing: '-0.01em',
            }}
          >
            Restaurants
          </h2>

          {/* Radius chip */}
          <button
            onClick={function () { setShowRadiusSheet(true) }}
            aria-label={'Search radius: ' + radius + ' miles'}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full font-bold"
            style={{
              fontSize: '13px',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              border: '1.5px solid var(--color-divider)',
            }}
          >
            {radius} mi
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Location permission banner */}
        <LocationBanner
          permissionState={permissionState}
          requestLocation={requestLocation}
          message="Enable location to see restaurants near you"
        />

        {/* Open / Closed Tab Switcher */}
        <div
          className="flex rounded-xl p-1 mb-5"
          style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-divider)',
          }}
          role="tablist"
          aria-label="Restaurant status filter"
        >
          <button
            role="tab"
            aria-selected={restaurantTab === 'open'}
            onClick={function () { setRestaurantTab('open') }}
            className="flex-1 py-1.5 text-sm font-bold rounded-lg transition-all"
            style={{
              background: restaurantTab === 'open' ? 'var(--color-primary)' : 'transparent',
              color: restaurantTab === 'open' ? 'var(--color-surface-elevated)' : 'var(--color-text-tertiary)',
            }}
          >
            Open
          </button>
          <button
            role="tab"
            aria-selected={restaurantTab === 'closed'}
            onClick={function () { setRestaurantTab('closed') }}
            className="flex-1 py-1.5 text-sm font-bold rounded-lg transition-all"
            style={{
              background: restaurantTab === 'closed' ? 'var(--color-primary)' : 'transparent',
              color: restaurantTab === 'closed' ? 'var(--color-surface-elevated)' : 'var(--color-text-tertiary)',
            }}
          >
            Closed
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
          <div className="space-y-3">
            {[0, 1, 2, 3, 4, 5].map(function (i) {
              return (
                <div
                  key={i}
                  className="h-24 rounded-xl animate-pulse"
                  style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-divider)' }}
                />
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRestaurants.map(function (restaurant) {
              return (
                <button
                  key={restaurant.id}
                  onClick={function () { handleRestaurantSelect(restaurant) }}
                  className="w-full rounded-xl p-4 text-left transition-all active:scale-[0.98]"
                  style={{
                    background: restaurant.is_open
                      ? 'var(--color-surface-elevated)'
                      : 'var(--color-surface)',
                    border: '1.5px solid var(--color-divider)',
                    boxShadow: restaurant.is_open ? '0 2px 12px rgba(0, 0, 0, 0.06)' : 'none',
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3
                        className="font-bold"
                        style={{
                          color: restaurant.is_open ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                          fontSize: restaurant.is_open ? '18px' : '14px',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {restaurant.name}
                      </h3>
                      {restaurant.is_open && restaurant.town && (
                        <p
                          className="mt-0.5 font-medium"
                          style={{
                            fontSize: '12px',
                            color: 'var(--color-text-tertiary)',
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {restaurant.town}
                          {restaurant.distance_miles != null && (
                            ' · ' + restaurant.distance_miles + ' mi'
                          )}
                        </p>
                      )}
                      {!restaurant.is_open && (
                        <span
                          className="inline-block mt-1 px-2 py-0.5 rounded font-bold"
                          style={{
                            fontSize: '10px',
                            background: 'rgba(228, 68, 10, 0.08)',
                            color: 'var(--color-primary)',
                            border: '1px solid var(--color-primary)',
                          }}
                        >
                          Closed for Season
                        </span>
                      )}
                      {restaurant.knownFor && (
                        <p
                          className="mt-1.5 font-medium"
                          style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}
                        >
                          Known for{' '}
                          <span style={{ color: 'var(--color-text-secondary)' }}>
                            {restaurant.knownFor.name}
                          </span>
                          {' · '}
                          <span
                            className="font-bold"
                            style={{ color: getRatingColor(restaurant.knownFor.rating) }}
                          >
                            {restaurant.knownFor.rating}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Chevron */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </button>
              )
            })}

            {filteredRestaurants.length === 0 && (
              <div
                className="text-center py-12 rounded-xl"
                style={{
                  color: 'var(--color-text-tertiary)',
                  background: 'var(--color-surface)',
                  border: '1.5px solid var(--color-divider)',
                }}
              >
                <p className="font-bold" style={{ fontSize: '14px' }}>
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
            <h2
              className="font-bold mb-3"
              style={{
                color: 'var(--color-text-primary)',
                fontSize: '16px',
                letterSpacing: '-0.01em',
              }}
            >
              Discover more restaurants
            </h2>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
              Found on Google Maps — not yet on WGH
            </p>
            <div className="space-y-2">
              {nearbyPlaces.map(function (place) {
                return (
                  <NearbyPlaceCard
                    key={place.placeId}
                    place={place}
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

      {/* Radius Sheet */}
      <RadiusSheet
        isOpen={showRadiusSheet}
        onClose={function () { setShowRadiusSheet(false) }}
        radius={radius}
        onRadiusChange={setRadius}
      />

    </div>
  )
}

// Card for a discovered Google Place
function NearbyPlaceCard({ place }) {
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
      className="rounded-xl p-4"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-divider)',
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
