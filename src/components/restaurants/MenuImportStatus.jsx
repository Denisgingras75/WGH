import { useMenuImportStatus } from '../../hooks/useMenuImportStatus'

const headingStyle = {
  fontFamily: 'var(--font-display)',
  fontWeight: 500,
  fontSize: '21px',
  letterSpacing: '-0.01em',
  lineHeight: 1.1,
  color: 'var(--color-text-primary)',
  marginBottom: '6px',
}

const bodyStyle = { fontSize: '14px', lineHeight: '1.5', fontWeight: 500 }

export function MenuImportStatus({ restaurantId, dishCount }) {
  const { status, isImporting, hasFailed, loading } = useMenuImportStatus(restaurantId)

  if (loading || dishCount > 0) return null
  if (status === null) return null
  if (status === 'completed' && dishCount > 0) return null

  return (
    <div
      style={{
        margin: '16px 16px 0',
        padding: '22px 18px',
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
        background: 'var(--color-surface)',
        border: '1px dashed var(--color-divider-strong)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {isImporting && (
        <>
          <p style={headingStyle}>Thanks for adding this restaurant!</p>
          <p style={bodyStyle}>
            We're getting the menu ready — check back in a moment.
          </p>
        </>
      )}
      {status === 'completed' && dishCount === 0 && (
        <>
          <p style={headingStyle}>Menu coming soon</p>
          <p style={bodyStyle}>
            We couldn't find the menu yet — our team is working on it.
          </p>
        </>
      )}
      {hasFailed && (
        <>
          <p style={headingStyle}>Menu coming soon</p>
          <p style={bodyStyle}>
            We're working on getting this menu — check back soon.
          </p>
        </>
      )}
    </div>
  )
}
