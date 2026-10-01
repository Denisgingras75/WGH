import { useNavigate } from 'react-router-dom'
import { AMATIC_TITLE } from '../constants/styles'

const BACK_ICON_PATH = 'M15.75 19.5 8.25 12l7.5-7.5'

/**
 * BackButton — the 44px surface-elevated "Go back" icon button (style contract §4/§6).
 *
 * Props:
 *   onClick   - back handler (required)
 *   label     - accessible name (default "Go back")
 *   className - extra classes, e.g. positioning over a hero
 */
export function BackButton({ onClick, label = 'Go back', className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95' + (className ? ' ' + className : '')}
      style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)' }}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={BACK_ICON_PATH} />
      </svg>
    </button>
  )
}

/**
 * PageHeader — sticky detail header for sub-pages and standalone pages (style contract §6):
 * back button, Amatic title block (truncated) with an optional 13px meta line, trailing actions.
 *
 * Props:
 *   title      - page title. Omit for a back-only header.
 *   meta       - optional tertiary line under the title
 *   titleAs    - 'h1' (default) | 'p' / 'div' when the page's single h1 lives further down (hero)
 *   titleSize  - 28 (default, detail pages) | 32 (top-level / restaurant header)
 *   titleAside - inline element right after the title (e.g. a TrustBadge)
 *   children   - extra content inside the title block, under the meta line (e.g. score row)
 *   actions    - trailing icon buttons / controls
 *   below      - full-width content under the header row (search field, filter chips)
 *   onBack     - custom back handler. Default: history back, else navigate(backTo)
 *   backLabel  - accessible name for the back button (default "Go back")
 *   backTo     - fallback route when there is no history (default '/')
 *   standalone - page renders outside <Layout>: pad for the top safe-area inset
 *   contained  - constrain the row to the max-w-2xl content column
 */
export function PageHeader({
  title,
  meta,
  titleAs = 'h1',
  titleSize = 28,
  titleAside = null,
  children,
  actions = null,
  below = null,
  onBack,
  backLabel,
  backTo = '/',
  standalone = false,
  contained = false,
}) {
  const navigate = useNavigate()
  const handleBack = onBack || (() => (window.history.length > 1 ? navigate(-1) : navigate(backTo)))
  const TitleTag = titleAs
  const hasTitleBlock = title != null || children != null
  const titleNode = title != null && (
    <TitleTag className="truncate min-w-0" style={{ ...AMATIC_TITLE, fontSize: titleSize + 'px' }}>
      {title}
    </TitleTag>
  )

  return (
    <header
      className="sticky top-0 z-20 px-4 py-3"
      style={{
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-divider)',
        ...(standalone ? { paddingTop: 'calc(12px + env(safe-area-inset-top))' } : null),
      }}
    >
      <div className={contained ? 'max-w-2xl mx-auto' : undefined}>
        <div className="flex items-center gap-3">
          <BackButton onClick={handleBack} label={backLabel} />
          {hasTitleBlock && (
            <div className="min-w-0 flex-1">
              {titleAside ? (
                <div className="flex items-center gap-2 min-w-0">
                  {titleNode}
                  {titleAside}
                </div>
              ) : titleNode}
              {meta != null && meta !== '' && (
                <p className="truncate" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                  {meta}
                </p>
              )}
              {children}
            </div>
          )}
          {actions && (
            <div className={'flex items-center gap-1 flex-shrink-0' + (hasTitleBlock ? '' : ' ml-auto')}>
              {actions}
            </div>
          )}
        </div>
        {below}
      </div>
    </header>
  )
}

export default PageHeader
