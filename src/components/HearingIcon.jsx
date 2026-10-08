/**
 * HearingIcon - Illustrated hearing icon for "Heard Good Here" section
 */

export function HearingIcon({ size = 20, className = '', active = false }) {
  const scaledSize = Math.round(size * 1.6)
  return (
    <img
      src="/hearing.webp"
      alt="heard good here"
      className={`inline-block object-contain transition-all duration-200 ${className}`}
      style={{
        width: scaledSize,
        height: scaledSize,
        margin: -Math.round(size * 0.3),
        filter: active
          ? 'drop-shadow(2px 2px 0 var(--color-ink))'
          : 'brightness(0.9) opacity(0.85)',
      }}
    />
  )
}

export default HearingIcon
