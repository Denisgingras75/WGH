/**
 * CameraIcon - Illustrated camera icon for "Unrated" section.
 * Decorative: always sits next to visible text, so it's hidden from screen readers.
 */

export function CameraIcon({ size = 20, className = '' }) {
  const scaledSize = Math.round(size * 1.6)
  return (
    <img
      src="/camera.webp"
      alt=""
      aria-hidden="true"
      className={`inline-block object-contain ${className}`}
      style={{
        width: scaledSize,
        height: scaledSize,
        margin: -Math.round(size * 0.3),
      }}
    />
  )
}
