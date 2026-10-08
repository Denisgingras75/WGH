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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 mx-auto" style={{ border: '3px solid var(--color-divider)', borderTopColor: 'var(--color-primary)' }} />
          <p className="mt-3 text-sm" style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Loading invite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
        <div
          className="text-center max-w-md w-full px-6 py-8"
          style={{ background: 'var(--color-card)', border: 'var(--border-ink)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-hard)' }}
        >
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-danger)', color: 'var(--color-text-on-primary)', border: 'var(--border-ink)', boxShadow: 'var(--shadow-hard-sm)' }}
          >
            <span className="text-2xl" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>!</span>
          </div>
          <h1 className="mb-2" style={{ color: 'var(--color-text-primary)', fontSize: '24px', lineHeight: 1.15 }}>
            Invalid Invite
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {error?.message || error}
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-ink px-6 py-3"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
      <div
        className="text-center max-w-md w-full px-6 py-8"
        style={{ background: 'var(--color-card)', border: 'var(--border-ink)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-hard)' }}
      >
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-category-strip)', border: 'var(--border-ink)', boxShadow: 'var(--shadow-hard-sm)' }}
        >
          <span className="text-2xl">🏪</span>
        </div>
        <h1 className="mb-2" style={{ color: 'var(--color-text-primary)', fontSize: '24px', lineHeight: 1.15 }}>
          Restaurant Invite
        </h1>
        <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          You've been invited to manage
        </p>
        <p
          className="mb-6"
          style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}
        >
          {invite.restaurant_name}
        </p>

        {user ? (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="btn-ink w-full px-6 py-3.5"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontSize: '16px' }}
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </button>
        ) : (
          <button
            onClick={handleSignIn}
            className="btn-ink w-full px-6 py-3.5"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontSize: '16px' }}
          >
            Sign In to Accept
          </button>
        )}

        <p className="eyebrow mt-4">
          Expires {new Date(invite.expires_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
