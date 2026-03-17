# WGH — The Complete Picture

## What It Is

Dish-level food discovery. Not "is this restaurant good?" — "is this dish good?" The question every tourist asks walking into a bar: "What's good here?" Nobody built the answer until now.

## Why It Works

The insight is structural: Amazon has 150 reviews on a broom. Restaurants have 400 menu items and zero reviews per item. The gap isn't a feature request — it's a category void. Every existing system (Yelp, Google, TripAdvisor) rates the VENUE. Denis rates the PRODUCT. That's a different business.

---

## Who We're Targeting

### 1. The Browser (Tourist) — 80% of users

Standing on Circuit Ave, 20 restaurants, no idea what to order. Opens WGH. Sees "Top Dishes Near You." Picks the #1 lobster roll. Done in 5 seconds.

- No login required to browse
- No app download — PWA, works in any browser
- QR code on restaurant table = instant access at the decision moment
- "Best breakfast burrito near me" → ranked list with scores, not restaurant pages

**Why they care:** They're on vacation. Every meal matters. They don't want to waste one on a 6.2 when there's a 9.1 three blocks away.

### 2. The Pioneer (Foodie) — 5% of users, 50% of the value

Rates everything. Builds a personal food diary. Hunts hidden gems. Tracks their food life across cities. Carries WGH home to Boston/NYC and keeps rating.

- Personal food diary = the product (Goodreads reframe — selfish motivation > altruistic)
- Three shelves: Good Here / Wasn't Good Here / Heard That's Good There
- Shareable profile link: whatsgoodhere.com/@denis?location=marthas-vineyard — friends get value before they create an account
- The profile IS the acquisition funnel. Sharing IS the onboarding.

**Why they care:** They're building something that's THEIRS. A food identity. Not helping strangers rank dishes — tracking their own food life. Every diary entry is also a data point for community rankings. Selfish behavior produces public value.

**Why they're 50% of value:** They generate the data. They carry the app to new cities. They tell friends. They ARE the expansion engine.

### 3. The Business (Restaurant Owner) — The Revenue

Gets dish-level intelligence no one else provides. Self-service portal for specials, events, and menu management.

- **Hidden gem detection:** "Your new pasta has 12 reviews averaging 9.6 but only 30 orders — push this dish harder"
- **Trend alerts:** "Your ratings dropped 15% over 3 months — something changed in the kitchen"
- **Root cause correlation:** "When did you change bread suppliers? The cooking oil? Who's been on the line?"
- **Menu rotation intelligence:** Which new dishes are loved, which to cut
- **Chef performance:** "Your chef's best-rated dishes are X, Y, Z" — objective data, not gut feel
- **Price elasticity:** Taco Value Graph simulates: "Drop from $18 to $14 → triggers VALUE PEAK badge → more orders → more profit despite lower margin"
- **Peak detection:** "You peaked 3 months ago. What changed operationally?"
- **Specials promotion:** Live Vibe feed — post a special, every hungry person nearby sees it instantly

**Why they care:** POS shows what sold, not what people thought. Yelp gives restaurant-level complaints. Servers give anecdotes. Nobody gives them dish-level sentiment data over time with operational correlation.

**The pitch:** "You spend $100-250/month on Instagram showing specials to people scrolling on their couch. Pay $50/month to show it to someone standing outside your door, hungry, deciding where to eat right now."

---

## Every Use Case Documented

| Use Case | Customer | What WGH Does | What Exists Today |
|----------|----------|---------------|-------------------|
| "Best lobster roll near me" | Tourist | Ranked dish list by score within radius | Nothing — Google shows restaurants, not dishes |
| "What should I order here?" | Anyone at a restaurant | Score + consensus + evidence for every dish | Ask the server (anecdotal, inconsistent) |
| "Best value meal near me" | Budget traveler | Taco Value Graph — price-adjusted quality | Nothing — no system formalizes food value |
| "Actually gluten free?" | Celiac/dietary needs | Crowd-verified safe kitchens | Google can't distinguish real GF from "has a salad" |
| "Who has specials tonight?" | Local or tourist | Centralized Live Vibe feed | Fragmented across Instagram/Facebook/TikTok |
| "Where's live music this weekend?" | Anyone | Searchable events calendar | No central hub — ask around or check 15 Instagram accounts |
| "What's even OPEN right now?" | Local (off-season) | Real-time open/closed filter | Google hours are wrong half the time on MV |
| "Best espresso martini on MV?" | Cocktail seeker | Same scoring system for drinks | Nobody rates individual cocktails by location |
| "I'm visiting MV, where should we eat?" | Friend of a Pioneer | Shareable curated dish list via profile link | Text thread with 12 opinions and no consensus |
| "Try adding spicy mayo to the fish taco" | Foodie | Crowd-sourced dish mods — best modifications | Doesn't exist — nobody thinks customization is data |
| "My pasta dropped from 9.2 to 7.8" | Restaurant owner | Dish-level trend alert with timeline | No tool does this — POS shows sales, not sentiment |
| "Which new menu items are landing?" | Chef/manager | Performance data on menu rotations | Anecdotes from servers |
| "Our signature dish is in decline" | Restaurant owner | Peak detection + operational correlation | Nobody — Yelp doesn't track at dish level |
| "Should I lower the price on this dish?" | Owner | Price elasticity simulation via Taco Value Graph | Guesswork |
| "47 people viewed your special" | Restaurant marketing | View count analytics on specials | Instagram shows impressions to followers, not hungry people |
| Snap a photo of your plate | Anyone | AI matches photo to dish, rate-later queue | Doesn't exist |
| "Best breakfast burrito near me" (SEO) | Google searcher | WGH becomes the answer Google surfaces | Currently returns restaurant pages, not dish rankings |
| "Best lobster roll near me" (AI query) | Siri/ChatGPT user | WGH becomes the data source AI needs | AI has no authoritative dish-level dataset to reference |

---

## Why It's Better Than Everything Else

| | Yelp/Google | WGH |
|---|---|---|
| What's rated | Restaurant | Dish |
| Rating system | 5 stars (meaningless at scale) | 1-10 decimal (8.3 vs 8.4 matters) |
| Freshness | 2019 review = 2026 review | Reviews decay — only current quality counts |
| Restaurant relationship | Adversarial (pay-to-play) | Partnership (self-service portal) |
| Anti-fraud | 24% catch rate (Yelp) | Triple toll booth: dish granularity + decay + Jitter |
| Value scoring | None | Taco Value Graph — best bang-for-buck |
| Action from rating | "This place is good, figure it out" | "Order THIS dish → here's the button → 0.3 mi walk" |
| Seasonal awareness | None | Off-season open/close, specials, events |
| Expansion model | Launch in cities (expensive) | Users carry it home (free) |
| Cold start | Empty until users arrive | AI-seeded on day one ($0) |

---

## The Competitive Moat (7 Layers)

1. **Dish-level data** — nobody else has it
2. **Review freshness** — ratings decay, reflecting current quality. Yelp can't retrofit this without rebuilding their entire system.
3. **Taco Value Graph** — price-adjusted quality scoring. Original IP. (Rating / LOG(Price+2)) * 10
4. **Jitter Protocol** — behavioral biometrics for review authenticity. Patented.
5. **"Ranked by locals"** — trust signal algorithms can't manufacture
6. **Restaurant partnership** — restaurants are allies, not adversaries. Yelp structurally can't replicate this relationship.
7. **The name** — "What's Good Here?" IS the universal question. Works in every city on earth.

---

## How It Makes Money

| Stream | Price | When |
|--------|-------|------|
| Restaurant intelligence dashboard | $50-199/mo | 2027 |
| Promoted specials/events | $50/mo | 2027 |
| Promoted dish placements | TBD | 2027+ |
| Jitter Protocol licensing (B2B) | TBD | 2028+ |

**Target:** $100-150K/year from restaurant subscriptions across 3-5 resort markets. Combined with timber framing = $200K+/year on MV.

Not the goal for 2026. Memorial Day = proof event. 1,000 users, 10 restaurants engaging, one viral moment. Revenue starts summer 2027 with proven numbers.

---

## How It Grows for Free

1. 50 foodies use WGH on MV summer 2026
2. They go home to Boston, NYC, Portland — keep rating dishes
3. WGH detects user clusters in new cities
4. Auto-seed AI reviews around those clusters ($0 cost — LLM scrapes menus, auto-imports)
5. Friends see value → join → more data → network effect
6. City hits critical mass → invite restaurants to claim pages

Users build the map. Platform follows users. Waze playbook. Expansion cost: near zero.

---

## The Anti-Bot Defense (Emergent, Not Designed)

The product design IS the security architecture:

- **Dish granularity:** Yelp bots buy 1 review per restaurant. WGH bots need 1 per DISH. 30 dishes = 30x attack cost.
- **Review decay:** Reviews expire seasonally. Bot farms must re-buy every season.
- **Jitter biometrics:** Human typists cost $2-5/review to beat. Automated scripts fail.
- **Sequential gating:** Fail any checkpoint = restart the 10-day pipeline from Day 1. 33% failure rate = 3x real cost.

**Total cost to fake 50 dish reviews on WGH:** $1,074-2,274 with sequential gating. Per restaurant with 30 dishes: $2,000-5,000+. Per season (must re-buy after decay): $4,000-10,000/year. For comparison: restaurants currently pay farms $500-2,000/month on Yelp.

Denis didn't design dish-level ratings as anti-bot. He designed them because "what's good here?" is a dish question. The anti-bot properties are emergent from the product design. That's the moat nobody can copy by adding a feature — they'd have to rebuild their entire architecture.

---

## The Exit

**Target:** $500K-$1M

| Buyer | What They'd Buy |
|-------|-----------------|
| Yelp | Dish-level dataset + Jitter for fake review defense |
| Google | Local food intelligence to improve Maps/Search |
| DoorDash/Uber Eats | Demand signal data — which dishes drive orders |
| Infatuation/Eater | Crowd-sourced dish intelligence for editorial |
| Barstool Sports | Portnoy-adjacent food review platform with trust signal |

**What they're actually buying:** (1) the only dish-level rating dataset that exists, (2) Jitter review authenticity IP, (3) proven local expansion playbook (scrape → seed → launch), (4) brand equity — "What's Good Here" needs no explanation.

---

## Memorial Day 2026 — 70 Days

- 69 MV restaurants seeded
- ~96 ranked dishes
- 6 curated lists
- 35 Toast POS integrations (Order Now buttons)
- Google OAuth ready (needs Dashboard config)
- Dual theme: "Appetite" (light) + "Island Depths" (dark)
- Distribution: ferry terminals, table QR codes, Denis's bartender network

**The one metric that matters:** "Did this influence your choice?" If >40% say yes, that's product-market fit.
