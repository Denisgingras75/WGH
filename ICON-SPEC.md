# WGH Icon System v2.0 — Watercolor

The definitive spec for food category icons in What's Good Here. Every icon in the app must follow this system.

---

## Design Philosophy

Warm, hand-painted watercolor food illustrations. The style evokes a Martha's Vineyard restaurant menu or a cookbook illustration — inviting, slightly imperfect, full of appetite appeal. These are not flat icons or corporate clipart. They feel like someone painted them with real watercolors on thick paper.

They must work at 48px in a category chip AND at 128px as a category hero. The same PNG, scaled.

---

## Visual Language

### Style

- **Watercolor illustration** — soft washes, visible brushwork, natural color blending
- **Warm, realistic palette** — each food uses its natural colors (golden bread, red tomatoes, green lettuce, brown meats)
- **Thin ink outlines** — subtle dark outlines define shapes and interior structure, as if drawn with a fine pen before painting
- **Transparent backgrounds** — no background shape, circle, or container. The food floats.
- **Soft edges** — slight watercolor bleed/splatter at edges gives organic feel
- **Front-on or 3/4 perspective** — whichever reads best for the food. Consistency within the set matters more than strict angle rules.

### Color Temperature

All icons share a warm color temperature. Even "cool" foods (fish, salad) skew warm through the paper tone and lighting. This keeps the set cohesive on the warm stone `#F0ECE8` background.

### Detail Level

- **Enough detail to be appetizing** — you should want to eat it
- **Not so much detail that it becomes noisy at small sizes** — features should be recognizable at 48px
- **Interior details** (grill marks, cheese layers, toppings) are encouraged when they help identification
- **2-3 main visual elements per icon** — a burger is bun + patty + toppings, not a deconstructed ingredient list

---

## Technical Spec

### Format & Sizing

| Property | Value | Notes |
|---|---|---|
| Format | PNG with transparency | No SVGs — watercolor doesn't compress well as vector |
| Canvas | ~500x500px | High-res source, downscaled by browser |
| Aspect ratio | Roughly square | Food centered, natural proportions (wide foods like lobster roll are wider) |
| Min render size | 48px | Must be recognizable and appetizing |
| Standard sizes | 48px (chip), 64px (grid), 96px (hero), 128px (dish detail) | All from same PNG, CSS-scaled |
| Max file size | ~50KB per icon | Optimize with TinyPNG or similar |

### File Location & Naming

Icons live in `public/categories/icons/`.

File naming: `{category-id}.png` — must exactly match the `id` field in `ALL_CATEGORIES` from `src/constants/categories.js`. Hyphenated for multi-word (e.g., `lobster-roll.png`, `fish-and-chips.png`, `eggs-benedict.png`).

### Theme

Light mode only (Appetite theme). Icons use natural food colors — no tinting or CSS filtering needed. They sit on the warm stone `#F0ECE8` background or white `#FFFFFF` card surfaces.

---

## Style Rules

### DO

- **Paint the food, not the plate** — unless the vessel IS the dish (chowder in a bowl, salad in a bowl)
- **Use natural, appetizing colors** — warm golds, rich reds, fresh greens
- **Include subtle watercolor texture** — slight bleed, soft edges, visible wash layers
- **Keep thin ink outlines** — they define structure and give the set its "illustrated" character
- **Make each icon distinct in silhouette** — pizza (triangle) vs taco (half-moon) vs sandwich (rectangle)
- **Show the most iconic version** — pepperoni pizza, not margherita. Classic cheeseburger, not a slider.

### DON'T

- No flat/vector style — this is watercolor, not Material Design
- No background shapes (circles, squares, colored backgrounds)
- No photorealistic rendering — it should feel painted, not photographed
- No text or labels baked into the icon
- No utensils unless they're part of the dish identity (chopsticks with sushi: OK)
- No multiple separate unrelated items (exception: breakfast gets egg+toast+bacon as one scene)
- No pure black fills — use dark brown/charcoal for the darkest darks
- No neon or saturated digital colors — keep it natural and warm

---

## Consistency Checks

Before shipping a new icon:

1. **Appetizing?** Does it make you hungry? If it looks clinical or sterile, add warmth.
2. **Recognizable at 48px?** Squint test — can you tell what food this is?
3. **Cohesive with the set?** Place it next to pizza, burger, and lobster roll. Does it feel like the same artist painted it?
4. **Distinct silhouette?** Fill it solid — is it clearly different from every other icon?
5. **Warm tone?** Does it match the warm color temperature of the rest of the set?
6. **Transparent background?** No white box, no colored background.

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

When generating new watercolor icons (via AI image generation or commissioning an artist), use this prompt framework:

> Watercolor illustration of [FOOD], hand-painted style with thin ink outlines, warm natural colors, transparent background, appetizing and inviting, slight watercolor bleed at edges, cookbook illustration style, no background, no plate unless the food is served in a bowl

**Match the warmth, outline weight, and detail level of the existing pizza, burger, and lobster roll icons.** Those three are the north star for the set.

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

1. PNG icon from `CATEGORY_IMAGES` — the watercolor illustration
2. Emoji from `CATEGORY_INFO` — fallback for categories without an icon

### Poster variants

The `public/categories/poster/` directory contains alternate "water" style variants (e.g., `chowder-water.png`, `steak-water.png`). These are experimental and not currently used in production. Keep for reference but don't add new ones.
