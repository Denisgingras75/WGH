/**
 * ThumbsUpIcon - 3D illustrated thumbs up icon
 */

export function ThumbsUpIcon({ size = 20, className = '', active = false }) {
  // New images have more padding around the hand, scale up to compensate
  const scaledSize = Math.round(size * 1.6)
  return (
    <img
      src="/thumbs-up.webp"
      alt="thumbs up"
      className={`inline-block object-contain ${className}`}
      style={{
        width: scaledSize,
        height: scaledSize,
        margin: -Math.round(size * 0.3),
        filter: active ? 'brightness(1.15) drop-shadow(0 0 4px rgba(232, 102, 60, 0.4))' : 'none',
      }}
    />
  )
}

export default ThumbsUpIcon
