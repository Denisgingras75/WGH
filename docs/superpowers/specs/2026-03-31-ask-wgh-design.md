# Ask WGH — Conversational Dish Finder

> Spec date: 2026-03-31
> Status: Approved, ready for implementation
> Priority: #1 for Memorial Day launch (May 25, 2026)

---

## Overview

Ask WGH is a conversational AI dish finder — the app's "Ask Maps" moment but for food. Users type a natural language question ("I'm near OB with kids, want something quick") and get real dish recommendations backed by vote data. Powered by Claude Sonnet 4.6 via a Supabase Edge Function.

**Core principle:** Every recommendation comes from the database. Claude never invents dishes, restaurants, or ratings.

---

## Architecture

### Data Flow

```
User taps Ask icon → Bottom sheet opens → Types question → Submit
    ↓
Frontend POST to Supabase Edge Function /ask-wgh
  Body: { question, user_lat?, user_lng?, user_id? }
  Auth header if logged in (optional)
    ↓
Edge Function:
  1. Rate limit check (RPC: 2/hr guest, 6/hr logged in)
  2. Query ranked dishes (RPC: get_ranked_dishes with location, or broad query)
  3. If logged in: query user vote history + taste stats
  4. Build prompt: system prompt + dish data + user context + question
  5. Call Claude Sonnet 4.6 via Anthropic API (raw fetch, not SDK)
  6. Parse response: extract [[dish:ID|Name]] links
  7. Return JSON: { answer, dishes_mentioned, remaining_asks }
    ↓
Frontend renders answer in bottom sheet
  Dish/restaurant names are tappable links
```

### Why This Architecture

- **Pre-fetch + context stuffing** over tool use: ~300 MV dishes fit in ~15K tokens. Single API call = faster, cheaper, no tool-calling failure modes. Revisit tool use when dataset outgrows context window.
- **Supabase Edge Function** over Vercel serverless: co-located with database, follows existing edge function patterns (places-autocomplete, etc.), auth/rate-limit RPCs available natively.
- **Sonnet 4.6** over Haiku: marquee feature needs quality voice. ~$0.05/ask vs $0.02. At 200 asks/day = ~$300/month. Can downgrade later if costs matter.

---

## System Prompt

```
You are the local dish expert for What's Good Here — a food discovery app.
You answer like a knowledgeable friend who's eaten everywhere and remembers
what's great. Casual but articulate. Never stiff, never sloppy.

RULES:
- Only recommend dishes from the DATA below. Never invent dishes or restaurants.
- Default: one best pick for vague questions. If they want options, give top 3
  with variety.
- No dead ends. If you can't match exactly, pivot: "No Ethiopian, but if you
  want bold flavors, try..."
- Communicate vote confidence honestly: "9.4 backed by 142 voters" vs "9.2 but
  only 4 votes — early word is strong."
- Use real prices when available. Fall back to vibe (casual vs fine dining) when not.
- For dietary questions, do your best from dish names/categories, always add
  "confirm with the restaurant."
- Never badmouth any restaurant or dish. Steer toward the good.
- Never give health or allergy advice beyond "check with the restaurant."
- Never share another user's data.
- Keep answers concise — 2-4 sentences for simple questions, up to a short
  paragraph for restaurant deep-dives.
- When mentioning a dish, format as: [[dish:UUID|Dish Name]]
- When mentioning a restaurant, format as: [[restaurant:UUID|Restaurant Name]]
- If the user asks about something outside food (ferry schedules, beaches, etc.),
  briefly acknowledge and redirect: "I'm all about the food — but speaking of
  the harbor, have you tried..."
```

---

## Data Injection

### Dish Data Format

Compact text (not JSON — saves tokens):

```
DISHES (ranked by community votes, nearest first):
#1 Lobster Roll | Larsen's Fish Market | Menemsha | $28 | 9.4 (142 votes) | seafood | id:abc123 | rid:xyz789
#2 Fish Tacos | The Bite | Menemsha | $16 | 9.2 (98 votes) | tacos | id:def456 | rid:xyz789
#3 Fried Clams | The Net Result | Vineyard Haven | $22 | 9.1 (67 votes) | seafood | id:ghi789 | rid:uvw321
...
```

Fields per line: rank, dish name, restaurant name, town, price (or "market" if null), rating (vote count), category, dish ID, restaurant ID.

~300 dishes x ~50 tokens = ~15K input tokens.

### User Context (logged-in only)

```
YOUR FOOD HISTORY:
- Voted on 23 dishes. Favorites: Lobster Roll at Larsen's (9/10), Fish Tacos at The Bite (8/10)
- You tend to rate generously (your average: 7.8 vs community average: 7.2)
- Top categories: seafood (8 votes), tacos (5 votes), breakfast (4 votes)
- Highly rated dishes you haven't tried: [top 5 from preferred categories]
```

Sourced from: `votesApi.getUserVotes()`, `profileApi.getRatingBias()`, `profileApi.getTasteStats()`.

---

## Rate Limiting

### Server-Side

New RPC convenience wrapper:
```sql
CREATE OR REPLACE FUNCTION check_ask_rate_limit()
RETURNS JSONB AS $$
BEGIN
  RETURN check_and_record_rate_limit('ask_wgh', 6, 3600);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

For guests (no auth.uid()): Edge Function tracks by IP address with an in-memory Map. 2 asks/hour per IP. Simple and sufficient for launch — no persistent storage needed.

### Client-Side

Add to `rateLimiter.js`:
```js
ask: { maxAttempts: 6, windowMs: 3600000 }  // 6 per hour
```

UI shows remaining asks: "4 asks left this hour"

---

## Frontend

### Trigger

Chat bubble icon in the page header area (top-right). Not in BottomNav — that's for core navigation tabs. Icon uses `var(--color-accent-gold)` to stand out.

### Component: `src/components/AskWGH.jsx`

Portal-rendered bottom sheet (same pattern as DishModal):
- `useFocusTrap()` for accessibility
- `document.body.style.overflow = 'hidden'` while open
- History integration for back-button close
- Animated slide-up entrance

### Bottom Sheet States

1. **Input** — Text input with placeholder "What are you in the mood for?". Submit button. Shows "X asks left this hour" below input.
2. **Loading** — Pulsing animation with rotating messages: "Checking the menu...", "Asking the locals...", "Tasting everything..."
3. **Answer** — Styled text response. Dish names rendered as gold-colored tappable `<Link>` components. Restaurant names also tappable. "Ask something else" button resets to input state.
4. **Rate limited** — "You've used your asks for now. Check back in X minutes." Guest variant: "Sign in for 6 asks per hour" with login CTA.
5. **Error** — "Something went wrong. Try again?" with retry button.

### Response Parsing

`[[dish:abc123|Lobster Roll]]` → `<Link to="/dish/abc123" style="color: var(--color-accent-gold)">Lobster Roll</Link>`

`[[restaurant:xyz789|Larsen's]]` → `<Link to="/restaurants/xyz789">Larsen's</Link>`

Parser validates UUIDs with strict regex before rendering links (security).

### New Files

| File | Purpose |
|------|---------|
| `src/components/AskWGH.jsx` | Bottom sheet component |
| `src/api/askApi.js` | API module — single `askQuestion()` method |
| `src/hooks/useAskWGH.js` | Hook — manages state, loading, rate limits. Uses `useMutation`. |
| `supabase/functions/ask-wgh/index.ts` | Edge Function — orchestrates data fetch + Claude call |

---

## Edge Function Detail

### File: `supabase/functions/ask-wgh/index.ts`

**Env vars needed:**
- `ANTHROPIC_API_KEY` — Supabase Edge Function secret
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — already available in Edge Functions

**Request validation:**
- `question` required, max 500 characters
- `question` passed through content validation (no slurs, spam)
- `user_lat` / `user_lng` optional (improves relevance if provided)

**Claude API call:**
- Raw `fetch()` to `https://api.anthropic.com/v1/messages` (no Deno SDK needed)
- Model: `claude-sonnet-4-6`
- `max_tokens`: 1024 (keeps answers concise, saves cost)
- `temperature`: 1.0 (default — natural voice)
- No thinking needed (effort: low would work but not available on raw API without SDK)

**Response format returned to frontend:**
```json
{
  "answer": "You should try the [[dish:abc123|Lobster Roll]] at [[restaurant:xyz789|Larsen's Fish Market]]...",
  "dishes_mentioned": [
    { "id": "abc123", "name": "Lobster Roll", "type": "dish" },
    { "id": "xyz789", "name": "Larsen's Fish Market", "type": "restaurant" }
  ],
  "remaining_asks": 5
}
```

**Error responses:**
- 400: Missing/invalid question
- 429: Rate limited (with `retry_after_seconds`)
- 502: Claude API error (upstream failure)
- 500: Internal error

---

## Logging & Cost Tracking

### PostHog Events

`ask_wgh_query` event with properties:
- `question_length` (int, not the actual question for privacy)
- `response_time_ms`
- `has_location` (bool)
- `is_authenticated` (bool)
- `dishes_mentioned_count`

### Supabase Logging

New `ask_logs` table:
```sql
CREATE TABLE ask_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  question_hash TEXT,  -- SHA256, not raw question (privacy)
  tokens_input INT,
  tokens_output INT,
  response_time_ms INT,
  dishes_mentioned INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

RLS: service_role only (Edge Function writes, no client access).

Cost dashboard query: `SELECT DATE(created_at), SUM(tokens_input) * 3.0 / 1000000 + SUM(tokens_output) * 15.0 / 1000000 AS daily_cost FROM ask_logs GROUP BY 1;`

---

## Security

- `ANTHROPIC_API_KEY` is a Supabase Edge Function secret — never exposed to frontend
- User questions validated via `validateUserContent()` equivalent in Edge Function
- Link parser only accepts UUID format in `[[dish:ID|Name]]` — prevents injection
- Rate limiting prevents cost abuse (2/hr guest, 6/hr authed)
- No conversation history stored (standalone asks)
- Question hashes in ask_logs, not raw text (privacy)

---

## Voice Examples

**Q: "What's the best thing to eat near OB?"**
> The Lobster Roll at [[dish:abc123|Larsen's Fish Market]] is the #1 dish on the island right now — 9.4 with 142 votes behind it. It's in Menemsha, about 15 minutes from OB. If you want something closer, the [[dish:def456|Fish Tacos]] at [[restaurant:xyz789|The Bite]] are a local favorite at $16.

**Q: "I'm vegetarian, anything good?"**
> The [[dish:ghi789|Veggie Burger]] at [[restaurant:uvw321|The Black Dog]] gets solid marks — 8.7 from 34 voters. For something lighter, the [[dish:jkl012|Garden Salad]] at [[restaurant:mno345|Atria]] is worth a look. Fair warning — I'm going off dish names and categories here, so always confirm with the restaurant on ingredients.

**Q: "Tell me about The Net Result"**
> [[restaurant:pqr678|The Net Result]] in Vineyard Haven is a seafood counter — casual, lines out the door in July. Their top dishes by votes: [[dish:stu901|Fried Clams]] (9.1, 67 votes), [[dish:vwx234|Lobster Bisque]] (8.8, 45 votes), and [[dish:yza567|Fish & Chips]] (8.5, 52 votes). Most things run $18-28. It's the kind of place where everything's good, but the fried clams are what people come back for.

**Q: "Where can I get Ethiopian food?"**
> No Ethiopian on the island right now, unfortunately. But if you're after bold, layered flavors, the [[dish:bcd890|Jerk Chicken]] at [[restaurant:efg123|Caribbean Corner]] might scratch that itch — 8.9 with 28 votes. Or if it's the communal, share-everything vibe you're looking for, [[restaurant:hij456|The Lookout]] does great shareable plates.

---

## NEVER Rules (from approved design)

- Never make up dishes or restaurants not in the database
- Never give health/allergy advice beyond "check with the restaurant"
- Never badmouth a restaurant or dish
- Never pretend to have info it doesn't — if data is thin, say so
- Never recommend outside the WGH database
- Never share another user's personal data

---

## Future Considerations (not in scope)

- Multi-turn conversation (conversation memory)
- Voice input
- Photo-based "what is this dish?" identification
- Tool use for larger datasets (when expanding beyond MV)
- Caching frequent questions (e.g., "best lobster roll")
