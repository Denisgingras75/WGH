# Tone & Voice — Strategic Note

**Author:** Claude (in conversation with Dan)
**Date:** 2026-04-26
**Purpose:** One-page brief for Dan to react to. Not a plan. Not a spec. A starting point for a brand conversation.

---

## The question

Should WGH lean **more authoritative** in tone than it currently does?

## The current state, honest

The brand voice is **friendly small-app**. Amatic SC display, casual copy ("What are you craving?"), wink-and-smile splash. The voice is approachable and warm — that's a feature for first-touch users.

The data underneath wants to be **authoritative**. "12,481 votes ranked this dish #1." "On every local list." That's the language of a reference, not a friend.

Those two things fight each other on every surface. The casual voice undersells the conviction the data deserves.

## The recommendation

Move toward **authoritative-warm**, not authoritative-cold.

- **Authoritative** like Eater, Infatuation, Bon Appétit, Letterboxd. Serious about food, opinionated, conviction-forward. Type does the heavy lifting.
- **Not cold** like OpenTable, Resy, or the Apple Maps reviews tab. Those read as utility, not authority.

The locals-driven thesis ("ask the people who actually eat here") naturally wants this voice. Locals don't say "the yummiest 🦞" — they say "the best lobster roll on the island, and it's not close." WGH's tone should match how locals actually talk about their food.

## What changes

**Type system:**
- Display: Amatic SC → Fraunces (or Tiempos / Domaine Display) — editorial serif italic for headlines
- Body: Outfit → Inter or Söhne — crisp sans
- Mono: introduce JetBrains Mono / IBM Plex Mono for stat labels and metadata
- The hand-drawn warmth comes from layout (hairlines, generous spacing) instead of letterforms

**Color:**
- Coral stays as the brand spike but used sparingly
- More ink-on-paper restraint — currently every CTA is coral; should be 1–2 per screen
- Numbers and hairlines get the visual weight, not the buttons

**Copy: current → proposed**

| Surface | Current | Proposed |
|---|---|---|
| Tagline | What's Good Here | What's Good Here. *(unchanged — already perfect)* |
| Subhead | Top-rated dishes near you | A local's guide to what to actually order |
| Search placeholder | What are you craving? | Search a dish, restaurant, or place |
| Empty state | No dishes found nearby 🍽️ | Nothing here yet. Add the first one. |
| Rate CTA | Rate this dish | Have an opinion? |
| Vote pill | 73% would order again | Locals say yes. *(or)* 73 of 100 would order this again. |
| Locals' Picks header | Ask a Local · The Locals' Picks | Picks from people who eat here |
| Profile heading | Your Journal | What you've ordered |
| Add restaurant | Add to WGH | Missing? Add it. |
| Loading | Searching… | One sec. |
| Submit | Submit rating | Submit |

The pattern: drop adjectives, drop adverbs, drop emojis, commit to the claim.

**Splash + onboarding:**
- Lose the wink-and-smile pierce animation
- Replace with a typeset masthead reveal — kicker rules, big italic Fraunces wordmark, mono date line
- Animation budget: 600ms total, not 6 seconds

## What you lose

- The friendly small-app charm. Some users will read it as "trying too hard" or "for foodies, not me."
- The wink-and-smile is on-brand for kids, families, casual tourists. Authoritative is more aspirational, less inviting.
- Existing splash work, brand assets, social posts will need to be re-cut.

## What you gain

- **Trust.** Authoritative reads as credible. People believe a magazine more than a friend's group chat.
- **Longevity.** Jokey ages fast (think 2014 startup copy). Editorial ages slowly.
- **Differentiation.** The "casual fun food app" lane is crowded (Beli, Foursquare, Yelp Lite). The "local authority" lane is mostly empty in the app space. Eater/Infatuation own it on the editorial side; nobody owns it as a *product*.
- **Coherence with the data.** When you're serving up 12k votes and a #1 ranking, the voice should match the gravity.

## Risks

- This is a brand call, not a UX call. If Dan owns brand direction (he does), this needs his explicit sign-off before any visual implementation. *Don't ship copy or type changes ahead of that conversation.*
- iOS App Store screenshots will need re-shooting if voice/type changes land before submission.
- Memorial Day timing — the visual side of this is at minimum a 1–2 week effort (type swap, copy audit across every surface, splash redo). Probably defer the visual implementation post-launch and align the *copy* now.

## Phasing if greenlit

1. **Now (cheap):** copy audit. Run the current copy through the table above, ship in small PRs. Tone shift without type shift. Cost: ~1 day.
2. **Post-launch (1–2 wk):** type system swap. Fraunces + Inter + JetBrains Mono. Splash redesign. New OG images.
3. **Later:** brand identity refresh — new logomark, social templates, App Store screenshots.

## Open questions for Dan

1. Does authoritative-warm match the brand you've been building, or does it conflict with the warmth/playfulness you want?
2. Is "Locals' Picks" already a step toward this voice (it reads as more authoritative than the rest), or is it its own separate brand register?
3. Are you willing to lose the wink-and-smile splash, or is that load-bearing?
4. Pre- or post-launch?

---

*Written as a starting point, not a finished position. Push back on anything that doesn't ring true.*
