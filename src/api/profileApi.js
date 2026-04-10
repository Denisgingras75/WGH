import { supabase } from '../lib/supabase'
import { createClassifiedError } from '../utils/errorHandler'
import { validateUserContent } from '../lib/reviewBlocklist'
import { logger } from '../utils/logger'

/**
 * Profile API - Centralized data fetching and mutation for user profiles
 */

export const profileApi = {
  /**
   * Get a user's profile by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Profile object or null
   */
  async getProfile(userId) {
    try {
      if (!userId) {
        return null
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        throw createClassifiedError(error)
      }

      return data
    } catch (error) {
      logger.error('Error fetching profile:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Create a new profile for current authenticated user
   * @param {string} displayName - Display name (optional)
   * @returns {Promise<Object>} Created profile object
   */
  async createProfile(displayName = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in to create a profile')
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          display_name: displayName,
          has_onboarded: false,
        })
        .select()
        .single()

      if (error) {
        throw createClassifiedError(error)
      }

      return data
    } catch (error) {
      logger.error('Error creating profile:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Update current authenticated user's profile
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated profile object
   */
  async updateProfile(updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in to update your profile')
      }

      // Validate display name against content blocklist
      if (updates.display_name) {
        const contentError = validateUserContent(updates.display_name, 'Display name')
        if (contentError) throw new Error(contentError)
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        throw createClassifiedError(error)
      }

      return data
    } catch (error) {
      logger.error('Error updating profile:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Get per-category taste stats for a user (bias relative to consensus).
   * Uses the existing get_badge_evaluation_stats RPC which returns categoryStats.
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of { category, total_ratings, consensus_ratings, bias }
   */
  async getTasteStats(userId) {
    try {
      if (!userId) return []

      const { data, error } = await supabase.rpc('get_badge_evaluation_stats', {
        p_user_id: userId,
      })

      if (error) throw createClassifiedError(error)

      return data?.categoryStats || []
    } catch (error) {
      logger.error('Error fetching taste stats:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Get user's overall rating bias (deviation from consensus).
   * @param {string} userId - User ID
   * @returns {Promise<Object>} { ratingBias, biasLabel, votesWithConsensus }
   */
  async getRatingBias(userId) {
    try {
      if (!userId) return { ratingBias: 0, biasLabel: 'New Voter', votesWithConsensus: 0 }

      const { data, error } = await supabase.rpc('get_user_rating_identity', {
        target_user_id: userId,
      })

      if (error) throw createClassifiedError(error)

      const row = data?.[0] || data
      return {
        ratingBias: row?.rating_bias ?? 0,
        biasLabel: row?.bias_label ?? 'New Voter',
        votesWithConsensus: row?.votes_with_consensus ?? 0,
      }
    } catch (error) {
      logger.error('Error fetching rating bias:', error)
      return { ratingBias: 0, biasLabel: 'New Voter', votesWithConsensus: 0 }
    }
  },

  /**
   * Get or create a profile for current authenticated user
   * @returns {Promise<Object>} Profile object
   */
  async getOrCreateProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return null
      }

      // Try to get existing profile
      const existing = await this.getProfile(user.id)
      if (existing) {
        return existing
      }

      // For OAuth users (Google), use their provider name as default display_name
      // This lets WelcomeModal skip the name step for Google sign-ins
      const providerName = user.user_metadata?.full_name
        || user.user_metadata?.name
        || null
      return await this.createProfile(providerName)
    } catch (error) {
      logger.error('Error getting or creating profile:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },
}
