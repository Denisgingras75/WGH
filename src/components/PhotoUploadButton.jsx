import { useRef } from 'react'
import { useDishPhotos } from '../hooks/useDishPhotos'
import { useAuth } from '../context/AuthContext'
import { CameraIcon } from './CameraIcon'

export function PhotoUploadButton({
  dishId,
  onPhotoUploaded,
  onLoginRequired,
  compact = false,
  label,
}) {
  const fileInputRef = useRef(null)
  const { user } = useAuth()
  const { uploadPhoto, uploading, analyzing, uploadProgress, error, clearError } = useDishPhotos()

  const handleClick = () => {
    if (!user) {
      onLoginRequired?.()
      return
    }
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    clearError()

    try {
      const result = await uploadPhoto(dishId, file)

      // If rejected by quality checks, error is set in the hook
      if (result?.rejected) {
        // Error already displayed via the hook's error state
        return
      }

      onPhotoUploaded?.(result)
    } catch {
      // Error is already set in the hook
    }

    // Clear the input so the same file can be selected again
    e.target.value = ''
  }

  const isProcessing = analyzing || uploading

  if (compact) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
                    onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          onClick={handleClick}
          disabled={isProcessing}
          className="photo-upload-btn-compact tap-target"
          style={{
            background: 'var(--color-card)',
            border: 'var(--border-ink)',
            boxShadow: 'var(--shadow-hard-sm)',
            color: 'var(--color-ink)',
          }}
          title="Add photo"
          aria-label="Add photo"
        >
          {isProcessing ? (
            <span className="upload-spinner" />
          ) : (
            <CameraIcon size={18} />
          )}
        </button>
      </>
    )
  }

  const getButtonText = () => {
    if (analyzing) return 'Checking photo quality...'
    if (uploading) return `Uploading... ${uploadProgress}%`
    return label || 'Add Photo'
  }

  return (
    <div className="photo-upload-container">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
                onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <button
        onClick={handleClick}
        disabled={isProcessing}
        className="photo-upload-btn tap-target"
        style={{
          background: 'var(--color-surface)',
          border: '2px dashed var(--color-text-tertiary)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--color-ink)',
          fontWeight: 700,
        }}
      >
        {isProcessing ? (
          <>
            <span className="upload-spinner" />
            <span>{getButtonText()}</span>
          </>
        ) : (
          <>
            <CameraIcon size={18} />
            <span>{label || 'Add Photo'}</span>
          </>
        )}
      </button>

      {error && (
        <div className="photo-upload-error-container">
          <p className="photo-upload-error" style={{ fontWeight: 600 }}>{error?.message || error}</p>
          <button
            onClick={handleClick}
            className="photo-upload-retry-btn tap-target"
            style={{
              background: 'var(--color-card)',
              border: 'var(--border-ink-thin)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--color-ink)',
              fontWeight: 700,
            }}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
