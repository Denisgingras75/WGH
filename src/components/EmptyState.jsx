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
    <div
      className="py-10 px-6 text-center"
      style={{
        background: 'var(--color-surface)',
        border: '2px dashed var(--color-text-tertiary)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {emoji && (
        <div style={{ fontSize: '40px', lineHeight: 1, marginBottom: '12px' }}>{emoji}</div>
      )}
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          color: 'var(--color-text-primary)',
        }}
      >
        {title}
      </p>
      {subtitle && (
        <p
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            marginTop: '6px',
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
