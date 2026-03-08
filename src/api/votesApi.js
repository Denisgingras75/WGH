import { supabase } from '../lib/supabase'
import { capture } from '../lib/analytics'
import { checkVoteRateLimit } from '../lib/rateLimiter'
import { containsBlockedContent } from '../lib/reviewBlocklist'
import { MAX_REVIEW_LENGTH } from '../constants/app'
import { createClassifiedError } from '../utils/errorHandler'
import { logger } from '../utils/logger'
import { jitterApi } from './jitterApi'

/**
 * Votes API - Centralized data fetching and mutation for votes
 */

export const votesApi = {
  /**
   * Submit or update a vote for a dish
   * @param {Object} params
   * @param {string} params.dishId - Dish ID
   * @param {boolean} params.wouldOrderAgain - Vote value
   * @param {number} params.rating10 - Optional 1-10 rating
   * @param {string} params.reviewText - Optional review text (max 200 chars)
   * @returns {Promise<Object>} Success status
   */
  async submitVote({ dishId, wouldOrderAgain, rating10 = null, reviewText = null, purityData = null, jitterData = null, jitterScore = null, badgeHash = null }) {
    // Quick client-side check first (better UX)
      const clientRateLimit = checkVoteRateLimit()
      if (!clientRateLimit.allowed) {
        throw new Error(clientRateLimit.message)
      }

      // Validate review text if provided
      if (reviewText) {
        // Check length
        if (reviewText.length > MAX_REVIEW_LENGTH) {
          throw new Error(`Review is ${reviewText.length - MAX_REVIEW_LENGTH} characters over limit`)
        }
        // Check for blocked content
        if (containsBlockedContent(reviewText)) {
          throw new Error('Review contains inappropriate content. Please revise.')
        }
      }

      // Treat empty string as no review
      const cleanReviewText = reviewText?.trim() || null

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in to vote')
      }

      // Server-side rate limit check (authoritative)
      const { data: serverRateLimit, error: rateLimitError } = await supabase
        .rpc('check_vote_rate_limit')

      if (rateLimitError) {
        // SECURITY: Fail closed - if rate limit check fails, block the vote
        logger.error('Vote rate limit check failed:', rateLimitError)
        throw new Error('Unable to verify vote limit. Please try again.')
      } else if (serverRateLimit && !serverRateLimit.allowed) {
        throw new Error(serverRateLimit.message || 'Too many votes. Please wait.')
      }

      // Upsert vote with all fields
      const voteData = {
        dish_id: dishId,
        user_id: user.id,
        would_order_again: wouldOrderAgain,
        rating_10: rating10,
      }

      // Only include review fields if there's a review
      if (cleanReviewText) {
        voteData.review_text = cleanReviewText
        voteData.review_created_at = new Date().toISOString()
      }

      // Attach purity score if available (silent anti-spam metric)
      if (purityData && purityData.purity != null) {
        voteData.purity_score = purityData.purity
      }

      // Attach WAR score and badge hash from attestation
      if (jitterScore && jitterScore.score != null) {
        voteData.war_score = jitterScore.score
      }
      if (badgeHash) {
        voteData.badge_hash = badgeHash
      }

      const { error } = await supabase
        .from('votes')
        .upsert(voteData, {
          onConflict: 'dish_id,user_id',
        })

      if (error) {
        throw createClassifiedError(error)
      }

      // Submit jitter profile data if available
      if (jitterData) {
        try {
          const sampleRow = {
            user_id: user.id,
            sample_data: jitterData,
          }
          if (jitterScore) {
            sampleRow.liveness_score = jitterScore.score
            sampleRow.flags = jitterScore.flags
          }
          await supabase.from('jitter_samples').insert(sampleRow)
        } catch (jitterErr) {
          // Jitter submission is non-critical -- log but don't fail the vote
          logger.warn('Jitter sample submission failed:', jitterErr)
        }
      }

      capture('vote_submitted', {
        dish_id: dishId,
        would_order_again: wouldOrderAgain,
        rating: rating10,
        has_review: !!cleanReviewText,
      })

      return { success: true }
  },

  /**
   * Get all votes for the current user
   * @returns {Promise<Object>} Map of dish IDs to vote data
   */
  async getUserVotes() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return {}
      }

      const { data, error } = await supabase
        .from('votes')
        .select('dish_id, would_order_again, rating_10')
        .eq('user_id', user.id)

      if (error) {
        throw createClassifiedError(error)
      }

      // Return as a map for easy lookup
      return (data || []).reduce((acc, vote) => {
        acc[vote.dish_id] = {
          wouldOrderAgain: vote.would_order_again,
          rating10: vote.rating_10,
        }
        return acc
      }, {})
    } catch (error) {
      logger.error('Error fetching user votes:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Get detailed votes for a user with dish and restaurant info
   * Limited to most recent 500 votes for performance
   * @param {string} userId - User ID
   * @param {number} limit - Max votes to fetch (default 500)
   * @returns {Promise<Array>} Array of votes with dish details
   */
  async getDetailedVotesForUser(userId, limit = 500) {
    try {
      if (!userId) {
        return []
      }

      const { data, error } = await supabase
        .from('votes')
        .select(`
          id,
          would_order_again,
          rating_10,
          created_at,
          dishes (
            id,
            name,
            category,
            price,
            photo_url,
            avg_rating,
            total_votes,
            restaurants (name, town)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw createClassifiedError(error)
      }

      return data || []
    } catch (error) {
      logger.error('Error fetching detailed votes:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Delete a vote for a dish
   * @param {string} dishId - Dish ID
   * @returns {Promise<Object>} Success status
   */
  async deleteVote(dishId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('dish_id', dishId)
        .eq('user_id', user.id)

      if (error) {
        throw createClassifiedError(error)
      }

      return { success: true }
    } catch (error) {
      logger.error('Error deleting vote:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Get count of ranked dishes (5+ votes) that a user has voted on
   * Uses dishes.total_votes instead of counting votes table (O(1) vs O(n))
   * @param {string} userId - User ID
   * @returns {Promise<number>} Count of dishes helped rank
   */
  async getDishesHelpedRank(userId) {
    try {
      if (!userId) {
        return 0
      }

      // Single query: get user's votes with dish total_votes via JOIN
      const { data, error } = await supabase
        .from('votes')
        .select('dish_id, dishes(total_votes)')
        .eq('user_id', userId)

      if (error) throw createClassifiedError(error)
      if (!data?.length) return 0

      // Count dishes with 5+ votes (using pre-computed total_votes)
      const rankedCount = data.filter(v => (v.dishes?.total_votes || 0) >= 5).length
      return rankedCount
    } catch (error) {
      logger.error('Error getting dishes helped rank:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Get all reviews for a dish with user info
   * @param {string} dishId - Dish ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Array>} Array of reviews with user info
   */
  async getReviewsForDish(dishId, { limit = 10, offset = 0 } = {}) {
    try {
      // Fetch reviews (votes.user_id -> auth.users, not profiles, so no direct join)
      const { data, error } = await supabase
        .from('votes')
        .select(`
          id,
          review_text,
          rating_10,
          would_order_again,
          review_created_at,
          user_id,
          source,
          source_metadata,
          war_score,
          badge_hash
        `)
        .eq('dish_id', dishId)
        .not('review_text', 'is', null)
        .neq('review_text', '')
        .order('review_created_at', { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1)

      if (error) {
        logger.error('Error fetching reviews for dish:', error)
        return [] // Graceful degradation
      }

      if (!data?.length) return []

      // Enrich with profile display names
      const userIds = [...new Set(data.map(v => v.user_id).filter(Boolean))]
      const { data: profiles } = userIds.length
        ? await supabase.from('profiles').select('id, display_name').in('id', userIds)
        : { data: [] }
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))

      // Fetch jitter badge data via RPC (restricts exposed columns — no biometric data)
      let jitterMap = {}
      if (userIds.length > 0) {
        const { data: jitterData } = await supabase
          .rpc('get_jitter_badges', { p_user_ids: userIds })

        if (jitterData) {
          for (const j of jitterData) {
            jitterMap[j.user_id] = j
          }
        }
      }

      // Enrich reviews with profiles and trust badges
      const attestBase = import.meta.env.VITE_JITTER_ATTEST_URL
      const verifyBase = attestBase ? attestBase.replace('/attest', '/verify') : null

      return data.map(review => ({
        ...review,
        profiles: profileMap[review.user_id] || { id: review.user_id, display_name: null },
        trust_badge: review.source === 'ai_estimated'
          ? 'ai_estimated'
          : jitterApi.getTrustBadgeType(jitterMap[review.user_id] || null),
        jitter_profile: jitterMap[review.user_id] || null,
        verify_url: review.badge_hash && verifyBase
          ? verifyBase + '?hash=' + review.badge_hash
          : null,
      }))
    } catch (error) {
      logger.error('Error fetching reviews for dish:', error)
      return [] // Graceful degradation - don't break the UI
    }
  },

  /**
   * Get smart snippet for a dish (best review to show on card)
   * Priority: 9+ rated reviews first, then most recent
   * @param {string} dishId - Dish ID
   * @returns {Promise<Object|null>} Best review or null
   */
  async getSmartSnippetForDish(dishId) {
    try {
      // Fetch best review (no direct FK from votes -> profiles)
      const { data, error } = await supabase
        .from('votes')
        .select(`
          review_text,
          rating_10,
          review_created_at,
          user_id
        `)
        .eq('dish_id', dishId)
        .not('review_text', 'is', null)
        .neq('review_text', '')
        .order('rating_10', { ascending: false, nullsFirst: false })
        .order('review_created_at', { ascending: false, nullsFirst: false })
        .limit(1)

      if (error) {
        logger.error('Error fetching smart snippet:', error)
        return null // Graceful degradation
      }

      const review = data?.[0]
      if (!review) return null

      // Enrich with profile display name
      if (review.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name')
          .eq('id', review.user_id)
          .maybeSingle()
        review.profiles = profile || { id: review.user_id, display_name: null }
      }

      return review
    } catch (error) {
      logger.error('Error fetching smart snippet:', error)
      return null // Graceful degradation - don't break the UI
    }
  },

  /**
   * Get community averages for a set of dishes
   * @param {string[]} dishIds - Array of dish IDs
   * @returns {Promise<Object>} Map of dish ID to { avg, count }
   */
  async getCommunityAvgsForDishes(dishIds) {
    try {
      if (!dishIds || dishIds.length === 0) return {}

      const { data, error } = await supabase
        .from('votes')
        .select('dish_id, rating_10')
        .in('dish_id', dishIds)
        .not('rating_10', 'is', null)

      if (error) {
        throw createClassifiedError(error)
      }

      // Aggregate client-side: group by dish_id, compute avg and count
      const grouped = {}
      for (const row of (data || [])) {
        if (!grouped[row.dish_id]) {
          grouped[row.dish_id] = { sum: 0, count: 0 }
        }
        grouped[row.dish_id].sum += row.rating_10
        grouped[row.dish_id].count += 1
      }

      const result = {}
      for (const [dishId, { sum, count }] of Object.entries(grouped)) {
        result[dishId] = { avg: sum / count, count }
      }
      return result
    } catch (error) {
      logger.error('Error fetching community averages:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Get all reviews written by a user with dish info
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Array>} Array of reviews with dish info
   */
  /**
   * Get current user's ratings for specific dishes (for comparison on other profiles)
   * @param {string[]} dishIds - Array of dish IDs
   * @returns {Promise<Object>} Map of dish ID to rating_10
   */
  async getMyRatingsForDishes(dishIds) {
    try {
      if (!dishIds || dishIds.length === 0) return {}

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return {}

      const { data, error } = await supabase
        .from('votes')
        .select('dish_id, rating_10')
        .eq('user_id', user.id)
        .in('dish_id', dishIds)

      if (error) throw createClassifiedError(error)

      const ratingsMap = {}
      ;(data || []).forEach(v => { ratingsMap[v.dish_id] = v.rating_10 })
      return ratingsMap
    } catch (error) {
      logger.error('Error fetching my ratings for dishes:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  async getReviewsForUser(userId, { limit = 20, offset = 0 } = {}) {
    try {
      if (!userId) {
        return []
      }

      const { data, error } = await supabase
        .from('votes')
        .select(`
          id,
          review_text,
          rating_10,
          would_order_again,
          review_created_at,
          dish_id,
          dishes (
            id,
            name,
            photo_url,
            category,
            price,
            restaurants (name, town)
          )
        `)
        .eq('user_id', userId)
        .not('review_text', 'is', null)
        .neq('review_text', '')
        .order('review_created_at', { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1)

      if (error) {
        logger.error('Error fetching reviews for user:', error)
        return []
      }

      return data || []
    } catch (error) {
      logger.error('Error fetching reviews for user:', error)
      return []
    }
  },
}
