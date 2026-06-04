import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { localListsApi } from '../api/localListsApi'
import { useAuth } from '../context/AuthContext'
import { getUserMessage } from '../utils/errorHandler'

export function useMyLocalList() {
  var queryClient = useQueryClient()
  var { user } = useAuth()

  var { data, isLoading, error } = useQuery({
    queryKey: ['myLocalList'],
    queryFn: function () { return localListsApi.getMyList() },
    staleTime: 1000 * 60 * 2,
    // Only fetch for signed-in users — this hook also backs the "Add to Top 10"
    // affordance on public restaurant/dish pages, where logged-out visitors
    // must not trigger an RPC.
    enabled: !!user,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['myLocalList'] })
    queryClient.invalidateQueries({ queryKey: ['localLists'] })
    queryClient.invalidateQueries({ queryKey: ['localList'] })
  }

  var saveMutation = useMutation({
    mutationFn: function (payload) {
      return localListsApi.saveMyList(payload)
    },
    onSuccess: invalidate,
  })

  // Append a single dish (from the restaurant tab / dish page). Returns the raw
  // RPC result ({ success, code, ... }) so callers can branch on the gate code.
  var addDishMutation = useMutation({
    mutationFn: function (dishId) {
      return localListsApi.addDishToMyList(dishId)
    },
    onSuccess: function (result) {
      if (result && result.success) invalidate()
    },
  })

  // Parse the raw RPC rows into structured data
  var items = data || []
  var listMeta = items.length > 0 ? {
    listId: items[0].list_id,
    title: items[0].title,
    description: items[0].description,
    curatorTagline: items[0].curator_tagline,
    isActive: items[0].is_active,
  } : null

  // Filter out rows where dish_id is null (empty list returns 1 row with nulls due to LEFT JOIN)
  var dishes = items.filter(function (row) { return row.dish_id != null })
  var listDishIds = dishes.map(function (row) { return row.dish_id })

  return {
    listMeta: listMeta,
    dishes: dishes,
    // A user with a list row is a local curator (the row is created on invite
    // acceptance). Lets curator-only UI gate without a second profile query.
    isCurator: listMeta != null,
    listDishIds: listDishIds,
    isFull: dishes.length >= 10,
    loading: isLoading,
    error: error ? { message: getUserMessage(error, 'loading your list') } : null,
    saveList: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    saveError: saveMutation.error
      ? { message: getUserMessage(saveMutation.error, 'saving your list') }
      : null,
    addDish: addDishMutation.mutateAsync,
    adding: addDishMutation.isPending,
  }
}
