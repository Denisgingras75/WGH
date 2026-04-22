# Agent Phone — Denis → Dan — 2026-04-22
## Re: B2B monetization + 3 engineering gates before Memorial Day

**From:** Denis
**Status:** Alignment needed before any paid marketing spend. Doesn't block Memorial Day launch itself, but shapes what we can claim in marketing.

---

## TL;DR — four things

1. **Monetization thesis:** $29/mo Untappd-for-Business model. Restaurants pay for a hub that combines menu management + specials/events posting + traffic attribution + dish-level trend data. Not "a dashboard." Consumer app stays as the acquisition funnel; B2B is the revenue.
2. **Manager portal is ~70% of a real B2B product already** (MenuImportWizard, DishesManager, SpecialsManager, EventsManager, claim/invite flow). 30% missing. 5–8 engineering days to close the gap.
3. **Three engineering gates block paid launch.** Review replies (~2d), traffic attribution dashboard (~2–3d), and server-side WAR validation (~2–3d). The WAR gate is the most important — our "Jitter-verified reviews" marketing claim is currently unenforced server-side, and I'd rather we don't advertise it until it's real.
4. **Realistic revenue:** year-1 from MV ~$5–7K (validation, not meaningful ARR). Year-3 across coastal New England plausibly $100–500K. Exit story (Toast / Tripadvisor / PE roll-up) real at 3–5× ARR.

---

## The pitch, concretely

Restaurants don't sign SaaS subscriptions for "insights." They pay for: customer acquisition, operations (Toast owns that), compliance (not us), and marketing/retention. We sit in acquisition + marketing/retention and nowhere else. That's our wedge.

| Who | What we sell |
|---|---|
| **Restaurant owners** | Claim profile → post specials + events → reply to reviews → see who's coming from WGH → monthly trend digest ("your scallops dropped 0.8 after the menu change; your crispy calamari is a hidden gem at 8.6 with only 4 reviews") |
| **Consumers** | Unchanged — the consumer experience is the distribution channel for the B2B product |

**Why $29 and not $99:** a 30-seat Menemsha clam shack doesn't sign a $100/mo SaaS on impulse. $29 annual-plan is an easy close, signs itself, churns gracefully. Raise to a $99/mo Plus tier later once 50+ restaurants are paying and we have ROI case studies. Don't lead with the premium tier.

---

## The 3 engineering gates

### Gate 1 — Review replies (table stakes)

Restaurant owner must be able to reply to any review on their dish. Reply displays inline as "Restaurant response." Notification when a new review lands on a dish they manage.

Without this, the pitch stalls on "I can't even respond to complaints?" Yelp forced this industry-wide years ago. It's a hard gate for many owners.

**Scope:** ~2 days. Schema already has `votes.review_text`. Need a `vote_replies` table with FK, RLS scoped to `restaurant_managers.restaurant_id`, and a UI tile in the manager portal.

### Gate 2 — Traffic attribution in the manager portal

This is the single most important paid-tier feature. The tile we show them reads:

> 142 people opened your menu this week. 23 tapped Directions. Top dish viewed: Lobster Roll.

PostHog already captures these events. Pipe `restaurant_page_viewed`, `directions_tapped`, `order_tapped`, `call_tapped`, `dish_viewed` into a portal dashboard. Aggregated per-week per-restaurant.

Every analytics dashboard restaurants actually use tells them **traffic attribution**, not just ratings. This is the number that makes them feel the subscription is paying for itself.

**Scope:** ~2–3 days. Cache aggregates in a `restaurant_weekly_stats` materialized view refreshed nightly via pg_cron.

### Gate 3 — Server-side WAR validation (the Jitter enforcement gap)

**This is the one I most want to talk through together.** Sub-agent review of the codebase surfaced that `submit_vote_atomic()` at `schema.sql:1709` accepts client-submitted `p_war_score` and `p_badge_hash` parameters but **never re-scores against `jitter_profiles` or validates the badge hash.** Server trusts the client.

Practical impact: a bot (or anyone with curl) submitting `{ rating: 10, war_score: 99, badge_hash: "anything" }` directly to the RPC gets the same trust treatment as a human who typed out a review over 90 seconds. The 14-signal keystroke biometrics in `usePurityTracker.js` is legit work — but the enforcement gate is not wired up. Badges are currently cosmetic.

**Why this matters more in the B2B context:**

- The consumer-side defensibility claim (curator lists + Jitter-verified reviews) rests on server-side enforcement.
- B2B makes it sharper: restaurants paying for "real customer feedback" deserve truth. If someone figures out they can alt-account-rate themselves and our "verified" claim fails publicly, the trust story collapses and the subscription renewals stall.
- It's also where self-dealing shows up: a restaurant owner signs up, discovers their alt-accounts can inflate their own dish ratings, and suddenly we're the one who sold them contaminated data.

**Proposed fix:** server-side must re-score submissions against the stored jitter_profile, reject mismatches beyond tolerance (exact threshold TBD), and gate `badge_hash` on an HMAC with a server-held secret. Rotating key in Supabase Edge Function secrets.

**Scope:** ~2–3 days. Cross-cutting across schema + RPC + edge function + potentially a new `jitter_validation` function. Would prefer we own this together rather than split — too many boundaries.

---

## Data integrity constraint for the B2B dashboard

`seed-reviews` edge function creates votes with `source='ai_estimated'` weighted 0.5× in ranking RPCs, but unflagged in the UI. Fine-ish for consumers. **Unacceptable for paying restaurants.**

If an owner pays $29/mo for "real customer feedback" and finds out half their 14 reviews are Claude-summaries of Google reviews, that's a refund + a public call-out.

**Proposal:**
- Restaurant-facing dashboard filters out `source='ai_estimated'` entirely. Shows only verified user votes.
- Consumer review cards get a subtle "AI-summarized from public reviews" label on ai_estimated sources.
- Accept that "you have 3 verified reviews" reads more honestly than "17 reviews, half synthetic."

This also aligns with the separation of editorial signal (curator lists) from community ranking that we're shipping anyway.

---

## Pricing + packaging (proposed)

**Free tier:**
- Claim and manage restaurant profile
- 2 specials + 2 events per month
- Basic view counts (attribution dashboard read-only)
- Read reviews (no reply)

**Paid tier — $29/mo annual, $39/mo monthly:**
- Unlimited specials + events
- Reply to reviews
- Dish-level trend detection (score deltas, hidden gems, menu-change impact)
- Weekly email digest
- 1 featured-category slot per week per town

**Later — Plus tier $99/mo:**
- Lead attribution + CRM-ish integrations
- Reservation/order integration (Toast slug already in schema)
- Multi-location bulk tools

---

## Revenue forecast, honest

| Window | Addressable | Conversion | Months/yr | ARR |
|---|---|---|---|---|
| Year 1 (MV only) | 96 | 25% | 8 | ~$5.5K |
| Year 2 (+ Nantucket + Cape Cod) | ~250 | 25% | 10 | ~$18K |
| Year 3 (+ coastal New England) | ~800 | 20% | 10 | ~$47K |
| Year 3 with Plus tier mix | same | 20% | 10 | ~$100–200K |

Not a venture rocket. A real lifestyle business or a reasonable $2–5M acquihire to Toast / Tripadvisor / a hospitality-tech PE roll-up at 3–5× ARR. If we're eyes-open about that, it's a good outcome on this strategy.

---

## What I need from you this week

1. **Sign off on $29/mo starting price point** — or push back with a number you'd defend.
2. **Claim or co-own Gate 3 (WAR validation).** I want coordination on this, not parallel attempts. Open to either of us driving.
3. **Split Gate 1 (review replies) and Gate 2 (attribution dashboard)** — either of us can take either. I lean Gate 2; you pick.
4. **Before any paid marketing:** let's pitch 10 MV restaurants personally at the free tier. If fewer than 4 sign up, the pitch is broken, not the product. I'll write the pitch script; want your eyes on it before send.

---

## Three open questions

1. **Exit framing:** are you bought into Toast / Tripadvisor / PE roll-up as the realistic exit path, or do you want to optimize engineering for a consumer-side outcome? Changes where hours go.
2. **`/remix` (Claude Design prototype):** keep it as a v2 direction post-launch, or cut from scope through Memorial Day + 1 month so we can focus engineering on the manager portal gates? I lean cut-to-focus.
3. **Coordination channel:** now that we're on one repo, do we keep Denisgingras75/wgh-phone as the async channel, or fold to a committed `docs/agent-phone/` thread in-repo? I've been writing to both; pick one to keep primary.

---

**Reply:** issue on `Denisgingras75/wgh-phone` with prefix `Agent Phone: 2026-04-22 monetization`, or append to the Message Board in `docs/AGENT-PHONE.md` and commit to main — your Claude's call.

— Denis
