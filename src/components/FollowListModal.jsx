import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { followsApi } from '../api/followsApi'
import { useFocusTrap } from '../hooks/useFocusTrap'

// Rotating avatar inks for initials
const AVATAR_COLORS = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-ink)', 'var(--color-rating)']

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
      } catch {
        setError('Unable to load. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [userId, isFollowers])

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
    } catch {
      // Silently fail on load more - user can retry
    } finally {
      setLoadingMore(false)
    }
  }, [userId, isFollowers, cursor, hasMore, loadingMore])

  const handleUserClick = (user) => {
    onClose()
    navigate(`/user/${user.id}`)
  }

  const modalRef = useFocusTrap(true, onClose)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: 'rgba(27, 22, 17, 0.55)' }} aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="follow-list-title"
        className="relative w-full max-w-md overflow-hidden flex flex-col"
        style={{
          background: 'var(--color-card)',
          maxHeight: 'calc(100vh - 120px)',
          border: 'var(--border-ink)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-hard-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            borderBottom: 'var(--border-ink)',
            background: 'var(--color-card)'
          }}
        >
          <h2 id="follow-list-title" style={{ fontSize: '22px', lineHeight: 1.1, color: 'var(--color-text-primary)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95"
            style={{ color: 'var(--color-ink)', background: 'var(--color-card)', border: 'var(--border-ink)', boxShadow: 'var(--shadow-hard-sm)' }}
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12" role="status" aria-label="Loading">
              <div
                className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--color-divider)', borderTopColor: 'var(--color-primary)' }}
                aria-hidden="true"
              />
              <span className="sr-only">Loading...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-2">⚠️</div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                {error}
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-2">
                {isFollowers ? '👥' : '🔍'}
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                {isFollowers ? 'No followers yet' : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            <div>
              <div>
                {users.map((user, i) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className="w-full flex items-center gap-3 px-5 py-3 transition-all text-left active:scale-[0.99]"
                    style={{ borderBottom: i < users.length - 1 ? '1.5px solid var(--color-divider)' : 'none' }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                        color: 'var(--color-text-on-primary)',
                        border: 'var(--border-ink)',
                        fontFamily: 'var(--font-display)',
                        fontSize: '18px',
                        fontWeight: 800,
                      }}
                    >
                      {user.display_name?.charAt(0).toUpperCase() || '?'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
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
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="p-4" style={{ borderTop: '1.5px solid var(--color-divider)' }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="btn-ink w-full py-2.5 text-sm"
                    style={{
                      background: 'var(--color-primary)',
                      color: 'var(--color-text-on-primary)',
                    }}
                  >
                    {loadingMore ? (
                      <span className="flex items-center justify-center gap-2">
                        <div
                          className="w-4 h-4 border-2 rounded-full animate-spin"
                          style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: 'var(--color-text-on-primary)' }}
                        />
                        Loading...
                      </span>
                    ) : (
                      'Load More'
                    )}
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
