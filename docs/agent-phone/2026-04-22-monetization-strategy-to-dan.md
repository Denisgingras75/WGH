# Agent Phone — Denis → Dan — 2026-04-22
## Re: B2B monetization direction + pre-launch engineering gate

**From:** Denis (via his Claude)
**To:** Dan + Dan's Claude
**Status:** Decision needed before marketing spend. Not urgent this week, but gates Memorial Day launch narrative.

---

## TL;DR

We've nailed down a monetization thesis that's worth aligning on before we push marketing. Short version:

**Restaurants don't pay for dashboards. They pay for acquisition + menu management + specials promotion, with data as the retention hook.** The manager portal you and I have already built is ~70% of a legitimate B2B product; 30% is missing. Untappd-for-Business is the right archetype.

**Target model:** $29/mo annual, $39/mo monthly. Free tier for profile claim + 2 specials + 2 events/mo + view counts. Paid tier adds review replies, full trend detection, weekly email digest, featured placement. Realistic year-1 ARR from MV alone is ~$5-7K; year-3 across coastal New England is plausibly $100-500K. Acquirer exit story (Toast, Tripadvisor, PE roll-up) is real at 3-5× ARR.

**Biggest dependency on you:** three engineering items below gate the paid launch. One of them (server-side Jitter/WAR validation) you and I need to talk about because the marketing claim "Jitter-verified reviews" is currently not enforced server-side — it's client-only. Fix is 2-3 days.

---

## What the pitch actually is

| Role | What we sell them |
|---|---|
| **Restaurant owners** | One-stop hub: claim profile → post specials + events → respond to reviews → see who's coming from WGH → monthly trend report ("your scallops dropped 0.8 after the menu change, your crispy calamari is a hidden gem at 8.6 with only 4 reviews") |
| **Consumers** | Unchanged — the consumer product stays the acquisition funnel for the B2B product |

The consumer app is the distribution channel. The B2B product is the revenue.

## What restaurants actually pay for (and what we have)

Four things indie restaurants pay money for:
1. **Customer acquisition** — leads, traffic, attribution
2. **Operations** — POS, scheduling, inventory (Toast territory — we don't touch)
3. **Compliance** — tax, 1099 (not us)
4. **Marketing/retention** — specials posting, email, SMS

We hit #1 and #4. Toast hits #2. Yelp hits #1 partially. Nobody hits #1 + #4 + dish-level rating data in one portal. That's our wedge.

## What's already built in `src/components/restaurant-admin/`
- `MenuImportWizard` ✓
- `DishesManager` ✓
- `SpecialsManager` ✓
- `EventsManager` ✓
- Claim/invite flow ✓

This is real. Don't discount it.

## What's missing and needs shipping before paid launch

### [GATE 1] Review replies — table-stakes B2B feature
Owner must be able to reply to any review on their dish. Reply displays inline as "Restaurant response." Notification on new reviews.

Without this, the pitch stalls on "but I can't even respond to complaints?" Yelp forced this industry-wide years ago.

**Scope:** ~2 days. Schema already has `votes.review_text`; need `vote_replies` table with FK, RLS scoped to `restaurant_managers.restaurant_id`, and a UI tile in the portal.

### [GATE 2] Traffic attribution in the portal
The single most important paid-tier feature:

> "142 people opened your menu this week. 23 tapped Directions. Top dish viewed: Lobster Roll."

PostHog captures these events already. Pipe into a portal dashboard tile.

**Scope:** ~2-3 days. Sum posthog events per restaurant_id per week; cache in a `restaurant_weekly_stats` materialized view or a Supabase-side aggregate.

### [GATE 3] Server-side WAR validation — the trust story depends on it
**This is the blocker I need you to weigh in on.** Sub-agent review surfaced that `submit_vote_atomic()` at `schema.sql:1709` accepts client-submitted `p_war_score` and `p_badge_hash` but never re-scores against `jitter_profiles` or compares to stored confidence. Server trusts the client.

Practical impact: anyone hitting `submit_vote_atomic` via direct API call can submit `{ war_score: 99, badge_hash: "anything" }` and get the same trust treatment as a human who spent 90 seconds typing a review. The keystroke biometrics capture (`usePurityTracker.js`) is legitimate — but the verification gate is not wired up.

**Why this matters more now:** the marketing claim I was going to lead with (curator lists + "Jitter-verified reviews" = the defensibility moat) breaks if a competitor or a disgruntled user discovers the server doesn't enforce. For B2B, it breaks worse: restaurants paying for "real customer feedback" deserve to know the feedback is actually human.

**Fix:** server-side must re-score submissions against stored jitter_profile, reject mismatches beyond tolerance, and gate `badge_hash` on an HMAC with a server-held secret. Estimate 2-3 days. Would prefer we own this together rather than split responsibility.

---

## Data integrity constraint for the B2B dashboard

**Current state:** `seed-reviews` edge function creates votes with `source='ai_estimated'`, weighted 0.5× in ranking RPCs, but **unflagged in the UI.**

**B2C impact:** tolerable. Users see "reviews," don't distinguish.

**B2B impact:** unacceptable. If a restaurant pays for "real customer feedback" and finds out half their 14 reviews were Claude-generated from Google reviews, that's a refund + reputation hit.

**Proposal:**
- Restaurant-facing dashboard EXCLUDES `source='ai_estimated'` rows entirely.
- Consumer review cards get a subtle "AI-summarized from public reviews" label on `ai_estimated` sources.
- Accept the optics: "you have 3 verified reviews" beats "you have 17 reviews but half are synthetic."

Aligns with the curator strategy we're shipping anyway — editorial signal is separate from community rankings already per the curator plan in `docs/plans/2026-04-22-business-viability-review.md`.

---

## Pricing + packaging

**Free:**
- Claim profile
- 2 specials + 2 events per month
- Basic view counts
- Read reviews (no reply)

**Paid — $29/mo annual ($348/yr), $39/mo monthly:**
- Unlimited specials + events
- Reply to reviews
- Dish-level trend detection (score deltas, hidden gems, menu-change impact)
- Weekly email digest
- 1 featured-category slot per week per town
- (Later) Reservation/lead attribution upsell to $99/mo Plus tier

**Why $29 not $99:** a 30-seat Menemsha clam shack doesn't sign $100/mo SaaS on impulse. $29 is an annual-plan impulse buy. Raise once we have 50+ paying customers showing ROI.

**Year-1 realistic from MV alone:** 96 restaurants × 25% adoption × $29 × 8 months season = ~$5.5K. Validation, not revenue.

---

## What I'd ask of you this week

1. **Sign off on the $29/mo price point and packaging** — or push back with a number you'd defend.
2. **Own or split Gate 3 (WAR validation)** — this is the one I want us coordinated on because it's cross-cutting (schema + RPC + edge function + potentially a rotating server secret). Open to either of us driving; just don't want us both independently trying.
3. **Claim or split Gate 1 (review replies) and Gate 2 (attribution dashboard).** I can take either. Prefer Gate 2 if you'd rather do the review-replies RLS + UI work.
4. **Before any paid marketing push:** pitch 10 MV restaurants personally at the free tier. If fewer than 4 sign up, the pitch is broken, not the product. I'll write the pitch script; want your eyes on it before send.

---

## Additional context (full-depth docs in-repo)

- Business viability + curator-list strategy: `docs/plans/2026-04-22-business-viability-review.md`
- Engineering punch list (includes all three gates above): same doc, action-checklist section at bottom
- Original PARTNER-UPDATE + AGENT-PHONE history: `docs/AGENT-PHONE.md`, `docs/PARTNER-UPDATE-FEB-22.md`
- Technical DD findings that surfaced the WAR validation gap: available on request; not yet checked in

## Open questions back to you

- Is the "exit path = Toast / Tripadvisor / PE roll-up at 3-5× ARR" framing one you're bought into, or do you want to optimize for a consumer-side outcome instead? Changes where engineering hours go.
- Do you want to keep `/remix` (Claude Design prototype) as a v2 direction for Memorial Day + 1 month, or cut it entirely to focus engineering on the B2B portal? Both are defensible; I lean cut-to-focus.
- Should Denisgingras75/wgh-phone stay as the coordination channel, or now that we're on one repo, move to `docs/agent-phone/` committed in-repo? I've been writing to both lately; should pick one to keep primary.

---

**Reply channel:** issue on `Denisgingras75/wgh-phone` with title prefix `Agent Phone: 2026-04-22 monetization`, or append to `docs/AGENT-PHONE.md` Message Board and commit to main — your Claude's call.

— Denis
