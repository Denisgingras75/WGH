import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// System user ID for AI-estimated votes
const AI_SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://whats-good-here.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const REVIEW_EXTRACTION_PROMPT = `You are a food review analyst for a dish discovery app.

Given a restaurant review, extract every specific dish or menu item mentioned with its sentiment.

## Rules
1. Only extract SPECIFIC dishes/items (not "the food was great" — need "the lobster roll was amazing")
2. Include the reviewer's sentiment for each dish: positive, negative, or neutral
3. Include any descriptive phrases about each dish
4. If no specific dishes are mentioned, return empty array
5. Match dish names to the provided menu when possible

## Output Format
Return ONLY valid JSON (no markdown):
{
  "dishes": [
    {
      "dish_name": "Lobster Roll",
      "sentiment": "positive",
      "descriptive_phrases": ["amazing", "best on the island", "perfectly buttered"],
      "confidence": 0.9
    }
  ]
}`

interface GoogleReview {
  authorAttribution: { displayName: string }
  rating: number
  text: { text: string }
  relativePublishTimeDescription: string
  originalText?: { text: string }
}

interface ExtractedDishMention {
  dish_name: string
  sentiment: 'positive' | 'negative' | 'neutral'
  descriptive_phrases: string[]
  confidence: number
}

/**
 * Build a short review snippet from descriptive phrases (max 200 chars)
 */
function buildReviewSnippet(phrases: string[], rating: number | null): string | null {
  if (!phrases || phrases.length === 0) return null

  // Capitalize first phrase
  const capitalized = phrases.map((p, i) =>
    i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p
  )

  // Join phrases naturally
  let snippet: string
  if (capitalized.length === 1) {
    snippet = `${capitalized[0]}.`
  } else if (capitalized.length === 2) {
    snippet = `${capitalized[0]} and ${capitalized[1]}.`
  } else {
    const last = capitalized[capitalized.length - 1]
    const rest = capitalized.slice(0, -1).join(', ')
    snippet = `${rest}, and ${last}.`
  }

  // Add a closing sentiment if there's room
  const positive = rating != null && rating >= 7.0
  const closers = positive
    ? [' Would definitely order again.', ' A must-try.', ' Highly recommend.']
    : [' Probably wouldn\'t order again.', ' Not my favorite.']
  const closer = closers[Math.floor(Math.random() * closers.length)]

  if (snippet.length + closer.length <= 200) {
    snippet += closer
  }

  return snippet.length <= 200 ? snippet : snippet.slice(0, 197) + '...'
}

/**
 * Map Google star rating + AI sentiment to WGH 1-10 scale
 */
function mapToWghRating(googleStars: number, sentiment: string): number {
  let base: number
  if (googleStars >= 5) base = 9.0
  else if (googleStars >= 4) base = 7.5
  else if (googleStars >= 3) base = 6.0
  else if (googleStars >= 2) base = 4.0
  else base = 2.5

  if (sentiment === 'positive') base += 0.5
  else if (sentiment === 'negative') base -= 1.0

  // Add small random variance (+-0.3) to avoid algorithmic feel
  const variance = (Math.random() - 0.5) * 0.6
  base += variance

  return Math.round(Math.min(10.0, Math.max(1.0, base)) * 10) / 10
}

/**
 * Fetch reviews for a place via Google Places API (New)
 */
async function fetchGoogleReviews(placeId: string): Promise<GoogleReview[]> {
  const url = `https://places.googleapis.com/v1/places/${placeId}?languageCode=en`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': GOOGLE_API_KEY!,
      'X-Goog-FieldMask': 'reviews',
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`Google Places API error for ${placeId}: ${response.status} - ${errorBody}`)
    return []
  }

  const data = await response.json()
  return data.reviews || []
}

/**
 * Extract dish mentions from review text using Claude Haiku
 */
async function extractDishMentions(
  reviewText: string,
  restaurantName: string,
  menuDishes: string[]
): Promise<ExtractedDishMention[]> {
  const menuContext = menuDishes.length > 0
    ? `\n\nKnown menu items at ${restaurantName}:\n${menuDishes.join('\n')}`
    : ''

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Restaurant: ${restaurantName}${menuContext}\n\nReview:\n"${reviewText}"`,
      }],
      system: REVIEW_EXTRACTION_PROMPT,
    }),
  })

  if (!response.ok) {
    console.error(`Claude API error: ${response.status}`)
    return []
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return []
    const parsed = JSON.parse(jsonMatch[0])
    return Array.isArray(parsed.dishes) ? parsed.dishes : []
  } catch {
    return []
  }
}

/**
 * Fuzzy match extracted dish name to actual DB dish
 */
function findMatchingDish(
  extractedName: string,
  dbDishes: Array<{ id: string; name: string }>
): { id: string; name: string } | null {
  const lower = extractedName.toLowerCase().trim()

  // Exact match
  const exact = dbDishes.find(d => d.name.toLowerCase() === lower)
  if (exact) return exact

  // Substring match
  const substr = dbDishes.find(d =>
    lower.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(lower)
  )
  if (substr) return substr

  // Word overlap (at least 2 matching words)
  const extractedWords = new Set(lower.split(/\s+/))
  const wordMatch = dbDishes.find(d => {
    const dishWords = d.name.toLowerCase().split(/\s+/)
    const overlap = dishWords.filter(w => extractedWords.has(w))
    return overlap.length >= 2 || (dishWords.length === 1 && extractedWords.has(dishWords[0]))
  })
  return wordMatch || null
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth gate: require admin user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const supabaseUrl_ = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey_ = Deno.env.get('SUPABASE_ANON_KEY')!
    const authClient = createClient(supabaseUrl_, supabaseAnonKey_, {
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

    if (!GOOGLE_API_KEY || !ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing API keys' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Optional: process single restaurant
    let body: Record<string, unknown> = {}
    try { body = await req.json() } catch { /* batch mode */ }

    // Debug mode: test Google API directly
    if (body.debug && body.place_id) {
      const debugUrl = `https://places.googleapis.com/v1/places/${body.place_id}?languageCode=en`
      const debugResp = await fetch(debugUrl, {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': GOOGLE_API_KEY!,
          'X-Goog-FieldMask': 'reviews',
        },
      })
      const debugBody = await debugResp.text()
      return new Response(JSON.stringify({
        status: debugResp.status,
        body: debugBody,
        api_key_present: !!GOOGLE_API_KEY,
        api_key_length: GOOGLE_API_KEY?.length || 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch restaurants with google_place_id
    let query = supabase
      .from('restaurants')
      .select('id, name, google_place_id')
      .not('google_place_id', 'is', null)

    if (body.restaurant_id) {
      query = query.eq('id', body.restaurant_id)
    }

    const { data: restaurants, error: fetchErr } = await query
    if (fetchErr || !restaurants?.length) {
      return new Response(JSON.stringify({
        error: fetchErr?.message || 'No restaurants with google_place_id found',
      }), {
        status: fetchErr ? 500 : 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: Array<{
      restaurant: string
      reviews_fetched: number
      dishes_matched: number
      votes_inserted: number
      status: string
    }> = []

    for (const restaurant of restaurants) {
      try {
        console.log(`Processing reviews for: ${restaurant.name}`)

        // 1. Fetch Google reviews
        const reviews = await fetchGoogleReviews(restaurant.google_place_id)
        if (reviews.length === 0) {
          results.push({
            restaurant: restaurant.name,
            reviews_fetched: 0,
            dishes_matched: 0,
            votes_inserted: 0,
            status: 'no reviews found',
          })
          continue
        }

        // 2. Get existing dishes for this restaurant (for matching)
        const { data: dbDishes } = await supabase
          .from('dishes')
          .select('id, name')
          .eq('restaurant_id', restaurant.id)
          .is('parent_dish_id', null)

        const dishList = dbDishes || []
        const dishNames = dishList.map(d => d.name)

        let totalMatched = 0
        let totalInserted = 0

        // 3. Process each review
        for (const review of reviews) {
          const reviewText = review.originalText?.text || review.text?.text || ''
          if (!reviewText || reviewText.length < 20) continue

          // Extract dish mentions via Claude
          const mentions = await extractDishMentions(reviewText, restaurant.name, dishNames)

          for (const mention of mentions) {
            if (mention.confidence < 0.5) continue

            const matched = findMatchingDish(mention.dish_name, dishList)
            if (!matched) continue

            totalMatched++

            const rating10 = mapToWghRating(review.rating, mention.sentiment)
            // Phase 2: the votes.would_order_again column is nullable and no longer
            // surfaced anywhere. Insert NULL; the snippet builder derives its own
            // positive/negative closer from the rating.
            const wghRating = rating10

            // Check if we already seeded this dish (avoid duplicates)
            const { data: existing } = await supabase
              .from('votes')
              .select('id')
              .eq('dish_id', matched.id)
              .eq('source', 'ai_estimated')
              .limit(5)

            // Max 3 AI votes per dish to avoid over-seeding
            if ((existing?.length || 0) >= 3) continue

            const reviewSnippet = buildReviewSnippet(mention.descriptive_phrases, wghRating)

            const { error: insertErr } = await supabase.from('votes').insert({
              dish_id: matched.id,
              user_id: AI_SYSTEM_USER_ID,
              would_order_again: null,
              rating_10: rating10,
              review_text: reviewSnippet,
              source: 'ai_estimated',
              source_metadata: {
                google_rating: review.rating,
                sentiment: mention.sentiment,
                confidence: mention.confidence,
                reviewer_name: review.authorAttribution?.displayName || 'Anonymous',
              },
            })

            if (!insertErr) totalInserted++
          }

          await sleep(500)
        }

        results.push({
          restaurant: restaurant.name,
          reviews_fetched: reviews.length,
          dishes_matched: totalMatched,
          votes_inserted: totalInserted,
          status: 'success',
        })
      } catch (err) {
        console.error(`Error processing ${restaurant.name}:`, err)
        results.push({
          restaurant: restaurant.name,
          reviews_fetched: 0,
          dishes_matched: 0,
          votes_inserted: 0,
          status: `error: ${String(err)}`,
        })
      }

      await sleep(1000)
    }

    const totalVotes = results.reduce((sum, r) => sum + r.votes_inserted, 0)
    const successCount = results.filter(r => r.status === 'success').length

    return new Response(JSON.stringify({
      processed: restaurants.length,
      success: successCount,
      total_votes_inserted: totalVotes,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Seed reviews error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
