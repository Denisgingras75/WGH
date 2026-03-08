import { useRef, useCallback, useEffect } from 'react'

// Keys that don't count as "human typing" — editing/navigation only
const EDITING_KEYS = new Set([
  'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Home', 'End', 'PageUp', 'PageDown',
])

// Max flight times to keep for jitter calculation
const MAX_FLIGHT_TIMES = 100
// Max dwell times to keep
const MAX_DWELL_TIMES = 100
// Flight time bounds (ms) — filter out outliers
const MIN_FLIGHT_MS = 20
const MAX_FLIGHT_MS = 2000
// Dwell time bounds (ms) — filter out outliers
const MIN_DWELL_MS = 10
const MAX_DWELL_MS = 500
// Minimum human chars before we trust the score
const MIN_CHARS_FOR_SCORE = 20
// Max mutation length to tolerate (autocorrect/autocomplete)
const AUTOCORRECT_TOLERANCE = 15
// Number of fatigue windows to track
const FATIGUE_WINDOW_COUNT = 4
// Pause threshold (ms) — gaps longer than this count as cognitive pauses
const PAUSE_THRESHOLD_MS = 2000
// Top 10 English keys for per-key dwell tracking
const TRACKED_KEYS = ['e', 't', 'a', 'o', 'i', 'n', 's', 'r', 'h', 'l']
// Mouse path sampling
const MOUSE_SAMPLE_INTERVAL = 50
const MAX_MOUSE_SAMPLES = 50

// Top 30 English bigrams for typing signature
const TRACKED_BIGRAMS = new Set([
  'th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd',
  'ti', 'es', 'or', 'te', 'of', 'ed', 'is', 'it', 'al', 'ar',
  'st', 'to', 'nt', 'ng', 'se', 'ha', 'as', 'ou', 'io', 'le',
])

function calcMean(arr) {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function calcStd(arr) {
  if (arr.length < 2) return 0
  const mean = calcMean(arr)
  const variance = arr.reduce((sum, t) => sum + (t - mean) ** 2, 0) / arr.length
  return Math.sqrt(variance)
}

function computeMousePath(positions) {
  if (positions.length < 5) return null

  let totalDist = 0
  for (let i = 1; i < positions.length; i++) {
    const dx = positions[i].x - positions[i - 1].x
    const dy = positions[i].y - positions[i - 1].y
    totalDist += Math.sqrt(dx * dx + dy * dy)
  }

  const first = positions[0]
  const last = positions[positions.length - 1]
  const straightDist = Math.sqrt(
    (last.x - first.x) * (last.x - first.x) + (last.y - first.y) * (last.y - first.y)
  )

  const linearity = totalDist > 0 ? Math.round((straightDist / totalDist) * 1000) / 1000 : 1
  const totalTime = (last.t - first.t) / 1000
  const avgSpeed = totalTime > 0 ? Math.round(totalDist / totalTime) : 0

  return { linearity, avgSpeed }
}

export function usePurityTracker() {
  const dataRef = useRef({
    humanChars: 0,
    alienChars: 0,
    flightTimes: [],
    dwellTimes: [],
    ddTimes: [],
    bigramTimings: {},
    fatigueWindows: [],
    lastKeyTime: 0,
    lastKeyChar: '',
    lastKeyDownTime: 0,
    keyDownTimes: {},
    perKeyDwells: {},
    totalKeystrokes: 0,
    backspaceCount: 0,
    pauseCount: 0,
    mousePositions: [],
    lastMouseSampleTime: 0,
    sessionStartTime: Date.now(),
  })
  const observerRef = useRef(null)
  const textareaRef = useRef(null)
  const listenersRef = useRef(null)

  // Compute current purity snapshot
  const getPurity = useCallback(() => {
    const { humanChars, alienChars, flightTimes } = dataRef.current
    const total = humanChars + alienChars

    // Not enough signal — return null
    if (total < MIN_CHARS_FOR_SCORE) {
      return { purity: null, jitter: null, humanChars, alienChars }
    }

    const purity = Math.round((humanChars / total) * 100 * 100) / 100

    // Calculate jitter (stddev of flight times)
    let jitter = null
    if (flightTimes.length >= 5) {
      const mean = flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length
      const variance = flightTimes.reduce((sum, t) => sum + (t - mean) ** 2, 0) / flightTimes.length
      jitter = Math.round(Math.sqrt(variance) * 100) / 100
    }

    return { purity, jitter, humanChars, alienChars }
  }, [])

  // Compute jitter profile for server submission
  const getJitterProfile = useCallback(() => {
    const data = dataRef.current
    const { flightTimes, dwellTimes, ddTimes, bigramTimings, totalKeystrokes } = data

    // Need minimum signal
    if (flightTimes.length < 10) {
      return null
    }

    const meanInterKey = Math.round(calcMean(flightTimes) * 100) / 100
    const stdInterKey = Math.round(calcStd(flightTimes) * 100) / 100

    const meanDwell = dwellTimes.length > 0 ? Math.round(calcMean(dwellTimes) * 100) / 100 : null
    const stdDwell = dwellTimes.length > 1 ? Math.round(calcStd(dwellTimes) * 100) / 100 : null

    // DD time stats
    const meanDdTime = ddTimes.length > 0 ? Math.round(calcMean(ddTimes) * 100) / 100 : null
    const stdDdTime = ddTimes.length > 1 ? Math.round(calcStd(ddTimes) * 100) / 100 : null

    // Per-key dwell averages
    const perKeyDwell = {}
    for (let i = 0; i < TRACKED_KEYS.length; i++) {
      const key = TRACKED_KEYS[i]
      const times = data.perKeyDwells[key]
      if (times && times.length >= 2) {
        perKeyDwell[key] = Math.round(calcMean(times) * 100) / 100
      }
    }

    // Build bigram signatures — only include bigrams with 2+ samples
    const bigramSignatures = {}
    const bigramKeys = Object.keys(bigramTimings)
    for (let i = 0; i < bigramKeys.length; i++) {
      const bigram = bigramKeys[i]
      const timings = bigramTimings[bigram]
      if (timings.length >= 2) {
        bigramSignatures[bigram] = {
          mean: Math.round(calcMean(timings) * 100) / 100,
          std: Math.round(calcStd(timings) * 100) / 100,
          n: timings.length,
        }
      }
    }

    // Edit ratio: backspaces / total keystrokes
    const editRatio = totalKeystrokes > 0
      ? Math.round((data.backspaceCount / (totalKeystrokes + data.backspaceCount)) * 1000) / 1000
      : 0

    // Pause frequency: pauses per 100 keystrokes
    const pauseFreq = totalKeystrokes > 0
      ? Math.round((data.pauseCount / totalKeystrokes) * 100 * 100) / 100
      : 0

    return {
      total_keystrokes: totalKeystrokes,
      mean_inter_key: meanInterKey,
      std_inter_key: stdInterKey,
      mean_dwell: meanDwell,
      std_dwell: stdDwell,
      mean_dd_time: meanDdTime,
      std_dd_time: stdDdTime,
      per_key_dwell: perKeyDwell,
      bigram_signatures: bigramSignatures,
      edit_ratio: editRatio,
      pause_freq: pauseFreq,
      mouse_path: computeMousePath(data.mousePositions),
      sample_size: flightTimes.length,
    }
  }, [])

  const handleKeydown = useCallback((e) => {
    const now = performance.now()
    const data = dataRef.current

    // Skip modifier-only keys
    if (e.ctrlKey || e.metaKey || e.altKey) return

    // Count backspaces for edit ratio (before filtering editing keys)
    if (e.key === 'Backspace' || e.key === 'Delete') {
      data.backspaceCount++
      return
    }

    if (EDITING_KEYS.has(e.key)) return
    // Skip non-printable (single char = printable)
    if (e.key.length !== 1) return

    data.humanChars++
    data.totalKeystrokes++

    // Record dwell start time for this key
    data.keyDownTimes[e.key.toLowerCase()] = now

    // Track DD time (keydown to keydown)
    if (data.lastKeyDownTime > 0) {
      const dd = now - data.lastKeyDownTime
      if (dd >= MIN_FLIGHT_MS && dd <= MAX_FLIGHT_MS) {
        data.ddTimes.push(dd)
        if (data.ddTimes.length > MAX_FLIGHT_TIMES) {
          data.ddTimes.shift()
        }
      }
    }
    data.lastKeyDownTime = now

    const currentChar = e.key.toLowerCase()

    // Record flight time — but first check for cognitive pause
    if (data.lastKeyTime > 0) {
      const rawFlight = now - data.lastKeyTime
      // Track cognitive pauses (> 2s = thinking break)
      if (rawFlight > PAUSE_THRESHOLD_MS) {
        data.pauseCount++
      }
      // Only keep flights within bounds for biometric averaging
      if (rawFlight >= MIN_FLIGHT_MS && rawFlight <= MAX_FLIGHT_MS) {
        data.flightTimes.push(rawFlight)
        if (data.flightTimes.length > MAX_FLIGHT_TIMES) {
          data.flightTimes.shift()
        }

        // Track bigram timing
        if (data.lastKeyChar) {
          const bigram = data.lastKeyChar + currentChar
          if (TRACKED_BIGRAMS.has(bigram)) {
            if (!data.bigramTimings[bigram]) {
              data.bigramTimings[bigram] = []
            }
            data.bigramTimings[bigram].push(rawFlight)
          }
        }

        // Update fatigue windows — every 25 keystrokes, record average flight time
        if (data.totalKeystrokes > 0 && data.totalKeystrokes % 25 === 0) {
          const recentFlights = data.flightTimes.slice(-25)
          const avgFlight = recentFlights.reduce((a, b) => a + b, 0) / recentFlights.length
          data.fatigueWindows.push(Math.round(avgFlight * 100) / 100)
          if (data.fatigueWindows.length > FATIGUE_WINDOW_COUNT) {
            data.fatigueWindows.shift()
          }
        }
      }
    }

    data.lastKeyTime = now
    data.lastKeyChar = currentChar
  }, [])

  const handleKeyup = useCallback((e) => {
    const now = performance.now()
    const data = dataRef.current

    // Skip modifier-only keys and editing keys
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (EDITING_KEYS.has(e.key)) return
    if (e.key.length !== 1) return

    const keyLower = e.key.toLowerCase()
    const downTime = data.keyDownTimes[keyLower]

    if (downTime) {
      const dwell = now - downTime
      if (dwell >= MIN_DWELL_MS && dwell <= MAX_DWELL_MS) {
        data.dwellTimes.push(dwell)
        if (data.dwellTimes.length > MAX_DWELL_TIMES) {
          data.dwellTimes.shift()
        }

        // Track per-key dwell for fingerprint keys
        if (TRACKED_KEYS.includes(keyLower)) {
          if (!data.perKeyDwells[keyLower]) {
            data.perKeyDwells[keyLower] = []
          }
          data.perKeyDwells[keyLower].push(dwell)
          if (data.perKeyDwells[keyLower].length > 50) {
            data.perKeyDwells[keyLower].shift()
          }
        }
      }
      delete data.keyDownTimes[keyLower]
    }
  }, [])

  const handlePaste = useCallback((e) => {
    const pasted = e.clipboardData?.getData('text') || ''
    if (pasted.length > 0) {
      dataRef.current.alienChars += pasted.length
    }
  }, [])

  const handleMouseMove = useCallback((e) => {
    const now = performance.now()
    const data = dataRef.current
    if (now - data.lastMouseSampleTime < MOUSE_SAMPLE_INTERVAL) return
    data.lastMouseSampleTime = now
    data.mousePositions.push({ x: e.clientX, y: e.clientY, t: now })
    if (data.mousePositions.length > MAX_MOUSE_SAMPLES) {
      data.mousePositions.shift()
    }
  }, [])

  // Ref callback to attach/detach listeners
  const attachToTextarea = useCallback((node) => {
    // Cleanup previous
    if (listenersRef.current) {
      const { el, keydown, keyup, paste } = listenersRef.current
      el.removeEventListener('keydown', keydown)
      el.removeEventListener('keyup', keyup)
      el.removeEventListener('paste', paste)
      document.removeEventListener('mousemove', handleMouseMove)
      listenersRef.current = null
    }
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    if (!node) {
      textareaRef.current = null
      return
    }

    textareaRef.current = node

    // Attach keyboard + paste + mouse listeners
    node.addEventListener('keydown', handleKeydown)
    node.addEventListener('keyup', handleKeyup)
    node.addEventListener('paste', handlePaste)
    document.addEventListener('mousemove', handleMouseMove)
    listenersRef.current = { el: node, keydown: handleKeydown, keyup: handleKeyup, paste: handlePaste }

    // MutationObserver for non-keyboard insertions (voice input, drag-drop, etc.)
    // Skip small mutations (autocorrect tolerance)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          const addedLength = (mutation.target.textContent || '').length -
            (mutation.oldValue || '').length
          if (addedLength > AUTOCORRECT_TOLERANCE) {
            dataRef.current.alienChars += addedLength
          }
        }
      }
    })

    observer.observe(node, {
      characterData: true,
      characterDataOldValue: true,
      subtree: true,
    })
    observerRef.current = observer
  }, [handleKeydown, handleKeyup, handlePaste, handleMouseMove])

  // Lightweight session stats for live display (SessionBadge)
  const getSessionStats = useCallback(() => {
    const data = dataRef.current
    const total = data.humanChars + data.alienChars
    const purity = total >= MIN_CHARS_FOR_SCORE
      ? Math.round((data.humanChars / total) * 100)
      : null
    const duration = Math.round((Date.now() - data.sessionStartTime) / 1000)
    const minutes = duration / 60
    const wpm = minutes > 0 && data.totalKeystrokes > 0
      ? Math.round((data.totalKeystrokes / 5) / minutes)
      : 0
    const editRatio = data.totalKeystrokes > 0
      ? Math.round((data.backspaceCount / (data.totalKeystrokes + data.backspaceCount)) * 100)
      : 0

    return {
      keystrokes: data.totalKeystrokes,
      purity,
      wpm,
      duration,
      editRatio,
      isCapturing: data.totalKeystrokes >= MIN_CHARS_FOR_SCORE,
    }
  }, [])

  // Reset tracking data (for when review text is cleared)
  const reset = useCallback(() => {
    dataRef.current = {
      humanChars: 0,
      alienChars: 0,
      flightTimes: [],
      dwellTimes: [],
      ddTimes: [],
      bigramTimings: {},
      fatigueWindows: [],
      lastKeyTime: 0,
      lastKeyChar: '',
      lastKeyDownTime: 0,
      keyDownTimes: {},
      perKeyDwells: {},
      totalKeystrokes: 0,
      backspaceCount: 0,
      pauseCount: 0,
      mousePositions: [],
      lastMouseSampleTime: 0,
      sessionStartTime: Date.now(),
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (listenersRef.current) {
        const { el, keydown, keyup, paste } = listenersRef.current
        el.removeEventListener('keydown', keydown)
        el.removeEventListener('keyup', keyup)
        el.removeEventListener('paste', paste)
      }
      document.removeEventListener('mousemove', handleMouseMove)
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleMouseMove])

  return { getPurity, getJitterProfile, getSessionStats, attachToTextarea, reset }
}
