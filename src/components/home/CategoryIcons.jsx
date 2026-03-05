// Minimal line-art food icons — restaurant menu aesthetic
// Single stroke, no fill, thin lines. Scales perfectly, works in any theme.
// All icons use viewBox="0 0 48 48", stroke="currentColor"

// Dish-name overrides — specific icons for dishes matching keywords
// More specific matches first (e.g. "fried chicken" before "chicken" category)
// `solo` = only match when this word is the main dish, not a side
var dishNameIcons = [
  { match: 'pizza', icon: 'pizza' },
  { match: 'benedict', icon: 'eggs_benedict' },
  { match: 'cauliflower', icon: 'salad' },
  { match: 'carrot', icon: 'salad' },
  { match: 'wing', icon: 'wings' },
  { match: 'breakfast sandwich', icon: 'sandwich' },
  { match: 'breakfast sammy', icon: 'sandwich' },
  { match: 'roasted chicken', icon: 'drumstick' },
  { match: 'rotisserie chicken', icon: 'drumstick' },
  { match: 'half chicken', icon: 'drumstick' },
  { match: 'fried chicken', icon: 'drumstick' },
  { match: 'salmon', icon: 'fish' },
  { match: 'tuna', icon: 'fish' },
  { match: 'swordfish', icon: 'fish' },
  { match: 'shrimp', icon: 'shrimp' },
  { match: 'calamari', icon: 'calamari' },
  { match: 'fish sandwich', icon: 'sandwich' },
  { match: 'codfish sandwich', icon: 'sandwich' },
  { match: 'filet o', icon: 'sandwich' },
  { match: 'fish and chips', icon: 'fish_and_chips' },
  { match: 'fish & chips', icon: 'fish_and_chips' },
  { match: "fish n' chips", icon: 'fish_and_chips' },
  { match: "fish 'n chips", icon: 'fish_and_chips' },
  { match: 'fish n chips', icon: 'fish_and_chips' },
  { match: "n' chips", icon: 'fish_and_chips' },
  { match: "'n chips", icon: 'fish_and_chips' },
  { match: 'onion ring', icon: 'onion_rings' },
  { match: 'french toast', icon: 'pancakes' },
  { match: 'fries', icon: 'fries', solo: true },
  { match: 'french fry', icon: 'fries', solo: true },
  { match: 'soup', icon: 'soup' },
  { match: 'bisque', icon: 'soup' },
  { match: 'wrap', icon: 'wrap' },
  { match: 'burrito', icon: 'burrito' },
  { match: 'quesadilla', icon: 'quesadilla' },
  { match: 'rib', icon: 'ribs' },
  { match: 'lobster roll', icon: 'lobster_roll' },
  { match: 'lobster', icon: 'lobster' },
  { match: 'crab', icon: 'crab' },
  { match: 'scallop', icon: 'scallops' },
  { match: 'mussel', icon: 'mussels' },
  { match: 'pancake', icon: 'pancakes' },
  { match: 'waffle', icon: 'waffles' },
  { match: 'curry', icon: 'curry' },
  { match: 'bruschetta', icon: 'bruschetta' },
  { match: 'pork', icon: 'pork' },
  { match: 'flat iron', icon: 'steak' },
  { match: 'steak', icon: 'steak' },
  { match: 'filet', icon: 'steak' },
  { match: 'ribeye', icon: 'steak' },
  { match: 'sirloin', icon: 'steak' },
  { match: 'ny strip', icon: 'steak' },
  { match: 'kobe', icon: 'steak' },
]

// Category → icon key mapping
var categoryMap = {
  pizza: 'pizza',
  burger: 'burger',
  seafood: 'fish',
  wings: 'wings',
  sushi: 'sushi',
  breakfast: 'breakfast',
  'lobster roll': 'lobster_roll',
  chowder: 'soup',
  pasta: 'pasta',
  steak: 'steak',
  sandwich: 'sandwich',
  salad: 'salad',
  taco: 'taco',
  tendys: 'tendys',
  fish: 'fish',
  clams: 'clams',
  chicken: 'drumstick',
  'fried chicken': 'drumstick',
  pork: 'pork',
  dessert: 'dessert',
  curry: 'curry',
  'breakfast sandwich': 'sandwich',
}

// ── Icon paths (stroke only, no fill) ────────────────────────────────

var icons = {
  pizza: (
    <>
      <path d="M24 8L10 38h28L24 8z" strokeLinejoin="round" />
      <path d="M13 34h22" />
      <circle cx="21" cy="22" r="2" />
      <circle cx="27" cy="28" r="2" />
      <circle cx="22" cy="30" r="1.5" />
    </>
  ),
  burger: (
    <>
      <path d="M10 22c0-6 6-10 14-10s14 4 14 10" />
      <line x1="8" y1="24" x2="40" y2="24" />
      <path d="M9 26c2 1 5 2 8 1s5-2 7-1 5 2 8 1 5-2 7-1" />
      <line x1="9" y1="30" x2="39" y2="30" />
      <path d="M10 32c0 3 6 5 14 5s14-2 14-5" />
    </>
  ),
  fish: (
    <>
      <path d="M8 24c4-8 10-12 18-12 4 0 7 1 9 3" />
      <path d="M8 24c4 8 10 12 18 12 4 0 7-1 9-3" />
      <path d="M35 15l5-5v8" />
      <path d="M35 33l5 5v-8" />
      <circle cx="30" cy="23" r="1.5" />
      <path d="M14 20c4 0 8 2 12 4" />
    </>
  ),
  wings: (
    <>
      <path d="M16 10c-3 2-6 8-4 14 1 3 4 6 7 7" />
      <path d="M19 31l4 8 3-6" />
      <path d="M26 33c4-2 7-6 8-11 1-5-1-10-4-13" />
      <path d="M30 9c-3 1-6 3-8 6" />
      <path d="M16 10c2 0 5 1 6 3" />
      <line x1="13" y1="20" x2="17" y2="18" />
      <line x1="12" y1="24" x2="16" y2="23" />
    </>
  ),
  sushi: (
    <>
      <ellipse cx="24" cy="32" rx="16" ry="7" />
      <path d="M8 32c0-3 7-6 16-6s16 3 16 6" />
      <path d="M12 28c2-8 6-14 12-14s10 6 12 14" />
      <path d="M16 28c2-4 4-8 8-8s6 4 8 8" />
      <line x1="20" y1="20" x2="18" y2="26" />
      <line x1="28" y1="20" x2="30" y2="26" />
    </>
  ),
  breakfast: (
    <>
      <circle cx="20" cy="22" r="10" />
      <circle cx="20" cy="23" r="5" />
      <path d="M32 16c2 0 4 2 4 5v10c0 2-1 3-3 3h-1c-2 0-3-1-3-3V21c0-3 2-5 3-5z" />
      <path d="M32 16h2" />
      <line x1="33" y1="18" x2="33" y2="32" />
    </>
  ),
  lobster_roll: (
    <>
      <path d="M8 28c0-3 7-6 16-6s16 3 16 6" />
      <path d="M8 28c0 3 7 6 16 6s16-3 16-6" />
      <path d="M12 26c3-1 7-2 12-2s9 1 12 2" />
      <circle cx="18" cy="28" r="2" />
      <circle cx="24" cy="27" r="2" />
      <circle cx="30" cy="28" r="2" />
      <path d="M16 14c-2-4 0-7 2-6s2 4 1 8" />
      <path d="M32 14c2-4 0-7-2-6s-2 4-1 8" />
    </>
  ),
  soup: (
    <>
      <path d="M10 24h28c0 10-6 16-14 16S10 34 10 24z" />
      <path d="M8 22h32v4H8z" />
      <path d="M18 12c0-3 1-4 2-3s0 4 1 5" />
      <path d="M24 10c0-3 1-4 2-3s0 4 1 5" />
      <path d="M30 12c0-3 1-4 2-3s0 4 1 5" />
    </>
  ),
  pasta: (
    <>
      <ellipse cx="24" cy="32" rx="16" ry="8" />
      <path d="M8 32c0-4 7-8 16-8s16 4 16 8" />
      <path d="M18 8c-1 5-2 10-3 16" />
      <path d="M24 6c0 6 0 12-1 18" />
      <path d="M30 8c1 5 2 10 3 16" />
      <path d="M14 28c4-2 8-3 12-2" />
    </>
  ),
  steak: (
    <>
      <path d="M12 16c-3 4-4 10-1 15 3 5 8 6 12 5s7-3 10-8c3-5 2-12-2-15s-9-2-13 0-4 1-6 3z" />
      <path d="M20 20c-2 3-1 6 1 8s5 1 7-1" />
      <line x1="20" y1="14" x2="20" y2="38" />
      <circle cx="28" cy="24" r="1.5" />
    </>
  ),
  sandwich: (
    <>
      <path d="M8 28l16-16 16 16" strokeLinejoin="round" />
      <line x1="10" y1="30" x2="38" y2="30" />
      <path d="M11 32c3 0 5 1 8 0s5-1 8 0 5 1 8 0" />
      <line x1="11" y1="34" x2="37" y2="34" />
      <path d="M12 36h24c0 2-5 3-12 3s-12-1-12-3z" />
    </>
  ),
  salad: (
    <>
      <path d="M10 28h28c0 8-6 12-14 12S10 36 10 28z" />
      <path d="M8 26h32v4H8z" />
      <path d="M16 24c-1-4 1-8 4-10" />
      <path d="M24 14c0 4-1 7-2 10" />
      <path d="M28 18c2-2 5-3 6-1" />
      <circle cx="20" cy="18" r="3" />
      <circle cx="30" cy="22" r="2" />
    </>
  ),
  taco: (
    <>
      <path d="M8 32c0-12 7-22 16-22s16 10 16 22" />
      <path d="M8 32c0 2 7 4 16 4s16-2 16-4" />
      <circle cx="18" cy="24" r="2" />
      <circle cx="26" cy="20" r="2" />
      <circle cx="22" cy="28" r="1.5" />
      <path d="M30 26c1-2 2-4 2-6" />
    </>
  ),
  tendys: (
    <>
      <path d="M14 10c-2 1-3 4-2 8l4 20c1 3 3 4 5 3l2-1c2-1 3-3 2-6l-4-18c-1-4-3-7-5-7z" />
      <path d="M28 12c-1 0-2 2-2 5l3 18c0 3 2 5 4 5h1c3 0 5-2 5-5l-3-18c-1-3-3-5-5-5h-3z" />
      <path d="M14 18l7 2" />
      <path d="M28 20l6 1" />
    </>
  ),
  drumstick: (
    <>
      <path d="M20 8c-5 0-9 5-9 12 0 5 2 9 6 12" />
      <path d="M28 8c5 0 9 5 9 12 0 5-2 9-6 12" />
      <path d="M17 32l-3 10h6l-1-6" />
      <path d="M31 32l3 10h-6l1-6" />
      <path d="M20 8h8" />
      <path d="M18 16h12" />
    </>
  ),
  dessert: (
    <>
      <path d="M16 40l4-20h8l4 20" strokeLinejoin="round" />
      <path d="M14 40h20" />
      <path d="M20 20c0-4 2-8 4-8s4 4 4 8" />
      <circle cx="24" cy="10" r="2" />
      <path d="M18 28h12" />
      <path d="M17 34h14" />
    </>
  ),
  clams: (
    <>
      <path d="M24 6c-10 0-16 8-16 18h32c0-10-6-18-16-18z" />
      <path d="M8 24c0 10 7 18 16 18s16-8 16-18" />
      <path d="M12 24h24" />
      <path d="M14 14l10 10 10-10" fill="none" />
      <path d="M14 34l10-10 10 10" fill="none" />
      <line x1="24" y1="8" x2="24" y2="16" />
    </>
  ),
  pork: (
    <>
      <path d="M12 18c-2 4-2 10 1 14s8 6 12 5 8-4 10-8 1-10-2-13" />
      <path d="M33 16c-3-2-7-3-10-2s-6 2-9 1" />
      <path d="M14 18c-1-4 0-8 2-8s3 3 2 6" />
      <path d="M34 16c1-4 0-8-2-8s-3 3-2 6" />
      <line x1="20" y1="26" x2="20" y2="30" />
      <line x1="28" y1="26" x2="28" y2="30" />
    </>
  ),
  curry: (
    <>
      <path d="M10 26h28c0 8-6 14-14 14S10 34 10 26z" />
      <path d="M8 24h32v4H8z" />
      <path d="M34 20c4 0 6-2 6-5s-2-5-4-5" />
      <path d="M16 14c2-4 5-6 8-6s6 2 8 6" />
      <circle cx="20" cy="30" r="2" />
      <circle cx="28" cy="32" r="1.5" />
    </>
  ),
  shrimp: (
    <>
      <path d="M30 10c4 2 6 6 6 12 0 8-4 14-10 16" />
      <path d="M26 38c-4 0-8-2-10-6s-2-10 2-14c3-3 7-5 12-5" />
      <path d="M30 10c-2-2-5-2-7 0" />
      <path d="M14 24l4-2" />
      <path d="M16 28l3-1" />
      <path d="M20 32l2-1" />
      <circle cx="32" cy="16" r="1.5" />
    </>
  ),
  calamari: (
    <>
      <circle cx="24" cy="20" r="10" />
      <circle cx="24" cy="20" r="5" />
      <path d="M18 30l-2 10" />
      <path d="M22 30l-1 12" />
      <path d="M26 30l1 12" />
      <path d="M30 30l2 10" />
      <path d="M24 30l0 11" />
    </>
  ),
  lobster: (
    <>
      <ellipse cx="24" cy="20" rx="8" ry="10" />
      <path d="M16 20c-4-2-8-1-10 2" />
      <path d="M6 22l-2-4m2 4l3-2" />
      <path d="M32 20c4-2 8-1 10 2" />
      <path d="M42 22l2-4m-2 4l-3-2" />
      <circle cx="21" cy="16" r="1.5" />
      <circle cx="27" cy="16" r="1.5" />
      <path d="M20 30l-2 12m4-12l-1 12m6 0l-1-12m5 12l-2-12" />
      <path d="M20 10l-3-6m11 6l3-6" />
    </>
  ),
  crab: (
    <>
      <ellipse cx="24" cy="24" rx="12" ry="8" />
      <path d="M12 22c-4-4-8-4-8 0" />
      <path d="M4 22l-1-3m1 3l3 0" />
      <path d="M36 22c4-4 8-4 8 0" />
      <path d="M44 22l1-3m-1 3l-3 0" />
      <circle cx="20" cy="22" r="2" />
      <circle cx="28" cy="22" r="2" />
      <path d="M18 32l-2 6m4-6l0 7m8-7l0 7m4-7l2 6" />
      <path d="M18 16l-2-4m12 4l2-4" />
    </>
  ),
  scallops: (
    <>
      <path d="M24 38c-12 0-16-6-16-12" />
      <path d="M24 38c12 0 16-6 16-12" />
      <path d="M8 26c0-8 7-18 16-18s16 10 16 18" />
      <line x1="24" y1="10" x2="24" y2="36" />
      <line x1="16" y1="14" x2="18" y2="34" />
      <line x1="32" y1="14" x2="30" y2="34" />
      <line x1="12" y1="20" x2="14" y2="32" />
      <line x1="36" y1="20" x2="34" y2="32" />
    </>
  ),
  mussels: (
    <>
      <path d="M24 6c-8 0-14 8-14 18 0 6 3 10 8 14h12c5-4 8-8 8-14 0-10-6-18-14-18z" />
      <path d="M24 6c-3 6-4 14-4 22" />
      <path d="M24 6c3 6 4 14 4 22" />
      <line x1="14" y1="24" x2="34" y2="24" />
      <line x1="12" y1="30" x2="36" y2="30" />
    </>
  ),
  fries: (
    <>
      <path d="M14 20h20l4 20H10l4-20z" strokeLinejoin="round" />
      <line x1="16" y1="20" x2="15" y2="8" />
      <line x1="20" y1="20" x2="19" y2="6" />
      <line x1="24" y1="20" x2="24" y2="7" />
      <line x1="28" y1="20" x2="29" y2="6" />
      <line x1="32" y1="20" x2="33" y2="8" />
    </>
  ),
  wrap: (
    <>
      <path d="M10 12l24 4c2 0 4 2 4 4v4c0 6-4 12-10 14l-16 2c-2 0-4-2-4-4V16c0-2 2-4 4-4z" />
      <path d="M10 20c8-1 16 0 24 2" />
      <circle cx="20" cy="28" r="2" />
      <circle cx="28" cy="26" r="1.5" />
    </>
  ),
  burrito: (
    <>
      <ellipse cx="24" cy="24" rx="18" ry="10" />
      <path d="M6 24c0-6 8-10 18-10s18 4 18 10" />
      <line x1="16" y1="24" x2="16" y2="24" />
      <path d="M14 20c4-1 8-1 12 0" />
      <path d="M14 28c4 1 8 1 12 0" />
      <path d="M38 18l4-4m-4 10l4 4" />
    </>
  ),
  quesadilla: (
    <>
      <path d="M6 28c0-2 8-4 18-4s18 2 18 4" />
      <path d="M6 28c0 2 8 4 18 4s18-2 18-4" />
      <path d="M6 26c0-2 8-4 18-4s18 2 18 4" />
      <path d="M6 26c0 2 0 2 0 2" />
      <path d="M42 26v2" />
      <line x1="14" y1="27" x2="18" y2="27" strokeDasharray="2 2" />
      <line x1="22" y1="27" x2="26" y2="27" strokeDasharray="2 2" />
      <line x1="30" y1="27" x2="34" y2="27" strokeDasharray="2 2" />
    </>
  ),
  ribs: (
    <>
      <path d="M8 14c2-2 6-2 10 0s8 6 12 6 8-2 10-4" />
      <path d="M8 20c2-2 6-2 10 0s8 6 12 6 8-2 10-4" />
      <path d="M8 26c2-2 6-2 10 0s8 6 12 6 8-2 10-4" />
      <path d="M8 32c2-2 6-2 10 0s8 6 12 6 8-2 10-4" />
      <line x1="6" y1="14" x2="6" y2="34" />
    </>
  ),
  pancakes: (
    <>
      <ellipse cx="24" cy="34" rx="14" ry="5" />
      <path d="M10 34v-4c0-2 6-4 14-4s14 2 14 4v4" />
      <path d="M12 30v-4c0-2 5-4 12-4s12 2 12 4v4" />
      <path d="M14 26v-4c0-2 4-4 10-4s10 2 10 4v4" />
      <path d="M28 16c4 2 6 0 6-2" />
      <path d="M22 10c0-2 2-4 6-2" />
    </>
  ),
  waffles: (
    <>
      <rect x="10" y="14" width="28" height="20" rx="3" />
      <line x1="10" y1="21" x2="38" y2="21" />
      <line x1="10" y1="27" x2="38" y2="27" />
      <line x1="19" y1="14" x2="19" y2="34" />
      <line x1="29" y1="14" x2="29" y2="34" />
      <path d="M30 12c3 0 6-2 6-4" />
    </>
  ),
  onion_rings: (
    <>
      <ellipse cx="18" cy="22" rx="10" ry="10" />
      <ellipse cx="18" cy="22" rx="5" ry="5" />
      <ellipse cx="32" cy="28" rx="8" ry="8" />
      <ellipse cx="32" cy="28" rx="4" ry="4" />
      <ellipse cx="24" cy="14" rx="6" ry="6" />
      <ellipse cx="24" cy="14" rx="3" ry="3" />
    </>
  ),
  bruschetta: (
    <>
      <path d="M8 28c0-2 3-4 8-4h16c5 0 8 2 8 4v2c0 3-3 6-8 6H16c-5 0-8-3-8-6v-2z" />
      <path d="M14 24c1-2 3-4 6-4" />
      <circle cx="18" cy="22" r="2" />
      <circle cx="24" cy="20" r="2" />
      <circle cx="30" cy="22" r="2" />
      <circle cx="21" cy="18" r="1.5" />
      <circle cx="27" cy="18" r="1.5" />
    </>
  ),
  eggs_benedict: (
    <>
      <path d="M10 30c0-3 6-5 14-5s14 2 14 5v2c0 3-6 5-14 5S10 35 10 32v-2z" />
      <ellipse cx="24" cy="24" rx="10" ry="6" />
      <circle cx="24" cy="22" r="4" />
      <path d="M28 14c2-4 1-8-2-8s-4 3-3 7" />
      <path d="M18 16l-4-4" />
    </>
  ),
  fish_and_chips: (
    <>
      <path d="M6 22c3-6 8-10 14-10 3 0 5 1 7 3" />
      <path d="M6 22c3 6 8 10 14 10 3 0 5-1 7-3" />
      <path d="M27 15l3-4v6" />
      <path d="M27 29l3 4v-6" />
      <circle cx="22" cy="21" r="1.5" />
      <line x1="34" y1="12" x2="33" y2="24" />
      <line x1="37" y1="12" x2="36" y2="24" />
      <line x1="40" y1="12" x2="39" y2="24" />
      <path d="M32 24h10l2 14H30l2-14z" />
    </>
  ),
}

// Default icon — simple plate with fork
var defaultIcon = (
  <>
    <circle cx="24" cy="24" r="14" />
    <circle cx="24" cy="24" r="8" />
    <line x1="24" y1="4" x2="24" y2="8" />
    <line x1="20" y1="4" x2="20" y2="9" />
    <line x1="28" y1="4" x2="28" y2="9" />
  </>
)

/**
 * CategoryIcon — renders a minimal line-art food icon
 * @param {string} categoryId - category key (e.g. 'pizza', 'burger')
 * @param {string} dishName - dish name for specific icon matching
 * @param {number} size - icon size in px (default 32)
 * @param {string} color - stroke color (default 'currentColor')
 */
export function CategoryIcon({ categoryId, dishName, size, color }) {
  var _size = size || 32
  var _color = color || 'currentColor'
  var key = categoryId ? categoryId.toLowerCase() : ''

  // Dish-name overrides win (more specific than category)
  var nameLower = dishName ? dishName.toLowerCase() : ''
  var iconKey = null

  if (dishName) {
    for (var i = 0; i < dishNameIcons.length; i++) {
      var d = dishNameIcons[i]
      if (!nameLower.includes(d.match)) continue
      if (d.solo) {
        var idx = nameLower.indexOf(d.match)
        var before = nameLower.slice(0, idx).trim()
        if (before.endsWith('and') || before.endsWith('with') || before.endsWith('&') || before.endsWith('w/')) continue
      }
      iconKey = d.icon
      break
    }
  }

  if (!iconKey) {
    iconKey = categoryMap[key] || null
  }

  var icon = (iconKey && icons[iconKey]) || defaultIcon

  return (
    <svg
      width={_size}
      height={_size}
      viewBox="0 0 48 48"
      fill="none"
      stroke={_color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      {icon}
    </svg>
  )
}

/**
 * Check if a category has a specific icon
 */
export function hasCategoryIcon(categoryId) {
  return !!categoryMap[categoryId ? categoryId.toLowerCase() : '']
}

/**
 * Get poster PNG path — returns null now (line art icons are inline SVG)
 * Kept for backward compat with map pins
 */
export function getPosterIconSrc() {
  return null
}

export default CategoryIcon
