import { useRef } from 'react'
import { useDishPhotos } from '../hooks/useDishPhotos'
import { useAuth } from '../context/AuthContext'
import { CameraIcon } from './CameraIcon'

export function PhotoUploadButton({
  dishId,
  onPhotoUploaded,
  onLoginRequired,
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
    // Clear the input up front so the same file can be re-picked after a
    // rejection ("Try again"). The File object stays valid after clearing.
    e.target.value = ''
    if (!file) return

    clearError()

    try {
      const result = await uploadPhoto(dishId, file)

      // If rejected by quality checks, error is set in the hook
      if (result?.rejected) return

      onPhotoUploaded?.(result)
    } catch {
      // Error is already set in the hook
    }
  }

  const isProcessing = analyzing || uploading

  const getButtonText = () => {
    if (analyzing) return 'Checking photo…'
    if (uploading) return `Uploading… ${uploadProgress}%`
    return 'Add Photo'
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
      >
        {isProcessing ? <span className="upload-spinner" /> : <CameraIcon size={18} />}
        <span aria-live="polite">{getButtonText()}</span>
      </button>

      {error && (
        <div className="photo-upload-error-container">
          <p role="alert" className="photo-upload-error">{error}</p>
          <button
            onClick={handleClick}
            className="photo-upload-retry-btn tap-target"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
