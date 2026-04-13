import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { JournalFeed } from './JournalFeed'

const ratings = [
  { dish_id: 1, dish_name: 'Lobster Roll', restaurant_name: "Nancy's", restaurant_town: 'Oak Bluffs', category: 'Seafood', rating_10: 9.2, voted_at: '2026-02-20T12:00:00Z' },
  { dish_id: 2, dish_name: 'Clam Strips', restaurant_name: 'Giordano', restaurant_town: 'Oak Bluffs', category: 'Seafood', rating_10: 3.5, voted_at: '2026-02-19T12:00:00Z' },
]

describe('JournalFeed', () => {
  it('renders all rating entries', () => {
    render(
      <MemoryRouter>
        <JournalFeed ratings={ratings} />
      </MemoryRouter>
    )
    var items = screen.getAllByTestId('journal-card')
    expect(items).toHaveLength(2)
  })

  it('renders entries in reverse chronological order', () => {
    render(
      <MemoryRouter>
        <JournalFeed ratings={ratings} />
      </MemoryRouter>
    )
    var items = screen.getAllByTestId('journal-card')
    // Lobster Roll (newer) should come before Clam Strips
    expect(items[0].textContent).toContain('Lobster Roll')
    expect(items[1].textContent).toContain('Clam Strips')
  })

  it('shows empty state when no ratings', () => {
    render(
      <MemoryRouter>
        <JournalFeed ratings={[]} />
      </MemoryRouter>
    )
    expect(screen.getByText(/no dishes/i)).toBeTruthy()
  })

  it('shows loading skeleton when loading', () => {
    render(
      <MemoryRouter>
        <JournalFeed ratings={[]} loading />
      </MemoryRouter>
    )
    var skeletons = screen.getAllByTestId('journal-skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
