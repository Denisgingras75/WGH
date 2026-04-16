import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}))

vi.mock('../utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

vi.mock('../lib/rateLimiter', () => ({
  checkPlaylistCreateRateLimit: vi.fn(() => ({ allowed: true, retryAfterMs: null })),
  checkPlaylistItemAddRateLimit: vi.fn(() => ({ allowed: true, retryAfterMs: null })),
  checkPlaylistFollowRateLimit: vi.fn(() => ({ allowed: true, retryAfterMs: null })),
}))

vi.mock('../lib/reviewBlocklist', () => ({
  validateUserContent: vi.fn(() => null),
}))

import { supabase } from '../lib/supabase'
import { userPlaylistsApi } from './userPlaylistsApi'
import { checkPlaylistCreateRateLimit } from '../lib/rateLimiter'
import { validateUserContent } from '../lib/reviewBlocklist'

describe('userPlaylistsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mocks to default (allowed / no block) so tests don't leak state
    checkPlaylistCreateRateLimit.mockReturnValue({ allowed: true, retryAfterMs: null })
    validateUserContent.mockReturnValue(null)
  })

  describe('create', () => {
    it('calls create_user_playlist RPC with correct params', async () => {
      supabase.rpc.mockResolvedValue({
        data: { id: 'pl-1', title: 'Test', is_public: true },
        error: null,
      })

      var result = await userPlaylistsApi.create({ title: 'Test', description: 'Desc', isPublic: true })

      expect(supabase.rpc).toHaveBeenCalledWith('create_user_playlist', {
        p_title: 'Test',
        p_description: 'Desc',
        p_is_public: true,
      })
      expect(result).toEqual({ id: 'pl-1', title: 'Test', is_public: true })
    })

    it('throws when rate limited', async () => {
      checkPlaylistCreateRateLimit.mockReturnValue({ allowed: false, retryAfterMs: 3000 })

      await expect(userPlaylistsApi.create({ title: 'X' })).rejects.toThrow('Too many')
      expect(supabase.rpc).not.toHaveBeenCalled()
    })

    it('validates title via validateUserContent', async () => {
      validateUserContent.mockReturnValue('Title contains blocked content')

      await expect(userPlaylistsApi.create({ title: 'Bad' })).rejects.toThrow('blocked')
      expect(supabase.rpc).not.toHaveBeenCalled()
    })

    it('throws classified error on RPC failure', async () => {
      supabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'DB error', code: '42501' },
      })

      await expect(userPlaylistsApi.create({ title: 'Test' })).rejects.toThrow()
    })
  })

  describe('addDish', () => {
    it('calls add_dish_to_playlist with correct params', async () => {
      supabase.rpc.mockResolvedValue({ data: { id: 'item-1' }, error: null })

      var result = await userPlaylistsApi.addDish('pl-1', 'dish-1', 'try the salsa')

      expect(supabase.rpc).toHaveBeenCalledWith('add_dish_to_playlist', {
        p_playlist_id: 'pl-1',
        p_dish_id: 'dish-1',
        p_note: 'try the salsa',
      })
      expect(result).toEqual({ id: 'item-1' })
    })

    it('validates note content', async () => {
      validateUserContent.mockReturnValue('Note contains blocked content')

      await expect(userPlaylistsApi.addDish('pl-1', 'dish-1', 'bad note')).rejects.toThrow('blocked')
      expect(supabase.rpc).not.toHaveBeenCalled()
    })
  })

  describe('follow', () => {
    it('calls follow_playlist', async () => {
      supabase.rpc.mockResolvedValue({ error: null })

      await userPlaylistsApi.follow('pl-1')

      expect(supabase.rpc).toHaveBeenCalledWith('follow_playlist', { p_playlist_id: 'pl-1' })
    })

    it('throws when rate limited', async () => {
      var { checkPlaylistFollowRateLimit } = await import('../lib/rateLimiter')
      checkPlaylistFollowRateLimit.mockReturnValue({ allowed: false, retryAfterMs: 5000 })

      await expect(userPlaylistsApi.follow('pl-1')).rejects.toThrow('Too many')
    })
  })

  describe('getDetail', () => {
    it('returns first row from get_playlist_detail', async () => {
      supabase.rpc.mockResolvedValue({
        data: [{ playlist_id: 'pl-1', title: 'Test', items: [] }],
        error: null,
      })

      var result = await userPlaylistsApi.getDetail('pl-1')
      expect(result).toEqual({ playlist_id: 'pl-1', title: 'Test', items: [] })
    })

    it('returns null when no rows', async () => {
      supabase.rpc.mockResolvedValue({ data: [], error: null })

      var result = await userPlaylistsApi.getDetail('unknown')
      expect(result).toBeNull()
    })
  })

  describe('remove', () => {
    it('calls delete_user_playlist', async () => {
      supabase.rpc.mockResolvedValue({ error: null })

      await userPlaylistsApi.remove('pl-1')

      expect(supabase.rpc).toHaveBeenCalledWith('delete_user_playlist', { p_id: 'pl-1' })
    })
  })

  describe('reorder', () => {
    it('passes ordered dish IDs to RPC', async () => {
      supabase.rpc.mockResolvedValue({ error: null })

      await userPlaylistsApi.reorder('pl-1', ['d1', 'd2', 'd3'])

      expect(supabase.rpc).toHaveBeenCalledWith('reorder_playlist_items', {
        p_playlist_id: 'pl-1',
        p_ordered_dish_ids: ['d1', 'd2', 'd3'],
      })
    })
  })

  describe('getByUser', () => {
    it('returns array', async () => {
      supabase.rpc.mockResolvedValue({ data: [{ id: 'pl-1' }, { id: 'pl-2' }], error: null })

      var result = await userPlaylistsApi.getByUser('user-1')
      expect(result).toHaveLength(2)
    })

    it('returns empty array on null data', async () => {
      supabase.rpc.mockResolvedValue({ data: null, error: null })

      var result = await userPlaylistsApi.getByUser('user-1')
      expect(result).toEqual([])
    })
  })
})
