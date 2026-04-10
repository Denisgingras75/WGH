import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { dishPhotosApi } from './dishPhotosApi'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}))

import { supabase } from '../lib/supabase'

describe('Dish Photos API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getPhotosForDish', () => {
    it('should return photos for a dish', async () => {
      const mockPhotos = [
        { id: 'photo-1', photo_url: 'https://example.com/1.jpg' },
        { id: 'photo-2', photo_url: 'https://example.com/2.jpg' },
      ]
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValueOnce({ data: mockPhotos, error: null }),
        })),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect })

      const result = await dishPhotosApi.getPhotosForDish('dish-1')

      expect(result).toEqual(mockPhotos)
      expect(supabase.from).toHaveBeenCalledWith('dish_photos')
    })

    it('should throw on database error', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('Fetch failed') }),
        })),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect })

      await expect(dishPhotosApi.getPhotosForDish('dish-1')).rejects.toThrow()
    })
  })

  describe('getUserPhotoForDish', () => {
    it('should return null if no user is logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

      const result = await dishPhotosApi.getUserPhotoForDish('dish-1')

      expect(result).toBeNull()
    })

    it('should return photo if user has one for dish', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
      })

      const mockPhoto = { id: 'photo-1', photo_url: 'https://example.com/1.jpg' }
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(function() { return this }),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: mockPhoto, error: null }),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect })

      const result = await dishPhotosApi.getUserPhotoForDish('dish-1')

      expect(result).toEqual(mockPhoto)
    })

    it('should throw on database error', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
      })

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(function() { return this }),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('DB error') }),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect })

      await expect(dishPhotosApi.getUserPhotoForDish('dish-1')).rejects.toThrow()
    })
  })

  describe('getFeaturedPhoto', () => {
    it('should return restaurant photo if available', async () => {
      const mockRestaurantPhoto = { id: 'photo-1', source_type: 'restaurant' }
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(function() { return this }),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValueOnce({ data: mockRestaurantPhoto, error: null }),
          })),
        })),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect })

      const result = await dishPhotosApi.getFeaturedPhoto('dish-1')

      expect(result).toEqual(mockRestaurantPhoto)
    })

    it('should return highest quality featured photo if no restaurant photo', async () => {
      // First call - no restaurant photo
      const mockSelect1 = vi.fn(() => ({
        eq: vi.fn(function() { return this }),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
          })),
        })),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect1 })

      // Second call - get featured photo
      const mockFeaturedPhoto = { id: 'photo-2', status: 'featured', quality_score: 85 }
      const mockSelect2 = vi.fn(() => ({
        eq: vi.fn(function() { return this }),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValueOnce({ data: mockFeaturedPhoto, error: null }),
          })),
        })),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect2 })

      const result = await dishPhotosApi.getFeaturedPhoto('dish-1')

      expect(result).toEqual(mockFeaturedPhoto)
    })

    it('should throw on database error', async () => {
      // First call succeeds with null
      const mockSelect1 = vi.fn(() => ({
        eq: vi.fn(function() { return this }),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
          })),
        })),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect1 })

      // Second call fails
      const mockSelect2 = vi.fn(() => ({
        eq: vi.fn(function() { return this }),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('DB error') }),
          })),
        })),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect2 })

      await expect(dishPhotosApi.getFeaturedPhoto('dish-1')).rejects.toThrow()
    })
  })

  describe('getCommunityPhotos', () => {
    it('should return community photos ordered by quality', async () => {
      const mockPhotos = [
        { id: 'photo-1', status: 'community', quality_score: 80 },
        { id: 'photo-2', status: 'community', quality_score: 70 },
      ]
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(function() { return this }),
        order: vi.fn().mockResolvedValueOnce({ data: mockPhotos, error: null }),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect })

      const result = await dishPhotosApi.getCommunityPhotos('dish-1')

      expect(result).toEqual(mockPhotos)
    })

    it('should throw on database error', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(function() { return this }),
        order: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('DB error') }),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect })

      await expect(dishPhotosApi.getCommunityPhotos('dish-1')).rejects.toThrow()
    })
  })

  describe('getPhotoCounts', () => {
    it('should return counts by status', async () => {
      const mockPhotos = [
        { status: 'featured' },
        { status: 'community' },
        { status: 'community' },
        { status: 'hidden' },
      ]
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn().mockResolvedValueOnce({ data: mockPhotos, error: null }),
        })),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect })

      const result = await dishPhotosApi.getPhotoCounts('dish-1')

      expect(result).toEqual({
        featured: 1,
        community: 2,
        hidden: 1,
        total: 4,
      })
    })

    it('should throw on database error', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('DB error') }),
        })),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect })

      await expect(dishPhotosApi.getPhotoCounts('dish-1')).rejects.toThrow()
    })
  })

  describe('getUnratedDishesWithPhotos', () => {
    it('should return empty array if no userId', async () => {
      const result = await dishPhotosApi.getUnratedDishesWithPhotos(null)

      expect(result).toEqual([])
    })

    it('should throw on database error', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('DB error') }),
        })),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect })

      await expect(dishPhotosApi.getUnratedDishesWithPhotos('user-123')).rejects.toThrow()
    })
  })

  describe('uploadPhoto', () => {
    it('should throw for invalid file type', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })

      await expect(
        dishPhotosApi.uploadPhoto({
          dishId: 'dish-1',
          file: invalidFile,
          analysisResults: {},
        })
      ).rejects.toThrow('Invalid file type')
    })

    it('should throw for file too large', async () => {
      // Create a mock file that reports being > 10MB
      const largeFile = new File(['x'.repeat(100)], 'large.jpg', { type: 'image/jpeg' })
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 })

      await expect(
        dishPhotosApi.uploadPhoto({
          dishId: 'dish-1',
          file: largeFile,
          analysisResults: {},
        })
      ).rejects.toThrow('File too large')
    })

    it('should throw if user is not logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } })
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await expect(
        dishPhotosApi.uploadPhoto({
          dishId: 'dish-1',
          file: validFile,
          analysisResults: {},
        })
      ).rejects.toThrow('You must be logged in to upload photos')
    })
  })

  describe('deletePhoto', () => {
    it('should throw if user is not logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

      await expect(dishPhotosApi.deletePhoto('photo-1')).rejects.toThrow('Not authenticated')
    })
  })
})
