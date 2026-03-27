import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { JournalFeed } from './JournalFeed'

const worthIt = [
  { dish_id: 1, dish_name: 'Lobster Roll', restaurant_name: "Nancy's", restaurant_town: 'Oak Bluffs', category: 'Seafood', rating_10: 9.2, voted_at: '2026-02-20T12:00:00Z', would_order_again: true },
]
const avoid = [
  { dish_id: 2, dish_name: 'Clam Strips', restaurant_name: 'Giordano', restaurant_town: 'Oak Bluffs', category: 'Seafood', rating_10: 3.5, voted_at: '2026-02-19T12:00:00Z', would_order_again: false },
]

describe('JournalFeed', () => {
  it('renders all entries in reverse chronological order by default', () => {
    render(
      <MemoryRouter>
        <JournalFeed worthIt={worthIt} avoid={avoid} activeShelf="all" />
      </MemoryRouter>
    )
    var items = screen.getAllByTestId('journal-card')
    expect(items).toHaveLength(2)
  })

  it('filters to only good-here when shelf is active', () => {
    render(
      <MemoryRouter>
        <JournalFeed worthIt={worthIt} avoid={avoid} activeShelf="good-here" />
      </MemoryRouter>
    )
    expect(screen.getByText('Lobster Roll')).toBeTruthy()
    expect(screen.queryByText('Clam Strips')).toBeNull()
  })

  it('filters to only not-good-here when shelf is active', () => {
    render(
      <MemoryRouter>
        <JournalFeed worthIt={worthIt} avoid={avoid} activeShelf="not-good-here" />
      </MemoryRouter>
    )
    expect(screen.getByText('Clam Strips')).toBeTruthy()
    expect(screen.queryByText('Lobster Roll')).toBeNull()
  })

  it('shows empty state when filtered shelf has no entries', () => {
    render(
      <MemoryRouter>
        <JournalFeed worthIt={[]} avoid={avoid} activeShelf="good-here" />
      </MemoryRouter>
    )
    expect(screen.getByText(/no dishes/i)).toBeTruthy()
  })

  it('shows loading skeleton when loading', () => {
    render(
      <MemoryRouter>
        <JournalFeed worthIt={[]} avoid={[]} activeShelf="all" loading />
      </MemoryRouter>
    )
    var skeletons = screen.getAllByTestId('journal-skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
