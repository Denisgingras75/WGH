import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { WghLogo } from '../WghLogo'
import { ThumbsUpIcon } from '../ThumbsUpIcon'
import { ThumbsDownIcon } from '../ThumbsDownIcon'
import { capture } from '../../lib/analytics'

const STEPS = [
  {
    id: 'welcome',
    title: 'Find the best dishes near you',
    subtitle: 'Real ratings from locals & visitors like you',
    description: 'No more guessing. See what\'s actually worth ordering.',
  },
  {
    id: 'how-it-works',
    icon: 'thumbsUp',
    title: 'Vote on dishes you\'ve tried',
    subtitle: 'Good Here or Not Good — it\'s that simple',
    description: 'Rate 1-10, and watch dishes climb the rankings as the community votes.',
  },
  {
    id: 'name',
    emoji: '\uD83D\uDC4B',
    title: 'Enter your name',
    subtitle: 'Join the community',
    description: 'Friends can find you by your name',
  },
]

export function WelcomeModal() {
  const { user } = useAuth()
  const { profile, updateProfile, loading } = useProfile(user?.id)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [phase, setPhase] = useState('onboarding') // 'onboarding' | 'celebration' | 'fade-out'

  // Skip name step if user already set one during signup
  const hasName = profile?.display_name && profile.display_name.trim().length > 0
  const activeSteps = hasName ? STEPS.filter(s => s.id !== 'name') : STEPS

  useEffect(() => {
    if (user && !loading && profile) {
      if (!profile.has_onboarded) {
        setIsOpen(true)
        capture('onboarding_started')
      }
    }
  }, [user, profile, loading])

  const displayName = name.trim() || profile?.display_name || ''

  const completeOnboarding = async (nameSet) => {
    setSaving(true)
    const updates = { has_onboarded: true }
    if (name.trim()) updates.display_name = name.trim()
    await updateProfile(updates)
    capture('onboarding_completed', { name_set: nameSet })
    setSaving(false)

    // Show celebration screen
    setPhase('celebration')

    // Auto-dismiss after 2.5s
    setTimeout(() => setPhase('fade-out'), 2500)
    setTimeout(() => setIsOpen(false), 2800)
  }

  const handleNext = async () => {
    if (step < activeSteps.length - 1) {
      setStep(step + 1)
    } else {
      await completeOnboarding(hasName)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
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
        className="fixed inset-0 z-[100000] flex items-center justify-center p-4"
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
            <WghLogo size={72} />
          </div>

          {/* Brand name */}
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '42px',
              fontWeight: 700,
              color: 'var(--color-primary)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              position: 'relative',
              zIndex: 1,
            }}
          >
            What's Good Here
          </h1>

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
              opacity: 0.7,
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
  const currentStep = activeSteps[step]
  const isNameStep = currentStep.id === 'name'

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm pointer-events-none" />

      {/* Modal */}
      <div
        className="relative z-10 rounded-3xl max-w-md w-full shadow-xl overflow-hidden"
        style={{ animationDelay: '0.1s', background: 'var(--color-text-on-primary)' }}
      >
        {/* Decorative gradient header */}
        <div className="h-2" style={{ background: 'var(--color-primary)' }} />

        <div className="p-8">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {activeSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => i < step && setStep(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === step
                    ? 'w-6'
                    : i < step
                      ? 'cursor-pointer'
                      : ''
                }`}
                style={{
                  background: i === step
                    ? 'var(--color-primary)'
                    : i < step
                      ? 'var(--color-primary-muted, rgba(244, 122, 31, 0.5))'
                      : 'var(--color-divider)'
                }}
                disabled={i > step}
              />
            ))}
          </div>

          {/* Step icon */}
          {currentStep.id === 'welcome' ? (
            <div className="flex justify-center mb-6">
              <WghLogo size={56} />
            </div>
          ) : (
            <div
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg transition-all"
              style={{ background: 'var(--color-primary)' }}
            >
              {currentStep.icon === 'thumbsUp' ? <ThumbsUpIcon size={52} /> : <span className="text-4xl">{currentStep.emoji}</span>}
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
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

          {/* How it works visual */}
          {currentStep.id === 'how-it-works' && (
            <div className="flex justify-center gap-4 mb-6">
              <div className="flex flex-col items-center p-3 rounded-xl" style={{ background: 'rgba(107, 179, 132, 0.15)' }}>
                <span className="text-2xl mb-1"><ThumbsUpIcon size={32} /></span>
                <span className="text-xs font-medium" style={{ color: 'var(--color-rating)' }}>Good Here</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl" style={{ background: 'rgba(232, 102, 60, 0.1)' }}>
                <span className="text-2xl mb-1"><ThumbsDownIcon size={32} /></span>
                <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>Not Good</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                <span className="text-2xl mb-1">⭐</span>
                <span className="text-xs font-medium" style={{ color: 'var(--color-accent-gold)' }}>Rate 1-10</span>
              </div>
            </div>
          )}

          {/* Name input step */}
          {isNameStep ? (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoFocus
                maxLength={50}
                className="w-full px-4 py-4 border-2 rounded-xl text-lg text-center focus:outline-none transition-colors"
                style={{
                  background: 'var(--color-bg)',
                  borderColor: 'var(--color-divider)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <button
                type="submit"
                disabled={!name.trim() || saving}
                className="w-full px-6 py-4 font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
              >
                {saving ? 'Saving...' : "Let's go!"}
              </button>
              <button
                type="button"
                onClick={handleSkipName}
                disabled={saving}
                className="w-full py-2 text-sm transition-colors"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Skip for now
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleNext}
                disabled={saving}
                className="w-full px-6 py-4 font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
              >
                {saving ? 'Saving...' : step === activeSteps.length - 1 ? "Let's go!" : 'Next'}
              </button>
              {step > 0 && (
                <button
                  onClick={handleBack}
                  className="w-full py-2 text-sm transition-colors"
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
              {step === 0 && "Trusted by island food lovers"}
              {step === 1 && "Dishes need 5+ votes to get ranked"}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
