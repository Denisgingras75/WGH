// Bold flat food silhouette icons — Poster/zine aesthetic
// Single color, chunky proportions, visible at 32-56px
// All icons use viewBox="0 0 48 48" for consistency
//
// Poster PNGs (in /categories/poster/) override inline SVGs when available.
// These are ChatGPT-generated icons with thick black outlines + red-orange fill.

const posterIcons = {
  pizza: '/categories/poster/pizza-water.png',
  burger: '/categories/poster/burger-water.png',
  seafood: '/categories/poster/seafood-water.png',
  wings: '/categories/poster/wings-water.png',
  sushi: '/categories/poster/sushi-water.png',
  breakfast: '/categories/poster/breakfast-water.png',
  'lobster roll': '/categories/poster/lobster roll.png',
  chowder: '/categories/poster/chowder.png',
  pasta: '/categories/poster/pasta.png',
  steak: '/categories/poster/steak.png',
  sandwich: '/categories/poster/sandwich.png',
  salad: '/categories/poster/salad.png',
  taco: '/categories/poster/taco.png',
  tendys: '/categories/poster/tendys.png',
  fish: '/categories/poster/fish.png',
  clams: '/categories/poster/clams.png',
  chicken: '/categories/poster/chicken.png',
  'fried chicken': '/categories/poster/fried-chicken.png',
  pork: '/categories/poster/pork.png',
  dessert: '/categories/poster/dessert.png',
  curry: '/categories/poster/curry.png',
  'breakfast sandwich': '/categories/poster/breakfast-sandwich.png',
}

// Dish-name overrides — specific icons for dishes matching keywords
// More specific matches first (e.g. "fried chicken" before "chicken" category)
// `solo` = only match when this word is the main dish, not a side (e.g. "Truffle Fries" yes, "Tenders and Fries" no)
const dishNameIcons = [
  { match: 'poke', src: '/categories/poster/poke-bowl-pix.png' },
  { match: 'salmon bowl', src: '/categories/poster/poke-bowl-pix.png' },
  { match: 'tuna bowl', src: '/categories/poster/poke-bowl-pix.png' },
  { match: 'pizza', src: '/categories/poster/pizza-water.png' },
  { match: 'shrimp taco', src: '/categories/poster/shrimp-taco.png' },
  { match: 'chicken taco', src: '/categories/poster/chicken-taco.png' },
  { match: 'clam strip', src: '/categories/poster/clam-strips.png' },
  { match: 'fried clam', src: '/categories/poster/clams.png' },
  { match: 'benedict', src: '/categories/poster/eggs-benedict-water.png' },
  { match: 'cauliflower', src: '/categories/poster/cauliflower-water.png' },
  { match: 'carrot', src: '/categories/poster/carrots-water.png' },
  { match: 'wing', src: '/categories/poster/wings-water.png' },
  { match: 'breakfast sandwich', src: '/categories/poster/breakfast-sandwich.png' },
  { match: 'breakfast sammy', src: '/categories/poster/breakfast-sandwich.png' },
  { match: 'roasted chicken', src: '/categories/poster/chicken.png' },
  { match: 'rotisserie chicken', src: '/categories/poster/chicken.png' },
  { match: 'half chicken', src: '/categories/poster/chicken.png' },
  { match: 'fried chicken', src: '/categories/poster/fried-chicken.png' },
  { match: 'salmon', src: '/categories/poster/seafood-pix.png' },
  { match: 'tuna', src: '/categories/poster/seafood.png' },
  { match: 'swordfish', src: '/categories/poster/seafood.png' },
  { match: 'shrimp', src: '/categories/poster/shrimp.png' },
  { match: 'calamari', src: '/categories/poster/calamari.png' },
  { match: 'fish sandwich', src: '/categories/poster/fish-sandwich.png' },
  { match: 'codfish sandwich', src: '/categories/poster/fish-sandwich.png' },
  { match: 'filet o', src: '/categories/poster/fish-sandwich.png' },
  { match: 'fish and chips', src: '/categories/poster/fish-and-chips.png' },
  { match: 'fish & chips', src: '/categories/poster/fish-and-chips.png' },
  { match: "fish n' chips", src: '/categories/poster/fish-and-chips.png' },
  { match: "fish 'n chips", src: '/categories/poster/fish-and-chips.png' },
  { match: 'fish n chips', src: '/categories/poster/fish-and-chips.png' },
  { match: "n' chips", src: '/categories/poster/fish-and-chips.png' },
  { match: "'n chips", src: '/categories/poster/fish-and-chips.png' },
  { match: 'onion ring', src: '/categories/poster/onion-rings.png' },
  { match: 'french toast', src: '/categories/poster/pancakes.png' },
  { match: 'fries', src: '/categories/poster/fries-water.png', solo: true },
  { match: 'french fry', src: '/categories/poster/fries-water.png', solo: true },
  { match: 'soup', src: '/categories/poster/soup.png' },
  { match: 'bisque', src: '/categories/poster/soup.png' },
  { match: 'wrap', src: '/categories/poster/wrap.png' },
  { match: 'burrito', src: '/categories/poster/burrito.png' },
  { match: 'quesadilla', src: '/categories/poster/quesadilla.png' },
  { match: 'rib', src: '/categories/poster/ribs-water.png' },
  { match: 'lobster roll', src: '/categories/poster/lobster roll.png' },
  { match: 'lobster', src: '/categories/poster/lobster.png' },
  { match: 'crab', src: '/categories/poster/crab.png' },
  { match: 'scallop', src: '/categories/poster/scallops.png' },
  { match: 'mussel', src: '/categories/poster/mussels.png' },
  { match: 'pancake', src: '/categories/poster/pancakes.png' },
  { match: 'waffle', src: '/categories/poster/waffles.png' },
  { match: 'curry', src: '/categories/poster/curry.png' },
  { match: 'bruschetta', src: '/categories/poster/bruschetta-water.png' },
  { match: 'pork', src: '/categories/poster/pork.png' },
  { match: 'flat iron', src: '/categories/poster/steak.png' },
  { match: 'steak', src: '/categories/poster/steak.png' },
  { match: 'filet', src: '/categories/poster/steak.png' },
  { match: 'ribeye', src: '/categories/poster/steak.png' },
  { match: 'sirloin', src: '/categories/poster/steak.png' },
  { match: 'ny strip', src: '/categories/poster/steak.png' },
  { match: 'kobe', src: '/categories/poster/steak.png' },
]

const icons = {
  pizza: (
    <path d="M24 4L6 40c-.5 1 .2 2 1.2 2h33.6c1 0 1.7-1 1.2-2L24 4zm0 10c1.5 0 2.5 1 2.5 2.5S25.5 19 24 19s-2.5-1-2.5-2.5S22.5 14 24 14zm-5 10c1.5 0 2.5 1 2.5 2.5S20.5 29 19 29s-2.5-1-2.5-2.5S17.5 24 19 24zm10 2c1.5 0 2.5 1 2.5 2.5S30.5 31 29 31s-2.5-1-2.5-2.5S27.5 26 29 26z" />
  ),
  burger: (
    <>
      <path d="M8 18c0-7 7-12 16-12s16 5 16 12H8z" />
      <rect x="6" y="20" width="36" height="4" rx="1" />
      <path d="M7 26h34l-2 3H9l-2-3z" />
      <rect x="8" y="31" width="32" height="4" rx="1" />
      <path d="M10 37h28c0 3-6 5-14 5s-14-2-14-5z" />
    </>
  ),
  seafood: (
    <path d="M6 24c0 0 4-10 18-10s18 10 18 10s-4 10-18 10S6 24 6 24zm18-6c-4 0-7 2.5-7 6s3 6 7 6 7-2.5 7-6-3-6-7-6zm-14 5l-4-6m32 7l4-6M8 30l-4 4m36-4l4 4M18 14l-2-6m14 6l2-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  ),
  wings: (
    <path d="M14 8c-4 2-8 8-6 16 1 4 4 7 8 8l2-4c-3-1-5-3-6-6 4 2 9 1 12-2 4-4 5-10 2-14-2 2-5 3-8 2-1-2-3-2-4 0zm16 4c2 0 6 2 8 8 2 8-2 14-6 16l-2-4c3-1 5-3 6-6-4 2-9 1-12-2-3-3-3-7-1-10l7-2z" />
  ),
  sushi: (
    <>
      <ellipse cx="24" cy="30" rx="18" ry="10" />
      <ellipse cx="24" cy="28" rx="18" ry="10" fill="white" />
      <ellipse cx="24" cy="28" rx="18" ry="10" fill="none" stroke="currentColor" strokeWidth="3" />
      <ellipse cx="24" cy="24" rx="12" ry="6" />
      <path d="M16 22c2-4 6-6 8-5s2 5 0 8" fill="none" stroke="white" strokeWidth="2" />
    </>
  ),
  breakfast: (
    <>
      <circle cx="24" cy="22" r="14" />
      <circle cx="24" cy="22" r="11" fill="white" />
      <circle cx="24" cy="23" r="6" />
      <rect x="8" y="36" width="32" height="6" rx="3" />
      <rect x="12" y="34" width="24" height="3" rx="1" />
    </>
  ),
  'lobster roll': (
    <>
      <path d="M8 28c0-4 7-8 16-8s16 4 16 8v4c0 2-7 4-16 4S8 34 8 32v-4z" />
      <path d="M10 26c0-2 6-5 14-5s14 3 14 5" fill="none" stroke="white" strokeWidth="2" />
      <path d="M14 12c-2-4-1-8 2-8s4 3 3 7m16-3c2-4 1-8-2-8s-4 3-3 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="26" r="2" fill="white" />
      <circle cx="24" cy="25" r="2" fill="white" />
      <circle cx="32" cy="26" r="2" fill="white" />
    </>
  ),
  chowder: (
    <>
      <path d="M10 22h28c0 12-6 18-14 18S10 34 10 22z" />
      <rect x="6" y="20" width="36" height="4" rx="2" />
      <path d="M16 10c0-3 2-4 3-2s-1 4 1 6m6-8c0-3 2-4 3-2s-1 4 1 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  pasta: (
    <>
      <path d="M8 30c0-6 7-14 16-14s16 8 16 14c0 4-7 8-16 8S8 34 8 30z" />
      <path d="M14 28c2-6 6-10 10-10s8 4 10 10" fill="none" stroke="white" strokeWidth="2" />
      <path d="M18 26c1-3 3-6 6-6s5 3 6 6" fill="none" stroke="white" strokeWidth="2" />
      <path d="M20 8l-2 10m10-10l2 10m-6-12v12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  steak: (
    <>
      <path d="M10 18c-2 4-2 10 2 14 4 4 10 4 14 2s8-2 12-6 2-12-2-14-10-2-14 0-10 0-12 4z" />
      <path d="M18 24c-1 2 0 4 2 5s4 0 5-2 0-4-2-5-4 0-5 2z" fill="white" />
      <path d="M28 20c1 2 0 3-1 3s-2-1-2-3 1-2 2-2 1 1 1 2z" fill="white" />
    </>
  ),
  sandwich: (
    <>
      <path d="M6 24l18-14 18 14H6z" />
      <rect x="8" y="26" width="32" height="4" rx="1" fill="white" stroke="currentColor" strokeWidth="2" />
      <path d="M8 26h32" stroke="currentColor" strokeWidth="2" />
      <rect x="8" y="31" width="32" height="3" rx="1" />
      <path d="M8 35h32v3c0 1-7 3-16 3S8 39 8 38v-3z" />
    </>
  ),
  salad: (
    <>
      <path d="M8 28h32c0 8-7 14-16 14S8 36 8 28z" />
      <rect x="6" y="26" width="36" height="4" rx="2" />
      <circle cx="18" cy="20" r="5" />
      <circle cx="30" cy="20" r="5" />
      <circle cx="24" cy="16" r="5" />
      <circle cx="14" cy="16" r="3" />
      <circle cx="34" cy="16" r="3" />
    </>
  ),
  taco: (
    <path d="M6 32c0-10 8-22 18-22s18 12 18 22c0 2-1 3-3 3H9c-2 0-3-1-3-3zm6-2c1-6 5-14 12-14s11 8 12 14h-8c-1-4-3-6-4-6s-3 2-4 6h-8z" />
  ),
  tendys: (
    <>
      <path d="M14 6c-2 0-4 2-4 4v24c0 4 3 8 8 8h2c4 0 7-3 7-7V14c0-4 2-7 5-8-2-1-5 0-7 2-1-2-3-2-5-2h-6z" />
      <path d="M28 10c-1 0-3 1-3 4v20c0 4 3 8 7 8h1c4 0 7-3 7-7V18c0-4-3-8-7-8h-5z" />
    </>
  ),
  dessert: (
    <>
      <path d="M14 24h20c0 10-4 16-10 16s-10-6-10-16z" />
      <rect x="12" y="22" width="24" height="4" rx="2" />
      <path d="M24 6c-6 0-10 4-12 10h24C34 10 30 6 24 6z" />
      <circle cx="24" cy="4" r="3" />
      <path d="M20 12h2v4h-2zm4 0h2v4h-2zm4 0h2v4h-2z" fill="white" />
    </>
  ),
  fish: (
    <>
      <path d="M4 24c4-8 12-14 22-14 4 0 8 2 10 4l4-6v20l-4-6c-2 2-6 4-10 4C16 26 8 32 4 24zm24-2c1.5 0 3 1 3 2.5S29.5 27 28 27s-3-1-3-2.5S26.5 22 28 22z" />
    </>
  ),
  clams: (
    <>
      <path d="M24 4C14 4 6 14 6 24h36C42 14 34 4 24 4z" />
      <path d="M6 26c0 10 8 18 18 18s18-8 18-18H6z" />
      <path d="M12 24h24" stroke="white" strokeWidth="3" />
      <path d="M10 16l14 8 14-8" fill="none" stroke="white" strokeWidth="2" />
      <path d="M14 32l10-6 10 6" fill="none" stroke="white" strokeWidth="2" />
    </>
  ),
  chicken: (
    <>
      <path d="M20 8c-6 0-10 6-10 14 0 6 4 12 10 16h8c6-4 10-10 10-16 0-8-4-14-10-14h-8z" />
      <path d="M18 14c0-4 2-8 6-8s6 4 6 8" fill="none" stroke="white" strokeWidth="2" />
      <circle cx="20" cy="20" r="2" fill="white" />
      <circle cx="28" cy="20" r="2" fill="white" />
      <path d="M22 26h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  pork: (
    <>
      <ellipse cx="24" cy="26" rx="16" ry="14" />
      <ellipse cx="20" cy="28" rx="3" ry="4" fill="white" />
      <ellipse cx="28" cy="28" rx="3" ry="4" fill="white" />
      <circle cx="18" cy="20" r="3" fill="white" />
      <circle cx="30" cy="20" r="3" fill="white" />
      <circle cx="18" cy="20" r="1.5" />
      <circle cx="30" cy="20" r="1.5" />
      <path d="M14 10c-2-4-1-6 1-6s3 2 2 6m18-4c2-4 1-6-1-6s-3 2-2 6" />
    </>
  ),
}

// Default icon for unknown categories
const defaultIcon = (
  <path d="M24 6C14 6 6 14 6 24s8 18 18 18 18-8 18-18S34 6 24 6zm-2 10h4v2h4v4h-4v2h-4v-2h-4v-4h4v-2zm-2 14h8v4h-8v-4z" />
)

/**
 * CategoryIcon — renders a bold silhouette food icon
 * @param {string} categoryId - category key (e.g. 'pizza', 'burger')
 * @param {number} size - icon size in px (default 32)
 * @param {string} color - fill color (default 'currentColor')
 */
export function CategoryIcon({ categoryId, dishName, size = 32, color = 'currentColor' }) {
  const key = categoryId?.toLowerCase()

  // Dish-name overrides win (more specific than category icons)
  // `solo` entries only match when the word is the main dish, not a side after "and"/"with"/"&"
  const nameLower = dishName?.toLowerCase() || ''
  const nameMatch = dishName && dishNameIcons.find(d => {
    if (!nameLower.includes(d.match)) return false
    if (d.solo) {
      const idx = nameLower.indexOf(d.match)
      const before = nameLower.slice(0, idx).trim()
      if (before.endsWith('and') || before.endsWith('with') || before.endsWith('&') || before.endsWith('w/')) return false
    }
    return true
  })
  const posterSrc = nameMatch?.src || posterIcons[key]

  // Prefer poster PNG when available
  if (posterSrc) {
    return (
      <img
        src={posterSrc}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        style={{ display: 'block', flexShrink: 0, objectFit: 'contain' }}
        aria-hidden="true"
      />
    )
  }

  const icon = icons[key] || defaultIcon
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill={color}
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      {icon}
    </svg>
  )
}

/**
 * Get category icon element for use in non-React contexts
 * Returns the SVG children for a given category
 */
export function hasCategoryIcon(categoryId) {
  return !!icons[categoryId?.toLowerCase()]
}

/**
 * Get poster PNG path for a category + optional dish name.
 * Used by Leaflet map pins (raw HTML, not React).
 */
export function getPosterIconSrc(categoryId, dishName) {
  var key = categoryId ? categoryId.toLowerCase() : ''
  var nameLower = dishName ? dishName.toLowerCase() : ''
  var nameMatch = dishName && dishNameIcons.find(function (d) {
    if (!nameLower.includes(d.match)) return false
    if (d.solo) {
      var idx = nameLower.indexOf(d.match)
      var before = nameLower.slice(0, idx).trim()
      if (before.endsWith('and') || before.endsWith('with') || before.endsWith('&') || before.endsWith('w/')) return false
    }
    return true
  })
  return (nameMatch && nameMatch.src) || posterIcons[key] || null
}
