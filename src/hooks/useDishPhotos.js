import { useState, useCallback, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { capture } from '../lib/analytics'
import { dishPhotosApi } from '../api/dishPhotosApi'
import { analyzeImage } from '../utils/imageAnalysis'
import { logger } from '../utils/logger'

/**
 * Hook for managing photo uploads for dishes
 */
export function useDishPhotos() {
  const queryClient = useQueryClient()
  const [analyzing, setAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const progressResetTimerRef = useRef(null)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (progressResetTimerRef.current) {
        clearTimeout(progressResetTimerRef.current)
      }
    }
  }, [])

  const uploadMutation = useMutation({
    mutationFn: ({ dishId, file, analysisResults }) =>
      dishPhotosApi.uploadPhoto({ dishId, file, analysisResults }),
    onSuccess: () => {
      // Invalidate unrated dishes so the count updates
      queryClient.invalidateQueries({ queryKey: ['unratedDishes'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (photoId) => dishPhotosApi.deletePhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unratedDishes'] })
    },
  })

  const uploadPhoto = useCallback(async (dishId, file) => {
    setAnalyzing(true)
    setUploadProgress(0)
    setError(null)

    // Track upload attempt
    capture('photo_upload_attempt', {
      dish_id: dishId,
      file_size_bytes: file.size,
      mime_type: file.type,
    })

    try {
      // Step 1: Analyze the image
      const analysis = await analyzeImage(file)

      // If rejected by quality checks, don't upload
      if (analysis.status === 'rejected') {
        capture('photo_upload_rejected', {
          dish_id: dishId,
          reason: analysis.rejectReason,
          avg_brightness: analysis.avgBrightness,
          dark_pixel_pct: analysis.darkPixelPct,
          bright_pixel_pct: analysis.brightPixelPct,
          width: analysis.width,
          height: analysis.height,
          file_size_bytes: analysis.fileSize,
        })

        setError(analysis.rejectReason)
        return { rejected: true, reason: analysis.rejectReason }
      }

      // Step 2: Upload the photo with analysis results
      setAnalyzing(false)
      setUploadProgress(30)

      const result = await uploadMutation.mutateAsync({
        dishId,
        file,
        analysisResults: analysis,
      })

      // Track accepted upload with full metrics
      capture('photo_upload_accepted', {
        dish_id: dishId,
        status: analysis.status,
        quality_score: analysis.qualityScore,
        avg_brightness: analysis.avgBrightness,
        dark_pixel_pct: analysis.darkPixelPct,
        bright_pixel_pct: analysis.brightPixelPct,
        width: analysis.width,
        height: analysis.height,
        file_size_bytes: analysis.fileSize,
      })

      setUploadProgress(100)
      return { ...result, analysisResults: analysis }
    } catch (err) {
      setError(err.message || 'Failed to upload photo')
      throw err
    } finally {
      setAnalyzing(false)
      // Reset progress after a short delay — clear previous timer to avoid leak
      if (progressResetTimerRef.current) clearTimeout(progressResetTimerRef.current)
      progressResetTimerRef.current = setTimeout(() => setUploadProgress(0), 500)
    }
  }, [uploadMutation])

  const getUserPhotoForDish = useCallback(async (dishId) => {
    try {
      return await dishPhotosApi.getUserPhotoForDish(dishId)
    } catch (err) {
      logger.error('Error getting user photo:', err)
      return null
    }
  }, [])

  const deletePhoto = useCallback(async (photoId) => {
    try {
      await deleteMutation.mutateAsync(photoId)
      return { success: true }
    } catch (err) {
      setError(err.message || 'Failed to delete photo')
      throw err
    }
  }, [deleteMutation])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    uploadPhoto,
    getUserPhotoForDish,
    deletePhoto,
    uploading: uploadMutation.isPending,
    analyzing,
    uploadProgress,
    error,
    clearError,
  }
}
