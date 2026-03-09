// Centralized tag definitions for dish search + discovery
// Tags are intent-driven descriptors (not cuisine types — those live on restaurants)
// See docs/plans/2026-02-17-search-engine-v2-design.md for full definitions

// Texture/Preparation
export const TEXTURE_TAGS = [
  { id: 'crispy', label: 'Crispy' },
  { id: 'tender', label: 'Tender' },
  { id: 'smoky', label: 'Smoky' },
  { id: 'raw', label: 'Raw' },
  { id: 'fried', label: 'Fried' },
  { id: 'grilled', label: 'Grilled' },
]

// Flavor Profile
export const FLAVOR_TAGS = [
  { id: 'spicy', label: 'Spicy' },
  { id: 'sweet', label: 'Sweet' },
  { id: 'tangy', label: 'Tangy' },
  { id: 'savory', label: 'Savory' },
  { id: 'rich', label: 'Rich' },
]

// Occasion/Vibe
export const OCCASION_TAGS = [
  { id: 'quick-bite', label: 'Quick Bite' },
  { id: 'date-night', label: 'Date Night' },
  { id: 'late-night', label: 'Late Night' },
  { id: 'brunch', label: 'Brunch' },
  { id: 'comfort', label: 'Comfort' },
]

// Dietary
export const DIETARY_TAGS = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-Free' },
  { id: 'dairy-free', label: 'Dairy-Free' },
]

// Format
export const FORMAT_TAGS = [
  { id: 'shareable', label: 'Shareable' },
  { id: 'handheld', label: 'Handheld' },
  { id: 'big-plate', label: 'Big Plate' },
  { id: 'snack', label: 'Snack' },
  { id: 'side-dish', label: 'Side Dish' },
]

// Price Feel
export const PRICE_TAGS = [
  { id: 'budget-friendly', label: 'Budget-Friendly' },
  { id: 'splurge', label: 'Splurge' },
]

// Local Signal
export const LOCAL_TAGS = [
  { id: 'local-catch', label: 'Local Catch' },
  { id: 'island-favorite', label: 'Island Favorite' },
  { id: 'tourist-classic', label: 'Tourist Classic' },
]

// Cuisine Origin (for dishes with strong cultural identity)
export const CUISINE_TAGS = [
  { id: 'brazilian', label: 'Brazilian' },
  { id: 'jamaican', label: 'Jamaican' },
]

// Meta (overlapping intent — resolved via synonym expansion at query time)
export const META_TAGS = [
  { id: 'healthy', label: 'Healthy' },
  { id: 'fresh', label: 'Fresh' },
  { id: 'light', label: 'Light' },
]

// All tags combined
export const ALL_TAGS = [
  ...TEXTURE_TAGS, ...FLAVOR_TAGS, ...OCCASION_TAGS,
  ...DIETARY_TAGS, ...FORMAT_TAGS, ...PRICE_TAGS,
  ...LOCAL_TAGS, ...CUISINE_TAGS, ...META_TAGS,
]

// Synonym expansion table (query-time)
// When a user types a term, expand to matching tag IDs before searching
export const TAG_SYNONYMS = {
  'light':       ['light', 'fresh', 'healthy'],
  'healthy':     ['healthy', 'fresh', 'light'],
  'comfort':     ['comfort', 'rich', 'savory'],
  'hearty':      ['comfort', 'rich', 'big-plate'],
  'fresh':       ['fresh', 'light', 'raw'],
  'cheap':       ['budget-friendly'],
  'fancy':       ['date-night', 'splurge'],
  'quick':       ['quick-bite', 'handheld', 'snack'],
  'fried':       ['fried', 'crispy'],
  'bbq':         ['smoky', 'grilled'],
  'filling':     ['big-plate', 'comfort', 'rich'],
  'snack':       ['snack', 'quick-bite', 'side-dish'],
  'local':       ['local-catch', 'island-favorite'],
  'share':       ['shareable'],
  'kids':        ['handheld', 'comfort', 'budget-friendly'],
  'crispy':      ['crispy', 'fried'],
  'grilled':     ['grilled', 'smoky'],
  'savory':      ['savory', 'rich', 'comfort'],
  'rich':        ['rich', 'savory', 'comfort'],
  'spicy':       ['spicy'],
  'sweet':       ['sweet'],
  'vegetarian':  ['vegetarian', 'vegan'],
  'vegan':       ['vegan'],
  'gluten-free': ['gluten-free'],
  'brazilian':   ['brazilian'],
  'jamaican':    ['jamaican'],
  'jerk':        ['jamaican', 'spicy', 'grilled'],
  'caribbean':   ['jamaican'],
}

// Expand a search term to matching tag IDs
export function expandTagSynonyms(term) {
  if (!term) return []
  const key = term.toLowerCase().trim()
  return TAG_SYNONYMS[key] || []
}

// Get tag by id
export function getTagById(id) {
  return ALL_TAGS.find(tag => tag.id.toLowerCase() === id?.toLowerCase())
}

// Get tag label by id
export function getTagLabel(id) {
  const tag = getTagById(id)
  return tag?.label || id
}

// Match search term to tags (for autocomplete)
export function matchTags(searchTerm) {
  if (!searchTerm || searchTerm.trim().length < 2) return []
  const term = searchTerm.toLowerCase().trim()

  return ALL_TAGS
    .map(tag => {
      const id = tag.id.toLowerCase()
      const label = tag.label.toLowerCase()
      if (id === term || label === term) return { ...tag, score: 100 }
      if (id.startsWith(term) || label.startsWith(term)) return { ...tag, score: 80 }
      if (id.includes(term) || label.includes(term)) return { ...tag, score: 60 }
      return { ...tag, score: 0 }
    })
    .filter(tag => tag.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}
