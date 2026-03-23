import { supabase } from '../lib/supabase'
import { createClassifiedError } from '../utils/errorHandler'
import { logger } from '../utils/logger'

/**
 * Notifications API
 * All methods throw on error - handle in UI layer
 */
export const notificationsApi = {
  /**
   * Get notifications for current user
   * @param {number} limit - Max results
   * @returns {Promise<Array>}
   * @throws {Error} Not authenticated or API error
   */
  async getNotifications(limit = 20) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw createClassifiedError(error)
      }

      return data || []
    } catch (error) {
      logger.error('Error fetching notifications:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Get unread notification count
   * @returns {Promise<number>}
   * @throws {Error} Not authenticated or API error
   */
  async getUnreadCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) {
        throw createClassifiedError(error)
      }

      return count || 0
    } catch (error) {
      logger.error('Error fetching unread count:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Mark all notifications as read
   * @returns {Promise<void>}
   * @throws {Error} Not authenticated or API error
   */
  async markAllAsRead() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) {
        throw createClassifiedError(error)
      }
    } catch (error) {
      logger.error('Error marking notifications as read:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Delete all notifications for current user
   * @returns {Promise<void>}
   * @throws {Error} Not authenticated or API error
   */
  async deleteAll() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        throw createClassifiedError(error)
      }
    } catch (error) {
      logger.error('Error deleting notifications:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Mark a single notification as read
   * @param {string} notificationId
   * @returns {Promise<void>}
   * @throws {Error} Not authenticated or API error
   */
  async markAsRead(notificationId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) {
        throw createClassifiedError(error)
      }
    } catch (error) {
      logger.error('Error marking notification as read:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },
}
