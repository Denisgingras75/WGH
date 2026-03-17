import { Heart } from '@phosphor-icons/react'

export default function HeartIcon({ active, size = 24, className = '' }) {
  return (
    <Heart
      size={size}
      weight={active ? 'fill' : 'duotone'}
      className={className}
      style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}
    />
  )
}

export { HeartIcon }
