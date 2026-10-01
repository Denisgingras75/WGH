import { AMATIC_TITLE } from '../constants/styles'

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
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <Tag style={{ ...AMATIC_TITLE, fontSize: '24px' }}>
          {title}
        </Tag>
        {subtitle && (
          <p
            style={{
              fontSize: '13px',
              fontWeight: 500,
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
