/**
 * EmptyState — consistent "nothing here" display for generic contexts.
 *
 * Props:
 *   emoji    - visual anchor (e.g. "🍽️")
 *   title    - short headline (e.g. "No dishes found")
 *   subtitle - optional detail text
 *   action   - optional CTA button element
 */
export function EmptyState({ emoji, title, subtitle, action }) {
  return (
    <div className="py-12 px-4 text-center">
      {emoji && (
        <div aria-hidden="true" style={{ fontSize: '40px', marginBottom: '12px' }}>{emoji}</div>
      )}
      {title && (
        <p
          className="font-semibold break-words"
          style={{
            fontSize: '16px',
            color: 'var(--color-text-primary)',
          }}
        >
          {title}
        </p>
      )}
      {subtitle && (
        <p
          className="leading-relaxed"
          style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            marginTop: '4px',
          }}
        >
          {subtitle}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default EmptyState
