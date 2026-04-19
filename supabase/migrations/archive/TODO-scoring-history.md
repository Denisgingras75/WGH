# WGH Scoring History & Dish Versioning

## Problem
WGH only tracks current averages. No way to explain *why* a dish score changed.

## Data Model Needs

Each dish should have:
- All-time score
- Recent score (recency-weighted)
- Change over time (trend)

To explain drops/rises, store:
- Votes with timestamps
- Dish/menu state at time of each vote
- Dish versions when recipe or preparation materially changes
- Menu versions when imports or menu edits happen
- Optional restaurant change events (supplier change, price change, new cook, portion change)

## What This Enables
- "Smash burger is down 0.7 over 6 months"
- "The drop started after the April menu update"
- "Price changed, recipe changed, and review language got worse"

## Rollout Order

1. **Add rolling/recent scores** — recency-weighted alongside lifetime average
2. **Add dish versions** — track when recipe/prep changes
3. **Add menu version history** — snapshot on each import/edit
4. **Add change-event logging** — supplier, price, staff, portion changes
5. **Show "what changed?" analytics view** — for restaurant managers

## Status
- [ ] Step 1: Rolling/recent scores
- [ ] Step 2: Dish versions
- [ ] Step 3: Menu version history
- [ ] Step 4: Change-event logging
- [ ] Step 5: Analytics view

Created: 2026-04-12
