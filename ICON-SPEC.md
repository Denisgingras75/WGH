# WGH Icon System v4.0 — Neo-Brutalist

The definitive spec for food category icons in What's Good Here. Every icon in the app must follow this system.

---

## Design Philosophy

Neo-brutalist food icons with bold hand-drawn outlines, hard offset shadows, and flat saturated fills. The style has real personality — it looks like a human drew it on a wall, not like it was generated for a stock library. Think screen-print sticker art, not app icon template.

They must work at 48px in a category chip AND at 128px as a category hero. The same WebP, scaled.

---

## Visual Language

### Style

- **Neo-brutalist illustration** — solid color fills, no gradients, hand-drawn imperfection
- **Bold black outlines** — thick, slightly irregular strokes that feel hand-drawn, not vector-perfect
- **Hard offset shadow** — solid dark shadow offset to the bottom-right. Not blurred, not soft. Screen-print quality.
- **Flat saturated colors** — bright yellows, punchy reds, vivid greens. Bolder than typical app icons.
- **Transparent backgrounds** — no background shape, circle, or container. The food floats.
- **Slightly imperfect** — lines don't need to be perfectly smooth. The roughness IS the style.
- **Front-on or 3/4 perspective** — whichever reads best for the food.

### Color Temperature

All icons share a warm, saturated color temperature. Bright yellows (buns, cheese), punchy reds (pepperoni, ketchup, tomato), vivid greens (lettuce). Even "cool" foods skew warm. This keeps the set cohesive on the warm stone `#F0ECE8` background.

### Hard Shadow

The defining visual element. Every icon has a solid dark shadow offset to the bottom-right. The shadow should be:
- **Small offset** — tight to the icon, not a deep drop
- **Solid black/dark** — no transparency, no blur
- **Consistent direction** — always bottom-right across the full set

### Detail Level

- **Enough detail to be immediately recognizable** — you should know what it is at a glance
- **Simplified for small sizes** — features are clear and bold at 48px
- **Key visual elements only** — a burger is bun + patty + cheese + lettuce, not every ingredient
- **Playful details encouraged** — drippy cheese, ketchup drips, melting elements add personality

---

## Technical Spec

### Format & Sizing

| Property | Value | Notes |
|---|---|---|
| Format | PNG with transparency | Flat style could be SVG but PNG keeps workflow simple |
| Canvas | ~500x500px | High-res source, downscaled by browser |
| Aspect ratio | Roughly square | Food centered, natural proportions (wide foods like lobster roll are wider) |
| Min render size | 48px | Must be recognizable |
| Standard sizes | 48px (chip), 64px (grid), 96px (hero), 128px (dish detail) | All from same PNG, CSS-scaled |
| Max file size | ~150KB per icon | Flat style compresses well but source res is high |

### File Location & Naming

Icons live in `public/categories/icons/`.

File naming: `{category-id}.png` — must exactly match the `id` field in `ALL_CATEGORIES` from `src/constants/categories.js`. Hyphenated for multi-word (e.g., `lobster-roll.png`, `fish-and-chips.png`, `eggs-benedict.png`).

### Theme

Light mode only (Appetite theme). Icons use warm flat fills — no tinting or CSS filtering needed. They sit on the warm stone `#F0ECE8` background or white `#FFFFFF` card surfaces.

---

## Style Rules

### DO

- **Paint the food, not the plate** — unless the vessel IS the dish (chowder in a bowl, salad in a bowl)
- **Use bold, warm colors** — golden buns, bright tomato red, vivid greens
- **Keep thick dark outlines** — they define shapes and give the set its bold character
- **Make each icon distinct in silhouette** — pizza (triangle) vs taco (half-moon) vs sandwich (rectangle)
- **Show the most iconic version** — pepperoni pizza, not margherita. Classic cheeseburger, not a slider.

### DON'T

- No watercolor or hand-painted textures — this is flat illustration
- No background shapes (circles, squares, colored backgrounds)
- No photorealistic rendering — it should feel illustrated, not photographed
- No text or labels baked into the icon
- No utensils unless they're part of the dish identity (chopsticks with sushi: OK)
- No multiple separate unrelated items (exception: breakfast gets egg+toast+bacon as one scene)
- No thin/hairline outlines — keep outlines bold and consistent
- No neon or desaturated colors — warm and vivid

---

## Consistency Checks

Before shipping a new icon:

1. **Recognizable at 48px?** Squint test — can you tell what food this is?
2. **Cohesive with the set?** Place it next to pizza, burger, and lobster roll. Does it feel like the same artist drew it?
3. **Distinct silhouette?** Fill it solid — is it clearly different from every other icon?
4. **Bold outlines?** Does the outline weight match the rest of the set?
5. **Transparent background?** No white box, no colored background.

---

## Category Inventory (42 icons)

### Tier 1: Browse Categories (23)

Primary shortcuts shown on the Browse page.

| Category ID | Subject | File |
|---|---|---|
| `pizza` | Pepperoni pizza slice | `pizza.png` |
| `burger` | Classic cheeseburger | `burger.png` |
| `seafood` | Seafood arrangement | `seafood.png` |
| `wings` | Chicken wings (3) | `wings.png` |
| `sushi` | Salmon nigiri (3) | `sushi.png` |
| `breakfast` | Eggs + toast + bacon | `breakfast.png` |
| `lobster roll` | Split-top bun with lobster | `lobster-roll.png` |
| `chowder` | Bowl of chowder with crackers | `chowder.png` |
| `pasta` | Pasta dish | `pasta.png` |
| `steak` | Grilled steak with crosshatch | `steak.png` |
| `sandwich` | Layered sandwich | `sandwich.png` |
| `salad` | Bowl of greens with tomatoes | `salad.png` |
| `taco` | Two loaded tacos | `taco.png` |
| `tendys` | Chicken tenders | `tendys.png` |
| `dessert` | Chocolate cake slice with cherry | `dessert.png` |
| `fish` | Whole fish | `fish.png` |
| `clams` | Clams | `clams.png` |
| `chicken` | Chicken | `chicken.png` |
| `pork` | Pork | `pork.png` |
| `oysters` | — | **MISSING** |
| `coffee` | — | **MISSING** |
| `cocktails` | — | **MISSING** |
| `ice cream` | — | **MISSING** |

### Tier 2: Sub-Categories (19)

Used for dish-level matching in `ALL_CATEGORIES`.

| Category ID | Subject | File |
|---|---|---|
| `fried chicken` | Fried chicken | `fried-chicken.png` |
| `breakfast sandwich` | Breakfast sandwich | `breakfast-sandwich.png` |
| `soup` | Soup bowl | `soup.png` |
| `fries` | French fries | `fries.png` |
| `ribs` | Rack of ribs | `ribs.png` |
| `quesadilla` | Quesadilla | `quesadilla.png` |
| `fish-and-chips` | Fish and chips | `fish-and-chips.png` |
| `fish-sandwich` | Fish sandwich | `fish-sandwich.png` |
| `eggs-benedict` | Eggs benedict | `eggs-benedict.png` |
| `veggies` | Vegetables | `veggies.png` |
| `bruschetta` | Bruschetta | `bruschetta.png` |
| `burrito` | Burrito | `burrito.png` |
| `calamari` | Calamari | `calamari.png` |
| `crab` | Crab | `crab.png` |
| `curry` | Curry | `curry.png` |
| `lobster` | Whole lobster | `lobster.png` |
| `mussels` | Mussels | `mussels.png` |
| `onion rings` | Onion rings | `onion-rings.png` |
| `pancakes` | Pancakes | `pancakes.png` |
| `scallops` | Scallops | `scallops.png` |
| `shrimp` | Shrimp | `shrimp.png` |
| `waffles` | Waffles | `waffles.png` |
| `wrap` | Wrap | `wrap.png` |

---

## Generating New Icons

When generating new flat icons (via AI image generation or commissioning an artist), use this prompt framework:

> Flat illustrated food icon of [FOOD], bold dark outlines, warm saturated flat color fills, no gradients, transparent background, friendly app icon style, no background shape, no plate unless the food is served in a bowl

**Match the outline weight, color warmth, and simplification level of the existing pizza, burger, and taco icons.** Those three are the north star for the set.

---

## Implementation

### In code (`categories.js`)

Icons are mapped in the `CATEGORY_IMAGES` object:

```js
const CATEGORY_IMAGES = {
  pizza: '/categories/icons/pizza.png',
  burger: '/categories/icons/burger.png',
  // ...
}
```

Access via `getCategoryNeonImage(categoryId)` — returns the path or `null` if no icon exists.

### Fallback chain

1. PNG icon from `CATEGORY_IMAGES` — the flat illustrated icon
2. Emoji from `CATEGORY_INFO` — fallback for categories without an icon

### Poster variants

The `public/categories/poster/` directory contains alternate style variants (watercolor, pixelated, etc.). These are experimental and not currently used in production. Keep for reference but don't add new ones.
