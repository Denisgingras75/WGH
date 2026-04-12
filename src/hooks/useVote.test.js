import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVote } from '../hooks/useVote'
import { votesApi } from '../api/votesApi'

// Mock the API - must match the import path in useVote.js
vi.mock('../api/votesApi', () => ({
  votesApi: {
    submitVote: vi.fn(),
    getUserVotes: vi.fn(),
    deleteVote: vi.fn(),
  },
}))

describe('useVote Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('submitVote', () => {
    it('calls votesApi.submitVote with positional args minus wouldOrderAgain', async () => {
      votesApi.submitVote.mockResolvedValueOnce({ success: true })

      const { result } = renderHook(() => useVote())

      let response
      await act(async () => {
        response = await result.current.submitVote('dish-1', 8.5, 'great review', null, null, null, null)
      })

      expect(response.success).toBe(true)
      expect(votesApi.submitVote).toHaveBeenCalledWith({
        dishId: 'dish-1',
        rating10: 8.5,
        reviewText: 'great review',
        purityData: null,
        jitterData: null,
        jitterScore: null,
        badgeHash: null,
      })
    })

    it('should handle vote submission errors', async () => {
      const error = new Error('Not authenticated')
      votesApi.submitVote.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useVote())

      let response
      await act(async () => {
        response = await result.current.submitVote('dish-1', 8)
      })

      expect(response.success).toBe(false)
      expect(response.error).toBe('Not authenticated')
      expect(result.current.error).toBe('Not authenticated')
    })

    it('should set submitting state correctly', async () => {
      // Use a deferred promise so we can control when the API resolves
      let resolveApi
      const apiPromise = new Promise(resolve => {
        resolveApi = () => resolve({ success: true })
      })
      votesApi.submitVote.mockReturnValueOnce(apiPromise)

      const { result } = renderHook(() => useVote())

      expect(result.current.submitting).toBe(false)

      // Start the submission but don't await it yet
      let submitPromise
      act(() => {
        submitPromise = result.current.submitVote('dish-1', 8)
      })

      // Now submitting should be true (API hasn't resolved yet)
      expect(result.current.submitting).toBe(true)

      // Resolve the API and wait for the submission to complete
      await act(async () => {
        resolveApi()
        await submitPromise
      })

      // After the promise resolves, submitting should be false
      expect(result.current.submitting).toBe(false)
    })

    it('should handle votes without an explicit rating', async () => {
      votesApi.submitVote.mockResolvedValueOnce({ success: true })

      const { result } = renderHook(() => useVote())

      await act(async () => {
        await result.current.submitVote('dish-1')
      })

      expect(votesApi.submitVote).toHaveBeenCalledWith({
        dishId: 'dish-1',
        rating10: undefined,
        reviewText: null,
        purityData: null,
        jitterData: null,
        jitterScore: null,
        badgeHash: null,
      })
    })
  })

  describe('getUserVotes', () => {
    it('should fetch user votes successfully', async () => {
      const mockVotes = {
        'dish-1': { wouldOrderAgain: true, rating10: 8 },
        'dish-2': { wouldOrderAgain: false, rating10: 4 },
      }
      votesApi.getUserVotes.mockResolvedValueOnce(mockVotes)

      const { result } = renderHook(() => useVote())

      let votes
      await act(async () => {
        votes = await result.current.getUserVotes()
      })

      expect(votes).toEqual(mockVotes)
      expect(votesApi.getUserVotes).toHaveBeenCalled()
    })

    it('should return empty object on error', async () => {
      votesApi.getUserVotes.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useVote())

      let votes
      await act(async () => {
        votes = await result.current.getUserVotes()
      })

      expect(votes).toEqual({})
    })
  })
})
