# WAR Badge System — Design Doc

**Date:** 2026-03-04
**Status:** Approved
**Author:** Denis + Ram

## Problem

jitter-box.js captures 9 biometric signals but the WAR score is a 3-value flag counter (1.0/0.5/0.0). The number means nothing. Reviews need a visible, meaningful verification badge backed by real math.

## Solution

### 1. WAR Equation (9-signal weighted composite)

Continuous 0.0–1.0 score. Each signal maps to a component score via linear ramp between bot threshold and human typical value.

```
WAR = sum(weight_i * clamp((raw_i - bot_floor_i) / (human_zone_i - bot_floor_i), 0, 1))
```

#### Signal Table

| # | Signal | Raw Value | Bot Zone (-> 0.0) | Human Zone (-> 1.0) | Weight | Why |
|---|--------|-----------|-------------------|---------------------|--------|-----|
| 1 | Bigram Rhythm | CV of bigram means | < 0.08 | > 0.20 | 0.18 | Hardest to fake — need per-pair timing data |
| 2 | Per-Key Uniqueness | CV of per-key dwells | < 0.09 | > 0.25 | 0.15 | Biometric fingerprint — each finger different |
| 3 | Cross-Signal Correlation | avg of 3 sub-tests | 0.0 | 1.0 | 0.15 | Signals must co-vary naturally |
| 4 | Distribution Shape | K-S statistic vs log-normal | > 0.25 | < 0.08 | 0.12 | Human timing is log-normal, not gaussian |
| 5 | Inter-Key Variance | std of flight times | < 9ms | > 45ms | 0.10 | Non-metronomic timing |
| 6 | Dwell Std | std of dwell times | < 8ms | > 20ms | 0.10 | Variable key hold |
| 7 | Mean Dwell | avg ms key held | < 27ms | > 80ms | 0.08 | Physical key press |
| 8 | Editing Behavior | avg(edit_ratio, pause_freq) | 0.0 | 1.0 | 0.07 | Makes mistakes, pauses to think |
| 9 | Purity | typed / total chars | 0% | 100% | 0.05 | Actually typed the words |

**Total weight: 1.00**

#### Cross-Signal Correlation (signal 3) sub-tests

- **Pause-warmup**: after >2s pause, next 3 keystrokes slower than session avg? (1=yes, 0=no)
- **Flow coupling**: when inter-key speed increases, does dwell decrease? (Pearson r > 0.3 = 1, else 0)
- **Fatigue slope**: do fatigue windows trend upward? (positive slope = 1, else 0)

Component score = average of 3 sub-tests.

#### Distribution Shape (signal 4) — K-S test

Compare flight time CDF against log-normal fit.
- Fit log-normal params (mu, sigma) from log(flight_times)
- K-S statistic = max |F_empirical(x) - F_lognormal(x)|
- Score = clamp((0.25 - ks) / (0.25 - 0.08), 0, 1)

Note: inverted ramp — lower K-S = better fit = higher score.

#### Editing Behavior (signal 8) sub-scores

- edit_ratio: clamp((ratio - 0.03) / (0.08 - 0.03), 0, 1)
- pause_freq: clamp((freq - 0.4) / (1.5 - 0.4), 0, 1)
- Component score = average of both

### 2. Classification Thresholds

| WAR Range | Label | Badge Color |
|-----------|-------|-------------|
| 0.80 – 1.00 | Verified | Green |
| 0.50 – 0.79 | Suspicious | Amber |
| 0.00 – 0.49 | Bot | Red |
| null | Unscored | Gray |

Full transparency — all reviews show their score.

### 3. Badge UI (3 layers)

**Layer 1 — Inline badge** (on every review, next to @username):
- Pill shape: `"Verified . 0.92"` / `"Suspicious . 0.54"` / `"Bot . 0.12"`
- Color-coded by classification
- Replaces current TrustBadge text

**Layer 2 — Hover popover** (3 headline stats):
- Reviews: total review count
- Consistency: cumulative score from jitter_profiles
- WAR: this session's score

**Layer 3 — Click -> profile** (ProfileJitterCard):
- WAR as hero stat (big number, tier ring)
- Existing deep stats below (per-key fingerprint, etc.)

### 4. Data Flow

1. User types -> jitter-box.js captures silently (9 signals)
2. User submits -> jb.score() returns badge payload with continuous WAR
3. WAR + classification + full profile stored in jitter_samples with vote
4. Review card reads WAR from vote/sample join
5. Badge renders inline, popover pulls cumulative from jitter_profiles

### 5. Files to Change

| File | Change |
|------|--------|
| `src/utils/jitter-box.js` | Replace flag-counter scorer with 9-signal weighted equation |
| `src/utils/jitter-box.js` | Add cross-signal correlation computation |
| `src/utils/jitter-box.js` | Add K-S distribution shape test |
| `src/components/TrustBadge.jsx` | Add WAR number, update colors for 3 states |
| `src/components/TrustBadge.jsx` | Update popover to show reviews/consistency/WAR |
| `src/components/ReviewFlow.jsx` | Wire jitter-box.js score into vote submission |
| `src/components/jitter/ProfileJitterCard.jsx` | Add WAR as hero stat |
| `src/pages/Dish.jsx` | Pass WAR data to TrustBadge in reviews |
| `supabase/schema.sql` | Ensure war_score + classification columns on jitter_samples |

### 6. Security Notes

- WAR weights are in client code (visible). This is fine — the signals themselves are the defense, not the weights.
- A bot that knows the weights still can't fake cross-signal correlation or log-normal distribution shape.
- Future hardening: sub-ms timestamp analysis, handedness detection, error dynamics (from patent research doc).

### 7. What's NOT in scope

- Force sensors / Hall Effect keyboard (patent claim, future hardware)
- Crypto certificates
- Session fingerprint dedup
- Replay detection
- Global Passport system
