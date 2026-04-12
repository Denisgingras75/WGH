// Deduplicate places against existing restaurants using Place ID OR name+proximity
// Google sometimes returns different Place IDs for the same physical restaurant,
// so we also match by location + normalized name similarity.

const DUPLICATE_DISTANCE_METERS = 150

// Normalize a restaurant name: lowercase, strip punctuation and common suffixes
export function normalizeName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/\b(restaurant|tavern|cafe|café|bakery|kitchen|grill|bar|&|and|the)\b/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Haversine distance in meters
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371e3
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// True if a Google Places result matches any existing restaurant
export function matchesExistingRestaurant(place, existingRestaurants) {
  const placeNameNorm = normalizeName(place.name)
  if (!placeNameNorm) return false

  for (const existing of existingRestaurants) {
    // Match by Place ID (fast path)
    if (existing.google_place_id && existing.google_place_id === place.placeId) return true

    // Match by proximity + name
    if (
      existing.lat != null &&
      existing.lng != null &&
      place.lat != null &&
      place.lng != null
    ) {
      const dist = distanceMeters(existing.lat, existing.lng, place.lat, place.lng)
      if (dist <= DUPLICATE_DISTANCE_METERS) {
        const existingNameNorm = normalizeName(existing.name)
        if (!existingNameNorm) continue
        if (existingNameNorm === placeNameNorm) return true
        if (existingNameNorm.includes(placeNameNorm) || placeNameNorm.includes(existingNameNorm)) return true
      }
    }
  }
  return false
}
