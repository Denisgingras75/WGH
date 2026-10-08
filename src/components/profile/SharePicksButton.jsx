import { shareOrCopy } from '../../utils/share'
import { capture } from '../../lib/analytics'
import { toast } from 'sonner'

/**
 * SharePicksButton — generates a location-filtered profile link and shares it.
 *
 * Props:
 *   userId   - current user's ID
 *   userName - display name for share text
 *   location - optional location slug for filtering (e.g. 'marthas-vineyard')
 */
export function SharePicksButton({ userId, userName, location }) {
  var handleShare = async function () {
    var url = window.location.origin + '/user/' + userId
    if (location) {
      url += '?location=' + encodeURIComponent(location)
    }

    var result = await shareOrCopy({
      url: url,
      title: (userName || 'My') + "'s picks on What's Good Here",
      text: 'Check out ' + (userName || 'my') + "'s food picks on What's Good Here!",
    })

    capture('share_picks', {
      user_id: userId,
      location: location || 'all',
      method: result.method,
      success: result.success,
    })

    if (result.success && result.method !== 'native') {
      toast.success('Link copied!', { duration: 2000 })
    }
  }

  return (
    <button
      onClick={handleShare}
      className="btn-ink px-6 py-2.5"
      style={{
        background: 'var(--color-primary)',
        color: 'var(--color-text-on-primary)',
        fontSize: '15px',
        fontWeight: 800,
      }}
    >
      Share My Picks
    </button>
  )
}
