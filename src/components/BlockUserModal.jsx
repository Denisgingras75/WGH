import { useState } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useBlockedUsers } from '../hooks/useBlockedUsers'

export function BlockUserModal({ isOpen, onClose, user }) {
  const [loading, setLoading] = useState(false)
  const { blockUser } = useBlockedUsers()

  const handleClose = () => {
    if (loading) return
    onClose()
  }

  const modalRef = useFocusTrap(isOpen, handleClose)

  if (!isOpen || !user) return null

  const handleConfirm = async () => {
    setLoading(true)
    const { error } = await blockUser(user.id)
    setLoading(false)
    if (!error) onClose()
  }

  const displayName = user.displayName || user.display_name || 'this user'

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in-up"
      onClick={handleClose}
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
        aria-labelledby="block-user-title"
        className="relative max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--color-card)', border: 'var(--border-ink)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-hard-lg)' }}
      >
        <div className="p-7">
          <h2
            id="block-user-title"
            className="mb-3"
            style={{ fontSize: '24px', lineHeight: 1.1, color: 'var(--color-text-primary)' }}
          >
            Block {displayName}?
          </h2>
          <p
            className="text-sm leading-relaxed mb-5"
            style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}
          >
            You won't see their reviews, ratings, photos, or profile. They won't
            see yours either. You'll stop following each other, and neither of you
            can re-follow until you unblock them.
          </p>
          <p
            className="text-sm leading-relaxed mb-6"
            style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}
          >
            You can unblock anytime from Settings → Blocked users.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn-ink flex-1 px-5 py-3"
              style={{
                background: 'var(--color-card)',
                color: 'var(--color-ink)',
                fontSize: '15px',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="btn-ink flex-1 px-5 py-3"
              style={{
                background: 'var(--color-danger)',
                color: 'var(--color-text-on-primary)',
                fontSize: '15px',
              }}
            >
              {loading ? 'Blocking…' : 'Block'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
