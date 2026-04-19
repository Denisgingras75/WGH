import { getCategoryNeonImage, categoryEmojiFor } from '../../constants/categories'

// Brand tile background colors — used behind icons when no photo is available.
var BG_COLORS = [
  'var(--color-accent-gold)',
  'var(--color-primary)',
  'var(--color-medal-bronze)',
  'var(--color-success)',
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
        gap: 2,
        borderRadius: 8,
        overflow: 'hidden',
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
                  width: '70%',
                  height: '70%',
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
