import { Ear } from '@phosphor-icons/react'

export default function HearingIcon({ size = 24, className = '' }) {
  return (
    <Ear
      size={size}
      weight="duotone"
      className={className}
      style={{ color: 'var(--color-text-secondary)' }}
    />
  )
}

export { HearingIcon }
