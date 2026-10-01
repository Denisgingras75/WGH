// App-wide constants

// Minimum votes required for a dish to be considered "ranked"
// Dishes with fewer votes show as "Early" with less prominent display
export const MIN_VOTES_FOR_RANKING = 5

// Maximum character length for review text
export const MAX_REVIEW_LENGTH = 200

// Minimum votes required for value score eligibility
export const MIN_VOTES_FOR_VALUE = 8

// Value percentile threshold for "GREAT VALUE" badge (top 10%)
export const VALUE_BADGE_THRESHOLD = 90

// Browse page sort options (SortDropdown + persisted STORAGE_KEYS.BROWSE_SORT)
export const BROWSE_SORT_OPTIONS = [
  { id: 'top_rated', label: 'Top Rated', icon: '⭐' },
  { id: 'best_value', label: 'Best Value', icon: '💰' },
  { id: 'most_voted', label: 'Most Voted', icon: '💬' },
  { id: 'closest', label: 'Closest', icon: '📍' },
]
