import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'
import { createClassifiedError } from '../utils/errorHandler'

export const menuImportApi = {
  /**
   * Create or return existing menu import job for a restaurant.
   * @param {string} restaurantId
   * @param {'initial'|'refresh'} [jobType='initial']
   * @returns {Promise<{ job_id: string, job_status: string, is_new: boolean }>}
   */
  async createJob(restaurantId, jobType = 'initial') {
    try {
      const priority = jobType === 'refresh' ? 0 : 10
      const { data, error } = await supabase.rpc('enqueue_menu_import', {
        p_restaurant_id: restaurantId,
        p_job_type: jobType,
        p_priority: priority,
      })
      if (error) throw createClassifiedError(error)
      return data?.[0] ?? null
    } catch (error) {
      logger.error('menuImportApi.createJob:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Get current import job status for a restaurant.
   * @param {string} restaurantId
   * @returns {Promise<{ status: string, dishesFound: number|null, createdAt: string }|null>}
   */
  async getJobStatus(restaurantId) {
    try {
      const { data, error } = await supabase.rpc('get_menu_import_status', {
        p_restaurant_id: restaurantId,
      })
      if (error) throw createClassifiedError(error)
      if (!data || data.length === 0) return null
      const row = data[0]
      return {
        status: row.job_status,
        dishesFound: row.job_dishes_found ?? null,
        createdAt: row.job_created_at ?? null,
      }
    } catch (error) {
      logger.error('menuImportApi.getJobStatus:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },
}
