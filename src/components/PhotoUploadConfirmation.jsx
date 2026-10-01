import { useState, useId } from 'react'
import { PHOTO_TIERS } from '../constants/photoQuality'

export function PhotoUploadConfirmation({
  dishName,
  photoUrl,
  status = 'community',
  onRateNow,
  onLater,
}) {
  const [showInfo, setShowInfo] = useState(false)
  const infoId = useId()
  const tier = PHOTO_TIERS[status] || PHOTO_TIERS.community

  return (
    <div className="photo-upload-confirmation">
      <div className="photo-preview">
        <img src={photoUrl} alt={dishName} />
        <div className="checkmark" aria-hidden="true">✓</div>
      </div>

      <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
        Photo Added!
      </h2>

      {/* Tier badge */}
      <div
        className="photo-tier-badge"
        style={{ '--tier-color': tier.color }}
      >
        <span className="tier-icon">{tier.icon}</span>
        <span className="tier-label">{tier.label}</span>
      </div>

      {/* Tier explanation */}
      <p className="tier-description">{tier.uploadDescription}</p>

      {/* Tip for hidden photos */}
      {status === 'hidden' && tier.tip && (
        <p className="tier-tip">{tier.tip}</p>
      )}

      {/* How photos work disclosure */}
      <button
        type="button"
        className="photo-info-link inline-flex items-center min-h-[44px]"
        onClick={() => setShowInfo(!showInfo)}
        aria-expanded={showInfo}
        aria-controls={infoId}
      >
        How photos work&nbsp;<span aria-hidden="true">{showInfo ? '▲' : '▼'}</span>
      </button>

      {showInfo && (
        <div id={infoId} className="photo-info-content">
          <ul>
            <li>Photos are scored by clarity and shown in the community gallery.</li>
            <li>Everyone can contribute — not all photos are shown the same way.</li>
            <li>Higher-quality photos appear first in the gallery.</li>
          </ul>
        </div>
      )}

      <p className="rate-prompt">Would you like to rate this dish now?</p>

      <div className="flex gap-3 mb-3">
        <button
          type="button"
          onClick={onLater}
          className="flex-1 py-3 px-5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98]"
          style={{
            background: 'transparent',
            border: '1px solid var(--color-divider)',
            color: 'var(--color-text-primary)',
          }}
        >
          Later
        </button>
        <button
          type="button"
          onClick={onRateNow}
          className="flex-1 py-3 px-5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98]"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-text-on-primary)',
          }}
        >
          Rate Now
        </button>
      </div>

      <p className="hint">
        You can rate this dish anytime from your Profile
      </p>
    </div>
  )
}
