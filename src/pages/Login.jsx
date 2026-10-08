import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import { logger } from '../utils/logger'
import { CameraIcon } from '../components/CameraIcon'
import { SmileyPin } from '../components/SmileyPin'
import { Wordmark } from '../components/Wordmark'
import { FEATURES } from '../constants/features'

// SECURITY: Email is NOT persisted to storage to prevent XSS exposure of PII

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
  const [message, setMessage] = useState(
    isPostConfirmation ? { type: 'success', text: 'Email verified! Sign in to get started.' } : null
  )
  const [showLogin, setShowLogin] = useState(isPostConfirmation) // Controls welcome vs login view
  const [mode, setMode] = useState(isPostConfirmation ? 'signin' : 'options') // 'options' | 'signin' | 'signup' | 'forgot'
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

  // Check username availability with debounce
  useEffect(() => {
    if (mode !== 'signup' || !username || username.length < 2) {
      setUsernameStatus(null)
      return
    }

    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const available = await authApi.isUsernameAvailable(username)
        setUsernameStatus(available ? 'available' : 'taken')
      } catch (error) {
        logger.error('Failed to check username availability:', error)
        setUsernameStatus(null)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [username, mode])

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
      setMessage({ type: 'error', text: error.message })
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
      const fromLocation = location.state?.from
      const from = fromLocation
        ? fromLocation.pathname + (fromLocation.search || '') + (fromLocation.hash || '')
        : '/'
      navigate(from)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
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
      setMessage({ type: 'error', text: error.message })
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
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-bg)' }}
    >
        {/* Header */}
        <header className="px-4 pt-6 pb-4">
          <button
            onClick={() => {
              if (showLogin && mode !== 'options') {
                setMode('options')
              } else if (showLogin) {
                setShowLogin(false)
              } else {
                navigate('/')
              }
            }}
            className="flex items-center gap-1.5 pl-2.5 pr-4 py-2 text-sm"
            style={{
              background: 'var(--color-card)',
              color: 'var(--color-ink)',
              border: 'var(--border-ink)',
              borderRadius: 'var(--radius-pill)',
              boxShadow: 'var(--shadow-hard-sm)',
              fontWeight: 700,
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </header>

        {!showLogin ? (
          /* ========== WELCOME / SPLASH PAGE ========== */
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
            {/* Logo + Brand */}
            <div className="flex flex-col items-center mb-8">
              <div style={{ marginBottom: '-14px', position: 'relative', zIndex: 2 }}>
                <SmileyPin size={56} />
              </div>
              <Wordmark as="h1" size={36} style={{ position: 'relative', zIndex: 1 }} />
              <p className="eyebrow" style={{ marginTop: '12px' }}>
                Discover Great Food
              </p>
            </div>

            {/* Goals Section */}
            <div className="w-full max-w-sm mb-8">
              <h2 className="text-center mb-5" style={{ color: 'var(--color-text-primary)', fontSize: '24px', lineHeight: 1.1 }}>
                Our Goals
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'var(--color-butter)',
                      color: 'var(--color-ink)',
                      border: 'var(--border-ink)',
                      boxShadow: 'var(--shadow-hard-sm)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '18px',
                      lineHeight: 1,
                    }}
                  >
                    <span>1</span>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', fontWeight: 500, lineHeight: 1.4 }}>
                    Help you find <strong style={{ color: 'var(--color-text-primary)', fontWeight: 800 }}>the best dishes</strong> wherever you are
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'var(--color-butter)',
                      color: 'var(--color-ink)',
                      border: 'var(--border-ink)',
                      boxShadow: 'var(--shadow-hard-sm)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '18px',
                      lineHeight: 1,
                    }}
                  >
                    <span>2</span>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', fontWeight: 500, lineHeight: 1.4 }}>
                    Let you <strong style={{ color: 'var(--color-text-primary)', fontWeight: 800 }}>order confidently</strong> at any restaurant you're at
                  </p>
                </div>
              </div>
            </div>

            {/* How It Works Section */}
            <div
              className="w-full max-w-sm mb-8 p-4"
              style={{
                background: 'var(--color-card)',
                border: 'var(--border-ink)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-hard)',
              }}
            >
              <h3 className="text-center mb-4" style={{ color: 'var(--color-text-primary)', fontSize: '19px', lineHeight: 1.1 }}>
                How We Rate
              </h3>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                <div className="flex items-center gap-3 pb-3">
                  <span
                    className="w-9 h-9 flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: 'var(--color-category-strip)', border: 'var(--border-ink-thin)', borderRadius: 'var(--radius-sm)' }}
                  >
                    ⭐
                  </span>
                  <p>Rate the dishes you try from <strong style={{ color: 'var(--color-text-primary)', fontWeight: 800 }}>1 to 10</strong>. Your ratings help locals and visitors find the best food.</p>
                </div>
                <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1.5px dashed var(--color-divider)' }}>
                  <span
                    className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-category-strip)', border: 'var(--border-ink-thin)', borderRadius: 'var(--radius-sm)' }}
                  >
                    <CameraIcon size={20} />
                  </span>
                  <p><strong style={{ color: 'var(--color-text-primary)', fontWeight: 800 }}>Snap a photo</strong> — it'll show in the community gallery for that dish.</p>
                </div>
              </div>
            </div>

            {/* Get Started Button - goes to homepage */}
            <button
              onClick={() => navigate('/')}
              className="btn-ink w-full max-w-sm px-6 py-4 text-lg"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontWeight: 800 }}
            >
              Get Started
            </button>

            {/* Create Account Button */}
            <button
              onClick={() => {
                setShowLogin(true)
                setMode('signup')
              }}
              className="btn-ink w-full max-w-sm mt-3 px-6 py-4 text-lg"
              style={{ background: 'var(--color-card)', color: 'var(--color-ink)', fontWeight: 800 }}
            >
              Create Account
            </button>

            {/* Sign in option */}
            <button
              onClick={() => setShowLogin(true)}
              className="mt-5 text-sm"
              style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}
            >
              Already have an account? <span style={{ color: 'var(--color-accent)', fontWeight: 800 }}>Sign in</span>
            </button>
          </div>
        ) : (
          /* ========== LOGIN PAGE ========== */
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <SmileyPin size={48} />
            </div>

            {/* Heading */}
            <h1 className="text-center mb-2" style={{ color: 'var(--color-text-primary)', fontSize: '28px', lineHeight: 1.1 }}>
              {mode === 'signup' ? 'Create Account' : mode === 'signin' ? 'Welcome Back' : mode === 'forgot' ? 'Reset Password' : 'Sign in to vote'}
            </h1>
            <p className="text-center text-sm mb-8" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
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
                className="w-full max-w-sm mb-4 p-4 text-sm"
                style={message.type === 'error'
                  ? { background: 'var(--color-danger-muted)', color: 'var(--color-danger)', border: '1.5px solid var(--color-danger)', borderRadius: 'var(--radius-md)', fontWeight: 600 }
                  : { background: 'var(--color-success-muted)', color: 'var(--color-success)', border: '1.5px solid var(--color-success)', borderRadius: 'var(--radius-md)', fontWeight: 600 }
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
                  className="btn-ink w-full gap-3 px-6 py-4"
                  style={{ background: 'var(--color-card)', color: 'var(--color-ink)', fontSize: '16px' }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1" style={{ height: '1.5px', background: 'var(--color-divider)' }} />
                  <span className="eyebrow">or</span>
                  <div className="flex-1" style={{ height: '1.5px', background: 'var(--color-divider)' }} />
                </div>

                {/* Email Sign In */}
                <button
                  onClick={() => setMode('signin')}
                  className="btn-ink w-full px-6 py-4"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontSize: '16px' }}
                >
                  Sign in with Email
                </button>

                {/* Sign Up Link */}
                <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="underline"
                    style={{ color: 'var(--color-accent)', fontWeight: 800 }}
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
                  <label htmlFor="login-email" className="block text-sm mb-1.5" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    className="w-full px-4 py-3 focus:outline-none focus:shadow-[shadow:var(--shadow-hard)] transition-shadow"
                    style={{ background: 'var(--color-surface-elevated)', border: 'var(--border-ink)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '16px', fontWeight: 500 }}
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm mb-1.5" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 focus:outline-none focus:shadow-[shadow:var(--shadow-hard)] transition-shadow"
                    style={{ background: 'var(--color-surface-elevated)', border: 'var(--border-ink)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '16px', fontWeight: 500 }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-ink w-full px-6 py-4"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontSize: '16px' }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setMode('options')}
                    style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }}
                  >
                    Forgot password?
                  </button>
                </div>

                <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="underline"
                    style={{ color: 'var(--color-accent)', fontWeight: 800 }}
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
                  <label htmlFor="forgot-email" className="block text-sm mb-1.5" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    className="w-full px-4 py-3 focus:outline-none focus:shadow-[shadow:var(--shadow-hard)] transition-shadow"
                    style={{ background: 'var(--color-surface-elevated)', border: 'var(--border-ink)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '16px', fontWeight: 500 }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-ink w-full px-6 py-4"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontSize: '16px' }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="w-full text-center text-sm"
                  style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}
                >
                  Back to sign in
                </button>
              </form>
            )}

            {/* Sign Up Mode */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="w-full max-w-sm space-y-4">
                <div>
                  <label htmlFor="signup-username" className="block text-sm mb-1.5" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                    Username
                  </label>
                  <div className="relative">
                    <input
                      id="signup-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                      placeholder="Choose a unique username"
                      required
                      autoFocus
                      minLength={2}
                      maxLength={30}
                      className="w-full px-4 py-3 focus:outline-none focus:shadow-[shadow:var(--shadow-hard)] transition-shadow pr-10"
                      style={{
                        background: 'var(--color-surface-elevated)',
                        border: usernameStatus === 'taken' ? '2px solid var(--color-danger)' : usernameStatus === 'available' ? '2px solid var(--color-success)' : 'var(--border-ink)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-primary)',
                        fontSize: '16px',
                        fontWeight: 500,
                      }}
                    />
                    {usernameStatus && (
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
                        style={{ color: usernameStatus === 'taken' ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 800 }}
                      >
                        {usernameStatus === 'checking' && '⏳'}
                        {usernameStatus === 'available' && '✓'}
                        {usernameStatus === 'taken' && '✗'}
                      </span>
                    )}
                  </div>
                  {usernameStatus === 'taken' && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>This username is taken</p>
                  )}
                  {usernameStatus === 'available' && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-success)', fontWeight: 600 }}>Username available!</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-sm mb-1.5" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                    Email
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 focus:outline-none focus:shadow-[shadow:var(--shadow-hard)] transition-shadow"
                    style={{ background: 'var(--color-surface-elevated)', border: 'var(--border-ink)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '16px', fontWeight: 500 }}
                  />
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm mb-1.5" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                    Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 focus:outline-none focus:shadow-[shadow:var(--shadow-hard)] transition-shadow"
                    style={{ background: 'var(--color-surface-elevated)', border: 'var(--border-ink)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '16px', fontWeight: 500 }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking'}
                  className="btn-ink w-full px-6 py-4"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontSize: '16px' }}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setMode('options')}
                    style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    style={{ color: 'var(--color-accent)', fontWeight: 700 }}
                  >
                    Already have an account?
                  </button>
                </div>
              </form>
            )}

            {/* Footer */}
            <p className="mt-6 text-xs text-center" style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
              By continuing, you agree to our{' '}
              <a href="/terms" className="underline" style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>Terms</a>
              {' '}and{' '}
              <a href="/privacy" className="underline" style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>Privacy Policy</a>
            </p>
          </div>
        )}
    </div>
  )
}
