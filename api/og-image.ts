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

  // "Quiet" palette — keep in sync with src/index.css :root (SVG can't read CSS vars)
  const INK = '#141414'
  const PAPER = '#FFFFFF'
  const TEXT_2 = '#5C5C5C'
  const TEXT_3 = '#707070'
  const RULE = '#EAE8E3'
  const BRAND = '#C8361B'
  const RATING = '#1E6E45'
  const DISPLAY = "'Newsreader', 'Iowan Old Style', Georgia, 'Times New Roman', serif"
  const BODY = "'Instrument Sans', 'Helvetica Neue', Arial, sans-serif"

  const titleY = badge ? 318 : 290
  const pin = 'M100 20 C60 20, 30 50, 30 90 C30 130, 100 185, 100 185 C100 185, 170 130, 170 90 C170 50, 140 20, 100 20 Z'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPER}"/>

  <!-- Mark + wordmark -->
  <g transform="translate(88 70) scale(0.3)">
    <path d="${pin}" fill="${BRAND}"/>
    <circle cx="100" cy="90" r="46" fill="${PAPER}"/>
    <circle cx="84" cy="80" r="7" fill="${INK}"/>
    <circle cx="116" cy="80" r="7" fill="${INK}"/>
    <path d="M78 100 Q 100 124, 122 100" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
  </g>
  <text x="160" y="118" font-family="${DISPLAY}" font-size="34" font-weight="500" fill="${INK}">What’s <tspan font-style="italic" font-weight="400">Good</tspan> Here</text>

  ${badge ? `
  <!-- Badge -->
  <text x="96" y="232" font-family="${BODY}" font-size="20" font-weight="600" letter-spacing="3" fill="${TEXT_3}">${esc(badge.toUpperCase())}</text>
  ` : ''}

  <!-- Main title -->
  <text x="96" y="${titleY}" font-family="${DISPLAY}" font-size="${titleSize + 16}" font-weight="500" letter-spacing="-1.5" fill="${INK}">${esc(displayTitle)}</text>

  <!-- Subtitle -->
  <text x="96" y="${titleY + 58}" font-family="${BODY}" font-size="28" font-weight="500" fill="${TEXT_2}">${esc(subtitle)}</text>

  ${rating ? `
  <!-- Rating -->
  <line x1="96" y1="${titleY + 104}" x2="1104" y2="${titleY + 104}" stroke="${RULE}" stroke-width="2"/>
  <text x="96" y="${titleY + 168}" font-family="${DISPLAY}" font-size="48" font-weight="400" letter-spacing="-1" fill="${RATING}">${esc(rating)}</text>
  ` : ''}

  <!-- Footer -->
  <text x="96" y="566" font-family="${BODY}" font-size="22" font-weight="500" fill="${TEXT_3}">whats-good-here.vercel.app</text>
</svg>`
}
