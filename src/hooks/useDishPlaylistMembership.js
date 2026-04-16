import { useQuery } from '@tanstack/react-query'
import { userPlaylistsApi } from '../api/userPlaylistsApi'
import { getUserMessage } from '../utils/errorHandler'

export function useDishPlaylistMembership(dishId, enabled = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dish-playlist-membership', dishId],
    queryFn: () => userPlaylistsApi.getDishMembership(dishId),
    enabled: enabled && !!dishId,
  })
  return {
    entries: data || [],
    loading: isLoading,
    error: error ? { message: getUserMessage(error, 'loading your playlists') } : null,
    refetch,
  }
}
