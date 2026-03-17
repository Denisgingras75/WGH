/**
 * CategoryImageCard - Editorial category tile
 *
 * Design Philosophy:
 * - Sharp-cornered bordered card with emoji + Playfair Display label
 * - Vintage Island Press: like a chapter heading in a food zine
 * - Active state = ink fill with parchment text
 */

export function CategoryImageCard({
  category,
  isActive = false,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center transition-all duration-200 active:opacity-85"
      style={{
        padding: '16px 4px 12px',
        background: isActive ? 'var(--color-text-primary)' : 'var(--color-card)',
        border: isActive ? '1.5px solid var(--color-text-primary)' : '1.5px solid var(--color-divider)',
        borderRadius: '4px',
        cursor: 'pointer',
        width: '100%',
      }}
    >
      {/* Emoji */}
      {category.emoji && (
        <span style={{ fontSize: '28px', lineHeight: 1, marginBottom: '4px' }}>
          {category.emoji}
        </span>
      )}

      {/* Label */}
      <span
        style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '11px',
          fontWeight: 700,
          color: isActive ? 'var(--color-bg)' : 'var(--color-text-primary)',
          letterSpacing: '0.02em',
          lineHeight: 1.2,
          textAlign: 'center',
        }}
      >
        {category.label}
      </span>
    </button>
  )
}

export default CategoryImageCard
