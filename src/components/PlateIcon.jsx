/**
 * PlateIcon - Sticker plate container
 *
 * Design: Peach disc with an ink outline and hard offset shadow,
 * matching the neo-brutalist food icons that sit on it.
 */

export function PlateIcon({
  size = 96,
  active = false,
  children,
  className = ''
}) {
  // Content inset (2% from edge for food area - nearly fills entire plate)
  const contentInset = Math.round(size * 0.02)

  return (
    <div
      className={`relative flex-shrink-0 rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: active ? 'var(--color-butter)' : 'var(--color-category-strip)',
        border: 'var(--border-ink)',
        boxShadow: 'var(--shadow-hard)',
      }}
    >
      {/* Content container - centers children */}
      <div
        className="absolute flex items-center justify-center rounded-full overflow-hidden"
        style={{
          inset: contentInset,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default PlateIcon
