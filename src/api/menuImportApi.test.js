import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}))

vi.mock('../utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import { menuImportApi } from './menuImportApi'

describe('menuImportApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createJob', () => {
    it('calls enqueue_menu_import RPC with correct params', async () => {
      supabase.rpc.mockResolvedValue({
        data: [{ job_id: 'job-123', job_status: 'pending', is_new: true }],
        error: null,
      })

      const result = await menuImportApi.createJob('rest-456', 'initial')

      expect(supabase.rpc).toHaveBeenCalledWith('enqueue_menu_import', {
        p_restaurant_id: 'rest-456',
        p_job_type: 'initial',
        p_priority: 10,
      })
      expect(result).toEqual({ job_id: 'job-123', job_status: 'pending', is_new: true })
    })

    it('uses priority 0 for refresh jobs', async () => {
      supabase.rpc.mockResolvedValue({
        data: [{ job_id: 'job-789', job_status: 'pending', is_new: true }],
        error: null,
      })

      await menuImportApi.createJob('rest-456', 'refresh')

      expect(supabase.rpc).toHaveBeenCalledWith('enqueue_menu_import', {
        p_restaurant_id: 'rest-456',
        p_job_type: 'refresh',
        p_priority: 0,
      })
    })

    it('returns existing job when duplicate', async () => {
      supabase.rpc.mockResolvedValue({
        data: [{ job_id: 'existing-job', job_status: 'processing', is_new: false }],
        error: null,
      })

      const result = await menuImportApi.createJob('rest-456')
      expect(result.is_new).toBe(false)
      expect(result.job_status).toBe('processing')
    })

    it('throws classified error on RPC failure', async () => {
      supabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'connection refused' },
      })

      await expect(menuImportApi.createJob('rest-456')).rejects.toThrow()
    })
  })

  describe('getJobStatus', () => {
    it('calls get_menu_import_status RPC', async () => {
      supabase.rpc.mockResolvedValue({
        data: [{ job_status: 'completed', job_dishes_found: 12, job_created_at: '2026-04-09T00:00:00Z' }],
        error: null,
      })

      const result = await menuImportApi.getJobStatus('rest-456')

      expect(supabase.rpc).toHaveBeenCalledWith('get_menu_import_status', {
        p_restaurant_id: 'rest-456',
      })
      expect(result).toEqual({
        status: 'completed',
        dishesFound: 12,
        createdAt: '2026-04-09T00:00:00Z',
      })
    })

    it('returns null when no job exists', async () => {
      supabase.rpc.mockResolvedValue({ data: [], error: null })

      const result = await menuImportApi.getJobStatus('rest-456')
      expect(result).toBeNull()
    })
  })
})
