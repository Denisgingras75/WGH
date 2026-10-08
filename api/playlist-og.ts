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
  // "Quiet" palette — keep in sync with src/index.css :root (SVG can't read CSS vars)
  const INK = '#141414'
  const TILE = '#F3F1EC'
  const DISPLAY = "'Newsreader', 'Iowan Old Style', Georgia, 'Times New Roman', serif"
  const BODY = "'Instrument Sans', 'Helvetica Neue', Arial, sans-serif"
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FFFFFF"/>
  <text x="60" y="62" font-family="${DISPLAY}" font-size="28" font-weight="500" fill="${INK}">What’s <tspan font-style="italic" font-weight="400">Good</tspan> Here</text>
  ${tiles.map((emoji, i) => {
    const x = 60 + (i % 2) * 164
    const y = 100 + Math.floor(i / 2) * 164
    return `<rect x="${x}" y="${y}" width="152" height="152" rx="14" fill="${TILE}"/>
    <text x="${x + 76}" y="${y + 92}" font-size="68" text-anchor="middle" dominant-baseline="middle">${emoji}</text>`
  }).join('\n  ')}
  <text x="440" y="236" font-family="${DISPLAY}" font-size="64" font-weight="500" letter-spacing="-1.5" fill="${INK}">${escapeXml(title.length > 30 ? title.slice(0, 28) + '…' : title)}</text>
  <text x="440" y="294" font-family="${BODY}" font-size="26" font-weight="500" fill="#5C5C5C">${escapeXml(byline)}</text>
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
