import { useState } from 'react'
import { PHOTO_TIERS } from '../constants/photoQuality'

export function PhotoUploadConfirmation({
  dishName,
  photoUrl,
  status = 'community',
  onRateNow,
  onLater,
}) {
  const [showInfo, setShowInfo] = useState(false)
  const tier = PHOTO_TIERS[status] || PHOTO_TIERS.community

  return (
    <div className="photo-upload-confirmation">
      <div
        className="photo-preview"
        style={{
          border: 'var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <img src={photoUrl} alt={dishName} />
        <div
          className="checkmark"
          style={{
            background: 'var(--color-success)',
            color: 'var(--color-text-on-primary)',
            border: 'var(--border-subtle)',
            fontWeight: 600,
          }}
        >
          ✓
        </div>
      </div>

      <h3 style={{ fontSize: '22px', fontWeight: 600 }}>Photo Added!</h3>

      {/* Tier badge */}
      <div
        className="photo-tier-badge"
        style={{
          '--tier-color': tier.color,
          background: status === 'featured' ? 'var(--color-highlight)' : 'var(--color-card)',
          border: 'var(--border-subtle)',
          borderRadius: 'var(--radius-pill)',
        }}
      >
        <span className="tier-icon">{tier.icon}</span>
        <span className="tier-label" style={{ color: 'var(--color-ink)', fontWeight: 600 }}>{tier.label}</span>
      </div>

      {/* Tier explanation */}
      <p className="tier-description">{tier.uploadDescription}</p>

      {/* Tip for hidden photos */}
      {status === 'hidden' && tier.tip && (
        <p
          className="tier-tip"
          style={{ border: '1.5px solid var(--color-primary)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}
        >
          {tier.tip}
        </p>
      )}

      {/* How photos work link */}
      <button
        className="photo-info-link"
        style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }}
        onClick={() => setShowInfo(!showInfo)}
      >
        How photos work {showInfo ? '▲' : '▼'}
      </button>

      {showInfo && (
        <div
          className="photo-info-content"
          style={{ border: '1px dashed var(--color-divider-strong)', borderRadius: 'var(--radius-md)' }}
        >
          <ul>
            <li>Photos are scored by clarity and shown in the community gallery.</li>
            <li>Everyone can contribute — not all photos are shown the same way.</li>
            <li>Higher-quality photos appear first in the gallery.</li>
          </ul>
        </div>
      )}

      <p className="rate-prompt" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>Would you like to rate this dish now?</p>

      <div className="confirmation-buttons">
        <button
          onClick={onRateNow}
          className="btn px-6 py-2.5 text-sm"
          style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
        >
          Rate Now
        </button>
        <button
          onClick={onLater}
          className="btn px-6 py-2.5 text-sm"
          style={{ background: 'var(--color-card)', color: 'var(--color-ink)' }}
        >
          Later
        </button>
      </div>

      <p className="hint">
        You can rate this dish anytime from your Profile
      </p>
    </div>
  )
}
