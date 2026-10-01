import { useMenuImportStatus } from '../../hooks/useMenuImportStatus'
import { AMATIC_TITLE } from '../../constants/styles'

const headingStyle = { ...AMATIC_TITLE, fontSize: '24px', marginBottom: '8px' }

export function MenuImportStatus({ restaurantId, dishCount }) {
  const { status, isImporting, hasFailed, loading } = useMenuImportStatus(restaurantId)

  if (loading || dishCount > 0) return null
  if (status === null) return null

  return (
    <div
      role="status"
      style={{
        padding: '24px 20px',
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
      }}
    >
      {isImporting && (
        <>
          <h2 style={headingStyle}>Thanks for adding this restaurant!</h2>
          <p className="leading-relaxed" style={{ fontSize: '14px' }}>
            We're getting the menu ready — check back in a moment.
          </p>
        </>
      )}
      {status === 'completed' && dishCount === 0 && (
        <>
          <h2 style={headingStyle}>Menu coming soon</h2>
          <p className="leading-relaxed" style={{ fontSize: '14px' }}>
            We couldn't find the menu yet — our team is working on it.
          </p>
        </>
      )}
      {hasFailed && (
        <>
          <h2 style={headingStyle}>Menu coming soon</h2>
          <p className="leading-relaxed" style={{ fontSize: '14px' }}>
            We're working on getting this menu — check back soon.
          </p>
        </>
      )}
    </div>
  )
}
