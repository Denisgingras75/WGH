import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'
import { createClassifiedError } from '../utils/errorHandler'

/**
 * Favorites API - Centralized data fetching and mutation for saved dishes
 * SECURITY: All methods use auth.getUser() internally - never trust userId from caller
 */

export const favoritesApi = {
  /**
   * Get favorite dish IDs for current authenticated user
   * @returns {Promise<Array>} Array of dish IDs
   */
  async getFavoriteIds() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return []
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('dish_id')
        .eq('user_id', user.id)

      if (error) {
        throw createClassifiedError(error)
      }

      return (data || []).map(f => f.dish_id)
    } catch (error) {
      logger.error('Error fetching favorite IDs:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Add a dish to favorites for current authenticated user
   * @param {string} dishId - Dish ID
   * @returns {Promise<Object>} Success status
   */
  async addFavorite(dishId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in to save favorites')
      }

      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, dish_id: dishId })

      if (error) {
        // Handle duplicate gracefully
        if (error.code === '23505') {
          return { success: true } // Already favorited
        }
        throw createClassifiedError(error)
      }

      return { success: true }
    } catch (error) {
      logger.error('Error adding favorite:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Remove a dish from favorites for current authenticated user
   * @param {string} dishId - Dish ID
   * @returns {Promise<Object>} Success status
   */
  async removeFavorite(dishId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in to remove favorites')
      }

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('dish_id', dishId)

      if (error) {
        throw createClassifiedError(error)
      }

      return { success: true }
    } catch (error) {
      logger.error('Error removing favorite:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Get all favorite dishes for the current user
   * @returns {Promise<Object>} Object with favoriteIds array and favorites array
   */
  async getFavorites() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return { favoriteIds: [], favorites: [] }
      }

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          dish_id,
          created_at,
          dishes (
            id,
            name,
            category,
            price,
            photo_url,
            restaurants (name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw createClassifiedError(error)
      }

      const validData = (data || []).filter(f => f.dishes)
      const favoriteIds = validData.map(f => f.dish_id)
      const favorites = validData.map(f => ({
        dish_id: f.dishes.id,
        dish_name: f.dishes.name,
        category: f.dishes.category,
        price: f.dishes.price,
        photo_url: f.dishes.photo_url,
        restaurant_name: f.dishes.restaurants?.name,
        saved_at: f.created_at,
      }))

      return { favoriteIds, favorites }
    } catch (error) {
      logger.error('Error fetching favorites:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },
}
