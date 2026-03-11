import { useQuery } from '@tanstack/react-query'
import { localListsApi } from '../api/localListsApi'
import { getUserMessage } from '../utils/errorHandler'

export function useLocalListDetail(userId) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['localList', 'user', userId],
    queryFn: function () { return localListsApi.getByUser(userId) },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })

  return {
    items: data || [],
    loading: isLoading,
    error: error ? { message: getUserMessage(error, 'loading local list') } : null,
  }
}
