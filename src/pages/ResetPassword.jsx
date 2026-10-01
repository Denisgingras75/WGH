import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/authApi'
import { SmileyPin } from '../components/SmileyPin'
import { logger } from '../utils/logger'
import { getAuthErrorMessage, getUserMessage } from '../utils/errorHandler'
import { PageHeader } from '../components/PageHeader'
import { INPUT_FOCUS_CLASS, PAGE_INPUT_STYLE } from '../constants/styles'


export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState(null)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const timerRef = useRef(null)

  // Check if we have a valid recovery session
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        // Supabase automatically handles the recovery token from the URL
        const { data } = await authApi.getSession()
        if (cancelled) return

        if (data?.session) {
          setIsValidSession(true)
        } else {
          setMessage({
            type: 'error',
            text: 'Invalid or expired reset link. Please request a new one.'
          })
        }
      } catch (err) {
        logger.error('ResetPassword: session check failed', err)
        if (!cancelled) {
          setMessage({ type: 'error', text: getUserMessage(err, 'checking your reset link') })
        }
      } finally {
        if (!cancelled) setCheckingSession(false)
      }
    })()

    return () => { cancelled = true }
  }, [])

  // Don't fire the post-success redirect after the user has already left
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/login')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    try {
      setLoading(true)
      setMessage(null)

      await authApi.updatePassword(password)

      setMessage({
        type: 'success',
        text: 'Password updated successfully! Redirecting…'
      })
      // Lock the form so a second tap can't re-submit during the redirect window
      setDone(true)

      // Redirect to home after a short delay (replace: Back shouldn't return here)
      timerRef.current = setTimeout(() => {
        navigate('/', { replace: true })
      }, 2000)
    } catch (error) {
      setMessage({ type: 'error', text: getAuthErrorMessage(error, 'updating your password') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-bg)', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
    >
      {/* Header */}
      <PageHeader onBack={handleBack} standalone />

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-6 pb-12">
        {/* Logo */}
        <div className="mb-6">
          <SmileyPin size={96} />
        </div>

        {/* Heading */}
        <h1
          className="text-center mb-2"
          style={{
            fontFamily: "'Amatic SC', cursive",
            fontSize: '32px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            lineHeight: 1.1,
            color: 'var(--color-text-primary)',
          }}
        >
          Set New Password
        </h1>
        {isValidSession && (
          <p className="text-center text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            Enter your new password below
          </p>
        )}

        {/* Messages */}
        {message && (
          <div
            role={message.type === 'error' ? 'alert' : 'status'}
            className={`w-full max-w-sm mb-4 p-4 rounded-xl text-sm font-medium${isValidSession ? '' : ' mt-6'}`}
            style={message.type === 'error'
              ? { background: 'rgba(var(--color-danger-rgb), 0.15)', color: 'var(--color-danger)', border: '1px solid rgba(var(--color-danger-rgb), 0.3)' }
              : { background: 'rgba(var(--color-success-rgb), 0.15)', color: 'var(--color-success)', border: '1px solid rgba(var(--color-success-rgb), 0.3)' }
            }
          >
            {message.text}
          </div>
        )}

        {checkingSession ? (
          <div className="w-full max-w-sm flex justify-center py-8" role="status" aria-label="Checking reset link">
            <div
              className="spinner"
              aria-hidden="true"
            />
            <span className="sr-only">Loading…</span>
          </div>
        ) : isValidSession ? (
          <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
            <div>
              <label htmlFor="reset-password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                New Password
              </label>
              <input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                autoFocus
                minLength={6}
                className={'w-full px-4 py-3 rounded-xl ' + INPUT_FOCUS_CLASS}
                style={PAGE_INPUT_STYLE}
              />
            </div>

            <div>
              <label htmlFor="reset-password-confirm" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Confirm Password
              </label>
              <input
                id="reset-password-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Enter password again"
                required
                minLength={6}
                className={'w-full px-4 py-3 rounded-xl ' + INPUT_FOCUS_CLASS}
                style={PAGE_INPUT_STYLE}
              />
            </div>

            <button
              type="submit"
              disabled={loading || done}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', opacity: loading || done ? 0.7 : 1 }}
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        ) : (
          <div className="w-full max-w-sm">
            <button
              onClick={() => navigate('/login', { state: { mode: 'forgot' } })}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
            >
              Request a New Link
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
