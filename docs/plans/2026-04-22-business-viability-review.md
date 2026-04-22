# WGH Business Viability Review — 2026-04-22

**Context:** Honest pre-marketing assessment conducted in a Claude session on 2026-04-22 at Denis's request. Captures the critical read + the curator-lists pivot + refinements. Review before committing marketing dollars or finalizing the Memorial Day launch strategy.

**Review by:** Before first paid marketing spend. Re-read alongside `docs/superpowers/plans/2026-04-13-memorial-day-launch-plan.md`.

---

## Part 1 — Honest viability read

### The idea

- **Dish-level rating over restaurant-level is a genuinely better primitive.** Yelp/Google average too much. Users actually decide what to *order* once seated, not just where to go. Real gap.
- **MV as a beachhead is smart.** Concentrated geography, seasonal tourist surge, word-of-mouth culture, ~96 restaurants — a number you can cover. Beli scaled from NYC, Untappd started regional.
- **"Would you order this again?" as the core action is a liability.** Retrospective — requires users to have already eaten AND come back to rate. Weaker retention loop than Beli's "rate as an event." Binary Vote Removal is a forced move; the slider carries the water now. Core interaction is still being figured out.

### The hard business questions

**1. Cold-start is *much* worse for dish-level than restaurant-level.**
Restaurant app: 1,000 users × 3 ratings = 30 ratings per restaurant across 100 restaurants. Useful.
Dish app: 100 restaurants × ~30 dishes = 3,000 dishes. 1,000 users × 3 ratings = 1 rating/dish. Useless.
`MIN_VOTES_FOR_RANKING=5` implies ~15,000 user-ratings before rankings feel populated. Realistically 5-10K active users for MV alone.

AI-seeded reviews at 0.5x weighting + harvested Google reviews are smart patches, but **the Google Places harvest is a legal gray area** against Google ToS. If you scale, Google notices, and they hold the API keys. Plan B required.

**2. TAM on current strategy is small.**
MV: ~17K year-round, ~200K summer visitors. Realistic addressable = ~50K users in a great summer. Nantucket + Cape Cod triples that. Beyond = cold-start all over again, now against Yelp/Google/Beli/Infatuation with zero local advantage.

Honest ceiling on current strategy: loyal five-figure user base, $50-150K/year on restaurant subscriptions. Real business. Not a venture story.

**Paths to bigger:**
- License the manager portal + POS integrations (`toast_slug` already in schema) as a white-label for restaurant groups or tourism boards. Different company.
- Acquihire to Google/Tripadvisor/Toast once you show restaurant-side traction.
- Pivot the dish-rating engine to a non-tourism vertical where cold-start math works (corporate cafeterias, hotel F&B). Different company.

**3. No revenue model visible in code.**
`/for-restaurants` is a pitch page. Manager portal exists. Neither TASKS.md nor SPEC.md commits to subscription / featured placement / transaction fee / lead-gen / freemium. **This is the single biggest business-planning gap.** Can't market without a product to sell.

**4. Retention is weak for the majority persona.**
Tourists use MV 1-2 weeks a year. LTV ≈ one summer × 5 dishes rated. Fine for content aggregation (Infatuation model), bad for data network effects.
Pioneer persona (5%, 50× data generation) is where retention has to live. Profile Journal + Rating Identity + Food Playlists + SharePicks are built for them. **Market at Pioneers first, not tourists.**

**5. Competition is structural, not visible in your UI.**
- **Google Maps** — free, pre-installed, uses the same Places API you do. Most tourists don't realize they have a feature gap.
- **The Infatuation + Eater** — editorial authority, slower to update. You're faster, they have brand.
- **Beli** — venture-funded, serious competition for Pioneer users in major cities. Won't bother with MV unless you get press.
- **Yelp** — gets worse yearly but is the default.
- **Toast / Square / Resy** — own the restaurant-owner relationship via POS. If any of them bolts on "ranked dishes," restaurant-side business evaporates.

**Differentiator that might hold:** Jitter-verified reviews + hyper-local curation. Translated into marketing: *"Reviews you can actually trust from people who actually live here."* Needs to be lead message, not buried.

### Grade

- **Product quality:** solid.
- **Design:** solid but still churning (four visual directions in two months).
- **Idea:** good as a niche tool, unproven as a scalable business.
- **Viability:**
  - Loved local tool earning modestly — high confidence.
  - Sellable asset to a platform in 2-3 years — medium confidence.
  - Venture-scale platform — low confidence without a pivot.
- **Will it work?** Launching Memorial Day with 1,000 users — yes. Profitable self-sustaining business in 12 months — requires committed monetization motion. Big outcome — not on current trajectory.

### What to do before paid marketing

1. **Lock monetization model.** Pick price. Draft a pitch email to 3 MV restaurants as a thought experiment. If you can't write a convincing one in an hour, product story isn't tight enough.
2. **Friends-and-family soft launch first.** 30 days, 50-200 handpicked users. Measure: do they return? Rate unprompted? Does the app feel populated?
3. **Pick the persona you're optimizing for and admit it.** Browser vs. Pioneer. Pick one.
4. **Instrument for one truth metric.** "7-day post-install rating rate" — fraction of installs that produce ≥1 rating within a week. <30% = product not ready. >50% = something real.
5. **Commit to a 6-month revenue target out loud.** "$0" is fine if pre-revenue. "$5K MRR by Oct 1" is fine. "Not sure yet" is the failure answer.

---

## Part 2 — The curator/niche-lists pivot (Denis's response)

**Proposal:** Recruit 10-20 locals to create their own top-10 lists. Add niche dietary lists (alpha-gal, gluten-free, vegan, allergies).

### Why this is smart

- Moves from "Yelp for dishes" to "**curated guide with a community layer**." Better story, better business. Infatuation (editorial) + Beli (social) mashed together. Google can't replicate "Captain Kate's 10 favorite bar snacks."
- **Alpha-gal is a genuinely strong positioning hook.** MV has elevated alpha-gal prevalence (tick-heavy + summer tourism). Nobody serves it well. *"The food app that knows which dishes are safe for alpha-gal"* = NYT lifestyle piece bait. Alpha-gal community shares obsessively. Same pattern for celiac — "actually safe for celiac on MV" is a high-intent low-competition search query with zero good answers today. **Marketing wedge, not just a feature.**
- **15-20 curators × 10 dishes = 150-200 high-signal picks on day one.** Beats 500 AI-seeded reviews for trust and shareability. Each curator page is an SEO surface.
- **Code mostly exists.** `src/components/profile/LocalListCard.jsx`, `docs/superpowers/plans/2026-03-10-locals-lists-homepage.md` (930 lines), `2026-03-10-self-service-local-lists.md` (1,701 lines), `2026-03-10-locals-lists-design.md` (225 lines). Status: partial. Finish what's there, don't greenfield.

### Gaps to close before marketing

**1. Curator selection is strategy, not casting.**
Pick for **distribution**. Each person brings a different audience:
- A well-known chef (credibility, local press)
- A fishmonger or farmer (supply-chain trust)
- A bartender (cocktail/late-night niche)
- A real estate / hospitality concierge (tourist-money clientele)
- A sailing instructor or fishing charter captain (captive tourist audience)
- **An alpha-gal community leader** (niche-list seeder + community authority)
- **A celiac/gluten-free local** (same)
- A family-with-kids (kid-friendly, parent groups)
- An IG-active islander with 5K+ followers (organic reach)
- A year-round chef at a famous restaurant who recommends *other* restaurants (rare, credible)

15 is plenty. Every curator is someone you have to maintain.

**2. Maintenance model or it rots.**
Curators ghost. Menus change seasonally. Three mechanisms, pick at least two:
- **Quarterly refresh commitment** — soft contract, 2x summer + 1x off-season.
- **Admin override** — you (or a trusted deputy) can soft-remove stale items. Wire into menu-refresh pipeline's dish-availability check.
- **Expiry + re-confirm nudge** — items >90 days ping the curator for one-tap re-confirm. Jitter-style tracking to distinguish active curators from abandoned lists.

**3. Allergy lists carry real liability.**
Alpha-gal and celiac are medical-adjacent. "It was crowd-sourced" is not a defense if someone reacts. Minimum viable:
- **Persistent disclaimer banner** on every allergy-filtered list.
- **Two-tier display:** "Confirmed by [Restaurant] on [date]" vs. "Suggested by [curator]."
- **Reporting flow** — "this dish is no longer safe" → admin review, not auto-flag.
- **All-or-nothing on safety-critical filters.** If a curator says "ask about the fries oil," don't list the fries.
- **Lawyer for 30 minutes** before launch. ~$500. Confirm ToS + disclaimer language is adequate.

**4. Don't pollute the algorithm with editorial picks.**
Add a third vote source: `curator`. Display curator picks on a **separate surface** from community rankings — same dish data, two screens. Otherwise curator taste leaks into "organic" ranking and you can't tell what's what.

**5. The self-service plan is 1,701 lines — you don't need all of it for launch.**
For Memorial Day: admin-seeded curator lists that display well. Maybe 200 lines of the spec. Ship that. Self-service sign-up for new curators → v1.1 after validation.

### What this changes in the overall read

- **Cold start:** mostly solved for launch-week *feel*. Long-term compounding still depends on organic ratings.
- **SEO/PR angle:** dramatically strengthened. Alpha-gal-friendly MV + celiac-safe MV are content moats. `api/og-image.ts` + `api/share.ts` already built for shareable social cards.
- **Retention:** better for tourists mid-visit ("what's Sarah's #4?"), still constrained year-over-year — that's still Pioneer persona + Food Playlists.
- **Monetization:** new options. Featured curator placements. Branded lists ("MV Chamber of Commerce Top 10" — they'd pay). Tourism board partnerships.
- **Competitive moat:** slightly real now. Google doesn't have Captain Kate. Yelp doesn't have the alpha-gal list. Infatuation isn't on MV. 12-24 months of defensibility before Beli/Google could copy.

### Revised launch-marketing strategy

Skip paid ads for v1. Product is **earned-media shaped**.

**Two concrete moves:**
1. **Pitch the alpha-gal angle to Vineyard Gazette + MV Times + possibly Boston Globe lifestyle** as a pre-launch story. "Local developer builds food app for overlooked tick-bite allergy community." Real article. Free press with specific targeting.
2. **Soft-launch with the 15 curators as the first marketing push.** Each curator shares their list to their own audience. 15 concentric ripples, not one weak broadcast.

Spend the ads budget on a **launch-dinner event for curators** instead. Press attends, photos circulate, the app gets populated with real curator traffic before public launch.

---

## Action checklist (to revisit)

- [ ] Decide monetization model and target price (even a rough one).
- [ ] Pick 15 curators strategically (not just foodies — see distribution list above).
- [ ] Draft curator commitment + maintenance protocol.
- [ ] Talk to a lawyer (30 min, ~$500) about allergy-list disclaimer language.
- [ ] Add `curator` source type; keep editorial picks separate from community rankings.
- [ ] Finish the minimal 200 lines of the locals-lists plan needed for launch-week display (skip self-service sign-up for v1).
- [ ] Write a pitch to Vineyard Gazette / MV Times / Boston Globe lifestyle on alpha-gal angle.
- [ ] Plan launch-dinner for curators.
- [ ] Pick one truth metric (recommend: 7-day post-install rating rate) and instrument it.
- [ ] Commit to a 6-month revenue target in writing.

---

## One-liner to remember

**The product is better than most in its category. The curator + niche-list angle is your actual marketing story. Don't spend paid-ad dollars until organic behavior from 50-200 beta users tells you the loop works and you've picked a revenue model.**
