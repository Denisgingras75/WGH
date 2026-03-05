# WAR 9-Signal Scoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 3-value flag-counter WAR scorer with a continuous 9-signal weighted equation, then wire it into the badge UI.

**Architecture:** Rewrite `scoreProfile()` in jitter-box.js with 9 component scorers (linear ramp + clamp), add cross-signal correlation and K-S distribution shape test. Update TrustBadge to show WAR number inline. Update ProfileJitterCard to display WAR as hero stat. Update ReviewFlow to use jitter-box.js instead of the React hook + separate scorer. Add migration for `war_score` column (rename from `liveness_score`). Update tests.

**Tech Stack:** Vanilla JS (jitter-box.js), React (badge components), Supabase (schema), Vitest (tests)

---

### Task 1: Add math helpers for new scoring signals

**Files:**
- Modify: `src/utils/jitter-box.js:55-67` (after existing `round3` function)

**Step 1: Write failing test for K-S statistic calculation**

Add to `src/utils/__tests__/jitter-box.test.js`:

```js
describe('ksStatistic', () => {
  it('returns low value for log-normal distributed data', () => {
    // Generate log-normal-ish flight times (human-like)
    const humanFlights = [
      45, 52, 68, 73, 89, 95, 102, 115, 130, 145,
      155, 170, 190, 210, 250, 280, 310, 380, 450, 620
    ]
    const ks = _testExports.ksStatistic(humanFlights)
    expect(ks).toBeLessThan(0.15)
  })

  it('returns high value for uniform distributed data', () => {
    // Uniform spacing (bot-like)
    const botFlights = [
      100, 102, 104, 106, 108, 110, 112, 114, 116, 118,
      120, 122, 124, 126, 128, 130, 132, 134, 136, 138
    ]
    const ks = _testExports.ksStatistic(botFlights)
    expect(ks).toBeGreaterThan(0.15)
  })
})

describe('pearsonR', () => {
  it('returns positive correlation for correlated arrays', () => {
    const a = [1, 2, 3, 4, 5]
    const b = [2, 4, 5, 8, 10]
    const r = _testExports.pearsonR(a, b)
    expect(r).toBeGreaterThan(0.9)
  })

  it('returns near-zero for uncorrelated arrays', () => {
    const a = [1, 2, 3, 4, 5]
    const b = [5, 1, 4, 2, 3]
    const r = _testExports.pearsonR(a, b)
    expect(Math.abs(r)).toBeLessThan(0.5)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/denisgingras/whats-good-here && npm run test -- --run src/utils/__tests__/jitter-box.test.js`
Expected: FAIL — `_testExports.ksStatistic is not a function`

**Step 3: Implement K-S statistic and Pearson R in jitter-box.js**

Add after the `round3` function (line ~67):

```js
// ── Statistical tests ──────────────────────────────────────────────────

// Kolmogorov-Smirnov: compare empirical CDF to log-normal CDF
// Returns K-S statistic (0 = perfect fit, 1 = no fit)
function ksStatistic(values) {
  if (values.length < 10) return 0.5 // insufficient data = neutral

  // Fit log-normal: take log of values, compute mean and std
  var logs = []
  for (var i = 0; i < values.length; i++) {
    if (values[i] > 0) logs.push(Math.log(values[i]))
  }
  if (logs.length < 10) return 0.5

  var mu = mean(logs)
  var sigma = std(logs)
  if (sigma === 0) return 1.0 // zero variance = definitely not log-normal

  // Sort values for empirical CDF
  var sorted = values.slice().sort(function (a, b) { return a - b })
  var n = sorted.length
  var maxDiff = 0

  for (var j = 0; j < n; j++) {
    var empirical = (j + 1) / n
    // Log-normal CDF = Phi((ln(x) - mu) / sigma)
    var z = (Math.log(sorted[j]) - mu) / sigma
    var theoretical = normalCDF(z)
    var diff = Math.abs(empirical - theoretical)
    if (diff > maxDiff) maxDiff = diff
  }

  return round3(maxDiff)
}

// Standard normal CDF approximation (Abramowitz & Stegun)
function normalCDF(z) {
  if (z < -6) return 0
  if (z > 6) return 1
  var sign = z < 0 ? -1 : 1
  z = Math.abs(z)
  var t = 1 / (1 + 0.2316419 * z)
  var d = 0.3989422804014327 * Math.exp(-z * z / 2)
  var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.8212560 + t * 1.3302744))))
  return sign === 1 ? 1 - p : p
}

// Pearson correlation coefficient
function pearsonR(a, b) {
  if (a.length < 3 || a.length !== b.length) return 0
  var ma = mean(a)
  var mb = mean(b)
  var num = 0, da = 0, db = 0
  for (var i = 0; i < a.length; i++) {
    var ai = a[i] - ma
    var bi = b[i] - mb
    num += ai * bi
    da += ai * ai
    db += bi * bi
  }
  var denom = Math.sqrt(da * db)
  return denom > 0 ? num / denom : 0
}
```

Also add to the UMD export block at the bottom of the file (for testing):

```js
// Test-only exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JitterBox
  module.exports._testExports = { ksStatistic: ksStatistic, pearsonR: pearsonR, normalCDF: normalCDF }
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/denisgingras/whats-good-here && npm run test -- --run src/utils/__tests__/jitter-box.test.js`
Expected: PASS

**Step 5: Commit**

```bash
cd /Users/denisgingras/whats-good-here
git add src/utils/jitter-box.js src/utils/__tests__/jitter-box.test.js
git commit -m "feat(jitter): add K-S statistic and Pearson R helpers for WAR v2"
```

---

### Task 2: Rewrite scoreProfile with 9-signal weighted equation

**Files:**
- Modify: `src/utils/jitter-box.js:95-170` (replace entire `scoreProfile` function)

**Step 1: Write failing test for continuous WAR scoring**

Add to `src/utils/__tests__/jitter-box.test.js`:

```js
describe('WAR v2 continuous scoring', () => {
  it('genuine human scores >= 0.80', () => {
    // Simulate 50+ human keystrokes with realistic timing
    el = document.createElement('textarea')
    jb = JitterBox.attach(el)

    // Need to build a profile with enough data, then call score()
    // Simulate varied human typing with pauses, edits, bigrams
    simulateHumanSession(el, 80) // helper: 80 keystrokes with natural variance
    var badge = jb.score()
    expect(badge).not.toBeNull()
    expect(badge.war).toBeGreaterThanOrEqual(0.70) // allow margin for simulation limits
    expect(badge.classification).toBe('verified')
  })

  it('bot with fixed timing scores <= 0.49', () => {
    el = document.createElement('textarea')
    jb = JitterBox.attach(el)

    simulateBotSession(el, 80) // helper: 80 keystrokes with fixed timing
    var badge = jb.score()
    expect(badge).not.toBeNull()
    expect(badge.war).toBeLessThanOrEqual(0.49)
    expect(badge.classification).toBe('bot')
  })

  it('WAR is continuous, not 3-value', () => {
    el = document.createElement('textarea')
    jb = JitterBox.attach(el)

    simulateHumanSession(el, 60)
    var badge = jb.score()
    // Should not be exactly 0.0, 0.5, or 1.0
    expect(badge.war).not.toBe(0.0)
    expect(badge.war).not.toBe(0.5)
    expect(badge.war).not.toBe(1.0)
  })

  it('returns component scores breakdown', () => {
    el = document.createElement('textarea')
    jb = JitterBox.attach(el)

    simulateHumanSession(el, 60)
    var badge = jb.score()
    expect(badge.components).toBeDefined()
    expect(badge.components.bigram_rhythm).toBeDefined()
    expect(badge.components.distribution_shape).toBeDefined()
    expect(badge.components.cross_signal).toBeDefined()
  })
})
```

Note: `simulateHumanSession` and `simulateBotSession` are test helpers that dispatch keydown/keyup events with controlled timing using `vi.advanceTimersByTime`. They should be written as part of this test file's setup.

**Step 2: Run test to verify it fails**

Run: `cd /Users/denisgingras/whats-good-here && npm run test -- --run src/utils/__tests__/jitter-box.test.js`
Expected: FAIL — classification is 'human' not 'verified', no components field

**Step 3: Replace scoreProfile in jitter-box.js**

Replace lines 95-170 (the entire `scoreProfile` function and old threshold constants) with:

```js
// ── WAR Scorer (9-signal weighted composite) ───────────────────────────

// Signal ramps: [bot_floor, human_zone]
var RAMPS = {
  bigram_rhythm:    [0.08, 0.20],   // CV of bigram means
  per_key:          [0.09, 0.25],   // CV of per-key dwells
  inter_key_var:    [9, 45],        // std of flight times (ms)
  dwell_std:        [8, 20],        // std of dwell times (ms)
  mean_dwell:       [27, 80],       // avg dwell (ms)
  edit_ratio:       [0.03, 0.08],   // backspaces / keystrokes
  pause_freq:       [0.4, 1.5],     // pauses per 100 keystrokes
  purity:           [0, 1],         // typed / total (0-1)
  ks_shape:         [0.25, 0.08],   // K-S stat (inverted: lower = better)
}

// Weights (sum = 1.0, ordered by difficulty to fake)
var WEIGHTS = {
  bigram_rhythm:    0.18,
  per_key:          0.15,
  cross_signal:     0.15,
  distribution:     0.12,
  inter_key_var:    0.10,
  dwell_std:        0.10,
  mean_dwell:       0.08,
  editing:          0.07,
  purity:           0.05,
}

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v }

function rampScore(raw, floor, ceiling) {
  if (floor < ceiling) {
    // Normal: higher raw = more human
    return clamp01((raw - floor) / (ceiling - floor))
  } else {
    // Inverted: lower raw = more human (K-S statistic)
    return clamp01((floor - raw) / (floor - ceiling))
  }
}

function scoreProfile(profile, captureData) {
  if (!profile) return { war: 1.0, classification: 'verified', components: {}, flags: [] }

  var components = {}
  var flags = []

  // 1. Bigram rhythm (CV of bigram means)
  var sigs = profile.bigram_signatures || {}
  var bigramKeys = Object.keys(sigs)
  if (bigramKeys.length >= 4) {
    var bigramMeans = []
    for (var i = 0; i < bigramKeys.length; i++) bigramMeans.push(sigs[bigramKeys[i]].mean)
    var bigramM = mean(bigramMeans)
    var bigramCv = bigramM > 0 ? std(bigramMeans) / bigramM : 0
    components.bigram_rhythm = rampScore(bigramCv, RAMPS.bigram_rhythm[0], RAMPS.bigram_rhythm[1])
    if (bigramCv < 0.08) flags.push('bigram_uniform')
  } else {
    components.bigram_rhythm = 0.5 // insufficient data = neutral
  }

  // 2. Per-key uniqueness (CV of per-key dwells)
  var perKeyValues = []
  var pkd = profile.per_key_dwell || {}
  var pkKeys = Object.keys(pkd)
  for (var j = 0; j < pkKeys.length; j++) perKeyValues.push(pkd[pkKeys[j]])

  if (perKeyValues.length >= 3) {
    var pkMean = mean(perKeyValues)
    var pkCv = pkMean > 0 ? std(perKeyValues) / pkMean : 0
    components.per_key = rampScore(pkCv, RAMPS.per_key[0], RAMPS.per_key[1])
    if (pkCv < 0.09) flags.push('per_key_uniformity')
  } else {
    components.per_key = 0.5
  }

  // 3. Cross-signal correlation (3 sub-tests, requires raw capture data)
  components.cross_signal = scoreCrossSignal(captureData || {})

  // 4. Distribution shape (K-S test on flight times)
  if (captureData && captureData.flightTimes && captureData.flightTimes.length >= 10) {
    var ks = ksStatistic(captureData.flightTimes)
    components.distribution_shape = rampScore(ks, RAMPS.ks_shape[0], RAMPS.ks_shape[1])
    if (ks > 0.25) flags.push('non_lognormal')
  } else {
    components.distribution_shape = 0.5
  }

  // 5. Inter-key variance
  if (profile.std_inter_key != null) {
    components.inter_key_var = rampScore(profile.std_inter_key, RAMPS.inter_key_var[0], RAMPS.inter_key_var[1])
    if (profile.std_inter_key < 9) flags.push('variance_floor')
  } else {
    components.inter_key_var = 0.5
  }

  // 6. Dwell std
  if (profile.std_dwell != null) {
    components.dwell_std = rampScore(profile.std_dwell, RAMPS.dwell_std[0], RAMPS.dwell_std[1])
    if (profile.std_dwell < 8) flags.push('dwell_std_hard')
  } else {
    components.dwell_std = 0.5
  }

  // 7. Mean dwell
  if (profile.mean_dwell != null) {
    components.mean_dwell = rampScore(profile.mean_dwell, RAMPS.mean_dwell[0], RAMPS.mean_dwell[1])
    if (profile.mean_dwell < 27) flags.push('dwell_floor')
  } else {
    components.mean_dwell = 0.5
  }

  // 8. Editing behavior (avg of edit_ratio + pause_freq sub-scores)
  var editSub = profile.edit_ratio != null
    ? rampScore(profile.edit_ratio, RAMPS.edit_ratio[0], RAMPS.edit_ratio[1]) : 0.5
  var pauseSub = profile.pause_freq != null
    ? rampScore(profile.pause_freq, RAMPS.pause_freq[0], RAMPS.pause_freq[1]) : 0.5
  components.editing = (editSub + pauseSub) / 2
  if (profile.edit_ratio != null && profile.pause_freq != null &&
      profile.edit_ratio < 0.03 && profile.pause_freq < 0.4) {
    flags.push('no_editing_behavior')
  }

  // 9. Purity
  var total = (captureData && captureData.humanChars + captureData.alienChars) || 0
  if (total >= MIN_CHARS_FOR_SCORE && captureData) {
    var purityRatio = captureData.humanChars / total
    components.purity = rampScore(purityRatio, RAMPS.purity[0], RAMPS.purity[1])
  } else {
    components.purity = 0.5
  }

  // Weighted sum
  var war = 0
  var weightKeys = Object.keys(WEIGHTS)
  for (var w = 0; w < weightKeys.length; w++) {
    var key = weightKeys[w]
    var comp = key === 'distribution' ? 'distribution_shape' : key
    war += WEIGHTS[key] * (components[comp] != null ? components[comp] : 0.5)
  }
  war = round2(war)

  // Classification
  var classification
  if (war >= 0.80) classification = 'verified'
  else if (war >= 0.50) classification = 'suspicious'
  else classification = 'bot'

  return { war: war, classification: classification, components: components, flags: flags }
}

// Cross-signal correlation scorer (3 sub-tests)
function scoreCrossSignal(captureData) {
  var score = 0
  var tests = 0

  // Sub-test 1: Pause-warmup — after >2s pause, next keystrokes slower?
  if (captureData.flightTimes && captureData.flightTimes.length >= 20) {
    var flights = captureData.flightTimes
    var avgFlight = mean(flights)
    var pauseWarmups = 0
    var pauseCount = 0

    for (var i = 1; i < flights.length - 3; i++) {
      // Check if there was a gap (represented by the flight time itself being high)
      if (flights[i] > PAUSE_THRESHOLD_MS * 0.5) { // 1s+ gap
        pauseCount++
        // Check if next 3 keystrokes are slower than average
        var nextAvg = (flights[i + 1] + flights[i + 2] + flights[i + 3]) / 3
        if (nextAvg > avgFlight) pauseWarmups++
      }
    }
    if (pauseCount >= 1) {
      score += pauseWarmups / pauseCount > 0.5 ? 1 : 0
    } else {
      score += 0.5 // no pauses to test
    }
    tests++
  }

  // Sub-test 2: Flow coupling — when inter-key speeds up, does dwell decrease?
  if (captureData.flightTimes && captureData.dwellTimes &&
      captureData.flightTimes.length >= 20 && captureData.dwellTimes.length >= 20) {
    // Use overlapping windows of 10
    var flightWindows = []
    var dwellWindows = []
    var minLen = Math.min(captureData.flightTimes.length, captureData.dwellTimes.length)
    var windowSize = 10
    for (var k = 0; k + windowSize <= minLen; k += windowSize) {
      flightWindows.push(mean(captureData.flightTimes.slice(k, k + windowSize)))
      dwellWindows.push(mean(captureData.dwellTimes.slice(k, k + windowSize)))
    }
    if (flightWindows.length >= 3) {
      var r = pearsonR(flightWindows, dwellWindows)
      score += r > 0.3 ? 1 : r > 0 ? 0.5 : 0
    } else {
      score += 0.5
    }
    tests++
  }

  // Sub-test 3: Fatigue slope — do fatigue windows trend upward?
  if (captureData.fatigueWindows && captureData.fatigueWindows.length >= 3) {
    var fw = captureData.fatigueWindows
    // Simple linear trend: is last window slower than first?
    var trend = fw[fw.length - 1] - fw[0]
    score += trend > 0 ? 1 : 0
    tests++
  }

  return tests > 0 ? round2(score / tests) : 0.5
}
```

Also update the `score()` method inside the `attach()` function to pass `data` (capture state) to `scoreProfile`:

Change this line in the `score:` method:
```js
var result = scoreProfile(profile)
```
To:
```js
var result = scoreProfile(profile, data)
```

And update the classification labels in the return:
- Old: `'human'` / `'suspicious'` / `'bot'`
- New: `'verified'` / `'suspicious'` / `'bot'`

Add `components` to the returned badge:
```js
return {
  war: result.war,
  classification: result.classification,
  flags: result.flags,
  components: result.components,
  purity: purity,
  profile: profile,
  session: { ... },
}
```

**Step 4: Run tests**

Run: `cd /Users/denisgingras/whats-good-here && npm run test -- --run src/utils/__tests__/jitter-box.test.js`
Expected: All tests PASS (old tests updated for new classification labels, new tests pass)

**Step 5: Commit**

```bash
cd /Users/denisgingras/whats-good-here
git add src/utils/jitter-box.js src/utils/__tests__/jitter-box.test.js
git commit -m "feat(jitter): WAR v2 — 9-signal continuous scoring equation"
```

---

### Task 3: Update TrustBadge to show WAR number

**Files:**
- Modify: `src/components/TrustBadge.jsx`

**Step 1: No unit test needed — this is a UI change. Test visually.**

**Step 2: Update TrustBadge component**

Changes to `src/components/TrustBadge.jsx`:

1. Add `warScore` prop to `TrustBadge`:

```jsx
export function TrustBadge({ type, size = 'sm', profileData, warScore }) {
```

2. Add new badge configs for WAR-based display. After the existing `configs` object (~line 19), add:

```jsx
  // WAR-based display overrides type-based if warScore is present
  var warConfig = null
  if (warScore != null) {
    if (warScore >= 0.80) {
      warConfig = { label: 'Verified', color: 'var(--color-rating)', bg: 'rgba(34, 197, 94, 0.15)' }
    } else if (warScore >= 0.50) {
      warConfig = { label: 'Suspicious', color: 'var(--color-accent-orange)', bg: 'rgba(245, 158, 11, 0.15)' }
    } else {
      warConfig = { label: 'Bot', color: 'var(--color-error, #ef4444)', bg: 'rgba(239, 68, 68, 0.15)' }
    }
  }
  var displayConfig = warConfig || config
```

3. Add WAR number display next to the icon. After the icon SVGs (~line 84), add:

```jsx
  {warScore != null && (
    <span
      className="text-xs font-mono font-medium ml-1"
      style={{ color: displayConfig.color, whiteSpace: 'nowrap' }}
    >
      {displayConfig.label} &middot; {warScore.toFixed(2)}
    </span>
  )}
```

4. Update popover to show reviews/consistency/WAR (~line 86-110):

```jsx
  {showPopover && profileData && (
    <span ...>
      <span className="block space-y-1.5">
        {profileData.review_count != null && (
          <PopoverRow label="Reviews" value={profileData.review_count} />
        )}
        {profileData.consistency_score != null && (
          <PopoverRow label="Consistency" value={Number(profileData.consistency_score).toFixed(2)} />
        )}
        {warScore != null && (
          <PopoverRow label="WAR" value={warScore.toFixed(2)} />
        )}
      </span>
    </span>
  )}
```

**Step 3: Verify build**

Run: `cd /Users/denisgingras/whats-good-here && npm run build`
Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
cd /Users/denisgingras/whats-good-here
git add src/components/TrustBadge.jsx
git commit -m "feat(jitter): TrustBadge shows WAR score inline with hover popover"
```

---

### Task 4: Add WAR hero stat to ProfileJitterCard

**Files:**
- Modify: `src/components/jitter/ProfileJitterCard.jsx`

**Step 1: Add `warScore` prop and hero display**

Add `warScore` to props:
```jsx
export function ProfileJitterCard({ profile, warScore }) {
```

Add WAR hero stat above the headline stats grid (after line 37, before the grid):

```jsx
  {/* WAR Hero Stat */}
  {warScore != null && (
    <div className="text-center mb-3">
      <div className="text-3xl font-bold font-mono" style={{ color: warColor(warScore) }}>
        {warScore.toFixed(2)}
      </div>
      <div className="text-xs uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
        WAR Score
      </div>
    </div>
  )}
```

Add helper function at bottom of file:
```jsx
function warColor(war) {
  if (war >= 0.80) return 'var(--color-rating)'
  if (war >= 0.50) return 'var(--color-accent-orange)'
  return 'var(--color-error, #ef4444)'
}
```

**Step 2: Verify build**

Run: `cd /Users/denisgingras/whats-good-here && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
cd /Users/denisgingras/whats-good-here
git add src/components/jitter/ProfileJitterCard.jsx
git commit -m "feat(jitter): WAR hero stat on ProfileJitterCard"
```

---

### Task 5: Wire jitter-box.js into ReviewFlow

**Files:**
- Modify: `src/components/ReviewFlow.jsx:5-6,19,26,195-223,428`

**Step 1: Update imports**

Replace:
```jsx
import { JitterInput, SessionCard } from './jitter'
import { scoreSession } from '../utils/jitterScorer'
```
With:
```jsx
import { SessionCard } from './jitter'
import JitterBox from '../utils/jitter-box'
```

**Step 2: Replace jitterRef with JitterBox instance**

Replace:
```jsx
const jitterRef = useRef(null)
```
With:
```jsx
const jitterBoxRef = useRef(null)
const textareaRef = useRef(null)
```

Add an effect to attach/detach JitterBox (place after other hooks, BEFORE any early returns):
```jsx
useEffect(() => {
  if (textareaRef.current && !jitterBoxRef.current) {
    jitterBoxRef.current = JitterBox.attach(textareaRef.current)
  }
  return () => {
    if (jitterBoxRef.current) {
      jitterBoxRef.current.detach()
      jitterBoxRef.current = null
    }
  }
}, [textareaRef.current])
```

**Step 3: Update scoring on submit (~line 195-223)**

Replace:
```jsx
const purityData = reviewTextToSubmit && jitterRef.current ? jitterRef.current.getPurity() : null
const jitterData = reviewTextToSubmit && jitterRef.current ? jitterRef.current.getJitterProfile() : null
const sessionStatsData = jitterRef.current?.getSessionStats() || null

const jitterScore = scoreSession(jitterData)

jitterRef.current?.reset()
```
With:
```jsx
const badge = reviewTextToSubmit && jitterBoxRef.current
  ? jitterBoxRef.current.score()
  : null

if (jitterBoxRef.current) jitterBoxRef.current.reset()
```

Update the `submitVote` call to pass badge data:
```jsx
submitVote(dishId, pendingVote, sliderValue, reviewTextToSubmit,
  badge ? { purity: badge.purity } : null,
  badge ? badge.profile : null,
  badge ? { score: badge.war, flags: badge.flags, classification: badge.classification } : null
)
```

**Step 4: Replace JitterInput with plain textarea (~line 428)**

Replace `<JitterInput ref={jitterRef} ...>` with a standard textarea that uses `textareaRef`:
```jsx
<textarea
  ref={textareaRef}
  className="w-full rounded-lg p-3 text-sm"
  style={{
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-divider)',
    minHeight: '80px',
    resize: 'vertical',
  }}
  placeholder="What makes this dish special?"
  maxLength={200}
  value={reviewText}
  onChange={(e) => setReviewText(e.target.value)}
/>
```

**Step 5: Verify build + test**

Run: `cd /Users/denisgingras/whats-good-here && npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
cd /Users/denisgingras/whats-good-here
git add src/components/ReviewFlow.jsx
git commit -m "feat(jitter): wire jitter-box.js into ReviewFlow, replace React hook scorer"
```

---

### Task 6: Add war_score column to jitter_samples (migration)

**Files:**
- Create: `supabase/migrations/029-war-score.sql`
- Modify: `supabase/schema.sql` (add column to CREATE TABLE definition)

**Step 1: Write migration**

```sql
-- Add WAR v2 continuous score and classification to jitter_samples
-- Replaces the binary liveness_score with a continuous 0.0-1.0 composite

ALTER TABLE jitter_samples
  ADD COLUMN IF NOT EXISTS war_score DECIMAL(4, 3),
  ADD COLUMN IF NOT EXISTS classification TEXT CHECK (classification IN ('verified', 'suspicious', 'bot'));

-- Index for filtering verified reviews
CREATE INDEX IF NOT EXISTS idx_jitter_samples_war ON jitter_samples (war_score);

COMMENT ON COLUMN jitter_samples.war_score IS 'WAR v2: 9-signal weighted composite score (0.0=bot, 1.0=human)';
COMMENT ON COLUMN jitter_samples.classification IS 'verified (>=0.80), suspicious (0.50-0.79), bot (<0.50)';
```

**Step 2: Update schema.sql**

Add `war_score` and `classification` columns to the `jitter_samples` CREATE TABLE block (~line 290-295).

**Step 3: Commit**

```bash
cd /Users/denisgingras/whats-good-here
git add supabase/migrations/029-war-score.sql supabase/schema.sql
git commit -m "feat(jitter): add war_score + classification columns to jitter_samples"
```

---

### Task 7: Pass WAR to TrustBadge in Dish.jsx reviews

**Files:**
- Modify: `src/pages/Dish.jsx` (~line 930 where TrustBadge renders in reviews)

**Step 1: Add warScore prop to TrustBadge in reviews list**

Find the TrustBadge usage in the reviews section and add the warScore prop:

```jsx
<TrustBadge
  type={review.trust_badge}
  profileData={review.jitter_profile}
  warScore={review.war_score}
/>
```

This depends on `war_score` being available in the review data. Check the reviews query/API to ensure `war_score` is included in the select. If reviews are joined from votes + jitter_samples, add `war_score` to the select fields.

**Step 2: Verify build**

Run: `cd /Users/denisgingras/whats-good-here && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
cd /Users/denisgingras/whats-good-here
git add src/pages/Dish.jsx
git commit -m "feat(jitter): pass WAR score to TrustBadge in review cards"
```

---

### Task 8: Final integration test

**Step 1: Run full test suite**

Run: `cd /Users/denisgingras/whats-good-here && npm run test -- --run`
Expected: All tests pass

**Step 2: Run build**

Run: `cd /Users/denisgingras/whats-good-here && npm run build`
Expected: Build succeeds with no errors or warnings

**Step 3: Manual smoke test**

Start dev server, navigate to a dish, submit a review, verify:
- Typing captures silently (no visible change)
- After submit, review shows WAR badge inline
- Hover shows reviews/consistency/WAR popover
- Profile page shows WAR hero stat

**Step 4: Final commit if any fixups needed**

```bash
cd /Users/denisgingras/whats-good-here
git add -A
git commit -m "fix(jitter): integration fixups for WAR v2"
```
