#!/usr/bin/env node

/**
 * Classify dish "inclusion" signal for value rankings (Phase 1).
 *
 * Reads dishes that already have a menu `description` and asks Claude to infer
 * what the dish comes with — whether it includes side(s), which ones, and how
 * complete a meal it is. Writes the result to dishes.includes_sides /
 * included_sides / meal_completeness / inclusion_inferred_at.
 *
 * This is a STANDALONE backfill over data we already store — it does NOT touch
 * the menu-parsing edge functions. Going-forward parse-time classification is a
 * separate (coordinated) change.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_KEY=... \
 *     node scripts/classify-dish-inclusions.mjs [--limit N] [--batch 20] [--dry-run] [--recheck]
 *
 * Flags:
 *   --limit N    only process N dishes (default: all eligible)
 *   --batch N    dishes per Claude call (default: 20)
 *   --dry-run    print classifications, write nothing
 *   --recheck    re-classify dishes already classified (default: only unclassified)
 *
 * Env (or .env.local): SUPABASE_URL, SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY),
 *   ANTHROPIC_API_KEY, optional CLAUDE_MODEL (default claude-haiku-4-5).
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

function loadEnv() {
  try {
    const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8')
    for (const line of envFile.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    // .env.local optional if env vars set directly
  }
}

loadEnv()

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const anthropicKey = process.env.ANTHROPIC_API_KEY
const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5'

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) required')
  process.exit(1)
}
if (!anthropicKey) {
  console.error('Error: ANTHROPIC_API_KEY required')
  process.exit(1)
}

const args = process.argv.slice(2)
function flagValue(name, fallback) {
  const i = args.indexOf(name)
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback
}
const LIMIT = flagValue('--limit', null) ? parseInt(flagValue('--limit'), 10) : null
const BATCH = parseInt(flagValue('--batch', '20'), 10)
const DRY_RUN = args.includes('--dry-run')
const RECHECK = args.includes('--recheck')

const supabase = createClient(supabaseUrl, supabaseKey)

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You classify restaurant dishes by what they COME WITH, for a food-value ranking.

You receive a JSON array of dishes (id, name, category, menu_section, price, description).
For each, decide what is INCLUDED in the price based ONLY on the description text.

Return ONLY a JSON array, one object per input dish, in the same order:
[{ "id": "<uuid>", "includes_sides": true|false|null, "included_sides": ["fries","coleslaw"], "meal_completeness": "a_la_carte"|"comes_with_sides"|"full_platter"|null }]

Rules:
- A "side" is a separate accompaniment served alongside the main: fries/chips, mashed/baked/roasted potatoes, rice, coleslaw, side salad, vegetable/greens, beans, bread roll, soup. It is NOT a core ingredient of the dish itself (a burger's bun, lettuce, tomato, sauce, or cheese are NOT sides; the slaw inside a taco is NOT a side).
- includes_sides = true ONLY if the description names at least one accompaniment served with the dish. List those in included_sides (lowercase, short names).
- meal_completeness:
    - "full_platter" = two or more included sides, or an explicit combo/platter.
    - "comes_with_sides" = exactly one included side.
    - "a_la_carte" = the protein/dish alone, no included side.
- If the description is only ingredients with no clear accompaniment, treat as "a_la_carte" with includes_sides=false.
- If you genuinely cannot tell (too sparse/ambiguous), use includes_sides=null, included_sides=[], meal_completeness=null. NEVER guess.
- Output valid JSON only. No prose, no markdown.`

async function classifyBatch(dishes) {
  const payload = dishes.map((d) => ({
    id: d.id,
    name: d.name,
    category: d.category,
    menu_section: d.menu_section,
    price: d.price,
    description: d.description,
  }))

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(payload) }],
    }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Anthropic API ${resp.status}: ${text}`)
  }

  const data = await resp.json()
  const responseText = data.content?.[0]?.text || ''
  const jsonMatch = responseText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No JSON array in model response: ' + responseText.slice(0, 200))
  return JSON.parse(jsonMatch[0])
}

const VALID_COMPLETENESS = ['a_la_carte', 'comes_with_sides', 'full_platter']

function sanitize(result) {
  const includes = result.includes_sides
  let completeness = VALID_COMPLETENESS.includes(result.meal_completeness) ? result.meal_completeness : null
  let sides = Array.isArray(result.included_sides)
    ? result.included_sides.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim().toLowerCase()).slice(0, 8)
    : []
  // Keep the three fields internally consistent.
  if (includes === false) { sides = []; if (completeness === null) completeness = 'a_la_carte' }
  if (includes === null) { sides = []; completeness = null }
  return {
    includes_sides: includes === true || includes === false ? includes : null,
    included_sides: sides,
    meal_completeness: completeness,
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Classifying dish inclusions  (model=${model}, batch=${BATCH}, dryRun=${DRY_RUN}, recheck=${RECHECK}${LIMIT ? `, limit=${LIMIT}` : ''})`)

  let query = supabase
    .from('dishes')
    .select('id, name, category, menu_section, price, description')
    .not('description', 'is', null)
    .neq('description', '')
    .order('id', { ascending: true })

  if (!RECHECK) query = query.is('inclusion_inferred_at', null)
  if (LIMIT) query = query.limit(LIMIT)

  const { data: dishes, error } = await query
  if (error) { console.error('Failed to fetch dishes:', error.message); process.exit(1) }

  console.log(`Eligible dishes: ${dishes.length}`)
  if (dishes.length === 0) return

  let processed = 0
  let written = 0
  let unknown = 0
  const counts = { a_la_carte: 0, comes_with_sides: 0, full_platter: 0 }

  for (let i = 0; i < dishes.length; i += BATCH) {
    const batch = dishes.slice(i, i + BATCH)
    let results
    try {
      results = await classifyBatch(batch)
    } catch (err) {
      console.error(`  Batch ${i}-${i + batch.length} failed: ${err.message}`)
      continue
    }

    const byId = new Map(results.map((r) => [r.id, r]))
    for (const dish of batch) {
      const raw = byId.get(dish.id)
      processed++
      if (!raw) { unknown++; continue }
      const clean = sanitize(raw)
      if (clean.meal_completeness) counts[clean.meal_completeness]++
      if (clean.includes_sides === null) unknown++

      if (DRY_RUN) {
        console.log(`  ${dish.name} [${dish.category}] -> ${clean.meal_completeness || 'unknown'} ${clean.included_sides.length ? '(' + clean.included_sides.join(', ') + ')' : ''}`)
        continue
      }

      const { error: upErr } = await supabase
        .from('dishes')
        .update({
          includes_sides: clean.includes_sides,
          included_sides: clean.included_sides,
          meal_completeness: clean.meal_completeness,
          inclusion_inferred_at: new Date().toISOString(),
        })
        .eq('id', dish.id)
      if (upErr) console.error(`  Update failed for ${dish.id}: ${upErr.message}`)
      else written++
    }

    console.log(`  ...${Math.min(i + BATCH, dishes.length)}/${dishes.length}`)
    // Gentle pacing between Claude calls.
    await new Promise((r) => setTimeout(r, 600))
  }

  console.log('\nDone.')
  console.log(`  processed: ${processed}`)
  console.log(`  written:   ${written}${DRY_RUN ? ' (dry run — nothing written)' : ''}`)
  console.log(`  unknown:   ${unknown}`)
  console.log(`  completeness breakdown:`, counts)
}

main().catch((err) => { console.error(err); process.exit(1) })
