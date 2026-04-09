import { useQuery } from '@tanstack/react-query'
import { menuImportApi } from '../api/menuImportApi'

const ACTIVE_STATUSES = ['pending', 'processing']
const POLL_INTERVAL = 5000

export function useMenuImportStatus(restaurantId) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['menuImportStatus', restaurantId],
    queryFn: () => menuImportApi.getJobStatus(restaurantId),
    enabled: !!restaurantId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status && ACTIVE_STATUSES.includes(status)) return POLL_INTERVAL
      return false
    },
    staleTime: 2000,
  })

  const status = data?.status ?? null
  const isImporting = status !== null && ACTIVE_STATUSES.includes(status)
  const hasFailed = status === 'dead'

  return {
    status,
    dishesFound: data?.dishesFound ?? null,
    createdAt: data?.createdAt ?? null,
    isImporting,
    hasFailed,
    loading: isLoading,
    error,
  }
}
