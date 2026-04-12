import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Discover Restaurants Edge Function
 *
 * Systematically searches Google Places across all MV/Nantucket town centers
 * to find restaurants NOT already in our database. Inserts new ones with
 * full metadata (place_id, website, lat/lng, address) and probes for menu URLs.
 *
 * Also detects open/closed status from Google Places business_status and
 * website content signals.
 *
 * POST {} — search all towns
 * POST { towns: ["Oak Bluffs", "Nantucket"] } — search specific towns
 * POST { types: ["cafe", "bakery"] } — search specific place types
 */

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://whats-good-here.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Town centers with coordinates and search radius
// Multiple search points per town to ensure full coverage
const SEARCH_POINTS = [
  // Martha's Vineyard
  { town: 'Oak Bluffs', lat: 41.4545, lng: -70.5620, radius: 3000 },
  { town: 'Edgartown', lat: 41.3884, lng: -70.5133, radius: 3000 },
  { town: 'Vineyard Haven', lat: 41.4539, lng: -70.6033, radius: 3000 },
  { town: 'West Tisbury', lat: 41.3817, lng: -70.6736, radius: 4000 },
  { town: 'Chilmark', lat: 41.3456, lng: -70.7445, radius: 4000 },
  { town: 'Aquinnah', lat: 41.3106, lng: -70.8103, radius: 3000 },
  // MV extra coverage points (between towns)
  { town: 'Vineyard Haven', lat: 41.4280, lng: -70.5850, radius: 2000 },
  { town: 'Edgartown', lat: 41.4100, lng: -70.5400, radius: 2000 },

  // Nantucket
  { town: 'Nantucket', lat: 41.2835, lng: -70.0995, radius: 3000 },
  { town: 'Nantucket', lat: 41.2700, lng: -70.0800, radius: 2000 },
  { town: 'Siasconset', lat: 41.2610, lng: -69.9650, radius: 2000 },
  { town: 'Madaket', lat: 41.2720, lng: -70.1970, radius: 2000 },
  { town: 'Wauwinet', lat: 41.3190, lng: -70.0200, radius: 2000 },
]

const PLACE_TYPES = ['restaurant', 'cafe', 'bar', 'bakery', 'ice_cream_shop', 'coffee_shop']

const MENU_PATHS = [
  '/menu', '/menus', '/food-menu', '/dinner-menu', '/food',
  '/food-drink', '/food--drinks', '/eat', '/dining', '/our-menu',
]

// Signals that a restaurant is closed
const CLOSED_SIGNALS = [
  /closed\s+(for\s+the\s+)?season/i,
  /closed\s+for\s+winter/i,
  /temporarily\s+closed/i,
  /permanently\s+closed/i,
  /opening\s+(in\s+)?(spring|summer|may|june|april|march)/i,
  /we\s+are\s+closed/i,
  /see\s+you\s+(in\s+)?(spring|summer|next\s+season)/i,
  /reopening\s+(in\s+)?\w+\s+\d{4}/i,
  /winter\s+hours.*closed/i,
  /seasonal\s+closure/i,
]

async function findMenuUrl(websiteUrl: string): Promise<string | null> {
  if (!websiteUrl) return null
  let base = websiteUrl.replace(/\/+$/, '')
  if (!base.startsWith('http')) base = 'https://' + base

  for (const path of MENU_PATHS) {
    const candidate = base + path
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(candidate, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WhatsGoodHere-Bot/1.0)' },
      })
      clearTimeout(timeout)
      if (res.ok) return candidate
    } catch {
      // skip
    }
  }
  return null
}

/**
 * Check website content for closed/seasonal signals
 */
async function detectClosedFromWebsite(websiteUrl: string): Promise<{ isClosed: boolean; signal: string | null }> {
  if (!websiteUrl) return { isClosed: false, signal: null }

  try {
    let url = websiteUrl
    if (!url.startsWith('http')) url = 'https://' + url

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WhatsGoodHere-Bot/1.0)',
        'Accept': 'text/html',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) return { isClosed: false, signal: null }

    const html = await res.text()
    // Only check the first 5000 chars — closure notices are always prominent
    const snippet = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 5000)

    for (const signal of CLOSED_SIGNALS) {
      const match = snippet.match(signal)
      if (match) {
        return { isClosed: true, signal: match[0] }
      }
    }
  } catch {
    // Network error — don't assume closed
  }

  return { isClosed: false, signal: null }
}

/**
 * Search Google Places Nearby for one location point
 */
async function searchNearby(
  lat: number,
  lng: number,
  radius: number,
  types: string[],
): Promise<Array<{
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
  website: string | null
  businessStatus: string | null
  types: string[]
}>> {
  const results: Array<{
    placeId: string
    name: string
    address: string
    lat: number
    lng: number
    website: string | null
    businessStatus: string | null
    types: string[]
  }> = []

  // Google Nearby Search (New) only accepts one includedType at a time for best results,
  // but we can batch a few. We'll search by broad food types.
  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY!,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.websiteUri,places.businessStatus,places.types',
    },
    body: JSON.stringify({
      includedTypes: types,
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radius,
        },
      },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error(`Nearby search error at (${lat}, ${lng}):`, errText)
    return results
  }

  const data = await response.json()

  for (const place of (data.places || [])) {
    results.push({
      placeId: place.id,
      name: place.displayName?.text || '',
      address: place.formattedAddress || '',
      lat: place.location?.latitude || 0,
      lng: place.location?.longitude || 0,
      website: place.websiteUri || null,
      businessStatus: place.businessStatus || null,
      types: place.types || [],
    })
  }

  return results
}

/**
 * Determine which MV/Nantucket town a lat/lng belongs to
 */
function classifyTown(lat: number, lng: number): string {
  // Nantucket island is east of -70.03
  if (lng > -70.03) {
    if (lng > -69.99) return 'Siasconset'
    if (lat > 41.30) return 'Wauwinet'
    return 'Nantucket'
  }
  if (lng > -70.05) {
    if (lat < 41.28) return 'Nantucket'
    return 'Madaket'
  }

  // Martha's Vineyard
  if (lng < -70.77) return 'Aquinnah'
  if (lng < -70.68) return 'Chilmark'
  if (lng < -70.60) return 'West Tisbury'
  if (lat > 41.43) {
    if (lng < -70.57) return 'Vineyard Haven'
    return 'Oak Bluffs'
  }
  return 'Edgartown'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'GOOGLE_PLACES_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // --- Auth gate: require authenticated admin ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: admin } = await supabase.from('admins').select('id').eq('user_id', user.id).maybeSingle()
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let body: Record<string, unknown> = {}
    try { body = await req.json() } catch { /* empty */ }

    const filterTowns = body.towns as string[] | undefined
    const filterTypes = (body.types as string[]) || PLACE_TYPES

    // Get all existing google_place_ids to deduplicate
    const { data: existingRestaurants } = await supabase
      .from('restaurants')
      .select('google_place_id, name')

    const existingPlaceIds = new Set(
      (existingRestaurants || [])
        .filter(r => r.google_place_id)
        .map(r => r.google_place_id)
    )
    const existingNames = new Set(
      (existingRestaurants || []).map(r => r.name.toLowerCase().trim())
    )

    console.log(`Existing restaurants: ${existingRestaurants?.length || 0} (${existingPlaceIds.size} with place IDs)`)

    // Determine which search points to use
    const searchPoints = filterTowns
      ? SEARCH_POINTS.filter(p => filterTowns.includes(p.town))
      : SEARCH_POINTS

    // Collect all discovered places (deduplicated by placeId)
    const allDiscovered = new Map<string, {
      placeId: string
      name: string
      address: string
      lat: number
      lng: number
      website: string | null
      businessStatus: string | null
      town: string
      types: string[]
    }>()

    for (const point of searchPoints) {
      console.log(`Searching near ${point.town} (${point.lat}, ${point.lng})...`)
      const places = await searchNearby(point.lat, point.lng, point.radius, filterTypes)

      for (const place of places) {
        if (!allDiscovered.has(place.placeId)) {
          allDiscovered.set(place.placeId, {
            ...place,
            town: classifyTown(place.lat, place.lng),
          })
        }
      }

      await sleep(300) // Rate limit between searches
    }

    console.log(`Total unique places found: ${allDiscovered.size}`)

    // Filter out already-existing restaurants
    const newPlaces = Array.from(allDiscovered.values()).filter(p => {
      if (existingPlaceIds.has(p.placeId)) return false
      // Also check by name similarity (fuzzy match for restaurants added without place_id)
      if (existingNames.has(p.name.toLowerCase().trim())) return false
      return true
    })

    console.log(`New restaurants to add: ${newPlaces.length}`)

    const results: Array<{
      name: string
      town: string
      status: string
      website_url?: string
      menu_url?: string
      is_open?: boolean
      closed_signal?: string
    }> = []

    for (const place of newPlaces) {
      try {
        // Determine open/closed status
        let isOpen = true
        let closedSignal: string | null = null

        // Check Google business_status first
        if (place.businessStatus === 'CLOSED_TEMPORARILY' || place.businessStatus === 'CLOSED_PERMANENTLY') {
          isOpen = false
          closedSignal = `Google: ${place.businessStatus}`
        }

        // If Google says open, also check the website for seasonal closure
        if (isOpen && place.website) {
          const webCheck = await detectClosedFromWebsite(place.website)
          if (webCheck.isClosed) {
            isOpen = false
            closedSignal = `Website: ${webCheck.signal}`
          }
        }

        // Find menu URL
        let menuUrl: string | null = null
        if (place.website) {
          menuUrl = await findMenuUrl(place.website)
        }

        // Insert into database
        const { error: insertErr } = await supabase
          .from('restaurants')
          .insert({
            name: place.name,
            address: place.address,
            lat: place.lat,
            lng: place.lng,
            town: place.town,
            is_open: isOpen,
            google_place_id: place.placeId,
            website_url: place.website,
            menu_url: menuUrl,
          })

        if (insertErr) {
          // Could be duplicate constraint — skip
          if (insertErr.message.includes('duplicate') || insertErr.message.includes('unique')) {
            results.push({ name: place.name, town: place.town, status: 'duplicate_skipped' })
          } else {
            results.push({ name: place.name, town: place.town, status: `error: ${insertErr.message}` })
          }
        } else {
          results.push({
            name: place.name,
            town: place.town,
            status: 'inserted',
            website_url: place.website || undefined,
            menu_url: menuUrl || undefined,
            is_open: isOpen,
            closed_signal: closedSignal || undefined,
          })
        }
      } catch (err) {
        results.push({ name: place.name, town: place.town, status: `error: ${String(err)}` })
      }
    }

    const inserted = results.filter(r => r.status === 'inserted').length
    const withWebsite = results.filter(r => r.website_url).length
    const withMenu = results.filter(r => r.menu_url).length
    const closedCount = results.filter(r => r.is_open === false).length

    return new Response(JSON.stringify({
      search_points: searchPoints.length,
      total_discovered: allDiscovered.size,
      already_existed: allDiscovered.size - newPlaces.length,
      new_found: newPlaces.length,
      inserted,
      with_website: withWebsite,
      with_menu: withMenu,
      marked_closed: closedCount,
      results,
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Discover error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
