import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authApi } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { getUserMessage } from '../../utils/errorHandler'
import { logger } from '../../utils/logger'

const CONFIRM_WORD = 'DELETE'

export function DeleteAccountSection() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <section
        className="mt-16 pt-8 px-4 pb-10"
        style={{ borderTop: 'var(--border-ink)' }}
      >
        <h2
          style={{
            color: 'var(--color-text-primary)',
            fontSize: '22px',
            lineHeight: 1.1,
            marginBottom: '10px',
          }}
        >
          Delete Account
        </h2>
        <p
          className="leading-relaxed"
          style={{ color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}
        >
          This permanently removes your votes, reviews, photos, favorites, and profile.
          This can't be undone.
        </p>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-ink px-5 py-3"
          style={{
            background: 'var(--color-card)',
            color: 'var(--color-danger)',
            fontSize: '15px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-danger)'
            e.currentTarget.style.color = 'var(--color-text-on-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-card)'
            e.currentTarget.style.color = 'var(--color-danger)'
          }}
        >
          Delete My Account
        </button>
      </section>
      {modalOpen && <DeleteAccountModal onClose={() => setModalOpen(false)} />}
    </>
  )
}

export function DeleteAccountModal({ onClose }) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleClose = () => {
    if (loading) return
    onClose()
  }

  const modalRef = useFocusTrap(true, handleClose)
  // Trim + uppercase: mobile keyboards auto-add whitespace and capitalize inconsistently
  const canConfirm = confirmText.trim().toUpperCase() === CONFIRM_WORD && !loading

  const handleConfirm = async () => {
    if (!canConfirm) return
    setLoading(true)
    try {
      await authApi.deleteAccount()
      toast.success('Your account has been deleted.')
      await signOut()
      navigate('/', { replace: true })
    } catch (error) {
      logger.error('DeleteAccountSection: deletion failed', error)
      toast.error(getUserMessage(error, 'deleting your account'))
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in-up"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="absolute inset-0"
        style={{ background: 'var(--color-backdrop)' }}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="relative max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--color-card)', border: 'var(--border-ink)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-hard-lg)' }}
      >
        <div className="h-2" style={{ background: 'var(--color-danger)', borderBottom: 'var(--border-ink)', boxSizing: 'content-box' }} />
        <div className="p-7">
          <h2
            id="delete-account-title"
            className="mb-3"
            style={{ fontSize: '24px', lineHeight: 1.1, color: 'var(--color-text-primary)' }}
          >
            Delete your account?
          </h2>
          <p
            className="text-sm leading-relaxed mb-5"
            style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}
          >
            This is permanent. We'll remove your votes, reviews, photos, favorites, and profile
            from What's Good Here. Dish rankings that included your votes will be recalculated
            without them.
          </p>

          <label
            htmlFor="delete-account-confirm"
            className="block text-sm mb-1.5"
            style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}
          >
            Type <strong>DELETE</strong> to confirm
          </label>
          <input
            id="delete-account-confirm"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={loading}
            className="w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-danger)] transition-colors"
            style={{
              background: 'var(--color-surface-elevated)',
              border: 'var(--border-ink)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}
          />

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn-ink flex-1 px-5 py-3"
              style={{
                background: 'var(--color-card)',
                color: 'var(--color-ink)',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="btn-ink flex-1 px-5 py-3 disabled:cursor-not-allowed"
              style={{
                background: 'var(--color-danger)',
                color: 'var(--color-text-on-primary)',
              }}
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
