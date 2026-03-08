/**
 * Live session stats shown below the JitterInput textarea.
 * Appears after minChars threshold. Updates in real time.
 * Shows: keystrokes, purity %, WPM.
 */
export function SessionBadge({ stats }) {
  if (!stats || !stats.isCapturing) return null

  return (
    <div
      className="flex items-center gap-3 px-3 py-1.5 mt-1 rounded-lg"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-divider)',
        fontSize: '11px',
        color: 'var(--color-text-tertiary)',
      }}
    >
      <span>{stats.keystrokes} keystrokes</span>
      {stats.purity !== null && (
        <>
          <span style={{ color: 'var(--color-divider)' }}>&middot;</span>
          <span>{stats.purity}% human</span>
        </>
      )}
      {stats.wpm > 0 && (
        <>
          <span style={{ color: 'var(--color-divider)' }}>&middot;</span>
          <span>{stats.wpm} WPM</span>
        </>
      )}
    </div>
  )
}

export default SessionBadge
