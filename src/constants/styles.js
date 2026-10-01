// Shared UI recipes (site-wide style contract). Colors stay CSS variables from
// src/index.css; this file only keeps the repeated class/style combos in one place
// so a brand tweak is a one-line change.

// Amatic SC display heading: page h1s and section headers. Add fontSize per use
// (28 detail header, 32 top-level page, 24 section header).
export const AMATIC_TITLE = {
  fontFamily: "'Amatic SC', cursive",
  fontWeight: 700,
  letterSpacing: '0.02em',
  lineHeight: 1.1,
  color: 'var(--color-text-primary)',
}

// Buttons
export const PRIMARY_BUTTON_CLASS = 'py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]'
export const PRIMARY_BUTTON_STYLE = { background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }
export const SECONDARY_BUTTON_CLASS = 'py-3 px-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]'
export const SECONDARY_BUTTON_STYLE = { background: 'transparent', border: '1px solid var(--color-divider)', color: 'var(--color-text-primary)' }
// Ghost/text button that stands alone (44px hit area); add a gold or primary color
export const ROW_ACTION_CLASS = 'inline-flex items-center min-h-[44px] px-3 text-sm font-semibold'
export const DISABLED_STYLE = { background: 'var(--color-surface)', color: 'var(--color-text-tertiary)' }

// Standard content card (add rounded-xl p-4)
export const CARD_STYLE = { background: 'var(--color-card)', border: '1px solid var(--color-divider)' }

// Text inputs / textareas: 2px divider border that turns primary on focus (no ring).
// Inline styles must not set `border`/`borderColor` or they override the focus color.
export const INPUT_FOCUS_CLASS = 'border-2 border-[color:var(--color-divider)] focus:border-[color:var(--color-primary)] focus:outline-none transition-colors'
export const INPUT_CLASS = 'w-full px-4 py-3 rounded-xl text-sm ' + INPUT_FOCUS_CLASS
// Inputs inside a card / sheet sit on --color-bg; inputs directly on the page sit on --color-surface
export const INPUT_STYLE = { background: 'var(--color-bg)', color: 'var(--color-text-primary)' }
export const PAGE_INPUT_STYLE = { background: 'var(--color-surface)', color: 'var(--color-text-primary)' }
export const LABEL_CLASS = 'block text-sm font-medium mb-1.5'
export const LABEL_STYLE = { color: 'var(--color-text-secondary)' }
