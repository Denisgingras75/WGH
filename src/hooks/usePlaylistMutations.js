import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userPlaylistsApi } from '../api/userPlaylistsApi'

export function usePlaylistMutations() {
  const qc = useQueryClient()

  // Targeted invalidation per mutation type — avoids unnecessary refetches.
  // Previous version blew all 4 keys on every mutation.
  return {
    create: useMutation({
      mutationFn: (payload) => userPlaylistsApi.create(payload),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['user-playlists'] })
      },
    }),
    update: useMutation({
      mutationFn: ({ id, ...rest }) => userPlaylistsApi.update(id, rest),
      onSuccess: (_data, { id }) => {
        qc.invalidateQueries({ queryKey: ['user-playlists'] })
        qc.invalidateQueries({ queryKey: ['playlist-detail', id] })
      },
    }),
    remove: useMutation({
      mutationFn: (id) => userPlaylistsApi.remove(id),
      onSuccess: (_data, id) => {
        qc.removeQueries({ queryKey: ['playlist-detail', id] })
        qc.invalidateQueries({ queryKey: ['user-playlists'] })
        qc.invalidateQueries({ queryKey: ['followed-playlists'] })
      },
    }),
    addDish: useMutation({
      mutationFn: ({ playlistId, dishId, note }) =>
        userPlaylistsApi.addDish(playlistId, dishId, note),
      onSuccess: (_data, { playlistId }) => {
        qc.invalidateQueries({ queryKey: ['playlist-detail', playlistId] })
        qc.invalidateQueries({ queryKey: ['dish-playlist-membership'] })
        qc.invalidateQueries({ queryKey: ['user-playlists'] })
      },
    }),
    removeDish: useMutation({
      mutationFn: ({ playlistId, dishId }) =>
        userPlaylistsApi.removeDish(playlistId, dishId),
      onSuccess: (_data, { playlistId }) => {
        qc.invalidateQueries({ queryKey: ['playlist-detail', playlistId] })
        qc.invalidateQueries({ queryKey: ['dish-playlist-membership'] })
        qc.invalidateQueries({ queryKey: ['user-playlists'] })
      },
    }),
    reorder: useMutation({
      mutationFn: ({ playlistId, orderedDishIds }) =>
        userPlaylistsApi.reorder(playlistId, orderedDishIds),
      onSuccess: (_data, { playlistId }) => {
        qc.invalidateQueries({ queryKey: ['playlist-detail', playlistId] })
      },
    }),
    updateNote: useMutation({
      mutationFn: ({ playlistId, dishId, note }) =>
        userPlaylistsApi.updateItemNote(playlistId, dishId, note),
      onSuccess: (_data, { playlistId }) => {
        qc.invalidateQueries({ queryKey: ['playlist-detail', playlistId] })
      },
    }),
    follow: useMutation({
      mutationFn: (playlistId) => userPlaylistsApi.follow(playlistId),
      onSuccess: (_data, playlistId) => {
        qc.invalidateQueries({ queryKey: ['followed-playlists'] })
        qc.invalidateQueries({ queryKey: ['playlist-detail', playlistId] })
      },
    }),
    unfollow: useMutation({
      mutationFn: (playlistId) => userPlaylistsApi.unfollow(playlistId),
      onSuccess: (_data, playlistId) => {
        qc.invalidateQueries({ queryKey: ['followed-playlists'] })
        qc.invalidateQueries({ queryKey: ['playlist-detail', playlistId] })
      },
    }),
  }
}
