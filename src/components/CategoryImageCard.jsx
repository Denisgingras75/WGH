/**
 * CategoryImageCard - Category selector using PlateIcon
 *
 * Design Philosophy:
 * - PlateIcon provides the realistic matte ceramic plate
 * - Food image glows (alive), plate stays quiet (neutral)
 * - Consistent grid spacing with centered labels
 * - Images load eagerly (above fold) with smooth fade-in
 */

import { useState } from 'react'
import { PlateIcon } from './PlateIcon'
import { getCategoryNeonImage } from '../constants/categories'

export function CategoryImageCard({
  category,
  isActive = false,
  onClick,
  size = 80,
}) {
  const imageSrc = getCategoryNeonImage(category.id)
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center transition-transform duration-100 active:translate-x-[2px] active:translate-y-[2px]"
      style={{ gap: '12px' }}
    >
      {/* Plate with food icon */}
      <div>
        <PlateIcon size={size} active={isActive}>
          {imageSrc ? (
            <div className="w-full h-full rounded-full overflow-hidden">
            <img
              src={imageSrc}
              alt={category.label}
              // No lazy loading - these are above the fold
              className="w-full h-full object-cover transition-opacity duration-300"
              style={{
                opacity: imageLoaded ? 1 : 0,
                transform: category.id === 'breakfast' ? 'scale(1.3)' : 'none',
              }}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        ) : (
          <div
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-bg)' }}
          >
            {category.emoji && (
              <span style={{ fontSize: '40px', lineHeight: 1 }}>{category.emoji}</span>
            )}
          </div>
        )}
        </PlateIcon>
      </div>

      {/* Label - secondary to plate */}
      <span
        className="text-[13px] text-center leading-none"
        style={{
          fontWeight: 700,
          color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
        }}
      >
        {category.label}
      </span>
    </button>
  )
}

export default CategoryImageCard
