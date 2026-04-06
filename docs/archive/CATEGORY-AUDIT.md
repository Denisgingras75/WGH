# Category Granularity Audit

**Date:** Jan 16, 2026
**Triggered by:** User feedback that "Appetizers" is too broad for fair comparison

---

## Current State: Dish Counts by Category

| Category | Count | Assessment |
|----------|-------|------------|
| **apps** | 149 | **PROBLEM** - catch-all dumping ground |
| sandwich | 127 | OK - sandwiches are comparable |
| salad | 78 | OK - but some misclassified items |
| burger | 61 | Good - specific, comparable |
| **entree** | 33 | **PROBLEM** - too broad |
| sushi | 28 | Good - specific |
| pasta | 27 | Good - specific |
| pizza | 26 | Good - specific |
| taco | 24 | Good - specific |
| chowder | 20 | Good - MV specialty |
| fried chicken | 19 | Good - specific |
| fries | 13 | OK - side dish category |
| lobster roll | 11 | Good - MV specialty |
| breakfast | 11 | **Undercount** - many items in "apps" |
| wings | 10 | Good - specific |
| breakfast sandwich | 9 | Good - specific |
| pokebowl | 5 | Good - specific |
| tendys | 3 | Low count - consider merging |

---

## Problem #1: "Apps" is a Dumping Ground (149 dishes)

The "apps" category contains wildly different items that cannot be fairly compared:

### What's Actually in "Apps"

| Type | Examples | Should Be |
|------|----------|-----------|
| Actual appetizers | Deviled Eggs, Calamari, Crab Cakes, Mussels | Keep as "apps" |
| Donuts | Apple Cider Donut, Boston Cream, Maple Bacon | → `donuts` or `dessert` |
| Thai entrees | Pad Thai, Green Curry, Bangkok Fried Rice | → `thai` or `asian` |
| Caribbean entrees | Curry Chicken, Oxtail, Rice & Peas | → `caribbean` or `entree` |
| Fine dining entrees | Duck Confit ($38), Beef Tenderloin ($48), Lobster Risotto ($44) | → `entree` |
| Salads | Greek Salad, Caesar Salad, Cobb Salad | → `salad` (already exists!) |
| Breakfast items | Breakfast Burrito, Avocado Toast, Pancakes, Biscuits Benedict | → `breakfast` |
| Bowls | Veggie Bowl | → `bowl` or `salad` |

**Impact:** A user filtering "apps" sees donuts next to calamari next to Pad Thai. This makes ranking meaningless.

---

## Problem #2: "Entree" is Too Broad (33 dishes)

While more consistent than "apps," the "entree" category still groups incomparable items:

| Price Range | Examples |
|-------------|----------|
| $26-30 | Cilantro Lime Chicken, Lamb Chops, Mediterranean Chicken |
| $30-40 | Steak Tips, Pot Pie, Pork Chop, Short Ribs |
| $40-60 | Filet Mignon, Prime NY Strip, Wagyu Skirt Steak |
| $60+ | Prime Ribeye ($69), Surf n Turf ($56) |

**Impact:** Comparing a $26 chicken dish to a $69 ribeye doesn't help users decide what to order.

---

## Analysis: Categories That Work vs. Don't

### Categories That Work (Specific, Comparable)

| Category | Why It Works |
|----------|--------------|
| burger | All burgers, similar price range, same format |
| pizza | All pizzas, comparable experience |
| lobster roll | Specific dish type, MV specialty |
| chowder | Specific dish type, MV specialty |
| wings | All wings, comparable format |
| taco | All tacos, similar format |
| sushi | All sushi/rolls, similar experience |
| pasta | All pasta dishes, comparable |

### Categories That Don't Work (Too Broad)

| Category | Problem |
|----------|---------|
| apps | Contains 6+ different food types |
| entree | Price range $26-$69, proteins vary wildly |

---

## Proposed Solution

### Option A: Recategorize (Recommended)

Break "apps" into specific categories. Move misclassified items.

**New categories to add:**
| Category | Source | Est. Count |
|----------|--------|------------|
| `donuts` | Extract from apps | ~10 |
| `thai` or `asian` | Extract from apps | ~10 |
| `shareables` | True appetizers (meant for sharing) | ~30 |

**Recategorization needed:**
| Current | Move To | Count |
|---------|---------|-------|
| Apps (salads) | salad | ~15 |
| Apps (breakfast) | breakfast | ~20 |
| Apps (entrees) | entree | ~15 |
| Apps (donuts) | donuts (new) | ~10 |
| Apps (thai) | asian (new) | ~10 |

**Keep as "apps":** True appetizers - fried items, dips, shareable plates (~40 items)

### Option B: Rename + Recategorize

Instead of "apps" and "entree," use more specific names:
- `apps` → `shareables` (only things meant for sharing)
- `entree` → `steaks` + `chicken` + `ribs`

### Option C: Defer (Not Recommended)

Leave as-is, rely on search.

**Why this is bad:** Users browsing by category (the primary UX) get meaningless comparisons.

---

## Rules for When a New Category Should Exist

1. **Minimum 5 items** - Fewer than 5 = merge into related category
2. **Comparable items** - Users should be able to rank them fairly
3. **Distinct user intent** - "I want wings" vs "I want a burger" are different searches
4. **Price band similarity** - A $5 donut shouldn't compete with a $50 steak

**Test:** Would a user say "I want [category]"?
- "I want a burger" ✓
- "I want an appetizer" ✗ (too vague)
- "I want an entree" ✗ (too vague)
- "I want donuts" ✓
- "I want Thai food" ✓

---

## Tradeoffs

### Broad Categories
| Pro | Con |
|-----|-----|
| Fewer filters to maintain | Comparisons are meaningless |
| Simpler UI | User feedback: "too broad" |
| More items per category | Rankings don't help decisions |

### Granular Categories
| Pro | Con |
|-----|-----|
| Fair comparisons | More categories to browse |
| Rankings are meaningful | Some categories may be small |
| Matches user intent | Data migration required |

### Dish-First vs Restaurant-Grouped
| Approach | Pro | Con |
|----------|-----|-----|
| **Dish-first (current)** | "Best wings anywhere" | Mixed restaurants in list |
| **Restaurant-grouped** | Organized by place | Defeats cross-restaurant ranking |

**Recommendation:** Keep dish-first. The feedback about restaurant grouping is a symptom of bad categories, not a need for restaurant grouping. If categories were specific ("Wings"), users wouldn't feel the need to group by restaurant.

---

## Recommendation

### Do Now (30-60 min of SQL work)
1. **Audit all 149 "apps" dishes** - categorize into buckets
2. **Create migration SQL** to move misclassified items
3. **Add 2-3 new categories** if justified (donuts, asian/thai)
4. **Rename remaining "apps"** to `shareables` (clearer intent)

### Defer
1. Breaking up "entree" - it's smaller (33 items) and more consistent
2. Price-based subcategories - adds complexity, may not be needed

### Don't Do
1. Restaurant grouping - breaks the core value prop
2. Subcategory UI (Appetizers > Fried > Wings) - over-engineering

---

## Next Steps

If you want to proceed:
1. I'll query the actual database to get the real dish list
2. Propose exact recategorizations for each item
3. Generate migration SQL
4. Update `categoryImages.js` with new categories

**Estimated effort:** 1-2 hours total

---

*This is an analysis document. No code changes have been made.*
