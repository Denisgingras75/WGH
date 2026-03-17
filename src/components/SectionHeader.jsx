/**
 * SectionHeader — chalk-style section heading.
 */
export function SectionHeader({ title, subtitle, action, level = 'h2' }) {
  var Tag = level

  return (
    <div className="flex items-center justify-between">
      <div>
        <Tag style={{
          fontFamily: "'Amatic SC', cursive",
          fontSize: '26px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          letterSpacing: '0.04em',
          lineHeight: 1.1,
        }}>
          {title}
        </Tag>
        {subtitle && (
          <p style={{
            fontFamily: "'Outfit', system-ui, sans-serif",
            fontSize: '12px',
            fontWeight: 400,
            color: 'var(--color-text-secondary)',
            marginTop: '4px',
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

export default SectionHeader
