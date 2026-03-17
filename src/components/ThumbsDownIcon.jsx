import { ThumbsDown } from '@phosphor-icons/react'

export default function ThumbsDownIcon({ active, size = 28, className = '' }) {
  return (
    <ThumbsDown
      size={size}
      weight={active ? 'fill' : 'duotone'}
      className={className}
      style={{ color: active ? 'var(--color-danger)' : 'var(--color-text-tertiary)' }}
    />
  )
}

export { ThumbsDownIcon }
