import { Camera } from '@phosphor-icons/react'

export default function CameraIcon({ size = 24, className = '' }) {
  return (
    <Camera
      size={size}
      weight="duotone"
      className={className}
      style={{ color: 'var(--color-text-secondary)' }}
    />
  )
}

export { CameraIcon }
