import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'
import { createClassifiedError } from '../utils/errorHandler'
import { validateUserContent } from '../lib/reviewBlocklist'

export const eventsApi = {
  /**
   * Get all active events with restaurant info
   * @param {Object} [filters] - Optional filters
   * @param {string} [filters.eventType] - Filter by event_type
   * @returns {Promise<Array>}
   */
  async getActiveEvents(filters = {}) {
    let query = supabase
      .from('events')
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
      .gte('event_date', new Date().toISOString().split('T')[0])

    if (filters.eventType) {
      query = query.eq('event_type', filters.eventType)
    }

    query = query.order('event_date', { ascending: true })

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching events:', error)
      throw createClassifiedError(error)
    }

    return data || []
  },

  /**
   * Get events for a specific restaurant
   * @param {string} restaurantId
   * @returns {Promise<Array>}
   */
  async getByRestaurant(restaurantId) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })

    if (error) {
      logger.error('Error fetching restaurant events:', error)
      throw createClassifiedError(error)
    }

    return data || []
  },

  /**
   * Create a new event
   */
  async create({ restaurantId, eventName, description, eventDate, startTime, endTime, eventType, recurringPattern, recurringDayOfWeek }) {
    // Content moderation
    const nameError = validateUserContent(eventName, 'Event name')
    if (nameError) throw new Error(nameError)
    const descError = validateUserContent(description, 'Description')
    if (descError) throw new Error(descError)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be logged in to create an event')

    const { data, error } = await supabase
      .from('events')
      .insert({
        restaurant_id: restaurantId,
        event_name: eventName,
        description,
        event_date: eventDate,
        start_time: startTime || null,
        end_time: endTime || null,
        event_type: eventType,
        recurring_pattern: recurringPattern || null,
        recurring_day_of_week: recurringDayOfWeek != null ? recurringDayOfWeek : null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating event:', error)
      throw createClassifiedError(error)
    }

    return data
  },

  /**
   * Update an event
   */
  async update(id, updates) {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating event:', error)
      throw createClassifiedError(error)
    }

    return data
  },

  /**
   * Deactivate an event (soft delete)
   */
  async deactivate(id) {
    return this.update(id, { is_active: false })
  },
}
