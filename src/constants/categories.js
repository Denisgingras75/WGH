// Centralized category definitions for the app
// Used for Browse shortcuts, category picker, fuzzy matching, and profile stats

// Browse shortcuts - curated high-frequency categories for Browse page
// Note: Categories are shortcuts, NOT containers. All dishes are searchable regardless of category.
export const BROWSE_CATEGORIES = [
  { id: 'pizza', label: 'Pizza', emoji: '🍕' },
  { id: 'burger', label: 'Burgers', emoji: '🍔' },
  { id: 'lobster roll', label: 'Lobster Rolls', emoji: '🦞' },
  { id: 'wings', label: 'Wings', emoji: '🍗' },
  { id: 'sushi', label: 'Sushi', emoji: '🍣' },
  { id: 'breakfast', label: 'Breakfast', emoji: '🍳' },
  { id: 'seafood', label: 'Seafood', emoji: '🦐' },
  { id: 'chowder', label: 'Chowder', emoji: '🍲' },
  { id: 'pasta', label: 'Pasta', emoji: '🍝' },
  { id: 'steak', label: 'Steak', emoji: '🥩' },
  { id: 'sandwich', label: 'Sandwiches', emoji: '🥪' },
  { id: 'salad', label: 'Salads', emoji: '🥗' },
  { id: 'taco', label: 'Tacos', emoji: '🌮' },
  { id: 'tendys', label: 'Tenders', emoji: '🍗' },
  { id: 'dessert', label: 'Desserts', emoji: '🍰' },
  { id: 'ice cream', label: 'Ice Cream', emoji: '🍦' },
  { id: 'fish', label: 'Fish', emoji: '🐟' },
  { id: 'clams', label: 'Clams', emoji: '🐚' },
  { id: 'chicken', label: 'Chicken', emoji: '🐔' },
  { id: 'pork', label: 'Pork', emoji: '🐷' },
]

// Main categories shown in category picker (singular labels)
export const MAIN_CATEGORIES = [
  { id: 'pizza', label: 'Pizza', emoji: '🍕' },
  { id: 'burger', label: 'Burger', emoji: '🍔' },
  { id: 'taco', label: 'Taco', emoji: '🌮' },
  { id: 'wings', label: 'Wings', emoji: '🍗' },
  { id: 'sushi', label: 'Sushi', emoji: '🍣' },
  { id: 'breakfast', label: 'Breakfast', emoji: '🍳' },
  { id: 'lobster roll', label: 'Lobster Roll', emoji: '🦞' },
  { id: 'chowder', label: 'Chowder', emoji: '🥣' },
  { id: 'pasta', label: 'Pasta', emoji: '🍝' },
  { id: 'steak', label: 'Steak', emoji: '🥩' },
  { id: 'sandwich', label: 'Sandwich', emoji: '🥪' },
  { id: 'salad', label: 'Salad', emoji: '🥗' },
  { id: 'seafood', label: 'Seafood', emoji: '🦐' },
  { id: 'tendys', label: 'Tenders', emoji: '🍗' },
  { id: 'dessert', label: 'Dessert', emoji: '🍰' },
  { id: 'ice cream', label: 'Ice Cream', emoji: '🍦' },
  { id: 'fish', label: 'Fish', emoji: '🐟' },
  { id: 'clams', label: 'Clams', emoji: '🐚' },
  { id: 'chicken', label: 'Chicken', emoji: '🐔' },
  { id: 'pork', label: 'Pork', emoji: '🐷' },
]

// All categories in the system (including sub-categories)
// Used for fuzzy matching when user types custom input
export const ALL_CATEGORIES = [
  ...MAIN_CATEGORIES,
  { id: 'pokebowl', label: 'Poke Bowl', emoji: '🥗' },
  { id: 'soup', label: 'Soup', emoji: '🍜' },
  { id: 'fries', label: 'Fries', emoji: '🍟' },
  { id: 'apps', label: 'Appetizers', emoji: '🍤' },
  { id: 'fried chicken', label: 'Fried Chicken', emoji: '🍗' },
  { id: 'entree', label: 'Entree', emoji: '🍽️' },
  { id: 'donuts', label: 'Donuts', emoji: '🍩' },
  { id: 'asian', label: 'Asian', emoji: '🥢' },
  { id: 'quesadilla', label: 'Quesadilla', emoji: '🫓' },
  { id: 'breakfast sandwich', label: 'Breakfast Sandwich', emoji: '🥯' },
  { id: 'ribs', label: 'Ribs', emoji: '🍖' },
  { id: 'sides', label: 'Sides', emoji: '🥦' },
  { id: 'duck', label: 'Duck', emoji: '🦆' },
  { id: 'lamb', label: 'Lamb', emoji: '🍖' },
  { id: 'bruschetta', label: 'Bruschetta', emoji: '🍞' },
  { id: 'burrito', label: 'Burrito', emoji: '🌯' },
  { id: 'calamari', label: 'Calamari', emoji: '🦑' },
  { id: 'crab', label: 'Crab', emoji: '🦀' },
  { id: 'curry', label: 'Curry', emoji: '🍛' },
  { id: 'lobster', label: 'Lobster', emoji: '🦞' },
  { id: 'mussels', label: 'Mussels', emoji: '🐚' },
  { id: 'onion rings', label: 'Onion Rings', emoji: '🧅' },
  { id: 'pancakes', label: 'Pancakes', emoji: '🥞' },
  { id: 'scallops', label: 'Scallops', emoji: '🐚' },
  { id: 'shrimp', label: 'Shrimp', emoji: '🦐' },
  { id: 'waffles', label: 'Waffles', emoji: '🧇' },
  { id: 'wrap', label: 'Wrap', emoji: '🌯' },
  { id: 'fish-and-chips', label: 'Fish & Chips', emoji: '🐟' },
  { id: 'fish-sandwich', label: 'Fish Sandwich', emoji: '🐟' },
  { id: 'eggs-benedict', label: 'Eggs Benedict', emoji: '🍳' },
  { id: 'veggies', label: 'Veggies', emoji: '🥦' },
  { id: 'pastry', label: 'Pastry', emoji: '🥐' },
]

// Fuzzy match a search term to existing categories
// Returns matching categories sorted by relevance
export function matchCategories(searchTerm) {
  if (!searchTerm || searchTerm.trim().length < 2) return []

  const term = searchTerm.toLowerCase().trim()

  return ALL_CATEGORIES
    .map(cat => {
      const id = cat.id.toLowerCase()
      const label = cat.label.toLowerCase()

      // Exact match scores highest
      if (id === term || label === term) {
        return { ...cat, score: 100 }
      }

      // Starts with term
      if (id.startsWith(term) || label.startsWith(term)) {
        return { ...cat, score: 80 }
      }

      // Contains term
      if (id.includes(term) || label.includes(term)) {
        return { ...cat, score: 60 }
      }

      // Check for partial word matches (e.g., "acai" -> no match, but "chicken" -> "fried chicken")
      const words = [...id.split(' '), ...label.split(' ')]
      if (words.some(word => word.startsWith(term))) {
        return { ...cat, score: 40 }
      }

      return { ...cat, score: 0 }
    })
    .filter(cat => cat.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) // Return top 5 matches
}

// Get category by id
export function getCategoryById(id) {
  return ALL_CATEGORIES.find(cat => cat.id.toLowerCase() === id?.toLowerCase())
}

// Get emoji for a category id
export function getCategoryEmoji(id) {
  const category = getCategoryById(id)
  return category?.emoji || '🍽️'
}

// Flat illustrated food icons — WGH Icon System v3.0
// Bold dark outlines, warm flat fills, transparent backgrounds
// See ICON-SPEC.md for the full spec
const CATEGORY_IMAGES = {
  pizza: '/categories/icons/pizza.webp',
  burger: '/categories/icons/burger.webp',
  wings: '/categories/icons/wings.webp',
  breakfast: '/categories/icons/breakfast.webp',
  'lobster roll': '/categories/icons/lobster-roll.webp',
  chowder: '/categories/icons/chowder.webp',
  steak: '/categories/icons/steak.webp',
  sandwich: '/categories/icons/sandwich.webp',
  salad: '/categories/icons/salad.webp',
  taco: '/categories/icons/taco.webp',
  pasta: '/categories/icons/pasta.webp',
  seafood: '/categories/icons/seafood.webp',
  sushi: '/categories/icons/sushi.webp',
  tendys: '/categories/icons/tendys.webp',
  dessert: '/categories/icons/dessert.webp',
  'ice cream': '/categories/icons/ice-cream.webp',
  fish: '/categories/icons/fish.webp',
  clams: '/categories/icons/clams.webp',
  chicken: '/categories/icons/chicken.webp',
  pork: '/categories/icons/pork.webp',
  'fried chicken': '/categories/icons/fried-chicken.webp',
  'breakfast sandwich': '/categories/icons/breakfast-sandwich.webp',
  soup: '/categories/icons/soup.webp',
  fries: '/categories/icons/fries.webp',
  ribs: '/categories/icons/ribs.webp',
  quesadilla: '/categories/icons/quesadilla.webp',
  'fish-and-chips': '/categories/icons/fish-and-chips.webp',
  'fish-sandwich': '/categories/icons/fish-sandwich.webp',
  'eggs-benedict': '/categories/icons/eggs-benedict.webp',
  veggies: '/categories/icons/veggies.webp',
  bruschetta: '/categories/icons/bruschetta.webp',
  burrito: '/categories/icons/burrito.webp',
  calamari: '/categories/icons/calamari.webp',
  crab: '/categories/icons/crab.webp',
  curry: '/categories/icons/curry.webp',
  lobster: '/categories/icons/lobster.webp',
  mussels: '/categories/icons/mussels.webp',
  'onion rings': '/categories/icons/onion-rings.webp',
  pancakes: '/categories/icons/pancakes.webp',
  scallops: '/categories/icons/scallops.webp',
  shrimp: '/categories/icons/shrimp.webp',
  waffles: '/categories/icons/waffles.webp',
  wrap: '/categories/icons/wrap.webp',
  pokebowl: '/categories/icons/pokebowl.webp',
  'lobster benedict': '/categories/icons/eggs-benedict.webp',
}

// Dish name keyword → icon mapping
// Order matters — first match wins. More specific keywords go first.
const DISH_NAME_ICON_RULES = [
  // Specific compound terms first
  { keyword: 'lobster roll', icon: '/categories/icons/lobster-roll.webp' },
  { keyword: 'lobster benedict', icon: '/categories/icons/eggs-benedict.webp' },
  { keyword: 'cod and chips', icon: '/categories/icons/fish-and-chips.webp' },
  { keyword: 'cod & chips', icon: '/categories/icons/fish-and-chips.webp' },
  { keyword: 'filet and chips', icon: '/categories/icons/fish-and-chips.webp' },
  { keyword: 'filet & chips', icon: '/categories/icons/fish-and-chips.webp' },
  { keyword: 'fish and chips', icon: '/categories/icons/fish-and-chips.webp' },
  { keyword: 'fish & chips', icon: '/categories/icons/fish-and-chips.webp' },
  { keyword: 'fish n chips', icon: '/categories/icons/fish-and-chips.webp' },
  { keyword: "fish n' chips", icon: '/categories/icons/fish-and-chips.webp' },
  { keyword: "fish 'n chips", icon: '/categories/icons/fish-and-chips.webp' },
  { keyword: "fish 'n' chips", icon: '/categories/icons/fish-and-chips.webp' },
  { keyword: 'fish sandwich', icon: '/categories/icons/fish-sandwich.webp' },
  { keyword: 'fish taco', icon: '/categories/icons/fish.webp' },
  { keyword: 'breakfast sandwich', icon: '/categories/icons/breakfast-sandwich.webp' },
  { keyword: 'fried chicken', icon: '/categories/icons/fried-chicken.webp' },
  { keyword: 'chicken tender', icon: '/categories/icons/tendys.webp' },
  { keyword: 'chicken wing', icon: '/categories/icons/wings.webp' },
  { keyword: 'onion ring', icon: '/categories/icons/onion-rings.webp' },
  { keyword: 'poke bowl', icon: '/categories/icons/pokebowl.webp' },
  { keyword: 'rice bowl', icon: '/categories/icons/pokebowl.webp' },
  { keyword: 'eggs benedict', icon: '/categories/icons/eggs-benedict.webp' },
  { keyword: 'ice cream', icon: '/categories/icons/ice-cream.webp' },
  // Single keywords
  { keyword: 'benedict', icon: '/categories/icons/eggs-benedict.webp' },
  { keyword: 'burrito', icon: '/categories/icons/burrito.webp' },
  { keyword: 'wrap', icon: '/categories/icons/wrap.webp' },
  { keyword: 'taco', icon: '/categories/icons/taco.webp' },
  { keyword: 'burger', icon: '/categories/icons/burger.webp' },
  { keyword: 'pizza', icon: '/categories/icons/pizza.webp' },
  { keyword: 'sushi', icon: '/categories/icons/sushi.webp' },
  { keyword: 'maki', icon: '/categories/icons/sushi.webp' },
  { keyword: 'lobster', icon: '/categories/icons/lobster.webp' },
  { keyword: 'steak', icon: '/categories/icons/steak.webp' },
  { keyword: 'filet', icon: '/categories/icons/steak.webp' },
  { keyword: 'ribeye', icon: '/categories/icons/steak.webp' },
  { keyword: 'sirloin', icon: '/categories/icons/steak.webp' },
  { keyword: 'pasta', icon: '/categories/icons/pasta.webp' },
  { keyword: 'spaghetti', icon: '/categories/icons/pasta.webp' },
  { keyword: 'linguine', icon: '/categories/icons/pasta.webp' },
  { keyword: 'fettuccine', icon: '/categories/icons/pasta.webp' },
  { keyword: 'penne', icon: '/categories/icons/pasta.webp' },
  { keyword: 'rigatoni', icon: '/categories/icons/pasta.webp' },
  { keyword: 'ravioli', icon: '/categories/icons/pasta.webp' },
  { keyword: 'sandwich', icon: '/categories/icons/sandwich.webp' },
  { keyword: 'sub', icon: '/categories/icons/sandwich.webp' },
  { keyword: 'wing', icon: '/categories/icons/wings.webp' },
  { keyword: 'chowder', icon: '/categories/icons/chowder.webp' },
  { keyword: 'salad', icon: '/categories/icons/salad.webp' },
  { keyword: 'pancake', icon: '/categories/icons/pancakes.webp' },
  { keyword: 'waffle', icon: '/categories/icons/waffles.webp' },
  { keyword: 'french toast', icon: '/categories/icons/breakfast.webp' },
  { keyword: 'omelette', icon: '/categories/icons/breakfast.webp' },
  { keyword: 'omelet', icon: '/categories/icons/breakfast.webp' },
  { keyword: 'nacho', icon: '/categories/icons/nachos.webp' },
  { keyword: 'quesadilla', icon: '/categories/icons/quesadilla.webp' },
  { keyword: 'fries', icon: '/categories/icons/fries.webp' },
  { keyword: 'calamari', icon: '/categories/icons/calamari.webp' },
  { keyword: 'crab', icon: '/categories/icons/crab.webp' },
  { keyword: 'crab cake', icon: '/categories/icons/crab.webp' },
  { keyword: 'shrimp', icon: '/categories/icons/shrimp.webp' },
  { keyword: 'scallop', icon: '/categories/icons/scallops.webp' },
  { keyword: 'mussel', icon: '/categories/icons/mussels.webp' },
  { keyword: 'clam', icon: '/categories/icons/clams.webp' },
  { keyword: 'oyster', icon: '/categories/icons/clams.webp' },
  { keyword: 'fish', icon: '/categories/icons/fish.webp' },
  { keyword: 'salmon', icon: '/categories/icons/fish.webp' },
  { keyword: 'tuna', icon: '/categories/icons/fish.webp' },
  { keyword: 'cod', icon: '/categories/icons/fish.webp' },
  { keyword: 'swordfish', icon: '/categories/icons/fish.webp' },
  { keyword: 'halibut', icon: '/categories/icons/fish.webp' },
  { keyword: 'mahi', icon: '/categories/icons/fish.webp' },
  { keyword: 'rib', icon: '/categories/icons/ribs.webp' },
  { keyword: 'pork', icon: '/categories/icons/pork.webp' },
  { keyword: 'chicken', icon: '/categories/icons/chicken.webp' },
  { keyword: 'curry', icon: '/categories/icons/curry.webp' },
  { keyword: 'soup', icon: '/categories/icons/soup.webp' },
  { keyword: 'bruschetta', icon: '/categories/icons/bruschetta.webp' },
  { keyword: 'muffin', icon: '/categories/icons/dessert.webp' },
  { keyword: 'scone', icon: '/categories/icons/dessert.webp' },
  { keyword: 'croissant', icon: '/categories/icons/dessert.webp' },
  { keyword: 'cake', icon: '/categories/icons/dessert.webp' },
  { keyword: 'pie', icon: '/categories/icons/dessert.webp' },
  { keyword: 'brownie', icon: '/categories/icons/dessert.webp' },
  { keyword: 'cookie', icon: '/categories/icons/dessert.webp' },
]

// Match a dish name to an icon based on keywords
export function getDishNameIcon(dishName) {
  if (!dishName) return null
  const lower = dishName.toLowerCase()
  for (var i = 0; i < DISH_NAME_ICON_RULES.length; i++) {
    if (lower.includes(DISH_NAME_ICON_RULES[i].keyword)) {
      return DISH_NAME_ICON_RULES[i].icon + '?v=4'
    }
  }
  return null
}

// Get category image path (light mode only)
export function getCategoryNeonImage(id) {
  if (!id) return null
  var src = CATEGORY_IMAGES[id.toLowerCase()] || null
  return src ? src + '?v=4' : null
}

// Preload category images for smooth Browse page loading
export function preloadCategoryImages() {
  Object.values(CATEGORY_IMAGES).forEach(src => {
    const img = new Image()
    img.src = src
  })
}

// Category display info - used for profile stats and tier display
// Maps category id to emoji and label
export const CATEGORY_INFO = {
  'pizza': { emoji: '🍕', label: 'Pizza' },
  'burger': { emoji: '🍔', label: 'Burgers' },
  'taco': { emoji: '🌮', label: 'Tacos' },
  'wings': { emoji: '🍗', label: 'Wings' },
  'sushi': { emoji: '🍣', label: 'Sushi' },
  'sandwich': { emoji: '🥪', label: 'Sandwiches' },
  'breakfast sandwich': { emoji: '🥯', label: 'Breakfast Sandwiches' },
  'pasta': { emoji: '🍝', label: 'Pasta' },
  'pokebowl': { emoji: '🥗', label: 'Poke' },
  'lobster roll': { emoji: '🦞', label: 'Lobster Rolls' },
  'seafood': { emoji: '🦐', label: 'Seafood' },
  'chowder': { emoji: '🍲', label: 'Chowder' },
  'soup': { emoji: '🍜', label: 'Soup' },
  'breakfast': { emoji: '🍳', label: 'Breakfast' },
  'salad': { emoji: '🥗', label: 'Salads' },
  'fries': { emoji: '🍟', label: 'Fries' },
  'tendys': { emoji: '🍗', label: 'Tenders' },
  'fried chicken': { emoji: '🍗', label: 'Fried Chicken' },
  'apps': { emoji: '🧆', label: 'Apps' },
  'entree': { emoji: '🥩', label: 'Entrees' },
  'steak': { emoji: '🥩', label: 'Steak' },
  'dessert': { emoji: '🍰', label: 'Desserts' },
  'ribs': { emoji: '🍖', label: 'Ribs' },
  'sides': { emoji: '🥦', label: 'Sides' },
  'duck': { emoji: '🦆', label: 'Duck' },
  'lamb': { emoji: '🍖', label: 'Lamb' },
  'pork': { emoji: '🐷', label: 'Pork' },
  'fish': { emoji: '🐟', label: 'Fish' },
  'chicken': { emoji: '🐔', label: 'Chicken' },
  'clams': { emoji: '🐚', label: 'Clams' },
  'oysters': { emoji: '🦪', label: 'Oysters' },
  'coffee': { emoji: '☕', label: 'Coffee' },
  'cocktails': { emoji: '🍸', label: 'Cocktails' },
  'ice cream': { emoji: '🍦', label: 'Ice Cream' },
  'bruschetta': { emoji: '🍞', label: 'Bruschetta' },
  'burrito': { emoji: '🌯', label: 'Burrito' },
  'calamari': { emoji: '🦑', label: 'Calamari' },
  'crab': { emoji: '🦀', label: 'Crab' },
  'curry': { emoji: '🍛', label: 'Curry' },
  'lobster': { emoji: '🦞', label: 'Lobster' },
  'mussels': { emoji: '🐚', label: 'Mussels' },
  'onion rings': { emoji: '🧅', label: 'Onion Rings' },
  'pancakes': { emoji: '🥞', label: 'Pancakes' },
  'scallops': { emoji: '🐚', label: 'Scallops' },
  'shrimp': { emoji: '🦐', label: 'Shrimp' },
  'waffles': { emoji: '🧇', label: 'Waffles' },
  'wrap': { emoji: '🌯', label: 'Wrap' },
  'fish-and-chips': { emoji: '🐟', label: 'Fish & Chips' },
  'fish-sandwich': { emoji: '🐟', label: 'Fish Sandwich' },
  'eggs-benedict': { emoji: '🍳', label: 'Eggs Benedict' },
  'veggies': { emoji: '🥦', label: 'Veggies' },
  'pastry': { emoji: '🥐', label: 'Pastries' },
}

// Get category info with fuzzy matching
// Handles case differences and strips trailing IDs/characters
export function getCategoryInfo(category) {
  if (!category) return { emoji: '🍽️', label: 'Food' }

  // Normalize: lowercase, trim, remove trailing IDs (e.g., "_abc123")
  const normalized = category.toLowerCase().trim().replace(/_[a-z0-9]+$/i, '')

  // Direct match
  if (CATEGORY_INFO[normalized]) {
    return CATEGORY_INFO[normalized]
  }

  // Try matching just the first word for compound categories
  const firstWord = normalized.split(/[\s&,]+/)[0]
  if (CATEGORY_INFO[firstWord]) {
    return CATEGORY_INFO[firstWord]
  }

  // Fallback: capitalize the normalized category name
  const fallbackLabel = normalized
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return { emoji: '🍽️', label: fallbackLabel }
}

