import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { authApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import { logger } from '../utils/logger'
import { getAuthErrorMessage } from '../utils/errorHandler'
import { CameraIcon } from '../components/CameraIcon'
import { SmileyPin } from '../components/SmileyPin'
import { FEATURES } from '../constants/features'
import { PageHeader } from '../components/PageHeader'
import { AMATIC_TITLE, INPUT_FOCUS_CLASS, PAGE_INPUT_STYLE } from '../constants/styles'

// SECURITY: Email is NOT persisted to storage to prevent XSS exposure of PII

const sectionHeadingStyle = { ...AMATIC_TITLE, fontSize: '24px' }


export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  // If user arrives with confirmation hash params, go straight to sign-in
  const isPostConfirmation = window.location.hash.includes('type=signup') || window.location.hash.includes('type=email')
  // Arrived with somewhere to return to (ProtectedRoute, invite "Sign In to Accept"):
  // skip the marketing splash so the destination isn't thrown away.
  const hasReturnTarget = !!location.state?.from
  // Arrived from an expired reset link: open straight on the reset form.
  const isForgotEntry = location.state?.mode === 'forgot'
  const [message, setMessage] = useState(
    isPostConfirmation ? { type: 'success', text: 'Email verified! Sign in to get started.' } : null
  )
  const [showLogin, setShowLogin] = useState(isPostConfirmation || hasReturnTarget || isForgotEntry) // Controls welcome vs login view
  const [mode, setMode] = useState(isPostConfirmation ? 'signin' : isForgotEntry ? 'forgot' : 'options') // 'options' | 'signin' | 'signup' | 'forgot'
  const [usernameStatus, setUsernameStatus] = useState(null) // null | 'checking' | 'available' | 'taken'

  // Redirect authenticated users to home (or where they came from)
  useEffect(() => {
    if (user) {
      const fromLocation = location.state?.from
      const from = fromLocation
        ? fromLocation.pathname + (fromLocation.search || '') + (fromLocation.hash || '')
        : '/'
      navigate(from, { replace: true })
    }
  }, [user, navigate, location.state])

  // Reset form when switching modes
  useEffect(() => {
    if (!showLogin) {
      setMode('options')
      setPassword('')
      setUsername('')
      setMessage(null)
      setUsernameStatus(null)
    }
  }, [showLogin])

  // Safari restores this page from bfcache if the user backs out of Google's
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
        logger.error('Failed to check username availability:', error)
        if (!cancelled) setUsernameStatus(null)
      }
    }, 500)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [username, mode])

  // Switching forms clears any stale error/success banner
  const switchMode = (next) => {
    setMode(next)
    setMessage(null)
  }

  const handleBack = () => {
    if (showLogin && mode !== 'options') {
      switchMode('options')
    } else if (showLogin && !hasReturnTarget) {
      setShowLogin(false)
    } else if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  const buildOAuthRedirect = () => {
    const fromLocation = location.state?.from
    return fromLocation
      ? new URL(
          fromLocation.pathname + (fromLocation.search || '') + (fromLocation.hash || ''),
          window.location.origin
        ).toString()
      : null
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
      setMessage({ type: 'error', text: getAuthErrorMessage(error, 'signing in with Apple') })
      setLoading(false)
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setMessage(null)
      await authApi.signInWithPassword(email, password)
      const fromLocation = location.state?.from
      const from = fromLocation
        ? fromLocation.pathname + (fromLocation.search || '') + (fromLocation.hash || '')
        : '/'
      navigate(from, { replace: true })
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
          text: "Welcome to What's Good Here! Check your email for a verification link, then sign in to start discovering."
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

  const signupBlocked = usernameStatus === 'taken' || usernameStatus === 'checking'

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-bg)', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
    >
        {/* Header */}
        <PageHeader onBack={handleBack} standalone />

        {!showLogin ? (
          /* ========== WELCOME / SPLASH PAGE ========== */
          <div className="flex-1 flex flex-col items-center justify-center px-6 pt-6 pb-12">
            {/* Logo + Brand */}
            <div className="flex flex-col items-center mb-8">
              <div style={{ marginBottom: '-14px', position: 'relative', zIndex: 2 }}>
                <SmileyPin size={56} />
              </div>
              <h1
                style={{
                  fontFamily: "'Amatic SC', cursive",
                  fontSize: '42px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1,
                  letterSpacing: '0.04em',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                What's <span style={{ color: 'var(--color-primary)' }}>Good</span> Here
              </h1>
              <p
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  marginTop: '10px',
                }}
              >
                Discover Great Food
              </p>
            </div>

            {/* Goals Section */}
            <div className="w-full max-w-sm mb-8">
              <h2 className="text-center mb-6" style={sectionHeadingStyle}>
                Our Goals
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
                  >
                    <span className="font-bold">1</span>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    Help you find <strong style={{ color: 'var(--color-text-primary)' }}>the best dishes</strong> wherever you are
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
                  >
                    <span className="font-bold">2</span>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    Let you <strong style={{ color: 'var(--color-text-primary)' }}>order confidently</strong> at any restaurant you're at
                  </p>
                </div>
              </div>
            </div>

            {/* How It Works Section */}
            <div
              className="w-full max-w-sm mb-8 p-4 rounded-xl"
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-divider)' }}
            >
              <h3 className="text-center mb-4" style={sectionHeadingStyle}>
                How We Rate
              </h3>
              <div className="space-y-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <div className="flex items-center gap-3">
                  {/* Fixed icon column so both rows' text lines up */}
                  <span className="text-lg flex-shrink-0 w-7 flex justify-center" aria-hidden="true">⭐</span>
                  <p>Rate the dishes you try from <strong style={{ color: 'var(--color-text-primary)' }}>1 to 10</strong>. Your ratings help locals and visitors find the best food.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 flex justify-center"><CameraIcon size={20} /></span>
                  <p><strong style={{ color: 'var(--color-text-primary)' }}>Snap a photo</strong> — it'll show in the community gallery for that dish.</p>
                </div>
              </div>
            </div>

            {/* Get Started Button - goes to homepage */}
            <button
              onClick={() => navigate('/')}
              className="w-full max-w-sm py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
            >
              Get Started
            </button>

            {/* Create Account Button */}
            <button
              onClick={() => {
                setShowLogin(true)
                switchMode('signup')
              }}
              className="w-full max-w-sm mt-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
              style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)', border: '1px solid var(--color-divider)' }}
            >
              Create Account
            </button>

            {/* Sign in option */}
            <button
              onClick={() => setShowLogin(true)}
              className="mt-4 inline-flex items-center min-h-[44px] px-2 text-sm font-medium"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Already have an account? <span className="ml-1" style={{ color: 'var(--color-accent-gold)' }}>Sign in</span>
            </button>
          </div>
        ) : (
          /* ========== LOGIN PAGE ========== */
          <div className="flex-1 flex flex-col items-center justify-center px-6 pt-6 pb-12">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <SmileyPin size={48} />
            </div>

            {/* Heading */}
            <h1 className="text-center mb-2" style={{ ...sectionHeadingStyle, fontSize: '32px' }}>
              {mode === 'signup' ? 'Create Account' : mode === 'signin' ? 'Welcome Back' : mode === 'forgot' ? 'Reset Password' : 'Sign in to vote'}
            </h1>
            <p className="text-center text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              {mode === 'signup'
                ? 'Choose a unique username for your profile'
                : mode === 'signin'
                ? 'Enter your email and password'
                : mode === 'forgot'
                ? "Enter your email and we'll send you a reset link"
                : 'Help others find the best dishes'
              }
            </p>

            {/* Messages */}
            {message && (
              <div
                role={message.type === 'error' ? 'alert' : 'status'}
                className="w-full max-w-sm mb-4 p-4 rounded-xl text-sm font-medium"
                style={message.type === 'error'
                  ? { background: 'rgba(var(--color-danger-rgb), 0.15)', color: 'var(--color-danger)', border: '1px solid rgba(var(--color-danger-rgb), 0.3)' }
                  : { background: 'rgba(var(--color-success-rgb), 0.15)', color: 'var(--color-success)', border: '1px solid rgba(var(--color-success-rgb), 0.3)' }
                }
              >
                {message.text}
              </div>
            )}

            {/* Options Mode */}
            {mode === 'options' && (
              <div className="w-full max-w-sm space-y-4">
                {/* Sign in with Apple — handler is wired (handleAppleSignIn
                    above) and the flag gates the render slot, but the button
                    JSX itself is intentionally absent. Apple HIG requires the
                    button to use Apple's official asset (specific logo
                    proportions, padding, corner radius). Hand-authored SVG
                    is a known App Store rejection risk — the iOS Capacitor
                    build will render this same React code in WKWebView, so a
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
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
                  style={{
                    background: 'var(--color-surface-elevated)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-divider)',
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
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
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
              <form onSubmit={handleSignIn} className="w-full max-w-sm space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    className={'w-full px-4 py-3 rounded-xl ' + INPUT_FOCUS_CLASS}
                    style={PAGE_INPUT_STYLE}
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className={'w-full px-4 py-3 rounded-xl ' + INPUT_FOCUS_CLASS}
                    style={PAGE_INPUT_STYLE}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => switchMode('options')}
                    className="inline-flex items-center min-h-[44px] px-2"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="inline-flex items-center min-h-[44px] px-2 font-medium"
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
              <form onSubmit={handleForgotPassword} className="w-full max-w-sm space-y-4">
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
                    style={PAGE_INPUT_STYLE}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', opacity: loading ? 0.7 : 1 }}
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
              <form onSubmit={handleSignUp} className="w-full max-w-sm space-y-4">
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
                      aria-describedby={usernameStatus === 'taken' || usernameStatus === 'available' ? 'username-status' : undefined}
                      aria-invalid={usernameStatus === 'taken'}
                      className={'w-full px-4 py-3 rounded-xl ' + INPUT_FOCUS_CLASS + ' pr-10'}
                      style={{
                        ...PAGE_INPUT_STYLE,
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
                    <p id="username-status" role="alert" className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>This username is taken</p>
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
                    style={PAGE_INPUT_STYLE}
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
                    style={PAGE_INPUT_STYLE}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || signupBlocked}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                  style={!loading && signupBlocked
                    ? { background: 'var(--color-surface)', color: 'var(--color-text-tertiary)' }
                    : { background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', opacity: loading ? 0.7 : 1 }
                  }
                >
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => switchMode('options')}
                    className="inline-flex items-center min-h-[44px] px-2"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="inline-flex items-center min-h-[44px] px-2 font-medium"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Already have an account?
                  </button>
                </div>
              </form>
            )}

            {/* Footer */}
            <p className="mt-6 text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
              By continuing, you agree to our{' '}
              <Link to="/terms" className="underline">Terms</Link>
              {' '}and{' '}
              <Link to="/privacy" className="underline">Privacy Policy</Link>
            </p>
          </div>
        )}
    </div>
  )
}
