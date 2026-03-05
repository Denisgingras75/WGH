import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * JitterBadge — Waveform-based verification badge for keystroke biometrics.
 *
 * The waveform is the brand: lively peaks = human, flatline = bot.
 * Four states: verified (green), suspicious (amber), bot (red), ai-estimated (blue dashed).
 *
 * Props:
 *   warScore     — 0.0-1.0 WAR score (null = ai_estimated)
 *   classification — 'verified' | 'suspicious' | 'bot' | 'ai_estimated' (fallback if no warScore)
 *   stats        — { reviews, consistency, war } for hover popover
 *   onProfileClick — callback when badge is clicked (navigate to profile)
 *   size         — 'sm' (inline) | 'md' (card) | 'lg' (profile hero)
 *   animate      — enable waveform pulse animation (default true)
 */

// ── State configs ────────────────────────────────────────────────────

var STATES = {
  verified: {
    label: 'Verified',
    color: 'var(--color-rating, #16a34a)',
    // rgba needed for translucent backgrounds — CSS vars can't do opacity in inline styles
    bg: 'rgba(22, 163, 74, 0.10)',
    bgHover: 'rgba(22, 163, 74, 0.16)',
    glow: '0 0 8px rgba(22, 163, 74, 0.25)',
    // Lively irregular peaks — human rhythm
    wave: [0.3, 0.7, 0.45, 0.9, 0.35, 0.75, 0.5, 0.85, 0.4, 0.65],
    dash: null,
  },
  suspicious: {
    label: 'Suspicious',
    color: 'var(--color-amber, #d97706)',
    bg: 'rgba(217, 119, 6, 0.08)',
    bgHover: 'rgba(217, 119, 6, 0.14)',
    glow: '0 0 8px rgba(217, 119, 6, 0.20)',
    // Flattening — losing human signature
    wave: [0.4, 0.55, 0.42, 0.6, 0.38, 0.52, 0.44, 0.56, 0.41, 0.5],
    dash: null,
  },
  bot: {
    label: 'Bot',
    color: 'var(--color-danger, #dc2626)',
    bg: 'rgba(220, 38, 38, 0.08)',
    bgHover: 'rgba(220, 38, 38, 0.14)',
    glow: '0 0 8px rgba(220, 38, 38, 0.20)',
    // Flatline — dead rhythm
    wave: [0.48, 0.5, 0.49, 0.5, 0.5, 0.49, 0.5, 0.48, 0.5, 0.49],
    dash: null,
  },
  ai_estimated: {
    label: 'AI Est.',
    color: 'var(--color-blue, #2563eb)',
    bg: 'rgba(37, 99, 235, 0.08)',
    bgHover: 'rgba(37, 99, 235, 0.14)',
    glow: '0 0 8px rgba(37, 99, 235, 0.20)',
    // Synthetic wave — too regular, dashed
    wave: [0.3, 0.7, 0.3, 0.7, 0.3, 0.7, 0.3, 0.7, 0.3, 0.7],
    dash: '3,2',
  },
}

// ── Resolve state from props ──────────────────────────────────────────

function resolveState(warScore, classification) {
  if (warScore != null) {
    if (warScore >= 0.80) return 'verified'
    if (warScore >= 0.50) return 'suspicious'
    return 'bot'
  }
  if (classification && STATES[classification]) return classification
  return 'ai_estimated'
}

// ── SVG Waveform ──────────────────────────────────────────────────────

function Waveform({ points, color, dash, width, height, animate, stateKey }) {
  var padding = 2
  var usableW = width - padding * 2
  var usableH = height - padding * 2
  var step = usableW / (points.length - 1)

  // Build smooth curve through points
  var pathParts = []
  for (var i = 0; i < points.length; i++) {
    var x = padding + i * step
    var y = padding + usableH * (1 - points[i])
    if (i === 0) {
      pathParts.push('M ' + x + ' ' + y)
    } else {
      // Quadratic bezier for smooth curves
      var prevX = padding + (i - 1) * step
      var prevY = padding + usableH * (1 - points[i - 1])
      var cpX = (prevX + x) / 2
      pathParts.push('Q ' + cpX + ' ' + prevY + ' ' + x + ' ' + y)
    }
  }

  var pathD = pathParts.join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={'0 0 ' + width + ' ' + height}
      fill="none"
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Glow layer */}
      <path
        d={pathD}
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dash || 'none'}
        opacity={0.3}
        style={{ filter: 'blur(2px)' }}
      />
      {/* Main stroke */}
      <path
        d={pathD}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dash || 'none'}
        className={animate && !dash ? 'jitter-wave-pulse' : undefined}
      />
    </svg>
  )
}

// ── Popover ───────────────────────────────────────────────────────────

function JitterPopover({ stats, state, warScore }) {
  var cfg = STATES[state]
  var rows = []

  if (stats) {
    if (stats.reviews != null) rows.push({ label: 'Reviews', value: String(stats.reviews) })
    if (stats.consistency != null) rows.push({ label: 'Consistency', value: Number(stats.consistency).toFixed(2) })
  }
  if (warScore != null) rows.push({ label: 'WAR', value: Number(warScore).toFixed(2) })
  rows.push({ label: 'Classification', value: cfg.label })

  return (
    <div
      className="absolute z-50 rounded-lg shadow-lg"
      style={{
        left: 0,
        top: '100%',
        marginTop: '6px',
        background: 'var(--color-card, #fff)',
        border: '1px solid var(--color-divider, #e5e0db)',
        padding: '10px 14px',
        minWidth: '170px',
        fontSize: '11px',
        lineHeight: 1.5,
      }}
    >
      {/* Mini waveform header */}
      <div className="flex items-center gap-2" style={{ marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid var(--color-divider, #e5e0db)' }}>
        <Waveform points={cfg.wave} color={cfg.color} dash={cfg.dash} width={32} height={12} animate={false} stateKey={state} />
        <span style={{ fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace", fontWeight: 700, fontSize: '10px', letterSpacing: '0.06em', color: cfg.color, textTransform: 'uppercase' }}>
          jitter
        </span>
      </div>

      {/* Stat rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {rows.map(function (row) {
          return (
            <div key={row.label} className="flex justify-between" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: 'var(--color-text-tertiary, #999)' }}>{row.label}</span>
              <span style={{ color: 'var(--color-text-primary, #1a1a1a)', fontWeight: 600, fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: '11px' }}>{row.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Size presets ───────────────────────────────────────────────────────

var SIZES = {
  sm: { waveW: 28, waveH: 12, fontSize: '10px', scoreFontSize: '10px', pad: '3px 8px 3px 6px', gap: '4px', wordmark: false },
  md: { waveW: 36, waveH: 14, fontSize: '11px', scoreFontSize: '11px', pad: '4px 10px 4px 8px', gap: '5px', wordmark: true },
  lg: { waveW: 48, waveH: 18, fontSize: '13px', scoreFontSize: '14px', pad: '6px 14px 6px 10px', gap: '6px', wordmark: true },
}

// ── Main component ────────────────────────────────────────────────────

export function JitterBadge({ warScore, classification, stats, onProfileClick, size, animate }) {
  var _size = size || 'sm'
  var _animate = animate !== false
  var [hovered, setHovered] = useState(false)
  var [popoverVisible, setPopoverVisible] = useState(false)
  var hideTimeout = useRef(null)

  var state = resolveState(warScore, classification)
  var cfg = STATES[state]
  var sz = SIZES[_size] || SIZES.sm

  var showPopover = useCallback(function () {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current)
      hideTimeout.current = null
    }
    setPopoverVisible(true)
    setHovered(true)
  }, [])

  var hidePopover = useCallback(function () {
    hideTimeout.current = setTimeout(function () {
      setPopoverVisible(false)
      setHovered(false)
    }, 150)
  }, [])

  useEffect(function () {
    return function () {
      if (hideTimeout.current) clearTimeout(hideTimeout.current)
    }
  }, [])

  var hasPopover = stats != null || warScore != null

  return (
    <span
      className="inline-flex items-center relative"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sz.gap,
        padding: sz.pad,
        borderRadius: '999px',
        background: hovered ? cfg.bgHover : cfg.bg,
        border: '1px solid ' + (hovered ? cfg.color + '33' : 'transparent'),
        boxShadow: hovered ? cfg.glow : 'none',
        cursor: onProfileClick ? 'pointer' : hasPopover ? 'default' : 'default',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        position: 'relative',
        lineHeight: 1,
      }}
      onClick={onProfileClick || undefined}
      onMouseEnter={hasPopover ? showPopover : undefined}
      onMouseLeave={hasPopover ? hidePopover : undefined}
      role={onProfileClick ? 'button' : undefined}
      aria-label={'Jitter ' + cfg.label + (warScore != null ? ' ' + Number(warScore).toFixed(2) : '')}
    >
      {/* Waveform icon */}
      <Waveform
        points={cfg.wave}
        color={cfg.color}
        dash={cfg.dash}
        width={sz.waveW}
        height={sz.waveH}
        animate={_animate}
        stateKey={state}
      />

      {/* Wordmark — md and lg only */}
      {sz.wordmark && (
        <span
          style={{
            fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontWeight: 700,
            fontSize: sz.fontSize,
            letterSpacing: '0.05em',
            color: cfg.color,
            textTransform: 'lowercase',
          }}
        >
          jitter
        </span>
      )}

      {/* Score number */}
      {warScore != null && (
        <span
          style={{
            fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontWeight: 600,
            fontSize: sz.scoreFontSize,
            color: cfg.color,
            opacity: 0.9,
          }}
        >
          {Number(warScore).toFixed(2)}
        </span>
      )}

      {/* Label for ai_estimated (no score) */}
      {warScore == null && (
        <span
          style={{
            fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontWeight: 600,
            fontSize: sz.scoreFontSize,
            color: cfg.color,
            opacity: 0.85,
            letterSpacing: '0.02em',
          }}
        >
          {cfg.label}
        </span>
      )}

      {/* Popover */}
      {popoverVisible && hasPopover && (
        <JitterPopover stats={stats} state={state} warScore={warScore} />
      )}
    </span>
  )
}

// ── CSS injection (pulse animation) ───────────────────────────────────

var styleId = 'jitter-badge-styles'
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  var style = document.createElement('style')
  style.id = styleId
  style.textContent = [
    '@keyframes jitter-pulse {',
    '  0%, 100% { opacity: 1; }',
    '  50% { opacity: 0.7; }',
    '}',
    '.jitter-wave-pulse {',
    '  animation: jitter-pulse 3s ease-in-out infinite;',
    '}',
  ].join('\n')
  document.head.appendChild(style)
}

export default JitterBadge
