import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { followsApi } from '../api/followsApi'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { getUserMessage } from '../utils/errorHandler'
import { logger } from '../utils/logger'
import { EmptyState } from './EmptyState'

/**
 * Modal to display followers or following list with pagination
 */
export function FollowListModal({ userId, type, onClose }) {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const isFollowers = type === 'followers'
  const title = isFollowers ? 'Followers' : 'Following'

  // Initial fetch
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      setError(null)
      setUsers([])
      setCursor(null)
      try {
        const result = isFollowers
          ? await followsApi.getFollowers(userId)
          : await followsApi.getFollowing(userId)
        setUsers(result.users)
        setHasMore(result.hasMore)
        if (result.users.length > 0) {
          setCursor(result.users[result.users.length - 1].followed_at)
        }
      } catch (err) {
        logger.error('FollowListModal: fetch failed', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [userId, isFollowers, reloadKey])

  // Load more handler
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return

    setLoadingMore(true)
    try {
      const result = isFollowers
        ? await followsApi.getFollowers(userId, { cursor })
        : await followsApi.getFollowing(userId, { cursor })

      setUsers(prev => [...prev, ...result.users])
      setHasMore(result.hasMore)
      if (result.users.length > 0) {
        setCursor(result.users[result.users.length - 1].followed_at)
      }
    } catch (err) {
      logger.error('FollowListModal: load more failed', err)
      toast.error(getUserMessage(err, 'loading more'))
    } finally {
      setLoadingMore(false)
    }
  }, [userId, isFollowers, cursor, hasMore, loadingMore])

  const handleUserClick = (user) => {
    onClose()
    navigate(`/user/${user.id}`)
  }

  const modalRef = useFocusTrap(true, onClose)

  // Callers mount this conditionally, so useFocusTrap's isOpen never flips to
  // false and its restore never runs. Return focus to the opener on unmount,
  // unless navigation has already removed it from the document.
  useEffect(() => {
    const opener = document.activeElement
    return () => {
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        requestAnimationFrame(() => opener.focus())
      }
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in-up"
      onClick={onClose}
      role="presentation"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.6)' }} aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="follow-list-title"
        className="relative w-full max-w-md rounded-3xl overflow-hidden flex flex-col shadow-xl"
        style={{
          background: 'var(--color-surface-elevated)',
          maxHeight: 'calc(100dvh - 120px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-4 border-b"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          <h2 id="follow-list-title" className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ color: 'var(--color-text-primary)' }}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="animate-pulse" role="status" aria-label="Loading">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-11 h-11 rounded-full" style={{ background: 'var(--color-divider)' }} />
                  <div className="h-4 w-32 rounded" style={{ background: 'var(--color-divider)' }} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-12 px-6 text-center">
              <p role="alert" className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>
                {getUserMessage(error, 'loading ' + title.toLowerCase())}
              </p>
              <button
                type="button"
                onClick={() => setReloadKey(k => k + 1)}
                className="py-3 px-4 rounded-xl font-bold text-sm min-h-[44px] transition-all active:scale-[0.98]"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
              >
                Try again
              </button>
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              emoji={isFollowers ? '👥' : '🔍'}
              title={isFollowers ? 'No followers yet' : 'Not following anyone yet'}
            />
          ) : (
            <div>
              {users.map((user, i) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleUserClick(user)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left active:scale-[0.99]"
                  style={{ borderBottom: i < users.length - 1 ? '1px solid var(--color-divider)' : 'none' }}
                >
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                    style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
                    aria-hidden="true"
                  >
                    {user.display_name?.charAt(0).toUpperCase() || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {user.display_name || 'Anonymous'}
                    </p>
                  </div>

                  {/* Arrow */}
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: 'var(--color-text-tertiary)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="p-4 border-t" style={{ borderColor: 'var(--color-divider)' }}>
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full py-3 min-h-[44px] rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                    style={{
                      background: 'var(--color-primary)',
                      color: 'var(--color-text-on-primary)',
                      opacity: loadingMore ? 0.7 : 1
                    }}
                  >
                    {loadingMore ? 'Loading…' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FollowListModal
