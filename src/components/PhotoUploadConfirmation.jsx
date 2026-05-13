import { useState } from 'react'
import { PHOTO_TIERS } from '../constants/photoQuality'

export function PhotoUploadConfirmation({
  dishName,
  photoUrl,
  status = 'community',
  hasRated = false,
  onRateNow,
  onLater,
}) {
  const [showInfo, setShowInfo] = useState(false)
  const tier = PHOTO_TIERS[status] || PHOTO_TIERS.community

  return (
    <div className="photo-upload-confirmation">
      <div className="photo-preview">
        <img src={photoUrl} alt={dishName} />
        <div className="checkmark">✓</div>
      </div>

      <h3>Photo Added!</h3>

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

      {/* How photos work link */}
      <button
        className="photo-info-link"
        onClick={() => setShowInfo(!showInfo)}
      >
        How photos work {showInfo ? '▲' : '▼'}
      </button>

      {showInfo && (
        <div className="photo-info-content">
          <ul>
            <li>Photos are scored by clarity and shown in the community gallery.</li>
            <li>Everyone can contribute — not all photos are shown the same way.</li>
            <li>Higher-quality photos appear first in the gallery.</li>
          </ul>
        </div>
      )}

      {hasRated ? (
        <>
          {/* User already rated this session — don't re-prompt. */}
          <p className="rate-prompt">Thanks — your rating and photo are in.</p>
          <div className="confirmation-buttons">
            <button
              onClick={onLater}
              className="btn-primary"
            >
              Done
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="rate-prompt">Would you like to rate this dish now?</p>
          <div className="confirmation-buttons">
            <button
              onClick={onRateNow}
              className="btn-primary"
            >
              Rate Now
            </button>
            <button
              onClick={onLater}
              className="btn-secondary"
            >
              Later
            </button>
          </div>
          <p className="hint">
            You can rate this dish anytime from your Profile
          </p>
        </>
      )}
    </div>
  )
}
