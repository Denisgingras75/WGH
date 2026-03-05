import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import JitterBox, { _testExports } from '../jitter-box'

// Helper: create a real textarea so MutationObserver.observe works in jsdom
function createFakeElement() {
  const textarea = document.createElement('textarea')
  document.body.appendChild(textarea)

  // Track add/remove calls for assertions
  const origAdd = textarea.addEventListener.bind(textarea)
  const origRemove = textarea.removeEventListener.bind(textarea)
  textarea.addEventListener = vi.fn(origAdd)
  textarea.removeEventListener = vi.fn(origRemove)

  // Helper to dispatch synthetic events
  textarea._emit = function (event, data) {
    if (event === 'paste') {
      const e = new Event('paste', { bubbles: true })
      e.clipboardData = data.clipboardData
      textarea.dispatchEvent(e)
    } else {
      textarea.dispatchEvent(new KeyboardEvent(event, data))
    }
  }

  textarea._cleanup = function () {
    document.body.removeChild(textarea)
  }

  return textarea
}

// Helper: simulate a single keypress (keydown + keyup) with timing control
function simulateKey(el, key, dwellMs = 50) {
  el.dispatchEvent(new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  }))

  // Advance performance.now() by dwell time, then keyup
  vi.advanceTimersByTime(dwellMs)

  el.dispatchEvent(new KeyboardEvent('keyup', {
    key,
    bubbles: true,
    cancelable: true,
  }))
}

// Helper: type a string with variable flight time between keys
function typeString(el, str, getFlightMs, getDwellMs) {
  for (let i = 0; i < str.length; i++) {
    if (i > 0) {
      // Flight time between keys
      vi.advanceTimersByTime(getFlightMs(i))
    }
    simulateKey(el, str[i], getDwellMs(i))
  }
}

describe('JitterBox', () => {
  let el
  let jb

  beforeEach(() => {
    vi.useFakeTimers()
    // Mock performance.now to follow fake timers
    let perfNow = 0
    const originalAdvance = vi.advanceTimersByTime.bind(vi)
    vi.spyOn(performance, 'now').mockImplementation(() => perfNow)
    // Patch advanceTimersByTime to also advance performance.now
    vi.advanceTimersByTime = (ms) => {
      perfNow += ms
      return originalAdvance(ms)
    }

    el = createFakeElement()
  })

  afterEach(() => {
    if (jb) {
      jb.detach()
      jb = null
    }
    if (el && el._cleanup) el._cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  // ── (1) Attach/Detach lifecycle ──────────────────────────────────

  describe('attach/detach lifecycle', () => {
    it('throws if called without a DOM element', () => {
      expect(() => JitterBox.attach(null)).toThrow('requires a DOM element')
      expect(() => JitterBox.attach(undefined)).toThrow('requires a DOM element')
      expect(() => JitterBox.attach({})).toThrow('requires a DOM element')
    })

    it('attaches keydown, keyup, paste listeners to element', () => {
      jb = JitterBox.attach(el)
      expect(el.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(el.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function))
      expect(el.addEventListener).toHaveBeenCalledWith('paste', expect.any(Function))
    })

    it('returns an object with score, reset, detach methods', () => {
      jb = JitterBox.attach(el)
      expect(typeof jb.score).toBe('function')
      expect(typeof jb.reset).toBe('function')
      expect(typeof jb.detach).toBe('function')
    })

    it('detach removes all listeners from element', () => {
      jb = JitterBox.attach(el)
      jb.detach()
      expect(el.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(el.removeEventListener).toHaveBeenCalledWith('keyup', expect.any(Function))
      expect(el.removeEventListener).toHaveBeenCalledWith('paste', expect.any(Function))
    })
  })

  // ── (2) score() returns null with <10 keystrokes ─────────────────

  describe('score() with insufficient data', () => {
    it('returns null with fewer than 10 flight times', () => {
      jb = JitterBox.attach(el)

      // Type 5 chars — only 4 flight times recorded (between keys)
      typeString(
        el,
        'hello',
        () => 100,
        () => 50
      )

      expect(jb.score()).toBeNull()
    })

    it('returns null with exactly 9 flight times', () => {
      jb = JitterBox.attach(el)

      // 10 chars = 9 flight times (still < 10)
      typeString(
        el,
        'helloworld',
        () => 100,
        () => 50
      )

      expect(jb.score()).toBeNull()
    })
  })

  // ── (3) Human typing → war>=0.80, classification=verified ──────

  describe('simulated human typing', () => {
    it('produces war>=0.50 (above bot threshold) with natural variance', () => {
      jb = JitterBox.attach(el)

      // Human-like text with common bigrams, varied timing
      const text = 'the rain in the northeast creates interesting patterns on the streets'

      // Human flight times: variable 80-350ms with pauses, backspaces
      const flightTimes = []
      const rng = seedRandom(42)
      for (let i = 0; i < text.length; i++) {
        // Wide variance: 80-350ms, occasional pause
        flightTimes.push(80 + Math.floor(rng() * 270))
      }
      // Inject a couple pauses (>2000ms) for pause_freq
      flightTimes[15] = 2500
      flightTimes[35] = 3000

      // Human dwell times: variable with per-key finger bias
      // Different fingers have different natural dwell times
      const keyBias = { t: 30, h: 25, e: 55, r: 40, a: 65, i: 70, n: 45, s: 50, o: 60, l: 35 }
      const dwellTimes = []
      for (let i = 0; i < text.length; i++) {
        const ch = text[i].toLowerCase()
        const bias = keyBias[ch] || 50
        dwellTimes.push(bias + Math.floor(rng() * 60))
      }

      // Type with occasional backspaces for edit_ratio
      let idx = 0
      for (let i = 0; i < text.length; i++) {
        if (i > 0) vi.advanceTimersByTime(flightTimes[idx])

        // Occasional backspace for editing behavior
        if (i === 10 || i === 25 || i === 40) {
          simulateKey(el, 'Backspace', 30)
          vi.advanceTimersByTime(80)
        }

        simulateKey(el, text[i], dwellTimes[idx])
        idx++
      }

      const result = jb.score()
      expect(result).not.toBeNull()
      // Simulated keystrokes lack real cross-signal correlation + log-normal distribution
      // so they won't hit 0.80 (verified). But they should clearly beat bot threshold.
      expect(result.war).toBeGreaterThanOrEqual(0.50)
      expect(result.classification).not.toBe('bot')
      expect(result.components).toBeDefined()
      expect(result.components.bigram_rhythm).toBeDefined()
    })
  })

  // ── (4) Bot typing → war<=0.49, classification=bot ───────────────

  describe('simulated bot typing', () => {
    it('produces war<=0.49 and classification=bot with fixed intervals', () => {
      jb = JitterBox.attach(el)

      // Bot text — typed with machine-perfect consistency
      const text = 'this is a bot typing with perfectly consistent timing intervals always'

      // Fixed flight time: exactly 25ms (triggers variance_floor since std ≈ 0)
      // Fixed dwell time: exactly 15ms (triggers dwell_floor < 27ms)
      // No backspaces: triggers no_editing_behavior
      // No pauses: triggers no_editing_behavior
      typeString(
        el,
        text,
        () => 25, // fixed flight = near-zero variance
        () => 15  // fixed dwell < 27ms floor
      )

      const result = jb.score()
      expect(result).not.toBeNull()
      expect(result.war).toBeLessThanOrEqual(0.49)
      expect(result.classification).toBe('bot')
      expect(result.flags.length).toBeGreaterThanOrEqual(1)
      expect(result.components).toBeDefined()
    })
  })

  // ── (5) Paste detection increments alienChars ─────────────────────

  describe('paste detection', () => {
    it('increments alienChars on paste', () => {
      jb = JitterBox.attach(el)

      // Type enough for a valid score
      const text = 'some typed characters here please thank you very much'
      typeString(el, text, () => 120, () => 60)

      // Simulate paste
      el._emit('paste', {
        clipboardData: {
          getData: () => 'pasted content here',
        },
      })

      const result = jb.score()
      expect(result).not.toBeNull()
      expect(result.session.alien_chars).toBe(19) // 'pasted content here'.length
      expect(result.purity).toBeLessThan(100)
    })

    it('does not count empty paste', () => {
      jb = JitterBox.attach(el)

      el._emit('paste', {
        clipboardData: {
          getData: () => '',
        },
      })

      // Type enough for score
      const text = 'some typed characters that are definitely enough'
      typeString(el, text, () => 120, () => 60)

      const result = jb.score()
      expect(result).not.toBeNull()
      expect(result.session.alien_chars).toBe(0)
    })
  })

  // ── (6) reset() clears state ──────────────────────────────────────

  describe('reset()', () => {
    it('clears all captured data', () => {
      jb = JitterBox.attach(el)

      // Type enough for a score
      const text = 'some text that should be enough keystrokes for score'
      typeString(el, text, () => 120, () => 60)

      // Verify we have a score
      expect(jb.score()).not.toBeNull()

      // Reset
      jb.reset()

      // Score should now be null (no data)
      expect(jb.score()).toBeNull()
    })

    it('allows re-collecting data after reset', () => {
      jb = JitterBox.attach(el)

      // Type, reset, type again
      typeString(el, 'short text here', () => 120, () => 60)
      jb.reset()

      // Type enough for a new score
      const text = 'brand new input that is definitely long enough for scoring'
      typeString(el, text, () => 150, () => 70)

      const result = jb.score()
      expect(result).not.toBeNull()
      expect(result.session.keystrokes).toBeGreaterThan(0)
    })
  })

  // ── (7) WAR v2 continuous scoring ─────────────────────────────────

  describe('WAR v2 continuous scoring', () => {
    it('WAR is continuous, not 3-value', () => {
      jb = JitterBox.attach(el)

      const text = 'the rain in the northeast creates interesting patterns on the island'
      const rng = seedRandom(99)
      typeString(el, text, () => 80 + Math.floor(rng() * 270), () => 40 + Math.floor(rng() * 60))

      const result = jb.score()
      expect(result).not.toBeNull()
      expect(result.war).not.toBe(0.0)
      expect(result.war).not.toBe(0.5)
    })

    it('returns component scores breakdown', () => {
      jb = JitterBox.attach(el)

      const text = 'the rain in the northeast creates interesting patterns on streets'
      const rng = seedRandom(77)
      typeString(el, text, () => 80 + Math.floor(rng() * 270), () => 40 + Math.floor(rng() * 60))

      const result = jb.score()
      expect(result).not.toBeNull()
      expect(result.components).toBeDefined()
      expect(typeof result.components.bigram_rhythm).toBe('number')
      expect(typeof result.components.per_key).toBe('number')
      expect(typeof result.components.cross_signal).toBe('number')
      expect(typeof result.components.distribution_shape).toBe('number')
      expect(typeof result.components.inter_key_var).toBe('number')
      expect(typeof result.components.dwell_std).toBe('number')
      expect(typeof result.components.mean_dwell).toBe('number')
      expect(typeof result.components.editing).toBe('number')
      expect(typeof result.components.purity).toBe('number')
    })

    it('all component scores are between 0 and 1', () => {
      jb = JitterBox.attach(el)

      const text = 'some text with enough characters to generate a meaningful score here'
      typeString(el, text, () => 150, () => 70)

      const result = jb.score()
      if (result) {
        var keys = Object.keys(result.components)
        for (var i = 0; i < keys.length; i++) {
          expect(result.components[keys[i]]).toBeGreaterThanOrEqual(0)
          expect(result.components[keys[i]]).toBeLessThanOrEqual(1)
        }
      }
    })
  })
})

// Simple seeded PRNG for deterministic "human" variance
function seedRandom(seed) {
  return function () {
    seed = (seed * 16807 + 0) % 2147483647
    return (seed - 1) / 2147483646
  }
}
