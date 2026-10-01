import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { SmileyPin } from '../SmileyPin'
import { capture } from '../../lib/analytics'
import { getUserMessage } from '../../utils/errorHandler'
import { getRatingColor } from '../../utils/ranking'
import { MIN_VOTES_FOR_RANKING } from '../../constants/app'
import { INPUT_FOCUS_CLASS } from '../../constants/styles'

const STEPS = [
  {
    id: 'welcome',
    title: 'Find the best dishes near you',
    subtitle: 'Real ratings from locals & visitors like you',
    description: 'Find the best food faster.',
  },
  {
    id: 'how-it-works',
    icon: 'star',
    title: "Rate dishes you've actually tried, 1–10.",
    subtitle: 'Find the best food faster.',
    description: 'Your ratings help locals and visitors discover what\'s actually good.',
  },
  {
    id: 'photos',
    icon: 'camera',
    title: 'Snap it before you eat it',
    subtitle: 'Real photos from real people',
    description: 'No stock photos. When you order something, snap a quick pic — the community will thank you.',
  },
  {
    id: 'name',
    emoji: '👋',
    title: 'Enter your name',
    subtitle: 'Join the community',
    description: 'Friends can find you by your name',
  },
]

const NAME_STEP_INDEX = STEPS.findIndex(s => s.id === 'name')

export function WelcomeModal() {
  const { user } = useAuth()
  const { profile, updateProfile, loading } = useProfile(user?.id)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [phase, setPhase] = useState('onboarding') // 'onboarding' | 'celebration' | 'fade-out'
  // Which user this session already opened onboarding for — so a later
  // profile cache write can't re-open it (and a new sign-in starts fresh).
  const openedForRef = useRef(null)
  const timersRef = useRef([])

  // Skip name step if user already set one during signup
  const hasName = profile?.display_name && profile.display_name.trim().length > 0
  const activeSteps = hasName ? STEPS.filter(s => s.id !== 'name') : STEPS
  // Clamp in case activeSteps shrinks (name set elsewhere) while open
  const stepIndex = Math.min(step, activeSteps.length - 1)

  useEffect(() => {
    if (!user) {
      openedForRef.current = null
      setIsOpen(false)
      return
    }
    // Open for net-new users, and also for anyone whose display_name is
    // still missing — covers Apple users who declined name share on first
    // sign-in, Google users whose provider didn't supply a name, and any
    // past user who got into a weird data state. display_name is required
    // to vote, so we can't let onboarded-but-nameless users slip through.
    // Use trim() to match the hasName semantics elsewhere in the component.
    if (
      !loading &&
      profile &&
      openedForRef.current !== user.id &&
      (!profile.has_onboarded || !profile.display_name?.trim())
    ) {
      openedForRef.current = user.id
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
      setPhase('onboarding')
      // Already-onboarded users who skipped their name go straight to the name step
      setStep(profile.has_onboarded ? NAME_STEP_INDEX : 0)
      setName('')
      setSaveError(null)
      setIsOpen(true)
      capture('onboarding_started')
    }
  }, [user, profile, loading])

  const panelRef = useFocusTrap(isOpen && phase === 'onboarding')

  const displayName = name.trim() || profile?.display_name || ''

  const completeOnboarding = async (nameSet) => {
    // Snapshot the name at submit time so a late-typed character can't desync
    // what gets persisted from what the celebration screen shows.
    const submittedName = name.trim()
    setSaving(true)
    setSaveError(null)
    const updates = { has_onboarded: true }
    if (submittedName) updates.display_name = submittedName
    const { error } = await updateProfile(updates)
    setSaving(false)

    if (error) {
      // Surface the error so the user can correct it (most likely: duplicate
      // display_name — profiles_display_name_unique — or a blocklisted word)
      const code = error?.originalError?.code
      setSaveError(
        code === '23505'
          ? 'That name is already taken. Try another.'
          : /inappropriate/i.test(error?.message || '')
            ? error.message
            : getUserMessage(error, 'saving your name')
      )
      capture('onboarding_failed', { name_set: nameSet, error: error.message })
      return
    }

    capture('onboarding_completed', { name_set: nameSet })

    // Show celebration screen
    setPhase('celebration')

    // Auto-dismiss after 2.5s
    timersRef.current.push(
      setTimeout(() => setPhase('fade-out'), 2500),
      setTimeout(() => setIsOpen(false), 2800)
    )
  }

  const handleNext = async () => {
    if (stepIndex < activeSteps.length - 1) {
      setStep(stepIndex + 1)
    } else {
      await completeOnboarding(hasName)
    }
  }

  const handleBack = () => {
    if (stepIndex > 0) {
      setStep(stepIndex - 1)
    }
  }

  const handleNameSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    await completeOnboarding(true)
  }

  const handleSkipName = async () => {
    await completeOnboarding(false)
  }

  if (!isOpen) return null

  // ==================== CELEBRATION SCREEN ====================
  if (phase === 'celebration' || phase === 'fade-out') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
        style={{
          opacity: phase === 'fade-out' ? 0 : 1,
          transition: 'opacity 300ms ease-out',
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'var(--color-bg)' }}
        />

        <div className="relative z-10 text-center px-8">
          {/* Logo — matches splash page layout */}
          <div className="flex justify-center" style={{ marginBottom: '-18px', position: 'relative', zIndex: 2 }}>
            <SmileyPin size={72} />
          </div>

          {/* Brand name (not a heading — the page underneath owns the h1) */}
          <p
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
          </p>

          {/* Welcome line */}
          <p
            style={{
              color: 'var(--color-text-primary)',
              fontSize: '18px',
              fontWeight: 500,
              lineHeight: 1.4,
              marginTop: '16px',
            }}
          >
            Welcome{displayName ? `, ${displayName}` : ''}.
          </p>

          {/* Tagline — matches splash page */}
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginTop: '14px',
            }}
          >
            Dish Discovery
          </p>
        </div>
      </div>
    )
  }

  // ==================== ONBOARDING STEPS ====================
  const currentStep = activeSteps[stepIndex]
  const isNameStep = currentStep.id === 'name'
  const isLastStep = stepIndex === activeSteps.length - 1

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 backdrop-blur-sm pointer-events-none"
        style={{ background: 'rgba(0, 0, 0, 0.6)' }}
        aria-hidden="true"
      />

      {/* Modal — capped to the viewport; the body scrolls so the primary
          button stays reachable on short phones / with the keyboard open */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-step-title"
        className="relative z-10 rounded-3xl max-w-md w-full shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] supports-[height:100dvh]:max-h-[calc(100dvh-2rem)]"
        style={{ background: 'var(--color-surface-elevated)' }}
      >
        {/* Decorative gradient header */}
        <div className="h-2 flex-shrink-0" style={{ background: 'var(--color-primary)' }} />

        <div className="p-8 overflow-y-auto overscroll-contain min-h-0">
          {/* Progress dots (decorative — Back handles navigation) */}
          <div className="flex justify-center gap-2 mb-6">
            {activeSteps.map((_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`${i === stepIndex ? 'w-6' : 'w-2'} h-2 rounded-full transition-all`}
                style={{
                  background: i === stepIndex
                    ? 'var(--color-primary)'
                    : i < stepIndex
                      ? 'var(--color-primary-muted)'
                      : 'var(--color-divider)'
                }}
              />
            ))}
          </div>
          <p className="sr-only" aria-live="polite">
            Step {stepIndex + 1} of {activeSteps.length}
          </p>

          {/* Step icon */}
          {currentStep.id === 'welcome' ? (
            <div className="flex justify-center mb-6">
              <SmileyPin size={56} />
            </div>
          ) : (
            <div
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
              aria-hidden="true"
            >
              {currentStep.icon === 'star' ? <span className="text-4xl">⭐</span>
                : currentStep.icon === 'camera' ? (
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                ) : <span className="text-4xl">{currentStep.emoji}</span>}
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-6">
            <h2 id="welcome-step-title" className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {currentStep.title}
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {currentStep.subtitle}
            </p>
            {currentStep.description && (
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                {currentStep.description}
              </p>
            )}
          </div>

          {/* How it works visual — rating-first rail, same colour scale as every dish row */}
          {currentStep.id === 'how-it-works' && (
            <div className="flex justify-center items-center gap-2 mb-6">
              {[3, 5, 7, 9, 10].map((n) => (
                <div
                  key={n}
                  className="flex flex-col items-center justify-center rounded-xl"
                  style={{
                    width: 44,
                    height: 44,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-divider)',
                    color: getRatingColor(n),
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
          )}

          {/* Photos step visual */}
          {currentStep.id === 'photos' && (
            <div className="flex justify-center gap-3 mb-6">
              <div className="flex flex-col items-center p-3 rounded-xl" style={{ background: 'var(--color-category-strip)' }}>
                <span className="text-2xl mb-1" aria-hidden="true">📸</span>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Snap</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl" style={{ background: 'var(--color-category-strip)' }}>
                <span className="text-2xl mb-1" aria-hidden="true">⬆️</span>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Upload</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl" style={{ background: 'var(--color-category-strip)' }}>
                <span className="text-2xl mb-1" aria-hidden="true">🍽️</span>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Help others</span>
              </div>
            </div>
          )}

          {/* Name input step */}
          {isNameStep ? (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <label htmlFor="welcome-name" className="sr-only">Your name</label>
              <input
                id="welcome-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (saveError) setSaveError(null)
                }}
                placeholder="Your name"
                autoFocus
                autoComplete="nickname"
                autoCapitalize="words"
                enterKeyHint="go"
                maxLength={30}
                disabled={saving}
                className={'w-full px-4 py-4 rounded-xl text-lg text-center ' + INPUT_FOCUS_CLASS + ' disabled:opacity-60'}
                style={{
                  background: 'var(--color-bg)',
                  color: 'var(--color-text-primary)',
                  ...(saveError ? { borderColor: 'var(--color-danger)' } : null),
                }}
              />
              {saveError && (
                <p
                  role="alert"
                  className="text-sm text-center"
                  style={{ color: 'var(--color-danger)' }}
                >
                  {saveError}
                </p>
              )}
              <button
                type="submit"
                disabled={!name.trim() || saving}
                className="w-full px-5 py-3 rounded-xl font-semibold active:scale-[0.98] transition-all"
                style={!name.trim() && !saving
                  ? { background: 'var(--color-surface)', color: 'var(--color-text-tertiary)', fontSize: '15px' }
                  : { background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontSize: '15px', opacity: saving ? 0.7 : 1 }
                }
              >
                {saving ? 'Saving…' : "Let's go!"}
              </button>
              <button
                type="button"
                onClick={handleSkipName}
                disabled={saving}
                className="w-full min-h-[44px] text-sm font-semibold transition-colors"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Skip for now
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              {saveError && (
                <p
                  role="alert"
                  className="text-sm text-center"
                  style={{ color: 'var(--color-danger)' }}
                >
                  {saveError}
                </p>
              )}
              <button
                onClick={handleNext}
                disabled={saving}
                className="w-full px-5 py-3 rounded-xl font-semibold active:scale-[0.98] transition-all"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontSize: '15px', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : isLastStep ? "Let's go!" : 'Next'}
              </button>
              {stepIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="w-full min-h-[44px] text-sm font-semibold transition-colors"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Back
                </button>
              )}
            </div>
          )}

          {/* Fun footer text */}
          {!isNameStep && (
            <p className="mt-6 text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
              {stepIndex === 0 && "Trusted by island food lovers"}
              {stepIndex === 1 && `Dishes need ${MIN_VOTES_FOR_RANKING}+ votes to get ranked`}
              {stepIndex === 2 && "Your photos help everyone eat better"}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
