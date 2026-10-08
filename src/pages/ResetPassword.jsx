import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/authApi'
import { SmileyPin } from '../components/SmileyPin'

export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  // Check if we have a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      // Supabase automatically handles the recovery token from the URL
      const { data: { session } } = await authApi.getSession()

      if (session) {
        setIsValidSession(true)
      } else {
        setMessage({
          type: 'error',
          text: 'Invalid or expired reset link. Please request a new one.'
        })
      }
      setCheckingSession(false)
    }

    checkSession()
  }, [])

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
        text: 'Password updated successfully! Redirecting...'
      })

      // Redirect to home after a short delay
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Logo */}
      <div className="mb-6">
        <SmileyPin size={96} />
      </div>

      {/* Heading */}
      <h1 className="text-center mb-2" style={{ color: 'var(--color-text-primary)', fontSize: '28px', lineHeight: 1.1 }}>
        Set New Password
      </h1>
      <p className="text-center text-sm mb-8" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
        Enter your new password below
      </p>

      {/* Messages */}
      {message && (
        <div
          className="w-full max-w-sm mb-4 p-4 text-sm"
          style={message.type === 'error'
            ? { background: 'var(--color-danger-muted)', color: 'var(--color-danger)', border: '1.5px solid var(--color-danger)', borderRadius: 'var(--radius-md)', fontWeight: 600 }
            : { background: 'var(--color-success-muted)', color: 'var(--color-success)', border: '1.5px solid var(--color-success)', borderRadius: 'var(--radius-md)', fontWeight: 600 }
          }
        >
          {message.text}
        </div>
      )}

      {checkingSession ? (
        <div className="w-full max-w-sm flex justify-center py-8" role="status">
          <div
            className="w-8 h-8 rounded-full animate-spin"
            style={{ border: '3px solid var(--color-divider)', borderTopColor: 'var(--color-primary)' }}
            aria-hidden="true"
          />
          <span className="sr-only">Loading...</span>
        </div>
      ) : isValidSession ? (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <label htmlFor="reset-password" className="block text-sm mb-1.5" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
              New Password
            </label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              autoFocus
              minLength={6}
              className="w-full px-4 py-3 focus:outline-none"
              style={{ background: 'var(--color-surface-elevated)', border: 'var(--border-ink)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '16px', fontWeight: 500 }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter password again"
              required
              minLength={6}
              className="w-full px-4 py-3 focus:outline-none"
              style={{ background: 'var(--color-surface-elevated)', border: 'var(--border-ink)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '16px', fontWeight: 500 }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-ink w-full px-6 py-4"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontSize: '16px' }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      ) : (
        <div className="w-full max-w-sm">
          <button
            onClick={() => navigate('/login')}
            className="btn-ink w-full px-6 py-4"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontSize: '16px' }}
          >
            Back to Sign In
          </button>
        </div>
      )}
    </div>
  )
}
