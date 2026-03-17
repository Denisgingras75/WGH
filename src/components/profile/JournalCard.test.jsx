import { describe, it, expect, vi } from 'vitest'
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
  community_avg: 8.4,
  review_text: 'Best on the island, hands down.',
  voted_at: '2026-02-20T12:00:00Z',
  photo_url: null,
  would_order_again: true,
}

describe('JournalCard', () => {
  it('renders good-here variant with dish name, rating, and restaurant', () => {
    render(
      <MemoryRouter>
        <JournalCard dish={mockDish} variant="good-here" />
      </MemoryRouter>
    )
    expect(screen.getByText('Lobster Roll')).toBeTruthy()
    expect(screen.getByText(/Nancy's/)).toBeTruthy()
    expect(screen.getByText('9.2')).toBeTruthy()
  })

  it('shows rating number prominently', () => {
    render(
      <MemoryRouter>
        <JournalCard dish={mockDish} variant="good-here" />
      </MemoryRouter>
    )
    expect(screen.getByText('9.2')).toBeTruthy()
  })

  it('shows review text inline when present', () => {
    render(
      <MemoryRouter>
        <JournalCard dish={mockDish} variant="good-here" />
      </MemoryRouter>
    )
    expect(screen.getByText(/Best on the island/)).toBeTruthy()
  })

  it('shows restaurant name in italic line', () => {
    render(
      <MemoryRouter>
        <JournalCard dish={mockDish} variant="good-here" />
      </MemoryRouter>
    )
    expect(screen.getByText(/Nancy's/)).toBeTruthy()
  })

  it('navigates to dish page on click', () => {
    render(
      <MemoryRouter>
        <JournalCard dish={mockDish} variant="good-here" />
      </MemoryRouter>
    )
    var link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/dish/1')
  })

  it('renders not-good-here variant with muted styling', () => {
    render(
      <MemoryRouter>
        <JournalCard dish={{ ...mockDish, would_order_again: false }} variant="not-good-here" />
      </MemoryRouter>
    )
    expect(screen.getByText('Lobster Roll')).toBeTruthy()
    var card = screen.getByTestId('journal-card')
    expect(card.style.opacity).toBe('0.7')
  })

  it('renders heard variant with no rating and Tried it button', () => {
    var onTriedIt = vi.fn()
    var mockHeard = {
      dish_id: 2,
      dish_name: 'Fish Tacos',
      restaurant_name: 'Offshore Ale',
      restaurant_town: 'Oak Bluffs',
      category: 'Tacos',
      saved_at: '2026-02-19T10:00:00Z',
      photo_url: null,
    }
    render(
      <MemoryRouter>
        <JournalCard dish={mockHeard} variant="heard" onTriedIt={onTriedIt} />
      </MemoryRouter>
    )
    expect(screen.getByText('Fish Tacos')).toBeTruthy()
    expect(screen.getByText(/Tried it/)).toBeTruthy()
    expect(screen.queryByText(/\/10/)).toBeNull()
  })
})
