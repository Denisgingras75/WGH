import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { restaurantManagerApi } from '../api/restaurantManagerApi'
import { logger } from '../utils/logger'

export function AcceptInvite() {
  const { token } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()

  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState(null)

  // Fetch invite details on mount
  useEffect(() => {
    let cancelled = false

    async function fetchInvite() {
      try {
        const details = await restaurantManagerApi.getInviteDetails(token)
        if (cancelled) return
        if (!details.valid) {
          setError(details.error || 'Invalid invite link')
        } else {
          setInvite(details)
        }
      } catch (err) {
        if (cancelled) return
        logger.error('Error fetching invite:', err)
        setError('Failed to load invite details')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchInvite()
    return () => { cancelled = true }
  }, [token])

  async function handleAccept() {
    setAccepting(true)
    setError(null)

    try {
      const result = await restaurantManagerApi.acceptInvite(token)
      if (result.success) {
        navigate('/manage')
      } else {
        setError(result.error || 'Failed to accept invite')
      }
    } catch (err) {
      logger.error('Error accepting invite:', err)
      setError(err.message || 'Failed to accept invite')
    } finally {
      setAccepting(false)
    }
  }

  function handleSignIn() {
    navigate('/login', { state: { from: location } })
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--color-primary)' }} />
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Loading invite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-danger) 20%, var(--color-bg))' }}>
            <span className="text-2xl">!</span>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-headline)' }}>
            Invalid Invite
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            {error?.message || error}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 font-semibold"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-primary)', borderRadius: '4px' }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-primary) 20%, var(--color-bg))' }}>
          <span className="text-2xl">🏪</span>
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-headline)' }}>
          Restaurant Invite
        </h1>
        <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          You've been invited to manage
        </p>
        <p className="text-lg font-bold mb-6" style={{ color: 'var(--color-primary)' }}>
          {invite.restaurant_name}
        </p>

        {user ? (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full px-6 py-3 font-semibold transition-all disabled:opacity-50"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-primary)', borderRadius: '4px' }}
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </button>
        ) : (
          <button
            onClick={handleSignIn}
            className="w-full px-6 py-3 font-semibold transition-all"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-primary)', borderRadius: '4px' }}
          >
            Sign In to Accept
          </button>
        )}

        <p className="mt-4 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Expires {new Date(invite.expires_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
