# Dish & Restaurant Page UI Polish — Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish restaurant and dish detail pages — sticky action bar, social-forward reviews, stronger typography hierarchy, more vibrant colors.

**Architecture:** Pure UI changes across 2 pages + 1 CSS file. No schema changes, no API changes, no new dependencies.

**Tech Stack:** React JSX, CSS variables (var(--color-*)), inline styles per WGH convention.

---

## 1. Sticky Bottom Action Bar

Both pages get `position: fixed; bottom: 0` action bar with backdrop blur.

**Restaurant page:** `[Order Now] [Directions]` — Order only if toast_slug exists
**Dish page:** `[Order This] [Directions]` — Order only if toast_slug exists

- Two equal-width buttons: Order (accent-orange bg) + Directions (accent-gold bg)
- Directions opens Google Maps: `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`
- Backdrop: `backdrop-filter: blur(12px)`, subtle top shadow
- White text on both buttons, bold, 16px icon + label
- `padding-bottom: env(safe-area-inset-bottom)` for iPhone notch
- Page content needs `pb-20` to avoid bar overlap
- Remove current inline Order Now / Order This buttons (replaced by sticky bar)
- Phone/Website/Social stay as info links in page body

## 2. Social-Forward Reviews

Each review card redesign:

- Avatar: 32px → 44px (`w-11 h-11`)
- Card gap: `space-y-2` → `space-y-4` (8px → 16px)
- Card background: `var(--color-card)` (white) instead of `var(--color-surface)` (beige)
- Card border: keep `1.5px solid var(--color-divider)`
- Card padding: `p-4` stays
- Left border accent: 3px colored bar based on rating (≥8 green, ≥6 gold, <6 coral)
- Rating gets own line: colored pill (`rounded-full px-2 py-0.5`) + sentiment icon + "Would order again"
- Username: `text-sm font-bold` stays
- Second line: timestamp + town/badge info, `text-xs`, `--color-text-secondary` (not tertiary)
- Review text: `lineHeight: 1.7`, `fontSize: '15px'`
- Verification row: keep as-is

## 3. Typography Refresh

**Page titles (restaurant name, dish name):**
- fontWeight: `bold/800` → `900`
- letterSpacing: `-0.02em` → `-0.03em`

**Section headers (REVIEWS, TOP RATED, etc.):**
- fontWeight: `700` → `800`
- Keep uppercase + tracking

**Restaurant name on dish page:**
- fontSize: `12px` → `14px`
- color: `--color-text-tertiary` → `--color-accent-gold`

**Score number on dish page:**
- Add `textShadow: '0 1px 2px rgba(0,0,0,0.1)'`

**Verdict pill ("Worth It" / "Skip It"):**
- Bolder background: increase opacity from muted to 0.2
- fontWeight: `bold` → `800`

**Metadata timestamps:**
- color: `--color-text-tertiary` → `--color-text-secondary` (more readable)

## 4. Color Vibrancy

No new CSS variables. Use existing with more punch:

- Review cards: white (`--color-card`) on beige page bg → more contrast
- Section dividers: 1px → 2px, `--color-divider`
- Rating colors in getRatingColor(): increase saturation slightly
- Accent gold links: full opacity, no muted variants for interactive elements
- Active tab indicator: sharper contrast
