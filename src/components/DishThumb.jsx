import { memo, useState } from 'react'
import { getCategoryNeonImage, getCategoryEmoji, getDishNameIcon } from '../constants/categories'
import { sanitizeUrl } from '../utils/sanitize'

/**
 * DishThumb — the one image slot for a dish, at any size.
 *
 * Shows the dish's real photo when one exists (featured community photo,
 * then the dish's own photo_url). Until then it shows the category icon on a
 * quiet tile. Both states occupy the same box, so lists keep a steady rhythm
 * as photos arrive.
 *
 * Props:
 *   dish   - any dish shape (dish_name/name, category, featured_photo_url, photo_url)
 *   size   - px for a square thumb; omit with `fill` to fill the parent
 *   fill   - stretch to the parent box (parent sets size / aspect-ratio)
 *   radius - CSS radius (default var(--radius-md))
 *   iconScale - icon size as a fraction of the box (default 0.9 — the icons carry their own padding)
 */
export const DishThumb = memo(function DishThumb({ dish, size, fill = false, radius = 'var(--radius-md)', iconScale = 0.9, alt }) {
  var [loaded, setLoaded] = useState(false)
  var [failed, setFailed] = useState(false)

  var dishName = dish.dish_name || dish.name
  var photo = sanitizeUrl(dish.featured_photo_url) || sanitizeUrl(dish.photo_url)
  var showPhoto = photo && !failed
  var icon = getDishNameIcon(dishName) || getCategoryNeonImage(dish.category)

  var box = {
    position: 'relative',
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: radius,
    background: 'var(--color-category-strip)',
    width: fill ? '100%' : size,
    height: fill ? '100%' : size,
  }

  return (
    <div style={box}>
      {showPhoto ? (
        <img
          src={photo}
          alt={alt || dishName || ''}
          loading="lazy"
          onLoad={function () { setLoaded(true) }}
          onError={function () { setFailed(true) }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.25s ease',
          }}
        />
      ) : icon ? (
        <img
          src={icon}
          alt=""
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            margin: 'auto',
            width: (iconScale * 100) + '%',
            height: (iconScale * 100) + '%',
            objectFit: 'contain',
          }}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fill ? '40px' : Math.round((size || 56) * 0.4) + 'px' }}
        >
          {getCategoryEmoji(dish.category)}
        </span>
      )}
    </div>
  )
})
