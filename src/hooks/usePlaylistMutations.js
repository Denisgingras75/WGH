import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userPlaylistsApi } from '../api/userPlaylistsApi'

export function usePlaylistMutations() {
  const qc = useQueryClient()

  const invalidate = (playlistId) => {
    qc.invalidateQueries({ queryKey: ['user-playlists'] })
    qc.invalidateQueries({ queryKey: ['followed-playlists'] })
    if (playlistId) qc.invalidateQueries({ queryKey: ['playlist-detail', playlistId] })
    qc.invalidateQueries({ queryKey: ['dish-playlist-membership'] })
  }

  return {
    create: useMutation({
      mutationFn: (payload) => userPlaylistsApi.create(payload),
      onSuccess: () => invalidate(),
    }),
    update: useMutation({
      mutationFn: ({ id, ...rest }) => userPlaylistsApi.update(id, rest),
      onSuccess: (_data, { id }) => invalidate(id),
    }),
    remove: useMutation({
      mutationFn: (id) => userPlaylistsApi.remove(id),
      onSuccess: () => invalidate(),
    }),
    addDish: useMutation({
      mutationFn: ({ playlistId, dishId, note }) =>
        userPlaylistsApi.addDish(playlistId, dishId, note),
      onSuccess: (_data, { playlistId }) => invalidate(playlistId),
    }),
    removeDish: useMutation({
      mutationFn: ({ playlistId, dishId }) =>
        userPlaylistsApi.removeDish(playlistId, dishId),
      onSuccess: (_data, { playlistId }) => invalidate(playlistId),
    }),
    reorder: useMutation({
      mutationFn: ({ playlistId, orderedDishIds }) =>
        userPlaylistsApi.reorder(playlistId, orderedDishIds),
      onSuccess: (_data, { playlistId }) => invalidate(playlistId),
    }),
    updateNote: useMutation({
      mutationFn: ({ playlistId, dishId, note }) =>
        userPlaylistsApi.updateItemNote(playlistId, dishId, note),
      onSuccess: (_data, { playlistId }) => invalidate(playlistId),
    }),
    follow: useMutation({
      mutationFn: (playlistId) => userPlaylistsApi.follow(playlistId),
      onSuccess: (_data, playlistId) => invalidate(playlistId),
    }),
    unfollow: useMutation({
      mutationFn: (playlistId) => userPlaylistsApi.unfollow(playlistId),
      onSuccess: (_data, playlistId) => invalidate(playlistId),
    }),
  }
}
