import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { adminApi } from '../api'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}))

import { supabase } from '../lib/supabase'

describe('Admin API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('isAdmin', () => {
    it('should return false if no user is logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

      const result = await adminApi.isAdmin()

      expect(result).toBe(false)
    })

    it('should return true if user is in admins table', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
      })

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValueOnce({ data: { id: 'admin-1' }, error: null }),
        })),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect })

      const result = await adminApi.isAdmin()

      expect(result).toBe(true)
      expect(supabase.from).toHaveBeenCalledWith('admins')
    })

    it('should return false if user is not in admins table', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
      })

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
        })),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect })

      const result = await adminApi.isAdmin()

      expect(result).toBe(false)
    })

    it('should return false on database error', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
      })

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: { code: 'OTHER_ERROR' } }),
        })),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect })

      const result = await adminApi.isAdmin()

      expect(result).toBe(false)
    })
  })

  describe('addDish', () => {
    it('should insert dish with correct params', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
      })
      const mockInsert = vi.fn(() => ({
        select: vi.fn().mockResolvedValueOnce({
          data: [{ id: 'dish-1', name: 'Test Dish' }],
          error: null,
        }),
      }))
      supabase.from.mockReturnValueOnce({ insert: mockInsert })

      const result = await adminApi.addDish({
        restaurantId: 'rest-1',
        name: 'Test Dish',
        category: 'burger',
        price: 12.99,
        photoUrl: 'https://example.com/photo.jpg',
      })

      expect(result).toEqual({ id: 'dish-1', name: 'Test Dish' })
      expect(supabase.from).toHaveBeenCalledWith('dishes')
      expect(mockInsert).toHaveBeenCalledWith({
        restaurant_id: 'rest-1',
        name: 'Test Dish',
        category: 'burger',
        price: 12.99,
        photo_url: 'https://example.com/photo.jpg',
        created_by: 'user-123',
      })
    })

    it('should throw on database error', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
      })
      const mockInsert = vi.fn(() => ({
        select: vi.fn().mockResolvedValueOnce({
          data: null,
          error: new Error('Insert failed'),
        }),
      }))
      supabase.from.mockReturnValueOnce({ insert: mockInsert })

      await expect(
        adminApi.addDish({
          restaurantId: 'rest-1',
          name: 'Test Dish',
          category: 'burger',
        })
      ).rejects.toThrow()
    })
  })

  describe('deleteDish', () => {
    it('should delete dish by id', async () => {
      const mockDelete = vi.fn(() => ({
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      }))
      supabase.from.mockReturnValueOnce({ delete: mockDelete })

      const result = await adminApi.deleteDish('dish-1')

      expect(result).toEqual({ success: true })
      expect(supabase.from).toHaveBeenCalledWith('dishes')
    })

    it('should throw on database error', async () => {
      const mockDelete = vi.fn(() => ({
        eq: vi.fn().mockResolvedValueOnce({ error: new Error('Delete failed') }),
      }))
      supabase.from.mockReturnValueOnce({ delete: mockDelete })

      await expect(adminApi.deleteDish('dish-1')).rejects.toThrow()
    })
  })

  describe('updateDish', () => {
    it('should update dish with correct params', async () => {
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn().mockResolvedValueOnce({
            data: [{ id: 'dish-1', name: 'Updated Dish' }],
            error: null,
          }),
        })),
      }))
      supabase.from.mockReturnValueOnce({ update: mockUpdate })

      const result = await adminApi.updateDish('dish-1', {
        restaurantId: 'rest-1',
        name: 'Updated Dish',
        category: 'pizza',
        price: 15.99,
        photoUrl: null,
      })

      expect(result).toEqual({ id: 'dish-1', name: 'Updated Dish' })
      expect(supabase.from).toHaveBeenCalledWith('dishes')
    })

    it('should throw on database error', async () => {
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn().mockResolvedValueOnce({
            data: null,
            error: new Error('Update failed'),
          }),
        })),
      }))
      supabase.from.mockReturnValueOnce({ update: mockUpdate })

      await expect(
        adminApi.updateDish('dish-1', {
          restaurantId: 'rest-1',
          name: 'Test',
          category: 'burger',
        })
      ).rejects.toThrow()
    })
  })

  describe('searchDishes', () => {
    it('should return empty array for empty query', async () => {
      const result = await adminApi.searchDishes('')

      expect(result).toEqual([])
      expect(supabase.from).not.toHaveBeenCalled()
    })

    it('should search dishes by name', async () => {
      const mockDishes = [
        { id: 'dish-1', name: 'Burger', restaurants: { name: 'Joes' } },
      ]
      const mockSelect = vi.fn(() => ({
        ilike: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValueOnce({ data: mockDishes, error: null }),
          })),
        })),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect })

      const result = await adminApi.searchDishes('burg')

      expect(result).toEqual(mockDishes)
      expect(supabase.from).toHaveBeenCalledWith('dishes')
    })

    it('should throw on database error', async () => {
      const mockSelect = vi.fn(() => ({
        ilike: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('Search failed') }),
          })),
        })),
      }))
      supabase.from.mockReturnValueOnce({ select: mockSelect })

      await expect(adminApi.searchDishes('test')).rejects.toThrow()
    })
  })
})
