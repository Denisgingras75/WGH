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

  it('colors the rating green for high scores (>= 8)', () => {
    render(
      <MemoryRouter>
        <JournalCard dish={{ ...mockDish, rating_10: 8.5 }} />
      </MemoryRouter>
    )
    var rating = screen.getByTestId('journal-card-rating')
    expect(rating.style.color).toBe('var(--color-green-deep)')
  })

  it('colors the rating amber for mid scores (6-7.9)', () => {
    render(
      <MemoryRouter>
        <JournalCard dish={{ ...mockDish, rating_10: 6.5 }} />
      </MemoryRouter>
    )
    var rating = screen.getByTestId('journal-card-rating')
    expect(rating.style.color).toBe('var(--color-amber)')
  })

  it('colors the rating red for low scores (< 6)', () => {
    render(
      <MemoryRouter>
        <JournalCard dish={{ ...mockDish, rating_10: 4.0 }} />
      </MemoryRouter>
    )
    var rating = screen.getByTestId('journal-card-rating')
    expect(rating.style.color).toBe('var(--color-red)')
  })

  it('does not apply opacity muting regardless of rating', () => {
    render(
      <MemoryRouter>
        <JournalCard dish={{ ...mockDish, rating_10: 4.0 }} />
      </MemoryRouter>
    )
    var card = screen.getByTestId('journal-card')
    expect(card.style.opacity).not.toBe('0.7')
    expect(card.style.opacity).not.toBe('0.5')
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
