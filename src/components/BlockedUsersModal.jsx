import { useState } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useBlockedUsers } from '../hooks/useBlockedUsers'
import { EmptyState } from './EmptyState'

export function BlockedUsersModal({ isOpen, onClose }) {
  const { blocks, loading, error, refetch, unblockUser } = useBlockedUsers()
  const [pendingId, setPendingId] = useState(null)
  const modalRef = useFocusTrap(isOpen, onClose)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in-up"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0, 0, 0, 0.6)' }}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="blocked-users-title"
        className="relative rounded-3xl max-w-md w-full shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--color-surface-elevated)', maxHeight: '80vh' }}
      >
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--color-divider)' }}>
          <h2
            id="blocked-users-title"
            className="text-xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Blocked users
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center transition-all active:scale-95"
            aria-label="Close"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="animate-pulse" role="status" aria-label="Loading blocked users">
              {[0, 1, 2].map((i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full" style={{ background: 'var(--color-divider)' }} />
                  <div className="h-4 w-32 rounded" style={{ background: 'var(--color-divider)' }} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p role="alert" className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>
                {error.message}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="py-3 px-4 rounded-xl font-bold text-sm min-h-[44px] transition-all active:scale-[0.98]"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
              >
                Try again
              </button>
            </div>
          ) : blocks.length === 0 ? (
            <EmptyState
              emoji="🙌"
              title="No blocked users"
              subtitle="When you block someone, you can manage them here."
            />
          ) : (
            <ul>
              {blocks.map((block, i) => (
                <li
                  key={block.blockedId}
                  className="px-6 py-4 flex items-center gap-3"
                  style={{ borderBottom: i < blocks.length - 1 ? '1px solid var(--color-divider)' : 'none' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ background: 'var(--color-surface)' }}
                  >
                    {block.avatarUrl ? (
                      <img src={block.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
                        {(block.displayName || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {block.displayName || 'Unknown user'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setPendingId(block.blockedId)
                      await unblockUser(block.blockedId)
                      setPendingId(null)
                    }}
                    disabled={!!pendingId}
                    aria-label={'Unblock ' + (block.displayName || 'user')}
                    className="px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--color-primary)',
                      color: 'var(--color-primary)',
                      opacity: pendingId ? 0.7 : 1,
                    }}
                  >
                    {pendingId === block.blockedId ? 'Unblocking…' : 'Unblock'}
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
