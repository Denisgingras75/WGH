import { useState } from 'react'
import { toast } from 'sonner'
import { useMyLocalList } from '../hooks/useMyLocalList'
import { ReviewFlow } from './ReviewFlow'
import { logger } from '../utils/logger'

/**
 * AddToTop10Button — curator-only affordance to append a dish to the curator's
 * Top 10 (local list) from anywhere a dish appears (dish page, restaurant tab).
 *
 * Renders nothing for non-curators / logged-out users, so it's safe to drop
 * next to any dish. The rate-first gate is enforced on the server
 * (add_dish_to_my_local_list); when the server reports the dish is unrated we
 * open an inline rate sheet and finish the add automatically once a number
 * is in — no dead-end error.
 *
 * Props:
 *   dish    - dish object (needs dish_id|id, dish_name|name, restaurant_name, category)
 *   variant - 'icon' (compact square, e.g. dish-page header) | 'chip' (full-width row)
 */
export function AddToTop10Button({ dish, variant = 'chip' }) {
  const { isCurator, listDishIds, isFull, addDish, adding } = useMyLocalList()
  const [pendingRate, setPendingRate] = useState(false)

  // Not a curator (or logged out) — feature is invisible.
  if (!isCurator) return null

  const dishId = dish.dish_id || dish.id
  const dishName = dish.dish_name || dish.name
  const onList = listDishIds.indexOf(dishId) !== -1

  async function attemptAdd() {
    try {
      const result = await addDish(dishId)
      if (result && result.success) {
        toast.success('Added to your Top 10', { duration: 2000 })
        return
      }
      const code = result && result.code
      if (code === 'not_rated') {
        setPendingRate(true)
        toast('Rate it first to add it', { duration: 2500 })
      } else if (code === 'full') {
        toast('Your Top 10 is full — remove one in My Top 10 first', { duration: 3000 })
      } else if (code === 'duplicate') {
        toast('Already on your Top 10', { duration: 2000 })
      } else {
        toast.error((result && result.error) || 'Could not add to your Top 10', { duration: 3000 })
      }
    } catch (err) {
      logger.error('Add to Top 10 failed:', err)
      toast.error(err?.message || 'Could not add to your Top 10', { duration: 3000 })
    }
  }

  async function handleClick(e) {
    e.stopPropagation()
    e.preventDefault()
    if (onList || isFull || adding) return
    await attemptAdd()
  }

  // After the inline rating lands, the server gate is satisfied — finish the add.
  async function handleRated() {
    setPendingRate(false)
    await attemptAdd()
  }

  const rateSheet = pendingRate ? (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) setPendingRate(false) }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Rate this dish to add it"
        className="w-full rounded-t-2xl"
        style={{ background: 'var(--color-surface)', padding: '8px 16px 24px', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, background: 'var(--color-divider)', borderRadius: 2, margin: '8px auto 16px' }} />
        <div style={{ marginBottom: '4px', fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
          Rate it to add it
        </div>
        <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
          {dishName}{dish.restaurant_name ? ' · ' + dish.restaurant_name : ''}
        </div>
        <ReviewFlow
          dishId={dishId}
          dishName={dishName}
          category={dish.category}
          onVote={handleRated}
          onLoginRequired={() => setPendingRate(false)}
        />
      </div>
    </div>
  ) : null

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={onList || isFull || adding}
          aria-label={onList ? 'On your Top 10' : 'Add to my Top 10'}
          title={onList ? 'On your Top 10' : isFull ? 'Your Top 10 is full' : 'Add to my Top 10'}
          className="h-9 rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95"
          style={{
            padding: '0 10px',
            background: onList ? 'var(--color-primary)' : 'var(--color-surface-elevated)',
            border: '1.5px solid var(--color-primary)',
            color: onList ? '#fff' : 'var(--color-primary)',
            fontSize: 13,
            fontWeight: 700,
            opacity: (isFull && !onList) ? 0.5 : 1,
            cursor: (onList || isFull) ? 'default' : 'pointer',
          }}
        >
          {onList ? '✓ Top 10' : '＋ Top 10'}
        </button>
        {rateSheet}
      </>
    )
  }

  // 'chip' variant — subtle full-width row, rendered under a dish in lists.
  return (
    <>
      <button
        onClick={handleClick}
        disabled={onList || isFull || adding}
        className="w-full flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
        style={{
          padding: '7px',
          marginTop: '4px',
          borderRadius: '8px',
          background: 'transparent',
          border: '1px dashed ' + (onList ? 'var(--color-divider)' : 'var(--color-primary)'),
          color: onList ? 'var(--color-text-tertiary)' : 'var(--color-primary)',
          fontSize: 12,
          fontWeight: 700,
          opacity: (isFull && !onList) ? 0.5 : 1,
          cursor: (onList || isFull) ? 'default' : 'pointer',
        }}
      >
        {onList ? '✓ On your Top 10' : adding ? 'Adding…' : isFull ? 'Top 10 full' : '＋ Add to my Top 10'}
      </button>
      {rateSheet}
    </>
  )
}
