// Full-screen state screens for the Rate Your Meal flow.
import { AMATIC_TITLE, PRIMARY_BUTTON_CLASS, PRIMARY_BUTTON_STYLE, SECONDARY_BUTTON_CLASS, SECONDARY_BUTTON_STYLE } from '../../constants/styles'

var titleStyle = { ...AMATIC_TITLE, fontSize: '32px' }

var cardStyle = {
  background: 'var(--color-surface-elevated)',
  border: '1px solid var(--color-divider)',
}

function StateScreen({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 text-center" style={cardStyle}>
        {children}
      </div>
    </div>
  )
}

export function RateMealSignIn({ onBack, onSignIn }) {
  return (
    <StateScreen>
      <h1 style={titleStyle}>Sign in to Rate Your Meal</h1>
      <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
        This flow saves a vote for each dish you ate.
      </p>
      <div className="flex gap-3 mt-5">
        <button
          type="button"
          onClick={onBack}
          className={'flex-1 ' + SECONDARY_BUTTON_CLASS}
          style={SECONDARY_BUTTON_STYLE}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSignIn}
          className={'flex-1 ' + PRIMARY_BUTTON_CLASS}
          style={PRIMARY_BUTTON_STYLE}
        >
          Sign In
        </button>
      </div>
    </StateScreen>
  )
}

export function RateMealNoMenu({ onBack }) {
  return (
    <StateScreen>
      <h1 style={titleStyle}>No Menu Yet</h1>
      <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
        This restaurant needs dishes before the batch flow can start.
      </p>
      <button
        type="button"
        onClick={onBack}
        className={'mt-5 ' + PRIMARY_BUTTON_CLASS}
        style={PRIMARY_BUTTON_STYLE}
      >
        Back to Restaurant
      </button>
    </StateScreen>
  )
}

export function RateMealSuccess({ successCount, restaurantName, onDone }) {
  return (
    <StateScreen>
      <div
        className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
        style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
        aria-hidden="true"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
      <h1 className="mt-5" style={titleStyle}>Meal Rated</h1>
      <p className="text-base font-semibold mt-2" style={{ color: 'var(--color-text-primary)' }}>
        Rated {successCount} dish{successCount === 1 ? '' : 'es'} at {restaurantName}
      </p>
      <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
        Every dish was saved as its own vote.
      </p>
      <button
        type="button"
        onClick={onDone}
        className={'mt-6 w-full ' + PRIMARY_BUTTON_CLASS}
        style={PRIMARY_BUTTON_STYLE}
      >
        Back to Restaurant
      </button>
    </StateScreen>
  )
}
