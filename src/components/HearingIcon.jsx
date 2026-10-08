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
        opacity: active ? 1 : 0.7,
      }}
    />
  )
}

export default HearingIcon
