import { getCategoryNeonImage, categoryEmojiFor } from '../../constants/categories'

// Screen-print ink tiles — used behind icons when no photo is available.
// Diagonal pairs (butter/ink, lobster/harbor) keep every 2x2 cover high-contrast.
var BG_COLORS = [
  'var(--color-highlight)',
  'var(--color-primary)',
  'var(--color-accent)',
  'var(--color-ink)',
]

/**
 * 4-tile cover grid for playlists. Priority per tile:
 * 1. Real dish photo (coverPhotos[i]) — when dishes have user-uploaded photos
 * 2. Category icon (WGH flat illustrated WebP from public/categories/icons/)
 * 3. Emoji fallback
 *
 * @param {string[]} coverCategories - Category IDs for first 4 dishes
 * @param {string[]} coverPhotos - Photo URLs for first 4 dishes (optional)
 * @param {number} size - Grid size in px
 */
export function PlaylistCover({ coverCategories = [], coverPhotos = [], size = 120 }) {
  // Sticker treatment scales with the cover: tiny row thumbnails get a thin
  // outline and no shadow; grid/hero covers get the full ink outline + hard shadow.
  var isTiny = size < 64
  var isHero = size >= 200

  var tiles = [0, 1, 2, 3].map(function (i) {
    var photo = coverPhotos[i] || null
    var category = coverCategories[i] || null
    var iconSrc = category ? getCategoryNeonImage(category) : null
    return { photo: photo, iconSrc: iconSrc, category: category }
  })

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: isTiny ? 1.5 : 2,
        background: 'var(--color-ink)',
        border: isTiny ? 'var(--border-subtle)' : 'var(--border-default)',
        borderRadius: isTiny ? 'var(--radius-sm)' : isHero ? 'var(--radius-xl)' : 'var(--radius-lg)',
        boxShadow: isTiny ? 'none' : isHero ? 'var(--shadow-float)' : 'var(--shadow-card)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {tiles.map(function (tile, i) {
        // Real photo — full cover
        if (tile.photo) {
          return (
            <div
              key={i}
              style={{
                backgroundImage: 'url(' + tile.photo + ')',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )
        }

        // Category icon (WebP) — centered on brand color
        if (tile.iconSrc) {
          return (
            <div
              key={i}
              style={{
                background: BG_COLORS[i],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: Math.round(size / 12),
              }}
            >
              <img
                src={tile.iconSrc}
                alt={tile.category || ''}
                style={{
                  width: '88%',
                  height: '88%',
                  objectFit: 'contain',
                }}
              />
            </div>
          )
        }

        // Emoji fallback
        return (
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
            {categoryEmojiFor(tile.category)}
          </div>
        )
      })}
    </div>
  )
}
