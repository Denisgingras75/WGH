import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('../api/menuImportApi', () => ({
  menuImportApi: {
    getJobStatus: vi.fn(),
  },
}))

import { menuImportApi } from '../api/menuImportApi'
import { useMenuImportStatus } from './useMenuImportStatus'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useMenuImportStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null status when no job exists', async () => {
    menuImportApi.getJobStatus.mockResolvedValue(null)

    const { result } = renderHook(
      () => useMenuImportStatus('rest-123'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.status).toBeNull()
    expect(result.current.isImporting).toBe(false)
    expect(result.current.hasFailed).toBe(false)
  })

  it('returns importing state for pending jobs', async () => {
    menuImportApi.getJobStatus.mockResolvedValue({
      status: 'pending',
      dishesFound: null,
      createdAt: '2026-04-09T00:00:00Z',
    })

    const { result } = renderHook(
      () => useMenuImportStatus('rest-123'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.status).toBe('pending')
    expect(result.current.isImporting).toBe(true)
    expect(result.current.hasFailed).toBe(false)
  })

  it('returns importing state for processing jobs', async () => {
    menuImportApi.getJobStatus.mockResolvedValue({
      status: 'processing',
      dishesFound: null,
      createdAt: '2026-04-09T00:00:00Z',
    })

    const { result } = renderHook(
      () => useMenuImportStatus('rest-123'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isImporting).toBe(true)
  })

  it('returns completed state with dish count', async () => {
    menuImportApi.getJobStatus.mockResolvedValue({
      status: 'completed',
      dishesFound: 15,
      createdAt: '2026-04-09T00:00:00Z',
    })

    const { result } = renderHook(
      () => useMenuImportStatus('rest-123'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.status).toBe('completed')
    expect(result.current.dishesFound).toBe(15)
    expect(result.current.isImporting).toBe(false)
  })

  it('returns failed state for dead jobs', async () => {
    menuImportApi.getJobStatus.mockResolvedValue({
      status: 'dead',
      dishesFound: null,
      createdAt: '2026-04-09T00:00:00Z',
    })

    const { result } = renderHook(
      () => useMenuImportStatus('rest-123'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasFailed).toBe(true)
    expect(result.current.isImporting).toBe(false)
  })

  it('does not query when restaurantId is null', () => {
    menuImportApi.getJobStatus.mockResolvedValue(null)

    renderHook(
      () => useMenuImportStatus(null),
      { wrapper: createWrapper() }
    )

    expect(menuImportApi.getJobStatus).not.toHaveBeenCalled()
  })
})
