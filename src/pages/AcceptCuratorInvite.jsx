import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { localListsApi } from '../api/localListsApi'
import { logger } from '../utils/logger'

export function AcceptCuratorInvite() {
  var { token } = useParams()
  var navigate = useNavigate()
  var location = useLocation()
  var { user, loading: authLoading } = useAuth()

  var [invite, setInvite] = useState(null)
  var [loading, setLoading] = useState(true)
  var [accepting, setAccepting] = useState(false)
  var [error, setError] = useState(null)

  useEffect(function () {
    var cancelled = false

    async function fetchInvite() {
      try {
        var details = await localListsApi.getCuratorInviteDetails(token)
        if (cancelled) return
        if (!details.valid) {
          setError(details.error || 'Invalid invite link')
        } else {
          setInvite(details)
        }
      } catch (err) {
        if (cancelled) return
        logger.error('Error fetching curator invite:', err)
        setError('Failed to load invite details')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchInvite()
    return function () { cancelled = true }
  }, [token])

  async function handleAccept() {
    setAccepting(true)
    setError(null)

    try {
      var result = await localListsApi.acceptCuratorInvite(token)
      if (result.success) {
        navigate('/my-list')
      } else {
        setError(result.error || 'Failed to accept invite')
      }
    } catch (err) {
      logger.error('Error accepting curator invite:', err)
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
          style={{ background: 'var(--color-card)', border: 'var(--border-default)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }}
        >
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>😕</div>
          <h1 className="mb-2" style={{ color: 'var(--color-text-primary)', fontSize: '24px', lineHeight: 1.15 }}>
            Invalid Invite
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {error?.message || error}
          </p>
          <button
            onClick={function () { navigate('/') }}
            className="btn px-6 py-3"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', cursor: 'pointer' }}
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
        style={{ background: 'var(--color-card)', border: 'var(--border-default)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }}
      >
        <div
          className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-category-strip)', border: 'var(--border-default)', boxShadow: 'var(--shadow-card)', fontSize: '40px' }}
        >
          🍽️
        </div>
        <h1 className="mb-2" style={{ color: 'var(--color-text-primary)', fontSize: '26px', lineHeight: 1.1 }}>
          Become a Local Curator
        </h1>
        <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          You've been invited to share your
        </p>
        <p
          className="mb-2"
          style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.2 }}
        >
          Top 10 Dishes on Martha's Vineyard
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
          Your picks help visitors discover the best food on the island.
        </p>

        {user ? (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="btn w-full px-6 py-3.5"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontSize: '16px', cursor: accepting ? 'default' : 'pointer' }}
          >
            {accepting ? 'Setting up...' : 'Accept & Build My Top 10'}
          </button>
        ) : (
          <button
            onClick={handleSignIn}
            className="btn w-full px-6 py-3.5"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontSize: '16px', cursor: 'pointer' }}
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
