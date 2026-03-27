import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { JournalCard } from './JournalCard'

const mockDish = {
  dish_id: 1,
  dish_name: 'Lobster Roll',
  restaurant_name: "Nancy's",
  restaurant_town: 'Oak Bluffs',
  category: 'Seafood',
  rating_10: 9.2,
  review_text: 'Best on the island, hands down.',
  voted_at: '2026-02-20T12:00:00Z',
  photo_url: null,
  would_order_again: true,
}

describe('JournalCard', () => {
  it('renders dish name, restaurant, and rating', () => {
    render(
      <MemoryRouter>
        <JournalCard dish={mockDish} />
      </MemoryRouter>
    )
    expect(screen.getByText('Lobster Roll')).toBeTruthy()
    expect(screen.getByText(/Nancy's/)).toBeTruthy()
    expect(screen.getByText('9.2')).toBeTruthy()
  })

  it('shows review text inline when present', () => {
    render(
      <MemoryRouter>
        <JournalCard dish={mockDish} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Best on the island/)).toBeTruthy()
  })

  it('navigates to dish page on click', () => {
    render(
      <MemoryRouter>
        <JournalCard dish={mockDish} />
      </MemoryRouter>
    )
    var link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/dish/1')
  })

  it('applies muted opacity when would_order_again is false', () => {
    render(
      <MemoryRouter>
        <JournalCard dish={{ ...mockDish, would_order_again: false }} />
      </MemoryRouter>
    )
    expect(screen.getByText('Lobster Roll')).toBeTruthy()
    var card = screen.getByTestId('journal-card')
    expect(card.style.opacity).toBe('0.7')
  })

  it('does not show rating when rating_10 is absent', () => {
    render(
      <MemoryRouter>
        <JournalCard dish={{ ...mockDish, rating_10: null }} />
      </MemoryRouter>
    )
    expect(screen.queryByText('/10')).toBeNull()
  })
})
