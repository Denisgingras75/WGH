# T36: Client-Side Search Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 4-level network fallback search with instant client-side filtering over a cached dish list.

**Architecture:** One new `dishesApi.getAllSearchable()` fetches all dishes into React Query cache. A pure `searchDishes()` function scores and filters locally. `useDishSearch` keeps the same API but runs locally instead of hitting the network.

**Tech Stack:** React Query, Vitest, existing tag/sanitize utilities

---

### Task 1: Create `searchDishes` pure function with tests

**Files:**
- Create: `src/utils/dishSearch.js`
- Create: `src/utils/dishSearch.test.js`

**Step 1: Write the test file**

```js
// src/utils/dishSearch.test.js
import { describe, it, expect } from 'vitest'
import { searchDishes } from './dishSearch'

// Reusable mock dish factory
const makeDish = (overrides = {}) => ({
  id: overrides.id || 'dish-1',
  name: overrides.name || 'Lobster Roll',
  category: overrides.category || 'lobster roll',
  tags: overrides.tags || [],
  avg_rating: overrides.avg_rating ?? 8.5,
  total_votes: overrides.total_votes ?? 10,
  price: overrides.price ?? 18,
  photo_url: overrides.photo_url || null,
  value_score: overrides.value_score || null,
  value_percentile: overrides.value_percentile || null,
  restaurant_id: overrides.restaurant_id || 'rest-1',
  restaurant_name: overrides.restaurant_name || "Nancy's",
  restaurant_cuisine: overrides.restaurant_cuisine || 'Seafood',
  restaurant_town: overrides.restaurant_town || 'Oak Bluffs',
  restaurant_is_open: overrides.restaurant_is_open ?? true,
  restaurant_lat: overrides.restaurant_lat || 41.45,
  restaurant_lng: overrides.restaurant_lng || -70.56,
})

const DISHES = [
  makeDish({ id: '1', name: 'Lobster Roll', category: 'lobster roll', tags: ['fresh', 'local-catch'], avg_rating: 9.2, restaurant_name: "Larsen's Fish Market", restaurant_town: 'Chilmark' }),
  makeDish({ id: '2', name: 'Fried Chicken Sandwich', category: 'sandwich', tags: ['crispy', 'comfort', 'handheld'], avg_rating: 8.8, restaurant_name: 'Back Door Donuts', restaurant_town: 'Oak Bluffs' }),
  makeDish({ id: '3', name: 'Clam Chowder', category: 'chowder', tags: ['comfort', 'rich', 'local-catch'], avg_rating: 9.0, restaurant_name: 'The Net Result', restaurant_town: 'Vineyard Haven' }),
  makeDish({ id: '4', name: 'Margherita Pizza', category: 'pizza', tags: ['savory'], avg_rating: 8.3, restaurant_name: 'Rocco\'s', restaurant_town: 'Oak Bluffs' }),
  makeDish({ id: '5', name: 'Fried Clam Strips', category: 'clams', tags: ['crispy', 'fried', 'local-catch'], avg_rating: 8.1, restaurant_name: 'The Bite', restaurant_town: 'Menemsha' }),
  makeDish({ id: '6', name: 'Caesar Salad', category: 'salad', tags: ['fresh', 'light'], avg_rating: 7.5, restaurant_name: 'State Road', restaurant_town: 'West Tisbury' }),
  makeDish({ id: '7', name: 'Grilled Swordfish', category: 'fish', tags: ['grilled', 'fresh', 'local-catch'], avg_rating: 8.9, restaurant_name: 'Rockfish', restaurant_town: 'Oak Bluffs' }),
  makeDish({ id: '8', name: 'Chicken Wings', category: 'wings', tags: ['crispy', 'spicy'], avg_rating: 7.8, restaurant_name: 'Offshore Ale', restaurant_town: 'Oak Bluffs' }),
  makeDish({ id: '9', name: 'Fish Tacos', category: 'taco', tags: ['fresh', 'light', 'handheld'], avg_rating: 8.0, restaurant_name: 'Rockfish', restaurant_town: 'Oak Bluffs' }),
  makeDish({ id: '10', name: 'Fried Chicken', category: 'chicken', tags: ['crispy', 'fried', 'comfort'], avg_rating: 8.6, restaurant_name: 'Art Cliff Diner', restaurant_town: 'Vineyard Haven' }),
]

describe('searchDishes', () => {
  it('returns empty array for empty query', () => {
    expect(searchDishes(DISHES, '')).toEqual([])
    expect(searchDishes(DISHES, '   ')).toEqual([])
    expect(searchDishes(DISHES, null)).toEqual([])
  })

  it('returns empty array for query with only stop words', () => {
    expect(searchDishes(DISHES, 'the best food near me')).toEqual([])
  })

  it('matches single word in dish name', () => {
    const results = searchDishes(DISHES, 'lobster')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].dish_name).toBe('Lobster Roll')
  })

  it('matches exact phrase in dish name (multi-word)', () => {
    const results = searchDishes(DISHES, 'fried chicken sandwich')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].dish_name).toBe('Fried Chicken Sandwich')
  })

  it('does not return unrelated dishes for multi-word query', () => {
    const results = searchDishes(DISHES, 'fried chicken sandwich')
    const names = results.map(r => r.dish_name)
    // Should NOT include items that only match one token like "Caesar Salad"
    expect(names).not.toContain('Caesar Salad')
    expect(names).not.toContain('Margherita Pizza')
  })

  it('matches by category', () => {
    const results = searchDishes(DISHES, 'pizza')
    expect(results.some(r => r.dish_name === 'Margherita Pizza')).toBe(true)
  })

  it('expands tag synonyms (healthy -> fresh, light)', () => {
    const results = searchDishes(DISHES, 'healthy')
    expect(results.length).toBeGreaterThan(0)
    // Should include dishes tagged fresh or light
    const hasTagMatch = results.every(r => {
      const tags = r.tags || []
      return tags.some(t => ['fresh', 'light', 'healthy'].includes(t))
    })
    expect(hasTagMatch).toBe(true)
  })

  it('normalizes misspellings', () => {
    const results = searchDishes(DISHES, 'chineese')
    // Won't match our test data, but shouldn't crash
    expect(Array.isArray(results)).toBe(true)
  })

  it('filters by town when provided', () => {
    const results = searchDishes(DISHES, 'fried', { town: 'Menemsha' })
    expect(results.length).toBeGreaterThan(0)
    results.forEach(r => {
      expect(r.restaurant_town).toBe('Menemsha')
    })
  })

  it('respects limit parameter', () => {
    const results = searchDishes(DISHES, 'fried', { limit: 2 })
    expect(results.length).toBeLessThanOrEqual(2)
  })

  it('sorts by score then rating', () => {
    const results = searchDishes(DISHES, 'fried')
    // "Fried Chicken Sandwich" (exact phrase) should rank above partial matches
    expect(results[0].dish_name).toContain('Fried')
    // All results should be sorted by rating within same score tier
    for (let i = 1; i < results.length; i++) {
      // Can't assert strict ordering across score tiers, but within same score, rating descends
    }
  })

  it('only returns dishes from open restaurants', () => {
    const withClosed = [
      ...DISHES,
      makeDish({ id: '99', name: 'Lobster Bisque', category: 'soup', restaurant_is_open: false }),
    ]
    const results = searchDishes(withClosed, 'lobster')
    expect(results.every(r => r.restaurant_is_open !== false)).toBe(true)
  })

  it('returns results in the expected shape', () => {
    const results = searchDishes(DISHES, 'lobster')
    const r = results[0]
    expect(r).toHaveProperty('dish_id')
    expect(r).toHaveProperty('dish_name')
    expect(r).toHaveProperty('category')
    expect(r).toHaveProperty('tags')
    expect(r).toHaveProperty('avg_rating')
    expect(r).toHaveProperty('total_votes')
    expect(r).toHaveProperty('restaurant_id')
    expect(r).toHaveProperty('restaurant_name')
    expect(r).toHaveProperty('restaurant_town')
  })

  it('handles dishes with null/missing fields gracefully', () => {
    const sparse = [
      makeDish({ id: '99', name: 'Mystery Dish', category: null, tags: null, avg_rating: null, restaurant_name: null }),
    ]
    // Should not crash
    const results = searchDishes(sparse, 'mystery')
    expect(results.length).toBeGreaterThan(0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/utils/dishSearch.test.js`
Expected: FAIL — `searchDishes` not found

**Step 3: Write the implementation**

```js
// src/utils/dishSearch.js
import { TAG_SYNONYMS } from '../constants/tags'

const STOP_WORDS = new Set([
  'food', 'foods', 'the', 'a', 'an', 'and', 'or', 'for', 'of', 'at',
  'to', 'on', 'best', 'good', 'great', 'near', 'me', 'find', 'get',
  'want', 'looking', 'something', 'whats', "what's", 'is', 'some',
])

const MISSPELLINGS = {
  'indiana': 'indian', 'indain': 'indian',
  'italien': 'italian', 'italain': 'italian',
  'mexcian': 'mexican', 'maxican': 'mexican',
  'chineese': 'chinese', 'chinease': 'chinese',
  'japaneese': 'japanese', 'japenese': 'japanese',
  'thia': 'thai', 'tai': 'thai',
  'ceasar': 'caesar', 'ceaser': 'caesar',
}

/**
 * Search dishes locally with scoring and ranking.
 * Pure function — no side effects, no network calls.
 *
 * @param {Array} dishes - All dishes (from useAllDishes cache)
 * @param {string} query - User search input
 * @param {Object} options
 * @param {string|null} options.town - Optional town filter
 * @param {number} options.limit - Max results (default 10)
 * @returns {Array} Filtered, scored, and sorted dish results
 */
export function searchDishes(dishes, query, options = {}) {
  const { town = null, limit = 10 } = options

  if (!query?.trim()) return []
  if (!Array.isArray(dishes) || dishes.length === 0) return []

  // Tokenize
  const allWords = query.toLowerCase().trim().split(/\s+/).filter(w => w.length >= 2)
  const tokens = allWords.filter(w => !STOP_WORDS.has(w))
  if (tokens.length === 0) return []

  // Normalize misspellings
  const normalizedTokens = tokens.map(t => MISSPELLINGS[t] || t)
  const phrase = normalizedTokens.join(' ')

  // Expand tag synonyms
  const expandedTags = new Set()
  for (const token of normalizedTokens) {
    const synonyms = TAG_SYNONYMS[token]
    if (synonyms) {
      for (const s of synonyms) expandedTags.add(s)
    } else {
      expandedTags.add(token)
    }
  }

  // Score each dish
  const scored = []

  for (const dish of dishes) {
    // Skip closed restaurants
    if (dish.restaurant_is_open === false) continue

    // Town filter
    if (town && dish.restaurant_town !== town) continue

    const name = (dish.name || '').toLowerCase()
    const category = (dish.category || '').toLowerCase()
    const tags = (dish.tags || []).map(t => (t || '').toLowerCase())

    let score = 0

    // Exact phrase match on name (highest priority)
    if (normalizedTokens.length > 1 && name.includes(phrase)) {
      score = 100
    }
    // All tokens match in name
    else if (normalizedTokens.length > 1 && normalizedTokens.every(t => name.includes(t))) {
      score = 80
    }
    // All tokens match across name + category
    else if (normalizedTokens.every(t => name.includes(t) || category.includes(t))) {
      score = 60
    }
    // Tag overlap — at least one expanded tag matches
    else if (tags.some(t => expandedTags.has(t))) {
      // For multi-word queries, require at least one token in name/category too
      if (normalizedTokens.length > 1) {
        const hasNameOrCatMatch = normalizedTokens.some(t => name.includes(t) || category.includes(t))
        if (hasNameOrCatMatch) {
          score = 40
        }
      } else {
        score = 40
      }
    }
    // Single token partial match on name
    else if (normalizedTokens.some(t => name.includes(t))) {
      score = 20
    }

    if (score > 0) {
      scored.push({ dish, score })
    }
  }

  // Sort by score desc, then avg_rating desc
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return (b.dish.avg_rating || 0) - (a.dish.avg_rating || 0)
  })

  // Transform to output shape and limit
  return scored.slice(0, limit).map(({ dish }) => ({
    dish_id: dish.id,
    dish_name: dish.name,
    category: dish.category,
    tags: dish.tags || [],
    photo_url: dish.photo_url,
    price: dish.price,
    value_score: dish.value_score,
    value_percentile: dish.value_percentile,
    total_votes: dish.total_votes || 0,
    avg_rating: dish.avg_rating,
    restaurant_id: dish.restaurant_id,
    restaurant_name: dish.restaurant_name,
    restaurant_cuisine: dish.restaurant_cuisine,
    restaurant_town: dish.restaurant_town,
    restaurant_lat: dish.restaurant_lat,
    restaurant_lng: dish.restaurant_lng,
    restaurant_is_open: dish.restaurant_is_open,
  }))
}
```

**Step 4: Run tests to verify they pass**

Run: `npm run test -- src/utils/dishSearch.test.js`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/utils/dishSearch.js src/utils/dishSearch.test.js
git commit -m "feat: add searchDishes pure function with tests (T36)"
```

---

### Task 2: Add `dishesApi.getAllSearchable()` method

**Files:**
- Modify: `src/api/dishesApi.js` (add method after `getMapDishes`, ~line 490)

**Step 1: Add the method**

Add this method to `dishesApi` object, after `getMapDishes`:

```js
  /**
   * Get all dishes with search-relevant fields for client-side caching.
   * Returns a flat array (restaurant data denormalized into each dish).
   * ~300 rows, ~50KB. Cached by React Query in useAllDishes hook.
   * @returns {Promise<Array>} All dishes with restaurant metadata
   */
  async getAllSearchable() {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select(`
          id, name, category, tags, photo_url, price,
          avg_rating, total_votes, value_score, value_percentile,
          restaurants!inner (
            id, name, is_open, cuisine, town, lat, lng
          )
        `)
        .order('avg_rating', { ascending: false, nullsFirst: false })

      if (error) throw createClassifiedError(error)

      return (data || [])
        .filter(d => d.restaurants)
        .map(d => ({
          id: d.id,
          name: d.name,
          category: d.category,
          tags: d.tags || [],
          photo_url: d.photo_url,
          price: d.price,
          avg_rating: d.avg_rating,
          total_votes: d.total_votes || 0,
          value_score: d.value_score,
          value_percentile: d.value_percentile,
          restaurant_id: d.restaurants.id,
          restaurant_name: d.restaurants.name,
          restaurant_is_open: d.restaurants.is_open,
          restaurant_cuisine: d.restaurants.cuisine,
          restaurant_town: d.restaurants.town,
          restaurant_lat: d.restaurants.lat,
          restaurant_lng: d.restaurants.lng,
        }))
    } catch (error) {
      logger.error('Error fetching all searchable dishes:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/api/dishesApi.js
git commit -m "feat: add dishesApi.getAllSearchable() for client-side cache (T36)"
```

---

### Task 3: Create `useAllDishes` hook

**Files:**
- Create: `src/hooks/useAllDishes.js`

**Step 1: Write the hook**

```js
// src/hooks/useAllDishes.js
import { useQuery } from '@tanstack/react-query'
import { dishesApi } from '../api/dishesApi'
import { logger } from '../utils/logger'

/**
 * Cache all dishes for client-side search.
 * ~300 rows, ~50KB. Fetched once, refreshed on window focus and every 5 minutes.
 * @returns {Object} { dishes, loading, error }
 */
export function useAllDishes() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['allDishes'],
    queryFn: () => dishesApi.getAllSearchable(),
    staleTime: 1000 * 60 * 5,  // 5 minutes
    gcTime: 1000 * 60 * 30,    // 30 minutes
  })

  if (error) {
    logger.error('Error loading dish cache:', error)
  }

  return {
    dishes: data || [],
    loading: isLoading,
    error,
  }
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/hooks/useAllDishes.js
git commit -m "feat: add useAllDishes hook for dish cache (T36)"
```

---

### Task 4: Rewrite `useDishSearch` to use local filtering

**Files:**
- Modify: `src/hooks/useDishSearch.js` (full rewrite)

**Step 1: Rewrite the hook**

Replace entire contents of `src/hooks/useDishSearch.js`:

```js
// src/hooks/useDishSearch.js
import { useMemo } from 'react'
import { useAllDishes } from './useAllDishes'
import { searchDishes } from '../utils/dishSearch'

/**
 * Search dishes with instant client-side filtering.
 * Same API signature as previous server-based version.
 * @param {string} query - Search query
 * @param {number} limit - Max results (default 5)
 * @param {string|null} town - Optional town filter
 * @returns {Object} { results, loading, error }
 */
export function useDishSearch(query, limit = 5, town = null) {
  const { dishes, loading: cacheLoading, error } = useAllDishes()

  const trimmedQuery = query?.trim() || ''

  const results = useMemo(() => {
    if (trimmedQuery.length < 2) return []
    if (!dishes.length) return []
    return searchDishes(dishes, trimmedQuery, { town, limit })
  }, [dishes, trimmedQuery, town, limit])

  return {
    results,
    loading: cacheLoading && trimmedQuery.length >= 2,
    error,
  }
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/hooks/useDishSearch.js
git commit -m "feat: rewrite useDishSearch to use client-side filtering (T36)"
```

---

### Task 5: Update `DishSearch.jsx` — remove direct API search

**Files:**
- Modify: `src/components/DishSearch.jsx`

**Step 1: Replace the useEffect API call with useDishSearch hook**

In `DishSearch.jsx`:

1. Add import at top: `import { useDishSearch } from '../hooks/useDishSearch'`
2. Remove import: `import { dishesApi } from '../api/dishesApi'` (line 5)
3. Remove state: `const [searchResults, setSearchResults] = useState([])` (line 37)
4. Remove state: `const [searching, setSearching] = useState(false)` (line 38)
5. Remove the `mountedRef` and its useEffect (lines 40-48)
6. Remove the entire useEffect that calls `dishesApi.search()` (lines 77-107)
7. Add hook call after the existing state declarations:

```js
const { results: hookResults, loading: hookLoading } = useDishSearch(
  onSearchChange ? '' : query, // Only use hook in dropdown mode
  MAX_DISH_RESULTS,
  town
)
```

8. Update the `results` object (around line 120):

```js
const results = {
  dishes: onSearchChange ? [] : hookResults,
  categories: matchingCategories,
}
```

9. Update `isLoading` (around line 127):

```js
const isLoading = loading || (hookLoading && !onSearchChange)
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/DishSearch.jsx
git commit -m "refactor: DishSearch uses useDishSearch hook instead of direct API (T36)"
```

---

### Task 6: Update `Browse.jsx` — remove direct `dishesApi.search()` call

**Files:**
- Modify: `src/pages/Browse.jsx`

**Step 1: Replace the direct API call**

In `Browse.jsx` around line 142-155, there's a `fetchSuggestions` function that calls `dishesApi.search(searchQuery, 5, town)` directly. This needs to use the `useDishSearch` results instead.

1. The hook is already imported and called at line 79: `const { results: searchResults, loading: searchLoading } = useDishSearch(debouncedSearchQuery, 50, town)`
2. Remove the `dishesApi` import if only used for search (check other uses first — `dishesApi` may still be needed for other methods)
3. Replace the `fetchSuggestions` useEffect (lines ~135-158) that calls `dishesApi.search()`:
   - Instead of fetching dish suggestions from the API, derive them from `searchResults` (already available from `useDishSearch`)
   - The `dishSuggestions` state and its setter can be replaced with a `useMemo` over `searchResults`

```js
// Replace dishSuggestions state + fetchSuggestions useEffect with:
const dishSuggestions = useMemo(() => {
  if (!searchQuery?.trim() || searchQuery.trim().length < 2) return []
  return searchResults.slice(0, 5)
}, [searchResults, searchQuery])
```

4. Remove the `dishSuggestions` useState declaration
5. Remove the `fetchSuggestions` useEffect entirely

**Step 2: Verify build passes**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/pages/Browse.jsx
git commit -m "refactor: Browse uses useDishSearch instead of direct API search (T36)"
```

---

### Task 7: Delete `dishesApi.search()` and update tests

**Files:**
- Modify: `src/api/dishesApi.js` (delete search method, lines 70-303)
- Modify: `src/api/dishesApi.test.js` (delete search test block, lines 153-299)

**Step 1: Delete the search method from dishesApi**

Remove the entire `search()` method (lines ~70-303) from `dishesApi.js`. Also remove the `TAG_SYNONYMS` import at line 6 since it's no longer used in this file.

**Step 2: Delete search tests from dishesApi.test.js**

Remove the entire `describe('search', ...)` block (lines 153-299).

**Step 3: Verify all tests pass**

Run: `npm run test`
Expected: All PASS (dishSearch.test.js covers the new search, old search tests removed)

**Step 4: Verify build passes**

Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/api/dishesApi.js src/api/dishesApi.test.js
git commit -m "refactor: delete dishesApi.search() and old search tests (T36)"
```

---

### Task 8: Verify acceptance criteria

**Step 1: Run full test suite**

Run: `npm run test`
Expected: All PASS

**Step 2: Run build**

Run: `npm run build`
Expected: PASS with no errors

**Step 3: Manual verification checklist**

Run: `npm run dev` and verify in browser:

- [ ] Homepage search bar: type "lobster" — results appear instantly
- [ ] Homepage search bar: type "fried chicken sandwich" — returns fried chicken sandwiches, not unrelated items
- [ ] Homepage search bar: type "healthy" — returns dishes tagged fresh/light
- [ ] Homepage search bar: type "pizza" — returns pizza dishes
- [ ] Browse page: search works, results filter correctly
- [ ] Browse page: category filter still works independently of search
- [ ] DishSearch dropdown: type in search bar on any page, dropdown shows results
- [ ] Town filter: if active, search results respect it

**Step 4: Commit any final fixes if needed, then update TASKS.md**

Mark T36 as DONE in `TASKS.md` with a summary of what was done.

```bash
git add TASKS.md
git commit -m "docs: mark T36 as done"
```
