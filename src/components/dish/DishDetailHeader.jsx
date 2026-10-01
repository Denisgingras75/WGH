import { HearingIcon } from '../HearingIcon'
import { EarIconTooltip } from '../EarIconTooltip'
import { PageHeader } from '../PageHeader'

const ICON_BUTTON = 'w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95'

/**
 * Sticky detail header for the Dish page: back, title block, and dish actions.
 * With no `dish` (loading / error states) it renders just the back button.
 * `onReport` is optional — omit it to hide the report button.
 */
export function DishDetailHeader({
  dish,
  onBack,
  onShare,
  isFavorite,
  onToggleFavorite,
  showEarTooltip,
  onDismissEarTooltip,
  onAddToList,
  onReport,
}) {
  // Title block is a <p>, not a heading: the hero h1 is the page's single h1
  return (
    <PageHeader
      title={dish ? dish.dish_name : null}
      titleAs="p"
      meta={dish ? dish.restaurant_name : null}
      onBack={onBack}
      actions={dish && (
        <>
          <button
            type="button"
            onClick={onShare}
            aria-label="Share dish"
            className={ICON_BUTTON}
            style={{ color: 'var(--color-text-primary)' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (showEarTooltip) onDismissEarTooltip()
                onToggleFavorite()
              }}
              aria-label={isFavorite ? 'Remove from heard list' : 'Mark as heard it was good'}
              className={ICON_BUTTON}
            >
              <HearingIcon size={24} active={isFavorite} />
            </button>
            <EarIconTooltip visible={showEarTooltip} onDismiss={onDismissEarTooltip} />
          </div>
          <button
            type="button"
            onClick={onAddToList}
            aria-label="Add to playlist"
            className={ICON_BUTTON}
            style={{ color: 'var(--color-text-primary)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          {onReport && (
            <button
              type="button"
              onClick={onReport}
              aria-label="Report this dish"
              className={ICON_BUTTON}
              style={{ color: 'var(--color-text-primary)' }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
          )}
        </>
      )}
    />
  )
}
