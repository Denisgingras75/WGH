import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { restaurantManagerApi } from '../api/restaurantManagerApi'
import { logger } from '../utils/logger'
import { getUserMessage } from '../utils/errorHandler'
import { InviteShell } from '../components/InviteShell'
import { AMATIC_TITLE, PRIMARY_BUTTON_CLASS, PRIMARY_BUTTON_STYLE } from '../constants/styles'

const headingStyle = { ...AMATIC_TITLE, fontSize: '32px' }

export function AcceptInvite() {
  const { token } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()

  const [accepting, setAccepting] = useState(false)
  // Accept-time failure that makes the invite unusable (used / expired / not found)
  const [inviteError, setInviteError] = useState(null)
  // Transient accept failure — shown inline so the user can retry
  const [acceptError, setAcceptError] = useState(null)

  const { data: invite, isLoading, isFetching, error: loadError, refetch } = useQuery({
    queryKey: ['restaurantInvite', token],
    queryFn: () => restaurantManagerApi.getInviteDetails(token),
    enabled: !!token,
  })

  async function handleAccept() {
    setAccepting(true)
    setAcceptError(null)

    try {
      const result = await restaurantManagerApi.acceptInvite(token)
      if (result?.success) {
        // replace: the token is now consumed, so Back shouldn't land on "Invite already used"
        navigate('/manage', { replace: true })
      } else if (result?.error === 'Not authenticated') {
        setAcceptError('Your session expired. Please sign in again.')
      } else {
        setInviteError(result?.error || 'Failed to accept invite')
      }
    } catch (err) {
      logger.error('Error accepting invite:', err)
      setAcceptError(getUserMessage(err, 'accepting the invite'))
    } finally {
      setAccepting(false)
    }
  }

  function handleSignIn() {
    navigate('/login', { state: { from: location } })
  }

  if (isLoading || authLoading) {
    return (
      <InviteShell>
        <div role="status" aria-label="Loading invite">
          <div
            className="spinner mx-auto"
            aria-hidden="true"
          />
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Loading invite…</p>
        </div>
      </InviteShell>
    )
  }

  if (loadError && !invite) {
    return (
      <InviteShell>
        <div aria-hidden="true" style={{ fontSize: '40px', marginBottom: '16px' }}>😕</div>
        <h1 className="mb-2" style={headingStyle}>
          Couldn't load invite
        </h1>
        <p role="alert" className="text-sm mb-6" style={{ color: 'var(--color-danger)' }}>
          {getUserMessage(loadError, 'loading this invite')}
        </p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className={'w-full ' + PRIMARY_BUTTON_CLASS}
          style={{ ...PRIMARY_BUTTON_STYLE, opacity: isFetching ? 0.7 : 1 }}
        >
          {isFetching ? 'Loading…' : 'Try again'}
        </button>
      </InviteShell>
    )
  }

  if (inviteError || !invite?.valid) {
    return (
      <InviteShell>
        <div aria-hidden="true" style={{ fontSize: '40px', marginBottom: '16px' }}>😕</div>
        <h1 className="mb-2" style={headingStyle}>
          Invalid Invite
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {inviteError || invite?.error || 'Invalid invite link'}
        </p>
        <button
          onClick={() => navigate('/')}
          className={'w-full ' + PRIMARY_BUTTON_CLASS}
          style={PRIMARY_BUTTON_STYLE}
        >
          Go Home
        </button>
      </InviteShell>
    )
  }

  return (
    <InviteShell>
      <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(var(--color-primary-rgb), 0.2)' }}>
        <span className="text-2xl" aria-hidden="true">🏪</span>
      </div>
      <h1 className="mb-2" style={headingStyle}>
        Restaurant Invite
      </h1>
      <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
        You've been invited to manage
      </p>
      <p className="text-lg font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
        {invite.restaurant_name}
      </p>

      {user ? (
        <button
          onClick={handleAccept}
          disabled={accepting}
          className={'w-full ' + PRIMARY_BUTTON_CLASS}
          style={{ ...PRIMARY_BUTTON_STYLE, opacity: accepting ? 0.7 : 1 }}
        >
          {accepting ? 'Accepting…' : 'Accept Invitation'}
        </button>
      ) : (
        <button
          onClick={handleSignIn}
          className={'w-full ' + PRIMARY_BUTTON_CLASS}
          style={PRIMARY_BUTTON_STYLE}
        >
          Sign In to Accept
        </button>
      )}

      {acceptError && (
        <p role="alert" className="text-sm mt-3" style={{ color: 'var(--color-danger)' }}>
          {acceptError}
        </p>
      )}

      <p className="mt-4 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        Expires {new Date(invite.expires_at).toLocaleDateString()}
      </p>
    </InviteShell>
  )
}
