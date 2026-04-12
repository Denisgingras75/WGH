import { useQuery } from '@tanstack/react-query'
import { localListsApi } from '../api/localListsApi'

export function useLocalsAggregate() {
  var { data, isLoading } = useQuery({
    queryKey: ['localsAggregate'],
    queryFn: function () { return localListsApi.getAggregate() },
    staleTime: 1000 * 60 * 10,
  })

  return {
    aggregate: data || null,
    loading: isLoading,
  }
}
