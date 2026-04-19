import { useQuery } from '@tanstack/react-query'
import { userPlaylistsApi } from '../api/userPlaylistsApi'
import { getUserMessage } from '../utils/errorHandler'

export function useFollowedPlaylists(enabled = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['followed-playlists'],
    queryFn: () => userPlaylistsApi.getFollowed(),
    enabled,
  })
  return {
    playlists: data || [],
    loading: isLoading,
    error: error ? { message: getUserMessage(error, 'loading saved playlists') } : null,
    refetch,
  }
}
