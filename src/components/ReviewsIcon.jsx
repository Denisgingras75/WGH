import { ChatTeardropText } from '@phosphor-icons/react'

export default function ReviewsIcon({ size = 24, className = '' }) {
  return (
    <ChatTeardropText
      size={size}
      weight="duotone"
      className={className}
      style={{ color: 'var(--color-text-secondary)' }}
    />
  )
}

export { ReviewsIcon }
