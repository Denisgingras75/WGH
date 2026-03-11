import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'
import { createClassifiedError } from '../utils/errorHandler'

export const localListsApi = {
  async getForHomepage(viewerId) {
    try {
      const params = viewerId ? { p_viewer_id: viewerId } : {}
      const { data, error } = await supabase.rpc('get_local_lists_for_homepage', params)
      if (error) throw createClassifiedError(error)
      return data || []
    } catch (error) {
      logger.error('Failed to fetch local lists for homepage:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  async getByUser(userId) {
    try {
      const { data, error } = await supabase.rpc('get_local_list_by_user', { target_user_id: userId })
      if (error) throw createClassifiedError(error)
      return data || []
    } catch (error) {
      logger.error('Failed to fetch local list for user:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  async getCuratorInviteDetails(token) {
    try {
      const { data, error } = await supabase.rpc('get_curator_invite_details', { p_token: token })
      if (error) throw createClassifiedError(error)
      return data
    } catch (error) {
      logger.error('Failed to fetch curator invite details:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  async acceptCuratorInvite(token) {
    try {
      const { data, error } = await supabase.rpc('accept_curator_invite', { p_token: token })
      if (error) throw createClassifiedError(error)
      return data
    } catch (error) {
      logger.error('Failed to accept curator invite:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  async getMyList() {
    try {
      const { data, error } = await supabase.rpc('get_my_local_list')
      if (error) throw createClassifiedError(error)
      return data || []
    } catch (error) {
      logger.error('Failed to fetch my local list:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  async saveMyList({ tagline, items }) {
    try {
      const { data, error } = await supabase.rpc('save_my_local_list', {
        p_tagline: tagline || null,
        p_items: JSON.stringify(items),
      })
      if (error) throw createClassifiedError(error)
      return data
    } catch (error) {
      logger.error('Failed to save local list:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },
}
