# Feature Backlog

Ideas and features for future versions. Not prioritized yet.

---

## Photo-to-Rate Flow

**Summary:** Let users photograph their food, match it to a dish, and rate it later.

**Flow:**
1. User takes photo of their food
2. AI + location tries to match to existing dish in database
3. If match found → save to "rate later" queue
4. If no match → user can add the dish (photo already attached)
5. Reminder when user opens app: "You have dishes to rate!"

**Why it's good:**
- Users already love photographing food - capture that moment
- Reduces friction (no searching while eating)
- Crowdsources database growth when dishes aren't found
- Gets user-submitted photos for dish cards

**Technical needs:**
- OpenAI Vision API or Google Cloud Vision for photo analysis
- Supabase Storage for photos
- New `pending_ratings` table
- Reminder system (in-app first, push notifications later)

**Suggested approach:**
- v1: Skip AI matching. Photo → pick restaurant → pick or add dish → rate later
- v2: Add AI matching once dish database is larger

---

## Pre-Launch Data Seeding

**Goal:** Have enough real data that new users see value immediately.

**Approach:** Founders rate 50+ dishes before public launch. These are real ratings, not fake seeds.

**Why this works:**
- 100% authentic data
- No "disappearing ratings" confusion
- Founders ARE users — this is dogfooding
- No trust erosion later

**Targets before launch:**
- 50+ dish ratings across 10+ restaurants
- Cover major categories (pizza, seafood, breakfast, etc.)
- Hit the popular spots tourists will search for

**Soft launch option:**
- Invite 20 friends for 2 weeks before public launch
- Get to 100+ ratings before marketing push

---

## Gamification Framework

**Bottom line:** Phase 1 gamification = visibility of impact + identity as a contributor.

**Golden Rule:** If a mechanic risks inflating scores, biasing ratings, or low-effort behavior — it does not ship.

**NOT building:** Streaks, leaderboards, XP/points, Yelp Elite nonsense

**Phase 1 (Implemented):**
- Impact feedback after rating ("This dish entered Top 10", "You moved this up 2 spots")
- Contribution count on profile ("You've rated X dishes")
- "Needs X votes to rank" progress indicators
- Contribution language throughout ("Add Your Vote", "Help rank this dish")

**Phase 2 (After traction):**
- Contribution levels: Explorer → Contributor → Tastemaker → Local Legend
- Trust-based unlocks (suggest dishes, flag data, curate lists)

**Phase 3 (Restaurants involved):**
- Specials voting
- Community favorite badges (earned, not paid)

---

## Bot Protection & Vote Integrity

**Summary:** Prevent bots and fake accounts from gaming the rankings.

**Already in place:**
- One vote per user per dish (database constraint)
- Authentication required (Google OAuth or magic link email)
- Email verification inherent in auth flow

**Future measures (if needed):**
- Rate limiting: Max 20 votes per hour per user
- New account cooldown: Can't vote for first 10 minutes after signup
- Restaurant bombing limit: Max 3 ratings below 4 per restaurant per day (prevents targeted tanking, harder to game than streak detection)
- Suspicious pattern detection: Flag accounts that vote on same restaurant repeatedly
- Phone verification: Optional, unlocks "verified voter" badge
- Device fingerprinting: Detect multiple accounts from same device

**What NOT to do:**
- CAPTCHA on every vote (kills UX)
- Require phone number upfront (too much friction)
- Public vote history (privacy concern)

**Philosophy:** Start with light protection, add friction only if abuse appears. Don't punish real users for hypothetical bots.

---

## Search Autocomplete

**Summary:** Show matching suggestions as user types in search.

**Flow:**
1. User starts typing in search field
2. Dropdown shows matching dishes and restaurants
3. User can tap a suggestion to go directly to that item
4. Or press enter to see full search results

**Why it's good:**
- Reduces typing friction
- Helps users discover dishes they didn't know existed
- Standard UX pattern users expect

**Technical needs:**
- Debounced search query (300ms)
- Combined query for dishes + restaurants
- Dropdown component with keyboard navigation

---

## No Results State

**Summary:** When search returns nothing, show helpful suggestions instead of empty screen.

**Flow:**
1. User searches for something with no matches
2. Instead of blank screen, show:
   - "No dishes found for 'X'"
   - "Try searching for: [popular categories]"
   - "Or browse nearby restaurants"

**Why it's good:**
- Prevents dead-end frustration
- Guides users toward content that exists
- Easy win for UX polish

**Technical needs:**
- Simple conditional render
- Curated list of popular search terms
- Link to browse/restaurants pages

---

## Sorting Options

**Summary:** Let users sort dish lists by different criteria.

**Options:**
- Closest (distance)
- Most voted (total votes, high to low)
- Trending (recent vote velocity)
- Recently added

**Why it's good:**
- Users have different intents (exploring vs. deciding now)
- "Most voted" surfaces trusted dishes
- "Closest" helps when hungry NOW

**Technical needs:**
- Sort dropdown component
- Update RPC function or client-side sort
- Persist preference in localStorage

---

## Automated Menu Import Pipeline (Scaling)

**Summary:** Automated system to bulk-import restaurant menus for city expansion (Boston, etc.) without manual entry.

**Why it's needed:** Can't rely on restaurant managers to enter their own menus before launch — need menus already populated to show value when pitching. "Look, your restaurant is already here."

**How it works:**
1. Given a list of restaurants + addresses in a target city
2. Script finds their menu online (restaurant website, Toast, Square, DoorDash public pages)
3. LLM extracts dishes, section headings, prices, and maps to category vocabulary
4. Menu sections mirror the restaurant's actual menu layout (same approach as MV imports)
5. Auto-imports to database
6. QA a sample, then go live

**Technical needs:**
- Web scraper to find and fetch menu pages (handle PDFs, Toast ordering pages, restaurant websites)
- LLM extraction step (same logic as the menu-importer skill, just automated)
- Category mapping from the existing vocabulary table
- Batch runner to process hundreds of restaurants
- QA dashboard or spot-check workflow

**Phased approach:**
- v1: Semi-automated — script finds menu URL, LLM extracts, human spot-checks
- v2: Fully automated — bulk import with confidence scoring, auto-flag low-confidence extractions for review
- v3: POS integrations (Toast, Square, Clover APIs) for real-time menu sync

---

## How to Add Ideas

```markdown
## Feature Name

**Summary:** One-liner description

**Flow:** How it works from user perspective

**Why it's good:** Benefits

**Technical needs:** What's required to build it
```
