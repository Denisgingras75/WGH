import { DEFAULT_CATEGORY_EMOJI, categoryEmojiFor } from '../../constants/categories'

// Warm coral / amber / copper / green — the four WGH brand tiles.
const BG_COLORS = [
  'var(--color-accent-gold)',
  'var(--color-primary)',
  'var(--color-medal-bronze)',
  'var(--color-success)',
]

/**
 * 4-tile emoji cover grid. Used as the default visual identity for a
 * playlist when no uploaded cover exists. Takes a `coverCategories` array
 * of category ids (from the read RPCs' cover_categories field) and maps
 * each to its emoji; fills missing tiles with the fallback.
 */
export function PlaylistCover({ coverCategories = [], size = 120 }) {
  const tiles = [0, 1, 2, 3].map((i) =>
    coverCategories[i] ? categoryEmojiFor(coverCategories[i]) : DEFAULT_CATEGORY_EMOJI
  )
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 2,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {tiles.map((emoji, i) => (
        <div
          key={i}
          style={{
            background: BG_COLORS[i],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: Math.round(size / 3.5),
          }}
        >
          {emoji}
        </div>
      ))}
    </div>
  )
}
