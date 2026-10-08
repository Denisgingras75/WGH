/**
 * CameraIcon - Illustrated camera icon for "Unrated" section
 */

export function CameraIcon({ size = 20, className = '', active = false }) {
  const scaledSize = Math.round(size * 1.6)
  return (
    <img
      src="/camera.webp"
      alt="camera"
      className={`inline-block object-contain ${className}`}
      style={{
        width: scaledSize,
        height: scaledSize,
        margin: -Math.round(size * 0.3),
        filter: active ? 'drop-shadow(2px 2px 0 var(--color-ink))' : 'none',
      }}
    />
  )
}

export default CameraIcon
