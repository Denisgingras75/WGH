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
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      className="group flex flex-col items-center transition-all duration-200 active:scale-[0.97]"
      style={{ gap: '18px' }}
    >
      {/* Plate with food icon */}
      <div className="transition-all duration-200" style={{ filter: 'drop-shadow(0 0 0px transparent)' }} onMouseEnter={(e) => e.currentTarget.style.filter = 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08))'} onMouseLeave={(e) => e.currentTarget.style.filter = 'drop-shadow(0 0 0px transparent)'}>
        <PlateIcon size={size}>
          {imageSrc && !imageFailed ? (
            <div
              className="w-full h-full rounded-full overflow-hidden"
              style={{
                // Food glow - warm gold glow for appetite appeal
                boxShadow: isActive
                  ? '0 0 14px rgba(232, 102, 60, 0.15), 0 0 6px rgba(232, 102, 60, 0.1)'
                  : '0 0 8px rgba(0, 0, 0, 0.06)',
              }}
            >
            <img
              src={imageSrc}
              alt=""
              // No lazy loading - these are above the fold
              className="w-full h-full object-cover transition-opacity duration-300"
              style={{
                opacity: imageLoaded ? 1 : 0,
                transform: category.id === 'breakfast' ? 'scale(1.3)' : 'none',
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageFailed(true)}
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
        className="text-[12px] font-medium text-center leading-none transition-all duration-200 group-hover:brightness-125"
        style={{
          color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        }}
      >
        {category.label}
      </span>
    </button>
  )
}

export default CategoryImageCard
