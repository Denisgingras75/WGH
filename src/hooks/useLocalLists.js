import { useQuery } from '@tanstack/react-query'
import { localListsApi } from '../api/localListsApi'
import { getUserMessage } from '../utils/errorHandler'

export function useLocalLists(viewerId) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['localLists', 'homepage', viewerId || 'anon'],
    queryFn: function () { return localListsApi.getForHomepage(viewerId) },
    staleTime: 1000 * 60 * 5,
  })

  return {
    lists: data || [],
    loading: isLoading,
    error: error ? { message: getUserMessage(error, 'loading local lists') } : null,
  }
}
