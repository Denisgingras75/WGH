import { useFocusTrap } from '../hooks/useFocusTrap'
import { useBlockedUsers } from '../hooks/useBlockedUsers'

export function BlockedUsersModal({ isOpen, onClose }) {
  const { blocks, loading, unblockUser, unblocking } = useBlockedUsers()
  const modalRef = useFocusTrap(isOpen, onClose)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in-up"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(27, 22, 17, 0.55)' }}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="blocked-users-title"
        className="relative max-w-md w-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--color-card)', border: 'var(--border-ink)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-hard-lg)', maxHeight: '80vh' }}
      >
        <div className="px-6 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: 'var(--border-ink)' }}>
          <h2
            id="blocked-users-title"
            style={{ fontSize: '22px', lineHeight: 1.1, color: 'var(--color-text-primary)' }}
          >
            Blocked users
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95"
            aria-label="Close"
            style={{ color: 'var(--color-ink)', background: 'var(--color-card)', border: 'var(--border-ink)', boxShadow: 'var(--shadow-hard-sm)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
              Loading…
            </div>
          ) : blocks.length === 0 ? (
            <div className="p-6">
              <p
                className="text-sm leading-relaxed text-center p-5"
                style={{ color: 'var(--color-text-secondary)', fontWeight: 500, background: 'var(--color-surface)', border: '2px dashed var(--color-text-tertiary)', borderRadius: 'var(--radius-lg)' }}
              >
                You haven't blocked anyone. When you block someone, you can manage them here.
              </p>
            </div>
          ) : (
            <ul>
              {blocks.map((block, i) => (
                <li
                  key={block.blockedId}
                  className="px-6 py-3.5 flex items-center gap-3"
                  style={{ borderBottom: i < blocks.length - 1 ? '1.5px solid var(--color-divider)' : 'none' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{ background: 'var(--color-surface)', border: 'var(--border-ink)' }}
                  >
                    {block.avatarUrl ? (
                      <img src={block.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: 'var(--color-text-tertiary)' }}>
                        {(block.displayName || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {block.displayName || 'Unknown user'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => unblockUser(block.blockedId)}
                    disabled={unblocking}
                    className="px-4 py-1.5 text-sm transition-transform active:scale-95 disabled:opacity-60"
                    style={{
                      background: 'var(--color-card)',
                      border: 'var(--border-ink-thin)',
                      borderRadius: 'var(--radius-pill)',
                      color: 'var(--color-ink)',
                      fontWeight: 700,
                    }}
                  >
                    Unblock
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
