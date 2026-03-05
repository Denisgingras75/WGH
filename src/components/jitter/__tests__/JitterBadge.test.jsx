import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { JitterBadge } from '../JitterBadge'

// ── resolveState: WAR score thresholds ───────────────────────────────

describe('JitterBadge — state resolution', () => {
  it('renders verified for warScore >= 0.80', () => {
    render(<JitterBadge warScore={0.80} />)
    expect(screen.getByLabelText(/Verified/)).toBeTruthy()
  })

  it('renders verified for warScore = 0.95', () => {
    render(<JitterBadge warScore={0.95} />)
    expect(screen.getByLabelText(/Verified 0\.95/)).toBeTruthy()
  })

  it('renders suspicious for warScore >= 0.50 and < 0.80', () => {
    render(<JitterBadge warScore={0.50} />)
    expect(screen.getByLabelText(/Suspicious/)).toBeTruthy()
  })

  it('renders suspicious for warScore = 0.79', () => {
    render(<JitterBadge warScore={0.79} />)
    expect(screen.getByLabelText(/Suspicious/)).toBeTruthy()
  })

  it('renders bot for warScore < 0.50', () => {
    render(<JitterBadge warScore={0.10} />)
    expect(screen.getByLabelText(/Bot/)).toBeTruthy()
  })

  it('renders bot for warScore = 0.0', () => {
    render(<JitterBadge warScore={0.0} />)
    expect(screen.getByLabelText(/Bot/)).toBeTruthy()
  })

  it('renders ai_estimated when warScore is null', () => {
    render(<JitterBadge warScore={null} />)
    expect(screen.getByLabelText(/AI Est/)).toBeTruthy()
  })

  it('renders ai_estimated when no props given', () => {
    render(<JitterBadge />)
    expect(screen.getByLabelText(/AI Est/)).toBeTruthy()
  })

  it('uses classification fallback when warScore is null', () => {
    render(<JitterBadge warScore={null} classification="bot" />)
    expect(screen.getByLabelText(/Bot/)).toBeTruthy()
  })

  it('warScore takes precedence over classification', () => {
    render(<JitterBadge warScore={0.90} classification="bot" />)
    expect(screen.getByLabelText(/Verified/)).toBeTruthy()
  })
})

// ── All 4 states render correctly ────────────────────────────────────

describe('JitterBadge — 4 states', () => {
  it('verified shows score text', () => {
    render(<JitterBadge warScore={0.85} />)
    expect(screen.getByText('0.85')).toBeTruthy()
  })

  it('suspicious shows score text', () => {
    render(<JitterBadge warScore={0.65} />)
    expect(screen.getByText('0.65')).toBeTruthy()
  })

  it('bot shows score text', () => {
    render(<JitterBadge warScore={0.20} />)
    expect(screen.getByText('0.20')).toBeTruthy()
  })

  it('ai_estimated shows label instead of score', () => {
    render(<JitterBadge warScore={null} classification="ai_estimated" />)
    expect(screen.getByText('AI Est.')).toBeTruthy()
  })
})

// ── Sizes ────────────────────────────────────────────────────────────

describe('JitterBadge — sizes', () => {
  it('sm does not show wordmark', () => {
    render(<JitterBadge warScore={0.85} size="sm" />)
    expect(screen.queryByText('jitter')).toBeNull()
  })

  it('md shows wordmark', () => {
    render(<JitterBadge warScore={0.85} size="md" />)
    expect(screen.getByText('jitter')).toBeTruthy()
  })

  it('lg shows wordmark', () => {
    render(<JitterBadge warScore={0.85} size="lg" />)
    expect(screen.getByText('jitter')).toBeTruthy()
  })

  it('defaults to sm when no size prop', () => {
    render(<JitterBadge warScore={0.85} />)
    expect(screen.queryByText('jitter')).toBeNull()
  })
})

// ── Waveform SVG ─────────────────────────────────────────────────────

describe('JitterBadge — waveform SVG', () => {
  it('renders SVG with correct number of path segments per state', () => {
    // Each state has 10 wave points → 1 M command + 9 Q commands
    var states = [
      { warScore: 0.90 },       // verified
      { warScore: 0.60 },       // suspicious
      { warScore: 0.10 },       // bot
      { warScore: null },       // ai_estimated
    ]

    states.forEach(function (props) {
      var { container, unmount } = render(<JitterBadge {...props} size="md" />)
      var svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThanOrEqual(1)

      // Main badge SVG — check path d attribute has 10 points (M + 9 Q)
      var path = svgs[0].querySelector('path')
      var d = path.getAttribute('d')
      var mCount = (d.match(/M /g) || []).length
      var qCount = (d.match(/Q /g) || []).length
      expect(mCount).toBe(1)
      expect(qCount).toBe(9)
      unmount()
    })
  })

  it('ai_estimated waveform uses dashed stroke', () => {
    var { container } = render(<JitterBadge warScore={null} classification="ai_estimated" size="md" />)
    var paths = container.querySelectorAll('svg path')
    // Both glow and main stroke should have dash
    var hasDash = false
    paths.forEach(function (p) {
      if (p.getAttribute('stroke-dasharray') === '3,2') hasDash = true
    })
    expect(hasDash).toBe(true)
  })

  it('verified waveform does not use dashed stroke', () => {
    var { container } = render(<JitterBadge warScore={0.90} size="md" />)
    var paths = container.querySelectorAll('svg path')
    paths.forEach(function (p) {
      var dash = p.getAttribute('stroke-dasharray')
      expect(dash === 'none' || dash === null).toBe(true)
    })
  })
})

// ── Hover popover ────────────────────────────────────────────────────

describe('JitterBadge — hover popover', () => {
  it('shows popover on mouseEnter with stats', () => {
    var stats = { reviews: 12, consistency: 0.87, war: 0.91 }
    render(<JitterBadge warScore={0.91} stats={stats} size="md" />)

    var badge = screen.getByLabelText(/Verified/)
    fireEvent.mouseEnter(badge)

    expect(screen.getByText('Reviews')).toBeTruthy()
    expect(screen.getByText('12')).toBeTruthy()
    expect(screen.getByText('Consistency')).toBeTruthy()
    expect(screen.getByText('0.87')).toBeTruthy()
    expect(screen.getByText('WAR')).toBeTruthy()
    // 0.91 appears in both badge score and popover WAR row
    var warValues = screen.getAllByText('0.91')
    expect(warValues.length).toBe(2)
    expect(screen.getByText('Classification')).toBeTruthy()
    expect(screen.getByText('Verified')).toBeTruthy()
  })

  it('hides popover after mouseLeave with delay', () => {
    vi.useFakeTimers()
    var stats = { reviews: 5 }
    render(<JitterBadge warScore={0.60} stats={stats} size="md" />)

    var badge = screen.getByLabelText(/Suspicious/)
    fireEvent.mouseEnter(badge)
    expect(screen.getByText('Reviews')).toBeTruthy()

    fireEvent.mouseLeave(badge)
    // Still visible before timeout
    expect(screen.getByText('Reviews')).toBeTruthy()

    act(function () {
      vi.advanceTimersByTime(200)
    })
    expect(screen.queryByText('Reviews')).toBeNull()
    vi.useRealTimers()
  })

  it('does not show popover when no stats and no warScore', () => {
    render(<JitterBadge />)
    var badge = screen.getByLabelText(/AI Est/)
    fireEvent.mouseEnter(badge)
    expect(screen.queryByText('Classification')).toBeNull()
  })

  it('shows popover with warScore alone (no stats)', () => {
    render(<JitterBadge warScore={0.45} />)
    var badge = screen.getByLabelText(/Bot/)
    fireEvent.mouseEnter(badge)
    expect(screen.getByText('WAR')).toBeTruthy()
    expect(screen.getByText('Classification')).toBeTruthy()
  })
})

// ── Click handler ────────────────────────────────────────────────────

describe('JitterBadge — onProfileClick', () => {
  it('fires onProfileClick when clicked', () => {
    var handler = vi.fn()
    render(<JitterBadge warScore={0.85} onProfileClick={handler} />)

    var badge = screen.getByLabelText(/Verified/)
    fireEvent.click(badge)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('sets role=button when onProfileClick provided', () => {
    var handler = vi.fn()
    render(<JitterBadge warScore={0.85} onProfileClick={handler} />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('does not set role=button when no onProfileClick', () => {
    render(<JitterBadge warScore={0.85} />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
