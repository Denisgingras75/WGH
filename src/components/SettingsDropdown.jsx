import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { adminApi } from '../api/adminApi'
import { useRestaurantManager } from '../hooks/useRestaurantManager'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { DeleteAccountModal } from './profile'
import { BlockedUsersModal } from './BlockedUsersModal'
import { isSoundMuted, toggleSoundMute } from '../lib/sounds'
import { getUserMessage } from '../utils/errorHandler'
import { logger } from '../utils/logger'

/**
 * Settings gear icon with dropdown — mirrors NotificationBell pattern.
 * The menu only mounts while signed in, so its hooks never run across an auth flip.
 */
export function SettingsDropdown() {
  const { user } = useAuth()
  if (!user) return null
  return <SettingsMenu />
}

function SettingsMenu() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { isManager: isRestaurantManager } = useRestaurantManager()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [soundMuted, setSoundMuted] = useState(isSoundMuted())
  const dropdownRef = useRef(null)
  const gearButtonRef = useRef(null)

  // Check admin status (adminApi.isAdmin resolves false on error)
  const { data: isAdmin = false } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: () => adminApi.isAdmin(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape' && showDropdown) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showDropdown])

  const handleSignOut = () => {
    setShowDropdown(false)
    setShowSignOutConfirm(true)
  }

  const cancelSignOut = () => {
    if (signingOut) return
    setShowSignOutConfirm(false)
    requestAnimationFrame(() => gearButtonRef.current?.focus())
  }

  const confirmSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      logger.error('Sign out failed:', error)
      toast.error(getUserMessage(error, 'signing out'))
      setSigningOut(false)
    }
  }

  const signOutDialogRef = useFocusTrap(showSignOutConfirm, cancelSignOut)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Gear Icon */}
      <button
        type="button"
        ref={gearButtonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95"
        style={{ color: 'var(--color-text-primary)' }}
        aria-label="Settings"
        aria-expanded={showDropdown}
        aria-controls="settings-panel"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div
          id="settings-panel"
          aria-label="Settings"
          className="fixed top-14 right-4 w-64 rounded-xl shadow-xl border z-50 overflow-hidden"
          style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-divider)' }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 border-b font-semibold"
            style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-divider)' }}
          >
            Settings
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={!soundMuted}
            onClick={() => { const m = toggleSoundMute(); setSoundMuted(m) }}
            className="w-full px-4 py-3 flex items-center justify-between transition-colors border-b"
            style={{ borderColor: 'var(--color-divider)' }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Sounds</span>
            <span
              aria-hidden="true"
              className="block w-10 h-6 rounded-full transition-colors"
              style={{ background: soundMuted ? 'var(--color-text-tertiary)' : 'var(--color-primary)' }}
            >
              <span
                className="block w-4 h-4 rounded-full shadow-sm transition-transform mt-1"
                style={{
                  background: 'var(--color-surface-elevated)',
                  marginLeft: '4px',
                  transform: soundMuted ? 'translateX(0)' : 'translateX(18px)',
                }}
              />
            </span>
          </button>

          {/* Admin Panel Link */}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setShowDropdown(false)}
              className="w-full px-4 py-3 flex items-center justify-between transition-colors border-b"
              style={{ borderColor: 'var(--color-divider)' }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Admin Panel</span>
              <svg className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}

          {/* Manage Restaurant Link */}
          {isRestaurantManager && (
            <Link
              to="/manage"
              onClick={() => setShowDropdown(false)}
              className="w-full px-4 py-3 flex items-center justify-between transition-colors border-b"
              style={{ borderColor: 'var(--color-divider)' }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Manage Restaurant</span>
              <svg className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}

          {/* Privacy Policy */}
          <Link
            to="/privacy"
            onClick={() => setShowDropdown(false)}
            className="w-full px-4 py-3 flex items-center justify-between transition-colors border-b"
            style={{ borderColor: 'var(--color-divider)' }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Privacy Policy</span>
            <svg className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Terms of Service */}
          <Link
            to="/terms"
            onClick={() => setShowDropdown(false)}
            className="w-full px-4 py-3 flex items-center justify-between transition-colors border-b"
            style={{ borderColor: 'var(--color-divider)' }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Terms of Service</span>
            <svg className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Support / Help */}
          <Link
            to="/support"
            onClick={() => setShowDropdown(false)}
            className="w-full px-4 py-3 flex items-center justify-between transition-colors border-b"
            style={{ borderColor: 'var(--color-divider)' }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Help &amp; Support</span>
            <svg className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Blocked Users */}
          <button
            type="button"
            onClick={() => { setShowDropdown(false); setShowBlockedModal(true) }}
            className="w-full px-4 py-3 flex items-center justify-between transition-colors border-b"
            style={{ borderColor: 'var(--color-divider)' }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Blocked users</span>
            <svg className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Delete Account */}
          <button
            type="button"
            onClick={() => { setShowDropdown(false); setShowDeleteModal(true) }}
            className="w-full px-4 py-3 flex items-center justify-between transition-colors border-b"
            style={{ borderColor: 'var(--color-divider)' }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>Delete Account</span>
          </button>

          {/* Sign Out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full px-4 py-3 flex items-center justify-between transition-colors"
          >
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Sign Out</span>
          </button>
        </div>
      )}

      {/* Sign-out confirmation */}
      {showSignOutConfirm && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in-up"
          onClick={cancelSignOut}
          role="presentation"
        >
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0, 0, 0, 0.6)' }}
            aria-hidden="true"
          />
          <div
            ref={signOutDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-title"
            className="relative rounded-3xl max-w-md w-full shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--color-surface-elevated)' }}
          >
            <h2
              id="signout-title"
              className="text-2xl font-bold mb-6"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Sign out?
            </h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelSignOut}
                disabled={signingOut}
                className="flex-1 py-3 px-5 rounded-xl font-semibold transition-all active:scale-[0.98]"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-divider)',
                  color: 'var(--color-text-primary)',
                  fontSize: '15px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSignOut}
                disabled={signingOut}
                className="flex-1 py-3 px-5 rounded-xl font-semibold transition-all active:scale-[0.98]"
                style={{
                  background: 'var(--color-primary)',
                  color: 'var(--color-text-on-primary)',
                  fontSize: '15px',
                  opacity: signingOut ? 0.7 : 1,
                }}
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <DeleteAccountModal onClose={() => {
          setShowDeleteModal(false)
          requestAnimationFrame(() => gearButtonRef.current?.focus())
        }} />
      )}

      <BlockedUsersModal
        isOpen={showBlockedModal}
        onClose={() => {
          setShowBlockedModal(false)
          requestAnimationFrame(() => gearButtonRef.current?.focus())
        }}
      />
    </div>
  )
}
