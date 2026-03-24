import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Backfill Restaurants Edge Function (one-shot admin tool)
 *
 * For each restaurant missing google_place_id:
 *   1. Text-search Google Places for "{name} {town} Massachusetts"
 *   2. Store google_place_id, website_url, lat, lng
 *   3. Try to find menu_url by probing common paths on the website
 *
 * Auth: requires service_role key (admin only)
 * Rate: 200ms between Google API calls
 *
 * POST {} — process all restaurants missing google_place_id
 * POST { limit: 10 } — process up to N restaurants
 * POST { town: "Oak Bluffs" } — process only one town
 */

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://whats-good-here.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const MENU_PATHS = [
  '/menu',
  '/menus',
  '/food-menu',
  '/dinner-menu',
  '/food',
  '/food-drink',
  '/food--drinks',
  '/eat',
  '/dining',
]

/**
 * Try to find a menu page on a restaurant's website
 */
async function findMenuUrl(websiteUrl: string): Promise<string | null> {
  if (!websiteUrl) return null

  // Normalize base URL
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
        headers: { 'User-Agent': 'WhatsGoodHere-Bot/1.0' },
      })

      clearTimeout(timeout)

      if (res.ok) {
        return candidate
      }
    } catch {
      // timeout or network error — skip
    }
  }

  return null
}

/**
 * Search Google Places for a restaurant by name + town
 */
async function searchPlace(name: string, town: string): Promise<{
  placeId: string | null
  websiteUrl: string | null
  lat: number | null
  lng: number | null
  address: string | null
}> {
  const query = `${name} ${town} Massachusetts`

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY!,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.websiteUri',
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 1,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error(`Google Places error for "${name}":`, errText)
    return { placeId: null, websiteUrl: null, lat: null, lng: null, address: null }
  }

  const data = await response.json()
  const place = data.places?.[0]

  if (!place) {
    return { placeId: null, websiteUrl: null, lat: null, lng: null, address: null }
  }

  return {
    placeId: place.id || null,
    websiteUrl: place.websiteUri || null,
    lat: place.location?.latitude || null,
    lng: place.location?.longitude || null,
    address: place.formattedAddress || null,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth gate: require service_role or admin user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    // Verify the caller is an admin by checking with anon client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: authUser } } = await authClient.auth.getUser()
    if (!authUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const { data: adminRow } = await authClient.from('admins').select('user_id').eq('user_id', authUser.id).maybeSingle()
    if (!adminRow) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'GOOGLE_PLACES_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let body: Record<string, unknown> = {}
    try {
      body = await req.json()
    } catch {
      // empty body = all
    }

    const limit = (body.limit as number) || 100
    const townFilter = body.town as string | undefined

    // Fetch restaurants missing google_place_id
    let query = supabase
      .from('restaurants')
      .select('id, name, town')
      .is('google_place_id', null)
      .eq('is_open', true)
      .limit(limit)

    if (townFilter) {
      query = query.eq('town', townFilter)
    }

    const { data: restaurants, error: fetchErr } = await query.order('town').order('name')

    if (fetchErr) {
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!restaurants || restaurants.length === 0) {
      return new Response(JSON.stringify({ message: 'No restaurants need backfill', processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: Array<{
      name: string
      town: string
      status: string
      google_place_id?: string
      website_url?: string
      menu_url?: string
    }> = []

    for (const restaurant of restaurants) {
      try {
        console.log(`Looking up: ${restaurant.name} (${restaurant.town})`)

        // Search Google Places
        const place = await searchPlace(restaurant.name, restaurant.town)
        await sleep(200)

        if (!place.placeId) {
          results.push({ name: restaurant.name, town: restaurant.town, status: 'not_found' })
          continue
        }

        // Try to find menu URL
        let menuUrl: string | null = null
        if (place.websiteUrl) {
          menuUrl = await findMenuUrl(place.websiteUrl)
        }

        // Update restaurant
        const updates: Record<string, unknown> = {
          google_place_id: place.placeId,
        }
        if (place.websiteUrl) updates.website_url = place.websiteUrl
        if (place.lat) updates.lat = place.lat
        if (place.lng) updates.lng = place.lng
        if (place.address) updates.address = place.address
        if (menuUrl) updates.menu_url = menuUrl

        const { error: updateErr } = await supabase
          .from('restaurants')
          .update(updates)
          .eq('id', restaurant.id)

        if (updateErr) {
          results.push({ name: restaurant.name, town: restaurant.town, status: `error: ${updateErr.message}` })
        } else {
          results.push({
            name: restaurant.name,
            town: restaurant.town,
            status: 'updated',
            google_place_id: place.placeId,
            website_url: place.websiteUrl || undefined,
            menu_url: menuUrl || undefined,
          })
        }
      } catch (err) {
        console.error(`Error for ${restaurant.name}:`, err)
        results.push({ name: restaurant.name, town: restaurant.town, status: `error: ${String(err)}` })
      }
    }

    const updated = results.filter(r => r.status === 'updated').length
    const withWebsite = results.filter(r => r.website_url).length
    const withMenu = results.filter(r => r.menu_url).length

    return new Response(JSON.stringify({
      processed: restaurants.length,
      updated,
      with_website: withWebsite,
      with_menu: withMenu,
      results,
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Backfill error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
