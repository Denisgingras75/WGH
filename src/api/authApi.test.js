import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { clearRateLimit } from '../lib/rateLimiter'
import { authApi } from '../api'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signInWithOtp: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(function() { return this }),
        single: vi.fn(),
      })),
    })),
  },
}))

import { supabase } from '../lib/supabase'

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearRateLimit('auth')
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('signInWithGoogle', () => {
    it('should call signInWithOAuth with correct params', async () => {
      supabase.auth.signInWithOAuth.mockResolvedValueOnce({ error: null })

      await authApi.signInWithGoogle()

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
    })

    it('should use same-origin redirect URL if provided', async () => {
      supabase.auth.signInWithOAuth.mockResolvedValueOnce({ error: null })

      await authApi.signInWithGoogle(`${window.location.origin}/callback`)

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      })
    })

    it('should block external redirect URLs', async () => {
      supabase.auth.signInWithOAuth.mockResolvedValueOnce({ error: null })

      await authApi.signInWithGoogle('https://evil-site.com')

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, // Falls back to origin
        },
      })
    })

    it('should throw error if OAuth fails', async () => {
      const error = new Error('OAuth error')
      supabase.auth.signInWithOAuth.mockResolvedValueOnce({ error })

      await expect(authApi.signInWithGoogle()).rejects.toThrow('OAuth error')
    })
  })

  describe('signInWithMagicLink', () => {
    it('should call signInWithOtp with correct params', async () => {
      supabase.auth.signInWithOtp.mockResolvedValueOnce({ error: null })

      await authApi.signInWithMagicLink('user@example.com')

      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'user@example.com',
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
    })

    it('should use same-origin redirect URL if provided', async () => {
      supabase.auth.signInWithOtp.mockResolvedValueOnce({ error: null })

      // Only same-origin URLs are allowed (security: prevents open redirect)
      await authApi.signInWithMagicLink('user@example.com', `${window.location.origin}/callback`)

      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'user@example.com',
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      })
    })

    it('should block external redirect URLs', async () => {
      supabase.auth.signInWithOtp.mockResolvedValueOnce({ error: null })

      // External URLs should be blocked and fall back to origin
      await authApi.signInWithMagicLink('user@example.com', 'https://evil-site.com')

      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'user@example.com',
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
    })

    it('should throw error if OTP fails', async () => {
      const error = new Error('OTP error')
      supabase.auth.signInWithOtp.mockResolvedValueOnce({ error })

      await expect(authApi.signInWithMagicLink('user@example.com')).rejects.toThrow('OTP error')
    })
  })

  describe('getUserVoteForDish', () => {
    it('should return null if no user ID', async () => {
      const result = await authApi.getUserVoteForDish('dish-1', null)
      expect(result).toBeNull()
    })

    it('should fetch user vote successfully', async () => {
      const mockVote = { rating_10: 8, review_text: null, review_created_at: null }
      const selectFn = vi.fn((fields) => {
        // Ensure binary vote field is not projected any more.
        expect(fields).not.toMatch(/would_order_again/)
        return {
          eq: vi.fn(function() { return this }),
          maybeSingle: vi.fn().mockResolvedValueOnce({ data: mockVote, error: null }),
        }
      })

      supabase.from.mockReturnValueOnce({ select: selectFn })

      const result = await authApi.getUserVoteForDish('dish-1', 'user-1')

      expect(result).toEqual(mockVote)
    })

    it('should return null if vote not found', async () => {
      const selectFn = vi.fn(() => ({
        eq: vi.fn(function() { return this }),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
      }))

      supabase.from.mockReturnValueOnce({ select: selectFn })

      const result = await authApi.getUserVoteForDish('dish-1', 'user-1')

      expect(result).toBeNull()
    })
  })
})
