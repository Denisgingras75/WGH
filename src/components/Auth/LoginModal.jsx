import { useState, useEffect } from 'react'
import { authApi } from '../../api/authApi'
import { getPendingVoteFromStorage } from '../../lib/storage'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { logger } from '../../utils/logger'
import { getAuthErrorMessage } from '../../utils/errorHandler'
import { FEATURES } from '../../constants/features'
import { INPUT_FOCUS_CLASS, INPUT_STYLE } from '../../constants/styles'

// SECURITY: Email is NOT persisted to storage to prevent XSS exposure of PII

const primaryButtonClass = 'w-full px-5 py-3 rounded-xl font-semibold active:scale-[0.98] transition-all'
const textButtonClass = 'inline-flex items-center min-h-[44px] px-2'

export function LoginModal({ isOpen, onClose, pendingAction = null }) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState(null)
  const [mode, setMode] = useState('options') // 'options' | 'signin' | 'signup' | 'forgot'
  const [usernameStatus, setUsernameStatus] = useState(null) // null | 'checking' | 'available' | 'taken'

  // Check for pending vote from storage
  const hasPendingVote = getPendingVoteFromStorage() !== null

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMode('options')
      setPassword('')
      setUsername('')
      setMessage(null)
      setUsernameStatus(null)
    }
  }, [isOpen])

  // Safari restores the page from bfcache if the user backs out of Google's
  // consent screen — clear the stuck loading state so they can retry.
  useEffect(() => {
    const onShow = (e) => { if (e.persisted) setLoading(false) }
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [])

  // Check username availability with debounce
  useEffect(() => {
    if (mode !== 'signup' || !username || username.length < 2) {
      setUsernameStatus(null)
      return
    }

    let cancelled = false
    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const available = await authApi.isUsernameAvailable(username)
        if (!cancelled) setUsernameStatus(available ? 'available' : 'taken')
      } catch (error) {
        logger.error('LoginModal: username check failed', error)
        if (!cancelled) setUsernameStatus(null)
      }
    }, 500)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [username, mode])

  const modalRef = useFocusTrap(isOpen, onClose)

  if (!isOpen) return null

  // Switching forms clears any stale error/success banner
  const switchMode = (next) => {
    setMode(next)
    setMessage(null)
  }

  const buildOAuthRedirect = () => {
    const redirectUrl = new URL(window.location.href)
    const pending = getPendingVoteFromStorage()
    if (pending?.dishId) {
      redirectUrl.searchParams.set('votingDish', pending.dishId)
    }
    return redirectUrl.toString()
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      await authApi.signInWithGoogle(buildOAuthRedirect())
    } catch (error) {
      setMessage({ type: 'error', text: getAuthErrorMessage(error, 'signing in with Google') })
      setLoading(false)
    }
  }

  // Pre-wired for activation: gets referenced when the compliant Apple
  // button JSX is dropped in. See the Sign in with Apple comment block in
  // the options-mode section below for activation steps.
  // eslint-disable-next-line no-unused-vars
  const handleAppleSignIn = async () => {
    try {
      setLoading(true)
      await authApi.signInWithApple(buildOAuthRedirect())
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setMessage(null)
      await authApi.signInWithPassword(email, password)
      onClose()
    } catch (error) {
      setMessage({ type: 'error', text: getAuthErrorMessage(error, 'signing in') })
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()

    if (usernameStatus === 'taken') {
      setMessage({ type: 'error', text: 'This username is already taken.' })
      return
    }

    if (username.length < 2) {
      setMessage({ type: 'error', text: 'Username must be at least 2 characters.' })
      return
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }

    try {
      setLoading(true)
      setMessage(null)

      const result = await authApi.signUpWithPassword(email, password, username)

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Account created! Check your email to verify, then sign in.'
        })
        setMode('signin')
        setPassword('')
      }
    } catch (error) {
      setMessage({ type: 'error', text: getAuthErrorMessage(error, 'creating your account') })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()

    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address.' })
      return
    }

    try {
      setLoading(true)
      setMessage(null)

      await authApi.resetPassword(email)

      setMessage({
        type: 'success',
        text: 'Password reset link sent! Check your email.'
      })
    } catch (error) {
      setMessage({ type: 'error', text: getAuthErrorMessage(error, 'sending the reset link') })
    } finally {
      setLoading(false)
    }
  }

  const primaryStyle = { background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontSize: '15px', opacity: loading ? 0.7 : 1 }
  const signupBlocked = usernameStatus === 'taken' || usernameStatus === 'checking'

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in-up"
      onClick={onClose}
      role="presentation"
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(0, 0, 0, 0.6)' }} aria-hidden="true" />

      {/* Modal — capped to the viewport; the body scrolls so the close button,
          submit and legal footer stay reachable on short phones / open keyboard */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="relative rounded-3xl max-w-md w-full shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] supports-[height:100dvh]:max-h-[calc(100dvh-2rem)]"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--color-surface-elevated)' }}
      >
        {/* Decorative gradient header */}
        <div className="h-2 flex-shrink-0" style={{ background: 'var(--color-primary)' }} />

        <div className="p-8 overflow-y-auto overscroll-contain min-h-0">
          {/* Close button (positioned against the panel, so it stays put while the body scrolls) */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
            <span className="text-3xl" aria-hidden="true">{hasPendingVote ? '⭐' : '🍽️'}</span>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 id="login-modal-title" className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {mode === 'signup'
                ? 'Create Account'
                : mode === 'signin'
                ? 'Welcome Back'
                : mode === 'forgot'
                ? 'Reset Password'
                : hasPendingVote
                ? 'Sign in to save your rating'
                : pendingAction
                ? `Sign in to ${pendingAction}`
                : 'Sign in to rate'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {mode === 'signup'
                ? 'Choose a unique username for your profile'
                : mode === 'signin'
                ? 'Enter your email and password'
                : mode === 'forgot'
                ? "Enter your email and we'll send you a reset link"
                : hasPendingVote
                ? 'Your rating is ready'
                : 'Join the community and discover the best dishes'
              }
            </p>
          </div>

          {/* Messages */}
          {message && (
            <div
              role={message.type === 'error' ? 'alert' : 'status'}
              className="mb-6 p-4 rounded-xl text-sm font-medium"
              style={message.type === 'error'
                ? { background: 'rgba(var(--color-danger-rgb), 0.15)', color: 'var(--color-danger)' }
                : { background: 'rgba(var(--color-success-rgb), 0.15)', color: 'var(--color-success)' }
              }
            >
              {message.text}
            </div>
          )}

          {/* Options Mode - Show all login options */}
          {mode === 'options' && (
            <div className="space-y-4">
              {/* Sign in with Apple — handler is wired (handleAppleSignIn
                  above) and the flag gates the render slot, but the button
                  JSX itself is intentionally absent. Apple HIG requires the
                  button to use Apple's official asset (specific logo
                  proportions, padding, corner radius). Hand-authored SVG is
                  a known App Store rejection risk — the iOS Capacitor build
                  will render this same React code in WKWebView, so a
                  non-compliant button would fail review.

                  Activation steps (after Supabase Apple provider config):
                    1. Drop in Apple's official SIWA button asset:
                       https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple/overview/buttons/
                       OR install `react-apple-signin-auth` (use only its
                       button styling — auth flow stays on Supabase).
                    2. Replace the `null` below with the compliant button,
                       wired to handleAppleSignIn, placed ABOVE Google per
                       equal-prominence.
                    3. Set VITE_FEATURES_APPLE_SIGNIN=true in deploy env. */}
              {FEATURES.APPLE_SIGNIN_ENABLED && null}

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl font-semibold active:scale-[0.98] transition-all"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-divider)',
                  color: 'var(--color-text-primary)',
                  fontSize: '15px',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {loading ? 'Connecting…' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px" style={{ background: 'var(--color-divider)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'var(--color-divider)' }} />
              </div>

              {/* Email Sign In */}
              <button
                onClick={() => switchMode('signin')}
                className={primaryButtonClass}
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontSize: '15px' }}
              >
                Sign in with Email
              </button>

              {/* Sign Up Link */}
              <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="font-semibold underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Sign up
                </button>
              </p>
            </div>
          )}

          {/* Sign In Mode */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="signin-email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Email
                </label>
                <input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className={'w-full px-4 py-3 rounded-xl ' + INPUT_FOCUS_CLASS}
                  style={INPUT_STYLE}
                />
              </div>

              <div>
                <label htmlFor="signin-password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Password
                </label>
                <input
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className={'w-full px-4 py-3 rounded-xl ' + INPUT_FOCUS_CLASS}
                  style={INPUT_STYLE}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={primaryButtonClass}
                style={primaryStyle}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => switchMode('options')}
                  className={textButtonClass}
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className={`${textButtonClass} font-medium`}
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Forgot password?
                </button>
              </div>

              <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-semibold underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Sign up
                </button>
              </p>
            </form>
          )}

          {/* Forgot Password Mode */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className={'w-full px-4 py-3 rounded-xl ' + INPUT_FOCUS_CLASS}
                  style={INPUT_STYLE}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={primaryButtonClass}
                style={primaryStyle}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="w-full min-h-[44px] text-center text-sm"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Back to sign in
              </button>
            </form>
          )}

          {/* Sign Up Mode */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label htmlFor="signup-username" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Username
                </label>
                <div className="relative">
                  <input
                    id="signup-username"
                    type="text"
                    autoComplete="nickname"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                    placeholder="Choose a unique username"
                    required
                    autoFocus
                    minLength={2}
                    maxLength={30}
                    aria-describedby={usernameStatus ? 'username-status' : undefined}
                    aria-invalid={usernameStatus === 'taken'}
                    className={'w-full px-4 py-3 rounded-xl ' + INPUT_FOCUS_CLASS + ' pr-10'}
                    style={{
                      ...INPUT_STYLE,
                      // Status color overrides the focus border; idle falls back to INPUT_FOCUS_CLASS
                      ...(usernameStatus === 'taken' ? { borderColor: 'var(--color-danger)' } : usernameStatus === 'available' ? { borderColor: 'var(--color-success)' } : null),
                    }}
                  />
                  {usernameStatus && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg" aria-hidden="true">
                      {usernameStatus === 'checking' && '⏳'}
                      {usernameStatus === 'available' && '✓'}
                      {usernameStatus === 'taken' && '✗'}
                    </span>
                  )}
                </div>
                {usernameStatus === 'taken' && (
                  <p id="username-status" className="text-xs mt-1" style={{ color: 'var(--color-danger)' }} role="alert">This username is taken</p>
                )}
                {usernameStatus === 'available' && (
                  <p id="username-status" className="text-xs mt-1" style={{ color: 'var(--color-success)' }}>Username available!</p>
                )}
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={'w-full px-4 py-3 rounded-xl ' + INPUT_FOCUS_CLASS}
                  style={INPUT_STYLE}
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className={'w-full px-4 py-3 rounded-xl ' + INPUT_FOCUS_CLASS}
                  style={INPUT_STYLE}
                />
              </div>

              <button
                type="submit"
                disabled={loading || signupBlocked}
                className={primaryButtonClass}
                style={!loading && signupBlocked
                  ? { background: 'var(--color-surface)', color: 'var(--color-text-tertiary)', fontSize: '15px' }
                  : primaryStyle
                }
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => switchMode('options')}
                  className={textButtonClass}
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`${textButtonClass} font-medium`}
                  style={{ color: 'var(--color-primary)' }}
                >
                  Already have an account? <span className="ml-1" style={{ color: 'var(--color-accent-gold)' }}>Sign in</span>
                </button>
              </div>
            </form>
          )}

          {/* Footer — opens in a new tab so a mid-rating user doesn't lose their pending vote */}
          <p className="mt-6 text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
            By continuing, you agree to our{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--color-text-secondary)' }}>Terms</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--color-text-secondary)' }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
