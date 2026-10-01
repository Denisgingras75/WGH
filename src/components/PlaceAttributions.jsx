/**
 * Renders Google Places third-party attributions that come back from
 * the Place Details response. Google's policy requires these to be
 * displayed when present — they credit the source that contributed
 * data about the place (typically local business directories, etc.).
 *
 * Shape: array of `{ provider: string, url: string | null }`.
 * Silently renders nothing when the array is empty.
 *
 * Reference: https://developers.google.com/maps/documentation/places/web-service/policies
 */
import { sanitizeUrl } from '../utils/sanitize'

export function PlaceAttributions({ attributions, className = '' }) {
  if (!Array.isArray(attributions) || attributions.length === 0) return null

  return (
    <div
      className={className}
      style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}
    >
      {attributions.map((a, i) => {
        var safeUrl = sanitizeUrl(a.url)
        return (
          <span key={`${a.provider}-${i}`}>
            {i > 0 && ', '}
            {safeUrl ? (
              <a
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-accent-gold)' }}
              >
                {a.provider}
              </a>
            ) : (
              <span>{a.provider}</span>
            )}
          </span>
        )
      })}
    </div>
  )
}
