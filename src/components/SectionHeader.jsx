/**
 * SectionHeader — consistent section heading across all pages.
 *
 * Props:
 *   title    - heading text (required)
 *   subtitle - optional secondary text
 *   action   - optional right-side element (link, button, etc.)
 *   level    - 'h2' | 'h3' (default: 'h2')
 */
export function SectionHeader({ title, subtitle, action, level = 'h2' }) {
  var Tag = level

  return (
    <div className="flex items-center justify-between">
      <div>
        <Tag
          className="font-bold"
          style={{
            fontSize: '18px',
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
          }}
        >
          {title}
        </Tag>
        {subtitle && (
          <p
            style={{
              fontSize: '13px',
              fontWeight: 400,
              color: 'var(--color-text-tertiary)',
              marginTop: '2px',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

export default SectionHeader
