import { supabase } from '../lib/supabase'
import { createClassifiedError } from '../utils/errorHandler'
import { logger } from '../utils/logger'
import {
  checkPlaylistCreateRateLimit,
  checkPlaylistItemAddRateLimit,
  checkPlaylistFollowRateLimit,
} from '../lib/rateLimiter'

function rethrow(context, error) {
  logger.error(context, error)
  throw error.type ? error : createClassifiedError(error)
}

function rateLimitError(retryAfterMs) {
  const secs = Math.max(1, Math.ceil(retryAfterMs / 1000))
  const e = new Error(`Slow down — try again in ${secs}s`)
  e.type = 'rate_limit'
  return e
}

export const userPlaylistsApi = {
  async create({ title, description, isPublic }) {
    const rl = checkPlaylistCreateRateLimit()
    if (!rl.allowed) throw rateLimitError(rl.retryAfterMs)
    try {
      const { data, error } = await supabase.rpc('create_user_playlist', {
        p_title: title,
        p_description: description ?? null,
        p_is_public: isPublic ?? true,
      })
      if (error) throw createClassifiedError(error)
      return data
    } catch (e) { rethrow('userPlaylistsApi.create', e) }
  },

  async update(id, { title, description, isPublic } = {}) {
    try {
      const { data, error } = await supabase.rpc('update_user_playlist', {
        p_id: id,
        p_title: title ?? null,
        p_description: description ?? null,
        p_is_public: isPublic ?? null,
      })
      if (error) throw createClassifiedError(error)
      return data
    } catch (e) { rethrow('userPlaylistsApi.update', e) }
  },

  async remove(id) {
    try {
      const { error } = await supabase.rpc('delete_user_playlist', { p_id: id })
      if (error) throw createClassifiedError(error)
    } catch (e) { rethrow('userPlaylistsApi.remove', e) }
  },

  async addDish(playlistId, dishId, note) {
    const rl = checkPlaylistItemAddRateLimit()
    if (!rl.allowed) throw rateLimitError(rl.retryAfterMs)
    try {
      const { data, error } = await supabase.rpc('add_dish_to_playlist', {
        p_playlist_id: playlistId,
        p_dish_id: dishId,
        p_note: note ?? null,
      })
      if (error) throw createClassifiedError(error)
      return data
    } catch (e) { rethrow('userPlaylistsApi.addDish', e) }
  },

  async removeDish(playlistId, dishId) {
    try {
      const { error } = await supabase.rpc('remove_dish_from_playlist', {
        p_playlist_id: playlistId,
        p_dish_id: dishId,
      })
      if (error) throw createClassifiedError(error)
    } catch (e) { rethrow('userPlaylistsApi.removeDish', e) }
  },

  async reorder(playlistId, orderedDishIds) {
    try {
      const { error } = await supabase.rpc('reorder_playlist_items', {
        p_playlist_id: playlistId,
        p_ordered_dish_ids: orderedDishIds,
      })
      if (error) throw createClassifiedError(error)
    } catch (e) { rethrow('userPlaylistsApi.reorder', e) }
  },

  async updateItemNote(playlistId, dishId, note) {
    try {
      const { data, error } = await supabase.rpc('update_playlist_item_note', {
        p_playlist_id: playlistId,
        p_dish_id: dishId,
        p_note: note ?? null,
      })
      if (error) throw createClassifiedError(error)
      return data
    } catch (e) { rethrow('userPlaylistsApi.updateItemNote', e) }
  },

  async follow(playlistId) {
    const rl = checkPlaylistFollowRateLimit()
    if (!rl.allowed) throw rateLimitError(rl.retryAfterMs)
    try {
      const { error } = await supabase.rpc('follow_playlist', { p_playlist_id: playlistId })
      if (error) throw createClassifiedError(error)
    } catch (e) { rethrow('userPlaylistsApi.follow', e) }
  },

  async unfollow(playlistId) {
    try {
      const { error } = await supabase.rpc('unfollow_playlist', { p_playlist_id: playlistId })
      if (error) throw createClassifiedError(error)
    } catch (e) { rethrow('userPlaylistsApi.unfollow', e) }
  },

  async getDetail(id) {
    try {
      const { data, error } = await supabase.rpc('get_playlist_detail', { p_playlist_id: id })
      if (error) throw createClassifiedError(error)
      return data?.[0] ?? null
    } catch (e) { rethrow('userPlaylistsApi.getDetail', e) }
  },

  async getByUser(userId) {
    try {
      const { data, error } = await supabase.rpc('get_user_playlists', { p_user_id: userId })
      if (error) throw createClassifiedError(error)
      return data ?? []
    } catch (e) { rethrow('userPlaylistsApi.getByUser', e) }
  },

  async getFollowed() {
    try {
      const { data, error } = await supabase.rpc('get_followed_playlists')
      if (error) throw createClassifiedError(error)
      return data ?? []
    } catch (e) { rethrow('userPlaylistsApi.getFollowed', e) }
  },

  async getDishMembership(dishId) {
    try {
      const { data, error } = await supabase.rpc('get_dish_playlist_membership', { p_dish_id: dishId })
      if (error) throw createClassifiedError(error)
      return data ?? []
    } catch (e) { rethrow('userPlaylistsApi.getDishMembership', e) }
  },
}
