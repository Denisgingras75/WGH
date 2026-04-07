# Map-Category Sync — Design Spec

## Summary

When toggling from list to map mode, the map inherits the active category and shows the top 10 dishes for that category with numbered rank pins. A translucent floating category bar on the map lets users switch categories without returning to list mode.

## Approach: C — Inherit on toggle, then independent

- Map inherits the active category from list mode when toggling
- Once on the map, category switching is independent — doesn't affect list state
- Toggling back to list returns to exactly where the user left off

## State Flow

- New `mapCategory` state in `Map.jsx`, initialized to `null` ("Near You")
- On list → map toggle: `mapCategory = selectedCategory || expandedCategory || null`
- On map → list toggle: `mapCategory` discarded, list state untouched
- Floating category bar reads/writes `mapCategory` only

## Floating Category Bar

- Position: top of map screen, below search bar area
- Background: semi-transparent `rgba` of `--color-bg` at ~0.7 opacity + backdrop blur
- Layout: horizontal scroll row of category icons
- Icons: ~36px, using same `BROWSE_CATEGORIES` list and WebP icons from `getCategoryNeonImage()`
- First item: "Near You" with a location/pin icon, clears filter to overall top 10
- Active icon: highlight ring using `--color-primary`
- No text labels — icons only
- Tapping an icon sets `mapCategory`, pins update immediately

## Map Pins

- `mapCategory` set: filter `allRanked` by category, slice top 10, show with rank badges 1-10
- `mapCategory` null: show overall top 10 (current behavior)
- `dishRanks` recalculated per category so ranks are 1-10 within the filtered set
- Map auto-fits bounds to new pin set when category changes
- Pin rendering unchanged — `buildCategoryIcon` already handles rank badges with medal colors

## Files to Touch

- `src/pages/Map.jsx` — add `mapCategory` state, update toggle handler, update `displayedOnMap` and `dishRanks`
- `src/components/home/MapCategoryBar.jsx` — new component, floating translucent icon row
- `src/components/home/index.js` — barrel export

## What NOT to change

- List mode behavior — carousel, chalkboards, scroll position all untouched
- Pin rendering — `buildCategoryIcon` in `RestaurantMap.jsx` already works
- Search behavior — search overrides category filter (existing behavior preserved)
