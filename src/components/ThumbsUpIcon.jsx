import { ThumbsUp } from '@phosphor-icons/react'

export default function ThumbsUpIcon({ active, size = 28, className = '' }) {
  return (
    <ThumbsUp
      size={size}
      weight={active ? 'fill' : 'duotone'}
      className={className}
      style={{ color: active ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}
    />
  )
}

export { ThumbsUpIcon }
