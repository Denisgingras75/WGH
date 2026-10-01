import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { capture } from '../lib/analytics'
import { useAuth } from '../context/AuthContext'
import { useLocationContext } from '../context/LocationContext'
import { useRestaurants } from '../hooks/useRestaurants'
import { useNearbyPlaces } from '../hooks/useNearbyPlaces'
import { RadiusSheet } from '../components/LocationPicker'
import { LocationBanner } from '../components/LocationBanner'
import { getRatingColor } from '../utils/ranking'
import { placesApi } from '../api/placesApi'
import { AddRestaurantModal } from '../components/AddRestaurantModal'
import { EmptyState } from '../components/EmptyState'
import { SectionHeader } from '../components/SectionHeader'
import { PoweredByGoogle } from '../components/PoweredByGoogle'
import { PlaceAttributions } from '../components/PlaceAttributions'
import { getStorageItem, setStorageItem } from '../lib/storage'
import { RadiusChip } from '../components/home/RadiusChip'

// Bayesian shrinkage — restaurants with few votes get pulled toward the global mean
// so a 1-vote 9.5 doesn't beat a 50-vote 8.6
var BAYESIAN_PRIOR_STRENGTH = 5
var BAYESIAN_GLOBAL_MEAN = 7.5
var SORT_STORAGE_KEY = 'wgh_restaurant_sort'

function bayesianScore(avgRating, totalVotes) {
  if (avgRating == null || totalVotes === 0) return 0
  return (Number(avgRating) * totalVotes + BAYESIAN_GLOBAL_MEAN * BAYESIAN_PRIOR_STRENGTH) / (totalVotes + BAYESIAN_PRIOR_STRENGTH)
}

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
  var [searchFocused, setSearchFocused] = useState(false)
  var [showRadiusSheet, setShowRadiusSheet] = useState(false)
  var [addModalOpen, setAddModalOpen] = useState(false)
  var [addQuery, setAddQuery] = useState('')
  var [sortBy, setSortBy] = useState(function () {
    return getStorageItem(SORT_STORAGE_KEY) || 'distance'
  })

  useEffect(function () {
    setStorageItem(SORT_STORAGE_KEY, sortBy)
  }, [sortBy])

  // Fetch restaurants (distance-filtered when location available)
  var restData = useRestaurants(location, radius, permissionState)
  var restaurants = restData.restaurants
  var loading = restData.loading
  var fetchError = restData.error
  var refetch = restData.refetch
  var isDistanceFiltered = restData.isDistanceFiltered

  // Existing restaurants to filter out of discovery (by place_id OR name+proximity)
  var existingForDiscovery = useMemo(function () {
    return (restaurants || []).map(r => ({
      id: r.id,
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      google_place_id: r.google_place_id,
    }))
  }, [restaurants])

  // Discover nearby restaurants from Google Places (auth only)
  var nearbyData = useNearbyPlaces({
    lat: location?.lat,
    lng: location?.lng,
    radius: radius + 5,
    isAuthenticated: !!user,
    existingRestaurants: existingForDiscovery,
  })
  var nearbyPlaces = nearbyData.places
  var nearbyLoading = nearbyData.loading
  var nearbyError = nearbyData.error

  // Filter by open/closed tab + search, then sort by chosen mode
  var filteredRestaurants = useMemo(function () {
    var q = searchQuery.trim().toLowerCase()
    var filtered = restaurants
      .filter(function (r) {
        return restaurantTab === 'open' ? r.is_open !== false : r.is_open === false
      })
      .filter(function (r) {
        return (r.name || '').toLowerCase().includes(q)
      })

    if (sortBy === 'top-rated') {
      // Sort by Bayesian-shrunk score, fall back to name for ties
      return filtered.slice().sort(function (a, b) {
        var scoreA = bayesianScore(a.avg_rating, a.total_votes || 0)
        var scoreB = bayesianScore(b.avg_rating, b.total_votes || 0)
        if (scoreB !== scoreA) return scoreB - scoreA
        return a.name.localeCompare(b.name)
      })
    }

    // Default: distance when available, alphabetical otherwise
    if (!isDistanceFiltered) {
      return filtered.slice().sort(function (a, b) { return a.name.localeCompare(b.name) })
    }
    return filtered
  }, [restaurants, restaurantTab, searchQuery, isDistanceFiltered, sortBy])

  var handleRestaurantSelect = function (restaurant) {
    capture('restaurant_viewed', {
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
      restaurant_address: restaurant.address,
      dish_count: restaurant.dish_count ?? restaurant.dishCount ?? 0,
    })
    navigate('/restaurants/' + restaurant.id)
  }

  var handleTabKeyDown = function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    var next = restaurantTab === 'open' ? 'closed' : 'open'
    setRestaurantTab(next)
    requestAnimationFrame(function () {
      document.getElementById('restaurants-tab-' + next)?.focus()
    })
  }

  var trimmedQuery = searchQuery.trim()
  var canWidenRadius = isDistanceFiltered && radius !== 0
  var emptyAction = null
  if (trimmedQuery) {
    emptyAction = (
      <button
        type="button"
        onClick={function () {
          setAddQuery(trimmedQuery)
          setAddModalOpen(true)
        }}
        className="py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
        style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
      >
        {'Add "' + trimmedQuery + '"'}
      </button>
    )
  } else if (canWidenRadius) {
    emptyAction = (
      <button
        type="button"
        onClick={function () { setShowRadiusSheet(true) }}
        className="py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
        style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
      >
        Change radius
      </button>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header
        className="px-4 pt-4 pb-3"
        style={{
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        {/* Search bar */}
        <label htmlFor="restaurant-search" className="sr-only">Search restaurants</label>
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
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Search restaurants…"
            value={searchQuery}
            onChange={function (e) { setSearchQuery(e.target.value) }}
            onFocus={function () { setSearchFocused(true) }}
            onBlur={function () { setSearchFocused(false) }}
            className="w-full pl-10 pr-4 py-3 rounded-xl outline-none"
            style={{
              background: 'var(--color-surface)',
              border: searchFocused ? '2px solid var(--color-primary)' : '2px solid var(--color-divider)',
              color: 'var(--color-text-primary)',
              fontSize: '14px',
            }}
          />
        </div>
      </header>

      <div className="p-4 pt-5">
        {/* Page title */}
        <div className="mb-4 flex items-center justify-between">
          <h1
            style={{
              fontFamily: "'Amatic SC', cursive",
              fontSize: '32px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              lineHeight: 1.1,
              color: 'var(--color-text-primary)',
            }}
          >
            Restaurants
          </h1>

          {/* Radius chip */}
          <RadiusChip radius={radius} onOpen={function () { setShowRadiusSheet(true) }} />
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
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-divider)',
          }}
          role="tablist"
          aria-label="Restaurant status"
          onKeyDown={handleTabKeyDown}
        >
          <button
            type="button"
            role="tab"
            id="restaurants-tab-open"
            aria-selected={restaurantTab === 'open'}
            aria-controls="restaurants-tab-panel"
            tabIndex={restaurantTab === 'open' ? 0 : -1}
            onClick={function () { setRestaurantTab('open') }}
            className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all"
            style={{
              background: restaurantTab === 'open' ? 'var(--color-primary)' : 'transparent',
              color: restaurantTab === 'open' ? 'var(--color-text-on-primary)' : 'var(--color-text-tertiary)',
            }}
          >
            Open
          </button>
          <button
            type="button"
            role="tab"
            id="restaurants-tab-closed"
            aria-selected={restaurantTab === 'closed'}
            aria-controls="restaurants-tab-panel"
            tabIndex={restaurantTab === 'closed' ? 0 : -1}
            onClick={function () { setRestaurantTab('closed') }}
            className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all"
            style={{
              background: restaurantTab === 'closed' ? 'var(--color-primary)' : 'transparent',
              color: restaurantTab === 'closed' ? 'var(--color-text-on-primary)' : 'var(--color-text-tertiary)',
            }}
          >
            Closed
          </button>
        </div>

        {/* Sort pills */}
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={function () { setSortBy('distance') }}
            aria-pressed={sortBy === 'distance'}
            className="px-3 py-2 rounded-full text-xs font-semibold min-h-[36px] transition-all"
            style={{
              background: sortBy === 'distance' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: sortBy === 'distance' ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
              border: sortBy === 'distance' ? 'none' : '1.5px solid var(--color-divider)',
            }}
          >
            {isDistanceFiltered ? 'Distance' : 'A–Z'}
          </button>
          <button
            type="button"
            onClick={function () { setSortBy('top-rated') }}
            aria-pressed={sortBy === 'top-rated'}
            className="px-3 py-2 rounded-full text-xs font-semibold min-h-[36px] transition-all"
            style={{
              background: sortBy === 'top-rated' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: sortBy === 'top-rated' ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
              border: sortBy === 'top-rated' ? 'none' : '1.5px solid var(--color-divider)',
            }}
          >
            Top Rated
          </button>
        </div>

        {/* Restaurant List */}
        <div role="tabpanel" id="restaurants-tab-panel" aria-labelledby={'restaurants-tab-' + restaurantTab}>
        {fetchError ? (
          <div className="text-center py-12">
            <p role="alert" className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>
              {fetchError.message}
            </p>
            <button
              type="button"
              onClick={function () { refetch() }}
              className="py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-3 animate-pulse" role="status" aria-label="Loading restaurants">
            {[0, 1, 2, 3, 4, 5].map(function (i) {
              return (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-divider)' }}
                >
                  <div className="h-5 w-2/3 rounded" style={{ background: 'var(--color-divider)' }} />
                  <div className="h-3 w-1/3 rounded mt-2" style={{ background: 'var(--color-divider)' }} />
                </div>
              )
            })}
            <span className="sr-only">Loading restaurants</span>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRestaurants.map(function (restaurant) {
              var isOpen = restaurant.is_open !== false
              return (
                <div
                  key={restaurant.id}
                  className="w-full rounded-xl p-4 card-press"
                  style={{
                    background: isOpen ? 'var(--color-card)' : 'var(--color-surface)',
                    border: '1px solid var(--color-divider)',
                  }}
                >
                  <button
                    type="button"
                    onClick={function () { handleRestaurantSelect(restaurant) }}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2
                          className="font-bold"
                          style={{
                            color: isOpen ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                            fontSize: isOpen ? '18px' : '14px',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {restaurant.name}
                        </h2>
                        {isOpen && (restaurant.town || restaurant.distance_miles != null) && (
                          <p
                            className="mt-0.5 font-medium"
                            style={{
                              fontSize: '12px',
                              color: 'var(--color-text-tertiary)',
                              letterSpacing: '0.02em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {[
                              restaurant.town,
                              restaurant.distance_miles != null ? Number(restaurant.distance_miles).toFixed(1) + ' mi' : null,
                            ].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        {!isOpen && (
                          <span
                            className="inline-block mt-1 px-2 py-0.5 rounded font-bold"
                            style={{
                              fontSize: '11px',
                              background: 'var(--color-primary-muted)',
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
                              style={{
                                fontWeight: 800,
                                color: getRatingColor(restaurant.knownFor.rating),
                              }}
                            >
                              {Number(restaurant.knownFor.rating).toFixed(1)}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Chevron */}
                      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </button>

                  {/* Rating row — tappable, navigates to reviews */}
                  {isOpen && restaurant.avg_rating != null && (
                    <button
                      type="button"
                      onClick={function () { navigate('/restaurants/' + restaurant.id + '/reviews') }}
                      className="flex items-center gap-2 mt-2.5 pt-2.5 w-full min-h-[44px] text-left active:opacity-70 transition-opacity"
                      style={{ borderTop: '1px solid var(--color-divider)' }}
                    >
                      <span
                        style={{
                          fontSize: '18px',
                          fontWeight: 800,
                          letterSpacing: '-0.02em',
                          fontVariantNumeric: 'tabular-nums',
                          color: 'var(--color-rating)',
                        }}
                      >
                        {Number(restaurant.avg_rating).toFixed(1)}
                      </span>
                      <span
                        className="font-medium"
                        style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}
                      >
                        WGH Score · {restaurant.total_votes || 0} vote{(restaurant.total_votes || 0) === 1 ? '' : 's'}
                      </span>
                      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 ml-auto" style={{ color: 'var(--color-text-tertiary)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}

            {filteredRestaurants.length === 0 && (
              <EmptyState
                emoji="🍽️"
                title={trimmedQuery
                  ? 'No restaurants found'
                  : restaurantTab === 'open'
                    ? 'No open restaurants found'
                    : 'No closed restaurants'
                }
                subtitle={canWidenRadius ? 'Try increasing your search radius' : undefined}
                action={emptyAction}
              />
            )}
          </div>
        )}
        </div>

        {/* Discover More Restaurants — Google Places (auth only) */}
        {user && nearbyPlaces.length > 0 && (
          <div className="mt-8">
            <div className="mb-3">
              <SectionHeader title="Discover more restaurants" subtitle="Found on Google Maps — not yet on WGH" />
            </div>
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
            <div className="mt-3">
              <PoweredByGoogle align="right" />
            </div>
          </div>
        )}
        {user && nearbyError && (
          <p
            role="alert"
            className="mt-6 text-sm text-center"
            style={{ color: 'var(--color-danger)' }}
          >
            Couldn't load nearby suggestions from Google. Please try again later.
          </p>
        )}
        {user && !nearbyError && !nearbyLoading && !loading && !fetchError && nearbyPlaces.length === 0 && (
          <p
            className="mt-6 text-center text-xs py-3"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            No additional restaurants found nearby from Google
          </p>
        )}
        {user && nearbyLoading && (
          <div role="status" className="mt-8 flex justify-center py-4">
            <div
              className="spinner"
            />
            <span className="sr-only">Loading nearby restaurants</span>
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

      {/* Floating Add Restaurant button */}
      <button
        type="button"
        onClick={function () {
          setAddQuery('')
          setAddModalOpen(true)
        }}
        className="fixed right-4 flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-sm active:scale-95 transition-all"
        style={{
          bottom: 'calc(72px + env(safe-area-inset-bottom))',
          zIndex: 40,
          background: 'var(--color-primary)',
          color: 'var(--color-text-on-primary)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
        }}
      >
        <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Restaurant
      </button>

      <AddRestaurantModal
        isOpen={addModalOpen}
        onClose={function () { setAddModalOpen(false) }}
        initialQuery={addQuery}
      />

    </div>
  )
}

// Card for a discovered Google Place
function NearbyPlaceCard({ place }) {
  // React Query caches Place Details (billed per call) across visits; placesApi logs errors
  var detailsQuery = useQuery({
    queryKey: ['placeDetails', place.placeId],
    queryFn: function () { return placesApi.getDetails(place.placeId) },
    enabled: !!place.placeId,
    staleTime: 1000 * 60 * 60,
    retry: false,
  })
  var details = detailsQuery.data

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--color-card)',
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
        <div className="flex gap-4 mt-1">
          {details.googleMapsUrl && (
            <a
              href={details.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 min-h-[44px] text-sm font-semibold"
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
              className="inline-flex items-center gap-1 min-h-[44px] text-sm font-semibold"
              style={{ color: 'var(--color-accent-gold)' }}
            >
              Website
            </a>
          )}
        </div>
      )}
      {Array.isArray(details?.attributions) && details.attributions.length > 0 && (
        <PlaceAttributions attributions={details.attributions} className="mt-2" />
      )}
    </div>
  )
}
