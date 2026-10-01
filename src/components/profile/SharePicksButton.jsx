import { useState } from 'react'
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
  var [sharing, setSharing] = useState(false)

  var handleShare = async function () {
    // A second tap while the native sheet opens makes navigator.share throw,
    // which would fall through to clipboard and toast "copied" behind the sheet.
    if (sharing) return
    setSharing(true)
    try {
      var url = window.location.origin + '/user/' + userId
      if (location) {
        url += '?location=' + encodeURIComponent(location)
      }

      var result = await shareOrCopy({
        url: url,
        title: userName ? userName + "'s picks on What's Good Here" : "My picks on What's Good Here",
        text: userName
          ? 'Check out ' + userName + "'s food picks on What's Good Here!"
          : "Check out my food picks on What's Good Here!",
      })

      capture('share_picks', {
        user_id: userId,
        location: location || 'all',
        method: result.method,
        success: result.success,
      })

      if (result.success && result.method !== 'native') {
        toast.success('Link copied!', { duration: 2000 })
      } else if (!result.success && result.method !== 'native') {
        // Native failure = user cancelled the share sheet; no toast for that
        toast.error("Couldn't copy the link")
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={sharing}
      className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 rounded-full font-semibold text-sm transition-all active:scale-[0.98]"
      style={{
        background: 'var(--color-primary)',
        color: 'var(--color-text-on-primary)',
        opacity: sharing ? 0.7 : 1,
      }}
    >
      Share My Picks
    </button>
  )
}
