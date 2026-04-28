#!/usr/bin/env bash
# Bulk-trigger menu-refresh for Oak Bluffs restaurants needing population/refresh.
#
# Usage:
#   CRON_SECRET='<paste>' bash scripts/refresh-oak-bluffs-menus.sh
#
# Targets:
#   - 3 restaurants with menu_url but never populated (last_checked 2026-02-16)
#   - 12 restaurants with stale menus (last_checked > 60 days, before May summer-menu drop)

set -euo pipefail

if [[ -z "${CRON_SECRET:-}" ]]; then
  echo "ERROR: CRON_SECRET env var not set." >&2
  echo "Get it from Supabase Vault, then run:" >&2
  echo "  CRON_SECRET='...' bash $0" >&2
  exit 1
fi

# Source the project URL from .env.local (worktree)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
set -a; . "$SCRIPT_DIR/.env.local"; set +a

ENDPOINT="${VITE_SUPABASE_URL}/functions/v1/menu-refresh"

# Restaurants to refresh (by name; ids resolved at runtime)
declare -a TARGETS=(
  # 3 stuck-empty (menu_url present, last_checked 2026-02-16, never populated)
  "Aalia's"
  "Farm Neck Cafe"
  "Mocha Mott's"
  # 3 newly URL'd via supabase/seed/oak_bluffs_missing_menus.sql — run that first
  "Linda Jean's Restaurant"
  "The Loud Kitchen Experience"
  "ESH"  # was "Dos Mas" — rebranded 2026-03-31
  # 12 with stale menu_last_checked = 2026-02-16
  "Bangkok Cuisine"
  "Catboat"
  "Dock Street"
  "Fat Ronnie's Burger Bar"
  "Lookout Tavern"
  "Nat's Nook"
  "SANDBAR"
  "The Ritz • Martha's Vineyard"
  "Vineyard Caribbean Cuisine"
  "Wolf's Den Pizzeria"
)

# Resolve restaurant ids by name via REST
echo "Resolving restaurant ids…"
RESTAURANT_DATA=$(curl -s "${VITE_SUPABASE_URL}/rest/v1/restaurants?town=eq.Oak%20Bluffs&select=id,name" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}")

queue_count=0
for name in "${TARGETS[@]}"; do
  rid=$(echo "$RESTAURANT_DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)
target = sys.argv[1]
match = [r for r in data if r['name'] == target]
print(match[0]['id'] if match else '')
" "$name")

  if [[ -z "$rid" ]]; then
    echo "  ✗ $name — NOT FOUND in restaurants table"
    continue
  fi

  resp=$(curl -s -X POST "$ENDPOINT" \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    -H "Content-Type: application/json" \
    -d "{\"restaurant_id\":\"$rid\"}")

  if echo "$resp" | grep -qE '"job_id"|"status":"queued"|"enqueued"'; then
    echo "  ✓ $name ($rid) — enqueued"
    queue_count=$((queue_count + 1))
  else
    echo "  ⚠ $name ($rid) — response: $resp"
  fi
done

echo ""
echo "Enqueued $queue_count job(s). Draining the queue…"

# Drain the queue (processes all queued jobs)
drain_resp=$(curl -s -X POST "$ENDPOINT" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"mode":"queue"}')

echo "$drain_resp" | python3 -m json.tool 2>/dev/null || echo "$drain_resp"

echo ""
echo "Done. Verify by querying dish counts again, or load /restaurants/<id> in the app."
