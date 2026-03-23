import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'
import { createClassifiedError } from '../utils/errorHandler'
import { validateUserContent } from '../lib/reviewBlocklist'

export const specialsApi = {
  /**
   * Get all active specials with restaurant info
   */
  async getActiveSpecials() {
    const { data, error } = await supabase
      .from('specials')
      .select(`
        *,
        restaurants (
          id,
          name,
          town,
          address
        )
      `)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching specials:', error)
      throw createClassifiedError(error)
    }

    return data || []
  },

  /**
   * Get specials for a specific restaurant
   */
  async getByRestaurant(restaurantId) {
    const { data, error } = await supabase
      .from('specials')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching restaurant specials:', error)
      throw createClassifiedError(error)
    }

    return data || []
  },

  /**
   * Create a new special
   */
  async create({ restaurantId, dealName, description, price, expiresAt }) {
    // Content moderation
    const nameError = validateUserContent(dealName, 'Special name')
    if (nameError) throw new Error(nameError)
    const descError = validateUserContent(description, 'Description')
    if (descError) throw new Error(descError)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be logged in to create a special')

    const { data, error } = await supabase
      .from('specials')
      .insert({
        restaurant_id: restaurantId,
        deal_name: dealName,
        description,
        price,
        expires_at: expiresAt,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating special:', error)
      throw createClassifiedError(error)
    }

    return data
  },

  /**
   * Update a special
   */
  async update(id, updates) {
    const { data, error } = await supabase
      .from('specials')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating special:', error)
      throw createClassifiedError(error)
    }

    return data
  },

  /**
   * Deactivate a special (soft delete)
   */
  async deactivate(id) {
    return this.update(id, { is_active: false })
  }
}
