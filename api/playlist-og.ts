import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

// Uses the ANON key so RLS naturally filters private/nonexistent playlists.
// Returns the same generic SVG for both — no existence oracle.

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderSvg(title: string, byline: string, emojis: string[]): string {
  const tiles = [0, 1, 2, 3].map(i => emojis[i] || '🍽️')
  // "Lobster Buoy" inks — keep in sync with src/index.css :root (SVG can't read CSS vars)
  const INK = '#1B1611'
  const colors = ['#CA3216', '#FFC83D', '#1F4FA3', '#F9DDB8']
  const DISPLAY = "'Bricolage Grotesque', 'Arial Black', 'Helvetica Neue', Arial, sans-serif"
  const BODY = "'Instrument Sans', 'Helvetica Neue', Arial, sans-serif"
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#F6EEDC"/>
  <text x="60" y="58" font-family="${DISPLAY}" font-size="26" font-weight="800" fill="${INK}">What’s Good Here</text>
  ${tiles.map((emoji, i) => {
    const x = 60 + (i % 2) * 160
    const y = 92 + Math.floor(i / 2) * 160
    return `<rect x="${x + 5}" y="${y + 5}" width="148" height="148" rx="18" fill="${INK}"/>
    <rect x="${x}" y="${y}" width="148" height="148" rx="18" fill="${colors[i]}" stroke="${INK}" stroke-width="4"/>
    <text x="${x + 74}" y="${y + 92}" font-size="72" text-anchor="middle" dominant-baseline="middle">${emoji}</text>`
  }).join('\n  ')}
  <text x="430" y="226" font-family="${DISPLAY}" font-size="60" font-weight="800" letter-spacing="-2" fill="${INK}">${escapeXml(title.length > 30 ? title.slice(0, 28) + '…' : title)}</text>
  <text x="430" y="286" font-family="${BODY}" font-size="26" font-weight="600" fill="#554A3E">${escapeXml(byline)}</text>
</svg>`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  let title = 'Playlist not found'
  let byline = 'This playlist may be private or no longer exists.'
  let emojis: string[] = []

  if (id && UUID_RE.test(id)) {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data } = await sb.rpc('get_playlist_detail', { p_playlist_id: id })
    const playlist = data?.[0]
    if (playlist) {
      title = playlist.title
      byline = `by ${playlist.owner_display_name || 'Unknown'} · ${playlist.item_count} dishes · ${playlist.follower_count} followers`
      emojis = playlist.cover_categories || []
    }
  }

  // Same 200 OK for found + private + nonexistent — no existence oracle.
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30')
  res.status(200).send(renderSvg(title, byline, emojis))
}
