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
        opacity: active ? 1 : 0.85,
      }}
    />
  )
}

export default CameraIcon
