import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, AttributionControl, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getCategoryEmoji, getDishNameIcon } from '../../constants/categories'
import { MIN_VOTES_FOR_RANKING } from '../../constants/app'
import { getCategoryIconSrc } from '../home/CategoryIcons'
import { calculateDistance } from '../../utils/distance'
import { getRatingColor } from '../../utils/ranking'
import { getSessionItem, setSessionItem, removeSessionItem } from '../../lib/storage'
import { DEFAULT_LOCATION } from '../../context/LocationContext'

const PROXIMITY_THRESHOLD_MI = 0.062 // ~100m
var SELECTED_RESTAURANT_KEY = 'wgh_map_selected_restaurant'

// ─── Expose map instance to parent via ref ───────────────────────────────────
function MapRefExposer({ mapRef }) {
  const map = useMap()
  useEffect(function () {
    if (mapRef) mapRef.current = map
  }, [map, mapRef])
  return null
}

// ─── Fly to a location when prop changes ─────────────────────────────────────
function FlyToLocation({ lat, lng }) {
  var map = useMap()
  var prevRef = useRef(null)

  useEffect(function () {
    if (!lat || !lng) return
    var key = lat + ',' + lng
    if (key === prevRef.current) return
    prevRef.current = key
    map.flyTo([lat, lng], 16, { duration: 0.8 })
  }, [lat, lng, map])

  return null
}

// ─── Click handler to dismiss dish mini-card ─────────────────────────────────
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: () => {
      if (onMapClick) onMapClick()
    },
  })
  return null
}

// ─── Build category icon divIcon ─────────────────────────────────────────────
function buildCategoryIcon(category, hasHighRating, dishName, isSelected, ranks) {
  var posterImage = getDishNameIcon(dishName) || getCategoryIconSrc(category)
  var emoji = getCategoryEmoji(category)
  var bestRank = (ranks && ranks.length > 0) ? ranks[0] : null

  var medalBg = bestRank === 1 ? 'var(--color-medal-gold)'
    : bestRank === 2 ? 'var(--color-medal-silver)'
    : bestRank === 3 ? 'var(--color-medal-bronze)'
    : null
  var size = isSelected ? 56 : (medalBg ? 46 : 44)
  var imgSize = isSelected ? 52 : (medalBg ? 46 : 42)

  var glow = isSelected
    ? 'box-shadow:0 0 14px 6px rgba(228,90,53,0.6);border:3px solid var(--color-primary);z-index:9999 !important;'
    : medalBg
      ? 'box-shadow:0 0 10px 4px rgba(0,0,0,0.15);border:2.5px solid ' + medalBg + ';'
      : hasHighRating
        ? 'box-shadow:0 0 8px 3px rgba(217,167,101,0.5);'
        : ''

  var bg = medalBg || 'var(--color-surface-elevated)'
  var borderStyle = medalBg && !isSelected
    ? 'border:2.5px solid ' + medalBg + ';'
    : 'border:2px solid var(--color-divider);'

  var innerContent = posterImage
    ? '<img src="' + posterImage + '" alt="" style="width:' + imgSize + 'px;height:' + imgSize + 'px;object-fit:contain;" />'
    : '<span style="font-size:' + (isSelected ? 40 : (medalBg ? 36 : 32)) + 'px;">' + emoji + '</span>'

  // Small rank badge top-right for top 10
  var rankBadge = ''
  if (bestRank && bestRank <= 10 && !isSelected) {
    var badgeBg = medalBg || 'var(--color-text-primary)'
    rankBadge = '<div style="position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;padding:0 3px;background:' + badgeBg + ';display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;border:1.5px solid #fff;">' + bestRank + '</div>'
  }

  return L.divIcon({
    className: '',
    // aria-hidden: the Marker's `title` names the pin; keep emoji/rank digit out of its accessible name
    html: '<div aria-hidden="true" style="' +
      'position:relative;width:' + size + 'px;height:' + size + 'px;' +
      'display:flex;align-items:center;justify-content:center;' +
      'cursor:pointer;' +
      'border-radius:50%;' +
      'background:' + bg + ';' +
      borderStyle +
      'transition:all 0.2s ease;' +
      glow +
    '">' + innerContent + rankBadge + '</div>',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function RestaurantMap({
  dishes = [],
  userLocation,
  onSelectDish,
  onMapClick,
  permissionGranted,
  fullScreen = false,
  focusDishId = null,
  mapRef = null,
  dishRanks = {},
}) {
  const nav = useNavigate()
  const center = userLocation?.lat && userLocation?.lng
    ? [userLocation.lat, userLocation.lng]
    : [DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng]

  // ─── Selected restaurant (persisted for the session) ───
  const [selectedRestaurantId, _setSelectedRestaurantId] = useState(function () {
    return getSessionItem(SELECTED_RESTAURANT_KEY)
  })
  var setSelectedRestaurantId = function (id) {
    _setSelectedRestaurantId(id)
    if (id) setSessionItem(SELECTED_RESTAURANT_KEY, id)
    else removeSessionItem(SELECTED_RESTAURANT_KEY)
  }
  const [dismissedProximity, setDismissedProximity] = useState({})

  // ─── Group dishes by restaurant ───
  const restaurantGroups = useMemo(() => {
    if (!dishes || dishes.length === 0) return []

    const groupMap = {}
    for (let i = 0; i < dishes.length; i++) {
      const d = dishes[i]
      const rid = d.restaurant_id
      if (!rid) continue
      if (!groupMap[rid]) {
        groupMap[rid] = {
          restaurant_id: rid,
          restaurant_name: d.restaurant_name,
          restaurant_lat: d.restaurant_lat,
          restaurant_lng: d.restaurant_lng,
          restaurant_address: d.restaurant_address,
          dishes: [],
        }
      }
      groupMap[rid].dishes.push(d)
    }

    // Sort dishes within each group by avg_rating desc
    const groups = Object.values(groupMap)
    for (let i = 0; i < groups.length; i++) {
      groups[i].dishes = groups[i].dishes.slice().sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
    }

    return groups
  }, [dishes])

  // ─── Selected group for mini card ───
  const selectedGroup = useMemo(() => {
    if (!selectedRestaurantId) return null
    for (let i = 0; i < restaurantGroups.length; i++) {
      if (restaurantGroups[i].restaurant_id === selectedRestaurantId) {
        return restaurantGroups[i]
      }
    }
    return null
  }, [selectedRestaurantId, restaurantGroups])

  // ─── Focus on a dish from the list ───
  var [flyTarget, setFlyTarget] = useState(null)
  var [focusedSingleDish, setFocusedSingleDish] = useState(null)
  var handledFocusRef = useRef(null)

  useEffect(function () {
    if (!focusDishId || restaurantGroups.length === 0) return
    // Don't re-process the same focusDishId
    if (handledFocusRef.current === focusDishId) return
    for (var i = 0; i < restaurantGroups.length; i++) {
      var g = restaurantGroups[i]
      for (var j = 0; j < g.dishes.length; j++) {
        if (g.dishes[j].dish_id === focusDishId) {
          handledFocusRef.current = focusDishId
          setSelectedRestaurantId(g.restaurant_id)
          setFocusedSingleDish(g.dishes[j])
          setFlyTarget({ lat: g.restaurant_lat, lng: g.restaurant_lng })
          if (onSelectDish) onSelectDish(g.dishes[j].dish_id)
          return
        }
      }
    }
  }, [focusDishId, restaurantGroups, onSelectDish])

  // ─── Sync a selection restored from sessionStorage with the parent ───
  // The parent hides its floating controls only after onSelectDish; without this
  // a restored mini-card sits underneath them and can't be tapped.
  var restoredSyncRef = useRef(false)
  useEffect(function () {
    if (restoredSyncRef.current || restaurantGroups.length === 0) return
    restoredSyncRef.current = true
    // Nothing restored, or the focus effect above owns the selection
    if (!selectedRestaurantId || focusDishId) return
    var group = null
    for (var i = 0; i < restaurantGroups.length; i++) {
      if (restaurantGroups[i].restaurant_id === selectedRestaurantId) {
        group = restaurantGroups[i]
        break
      }
    }
    if (group) {
      if (onSelectDish) onSelectDish(group.dishes[0].dish_id)
    } else {
      // Stale key — restaurant isn't on the map any more
      setSelectedRestaurantId(null)
    }
  }, [restaurantGroups, onSelectDish, selectedRestaurantId, focusDishId])

  // ─── Proximity detection ───
  const nearbyRestaurant = useMemo(() => {
    if (!permissionGranted || !userLocation?.lat || !userLocation?.lng) return null

    for (let i = 0; i < restaurantGroups.length; i++) {
      const g = restaurantGroups[i]
      if (dismissedProximity[g.restaurant_id]) continue
      const dist = calculateDistance(
        userLocation.lat, userLocation.lng,
        g.restaurant_lat, g.restaurant_lng
      )
      if (dist <= PROXIMITY_THRESHOLD_MI) return g
    }
    return null
  }, [permissionGranted, userLocation, restaurantGroups, dismissedProximity])

  // ─── Distance for selected group (only from a real GPS fix) ───
  const selectedGroupDistance = useMemo(() => {
    if (!selectedGroup || !permissionGranted || !userLocation?.lat || !userLocation?.lng) return null
    const dist = calculateDistance(
      userLocation.lat, userLocation.lng,
      selectedGroup.restaurant_lat, selectedGroup.restaurant_lng
    )
    return dist.toFixed(1)
  }, [selectedGroup, permissionGranted, userLocation])

  // ─── Total votes for selected group ───
  const selectedGroupVotes = useMemo(() => {
    if (!selectedGroup) return 0
    let total = 0
    for (let i = 0; i < selectedGroup.dishes.length; i++) {
      total += selectedGroup.dishes[i].total_votes || 0
    }
    return total
  }, [selectedGroup])

  function clearSelection() {
    setSelectedRestaurantId(null)
    setFocusedSingleDish(null)
    if (onMapClick) onMapClick()
  }

  // ────────────────────── RENDER ──────────────────────

  return (
    <div
      role="region"
      aria-label="Dish map"
      className={fullScreen ? 'wgh-map-fullscreen' : undefined}
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
        zoomControl={!fullScreen}
      >
        {/* Expose map instance to parent */}
        {mapRef && <MapRefExposer mapRef={mapRef} />}

        {/* Tile licence attribution — bottom-left, clear of the FAB */}
        <AttributionControl position="bottomleft" />

        {/* Tiles — CartoDB Voyager (free, no API key, includes labels) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          subdomains="abcd"
          className="wgh-map-tiles"
        />

        {/* Click handler — dismisses dish mini-card */}
        <MapClickHandler onMapClick={clearSelection} />
        {flyTarget && <FlyToLocation lat={flyTarget.lat} lng={flyTarget.lng} />}

        {/* User location — blue pulsing dot (only from a real GPS fix) */}
        {permissionGranted && userLocation?.lat && userLocation?.lng && (
          <>
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={16}
              pathOptions={{
                color: '#4A90D9',
                fillColor: '#4A90D9',
                fillOpacity: 0.15,
                weight: 1,
                opacity: 0.3,
              }}
            />
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={7}
              pathOptions={{
                color: '#fff',
                fillColor: '#4A90D9',
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Popup>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>You are here</span>
              </Popup>
            </CircleMarker>
          </>
        )}

        {/* ─── Dish pins ─── */}
        {restaurantGroups.map(group => {
          const topDish = group.dishes[0]
          if (!topDish) return null
          const hasHighRating = group.dishes.some(d => (d.avg_rating || 0) >= 9)
          const isSelected = selectedRestaurantId === group.restaurant_id
          // Collect all ranks at this restaurant, sorted ascending
          var ranks = []
          for (var ri = 0; ri < group.dishes.length; ri++) {
            var dr = dishRanks[group.dishes[ri].dish_id]
            if (dr) ranks.push(dr)
          }
          ranks.sort(function (a, b) { return a - b })
          const icon = buildCategoryIcon(topDish.category, hasHighRating, topDish.dish_name, isSelected, ranks)

          return (
            <Marker
              key={group.restaurant_id}
              position={[group.restaurant_lat, group.restaurant_lng]}
              icon={icon}
              title={topDish.dish_name + ' at ' + group.restaurant_name + (ranks[0] ? ', ranked #' + ranks[0] : '')}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: () => {
                  // Clear single-dish focus when user taps any pin manually
                  setFocusedSingleDish(null)
                  // Always show mini-card overlay on pin tap
                  setSelectedRestaurantId(group.restaurant_id)
                  // In fullScreen (Home page): also signal to parent for sheet scroll
                  if (fullScreen && onSelectDish) {
                    onSelectDish(topDish.dish_id)
                  }
                },
              }}
            />
          )
        })}

      </MapContainer>

      {/* ─── Proximity banner — sits below the parent's floating search + category bars ─── */}
      {nearbyRestaurant && !selectedGroup && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top, 0px) + 136px)',
            left: '10px',
            right: '10px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 4px 4px 14px',
            borderRadius: '12px',
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-divider)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', paddingTop: '8px' }}>
              You're at {nearbyRestaurant.restaurant_name}
            </div>
            <button
              type="button"
              onClick={function () { nav('/restaurants/' + nearbyRestaurant.restaurant_id) }}
              className="inline-flex items-center min-h-[44px]"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-accent-gold)',
                cursor: 'pointer',
              }}
            >
              See their menu &rarr;
            </button>
          </div>
          <button
            type="button"
            onClick={() => setDismissedProximity(prev => ({ ...prev, [nearbyRestaurant.restaurant_id]: true }))}
            aria-label="Dismiss nearby restaurant"
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ─── Mini card overlay ─── */}
      {selectedGroup && (() => {
        // If we're focusing on a single dish (from "See on map"), show only that dish
        var rankedDishes = []
        if (focusedSingleDish) {
          var fr = dishRanks[focusedSingleDish.dish_id] || null
          rankedDishes.push({ dish: focusedSingleDish, rank: fr })
        } else {
          // Get all ranked dishes at this restaurant, sorted by rank
          for (var mi = 0; mi < selectedGroup.dishes.length; mi++) {
            var md = selectedGroup.dishes[mi]
            var mr = dishRanks[md.dish_id]
            if (mr) rankedDishes.push({ dish: md, rank: mr })
          }
          rankedDishes.sort(function (a, b) { return a.rank - b.rank })
          // If no ranked dishes, show top dish as fallback
          if (rankedDishes.length === 0) {
            rankedDishes.push({ dish: selectedGroup.dishes[0], rank: null })
          }
        }

        return (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              width: 'calc(100% - 20px)',
              maxWidth: '320px',
              borderRadius: '12px',
              background: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-divider)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              padding: '12px 14px',
              maxHeight: '280px',
              overflowY: 'auto',
            }}
          >
            {/* Restaurant name — clickable, plus close */}
            <div className="flex items-start gap-2">
              <button
                type="button"
                onClick={function () { nav('/restaurants/' + selectedGroup.restaurant_id) }}
                className="inline-flex items-center min-h-[44px] text-left flex-1 min-w-0"
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--color-accent-gold)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <span className="truncate min-w-0">{selectedGroup.restaurant_name}</span>
                <span aria-hidden="true">&nbsp;→</span>
              </button>
              <button
                type="button"
                aria-label="Close"
                onClick={clearSelection}
                className="w-11 h-11 -mr-2 -mt-2 rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Meta line */}
            <div style={{
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
              marginBottom: '8px',
            }}>
              {selectedGroupDistance != null ? selectedGroupDistance + ' mi' : ''}
              {selectedGroupDistance != null && selectedGroupVotes > 0 ? ' · ' : ''}
              {selectedGroupVotes > 0 ? selectedGroupVotes + ' vote' + (selectedGroupVotes !== 1 ? 's' : '') : ''}
            </div>

            {/* Dish list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
              {rankedDishes.map(function (item, idx) {
                var dish = item.dish
                var rank = item.rank
                var medalColor = rank === 1 ? 'var(--color-medal-gold)'
                  : rank === 2 ? 'var(--color-medal-silver)'
                  : rank === 3 ? 'var(--color-medal-bronze)'
                  : 'var(--color-text-tertiary)'

                var voteCount = dish.total_votes || 0
                var showRating = voteCount >= MIN_VOTES_FOR_RANKING && dish.avg_rating != null

                return (
                  <button
                    key={dish.dish_id}
                    type="button"
                    onClick={function () { nav('/dish/' + dish.dish_id) }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '10px 4px',
                      background: 'none',
                      borderBottom: idx === rankedDishes.length - 1 ? 'none' : '1px solid var(--color-divider)',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    {/* Rank number */}
                    {rank && (
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: medalColor,
                        width: '22px',
                        textAlign: 'center',
                        flexShrink: 0,
                        paddingTop: '1px',
                      }}>
                        #{rank}
                      </span>
                    )}

                    {/* Name + rating */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          letterSpacing: '-0.01em',
                          color: 'var(--color-text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {dish.dish_name}
                        </span>
                        {showRating && (
                          <span style={{
                            fontSize: '14px',
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            fontVariantNumeric: 'tabular-nums',
                            color: getRatingColor(dish.avg_rating),
                            flexShrink: 0,
                          }}>
                            {Number(dish.avg_rating).toFixed(1)}
                          </span>
                        )}
                      </div>

                      {/* Vote count */}
                      <div style={{ marginTop: '4px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 500,
                          color: 'var(--color-text-tertiary)',
                        }}>
                          {voteCount ? voteCount + ' vote' + (voteCount === 1 ? '' : 's') : 'New'}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

          </div>
        )
      })()}
    </div>
  )
}
