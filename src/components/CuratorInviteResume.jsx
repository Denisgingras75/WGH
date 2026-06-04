import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { localListsApi } from '../api/localListsApi'
import { getStorageItem, removeStorageItem, STORAGE_KEYS } from '../lib/storage'
import { logger } from '../utils/logger'

/**
 * Resumes a pending curator invite after authentication.
 *
 * The mint (curator invite) link sends logged-out users through signup. The
 * email-verification round-trip drops `location.state`, so after verifying +
 * signing in the user used to land on the homepage with no way back to the
 * invite — the link looked "broken." We stash the token before redirecting and
 * accept it here once a user is present, wherever they land, then drop them in
 * their Top 10 builder. Mounted once inside the router.
 */
export function CuratorInviteResume() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const handledRef = useRef(false)

  useEffect(() => {
    if (!user || handledRef.current) return
    const token = getStorageItem(STORAGE_KEYS.PENDING_CURATOR_TOKEN)
    if (!token) return

    handledRef.current = true
    removeStorageItem(STORAGE_KEYS.PENDING_CURATOR_TOKEN)

    localListsApi.acceptCuratorInvite(token)
      .then((result) => {
        // Success, or already accepted by this same user — either way they're a
        // curator now, so take them to their list.
        if (result?.success || (result?.error && /already used/i.test(result.error))) {
          toast.success('You’re a local curator — build your Top 10', { duration: 3000 })
          navigate('/my-list')
        } else if (result?.error) {
          toast.error(result.error, { duration: 4000 })
        }
      })
      .catch((err) => {
        logger.error('Failed to resume curator invite:', err)
      })
  }, [user, navigate])

  return null
}
