import { useQuery } from '@tanstack/react-query'
import { userPlaylistsApi } from '../api/userPlaylistsApi'
import { getUserMessage } from '../utils/errorHandler'

export function useUserPlaylists(userId) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-playlists', userId],
    queryFn: () => userPlaylistsApi.getByUser(userId),
    enabled: !!userId,
  })
  return {
    playlists: data || [],
    loading: isLoading,
    error: error ? { message: getUserMessage(error, 'loading playlists') } : null,
    refetch,
  }
}
