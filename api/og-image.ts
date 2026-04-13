import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

/**
 * Dynamic OG Image Generator
 *
 * Generates an SVG-based OG image for dishes and restaurants.
 * Returns an SVG that social crawlers render as the preview image.
 *
 * Usage:
 *   /api/og-image?type=dish&id=uuid
 *   /api/og-image?type=restaurant&id=uuid
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { type, id } = req.query

  if (!type || !id || typeof type !== 'string' || typeof id !== 'string') {
    return res.status(400).json({ error: 'type and id required' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  let title = "What's Good Here"
  let subtitle = 'Find the best dishes near you'
  let rating = ''
  let badge = ''

  try {
    if (type === 'dish') {
      const { data: dish } = await supabase
        .from('dishes')
        .select('name, category, price, photo_url, restaurant_id, avg_rating, total_votes')
        .eq('id', id)
        .maybeSingle()

      if (dish) {
        title = dish.name

        // Get restaurant name
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('name, town')
          .eq('id', dish.restaurant_id)
          .maybeSingle()

        subtitle = restaurant ? `${restaurant.name} · ${restaurant.town || ''}` : ''

        // Rating-first stats (no binary vote)
        const { count: totalVotes } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('dish_id', id)

        const votes = dish.total_votes ?? totalVotes ?? 0
        const avg = dish.avg_rating != null ? Number(dish.avg_rating) : null

        if (votes >= 5 && avg != null) {
          rating = `${avg.toFixed(1)}/10 · ${votes} ratings`
          if (avg >= 9.0) badge = 'GREAT'
          else if (avg >= 8.0) badge = 'Great Here'
        } else if (votes > 0) {
          rating = `${votes} rating${votes === 1 ? '' : 's'}`
        }

        if (dish.price) {
          subtitle += ` · $${dish.price}`
        }
      }
    } else if (type === 'restaurant') {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('name, town, address')
        .eq('id', id)
        .maybeSingle()

      if (restaurant) {
        title = restaurant.name
        subtitle = restaurant.town || restaurant.address || ''

        // Get dish count
        const { count } = await supabase
          .from('dishes')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', id)

        if (count) {
          rating = `${count} dishes ranked`
        }
      }
    }
  } catch {
    // Fall through with defaults
  }

  // Generate SVG OG image (1200x630 is the standard)
  const svg = generateOgSvg(title, subtitle, rating, badge)

  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  return res.status(200).send(svg)
}

function generateOgSvg(title: string, subtitle: string, rating: string, badge: string): string {
  // Escape XML entities
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  // Truncate title if too long
  const displayTitle = title.length > 40 ? title.slice(0, 37) + '...' : title
  const titleSize = displayTitle.length > 25 ? 48 : 56

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0D1B22"/>
      <stop offset="100%" stop-color="#1A3A42"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#D9A765"/>
      <stop offset="100%" stop-color="#E8C088"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Subtle top accent line -->
  <rect x="0" y="0" width="1200" height="4" fill="url(#gold)"/>

  <!-- Bottom accent line -->
  <rect x="0" y="626" width="1200" height="4" fill="url(#gold)"/>

  <!-- Brand wordmark area -->
  <text x="80" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" fill="#7D7168">
    WHAT'S <tspan fill="#D9A765">GOOD</tspan> HERE
  </text>

  ${badge ? `
  <!-- Badge -->
  <rect x="80" y="140" width="${badge.length * 18 + 40}" height="44" rx="22" fill="#D9A765" opacity="0.15"/>
  <text x="100" y="168" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="#D9A765">${esc(badge)}</text>
  ` : ''}

  <!-- Main title -->
  <text x="80" y="${badge ? 250 : 220}" font-family="system-ui, -apple-system, sans-serif" font-size="${titleSize}" font-weight="700" fill="#F5F1E8">
    ${esc(displayTitle)}
  </text>

  <!-- Subtitle -->
  <text x="80" y="${badge ? 305 : 275}" font-family="system-ui, -apple-system, sans-serif" font-size="26" fill="#B8A99A">
    ${esc(subtitle)}
  </text>

  ${rating ? `
  <!-- Rating -->
  <text x="80" y="${badge ? 370 : 340}" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" fill="#6BB384">
    ${esc(rating)}
  </text>
  ` : ''}

  <!-- Decorative circle (brand element) -->
  <circle cx="1050" cy="315" r="160" fill="none" stroke="#D9A765" stroke-width="1" opacity="0.1"/>
  <circle cx="1050" cy="315" r="120" fill="none" stroke="#D9A765" stroke-width="1" opacity="0.08"/>

  <!-- Bottom CTA -->
  <text x="80" y="570" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#7D7168">
    whats-good-here.vercel.app
  </text>
</svg>`
}
