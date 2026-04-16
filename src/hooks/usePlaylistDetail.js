import { useQuery } from '@tanstack/react-query'
import { userPlaylistsApi } from '../api/userPlaylistsApi'
import { getUserMessage } from '../utils/errorHandler'

export function usePlaylistDetail(id) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['playlist-detail', id],
    queryFn: () => userPlaylistsApi.getDetail(id),
    enabled: !!id,
  })
  return {
    playlist: data,
    loading: isLoading,
    error: error ? { message: getUserMessage(error, 'loading playlist') } : null,
    refetch,
  }
}
