/* global React */
const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

/* =============================================================
   ATOMS — small reusable bits
   ============================================================= */

// Rating display: editorial "9.2" with subtle context
function Rating({ value, votes, size = 'md' }) {
  if (value == null) return null;
  const sz = { sm: 14, md: 18, lg: 28, xl: 44 }[size] || 18;
  const lh = { sm: 14, md: 18, lg: 28, xl: 44 }[size] || 18;
  const tone = value >= 9 ? 'var(--color-primary)' : value >= 8 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)';
  return (
    <span className="stat-num" style={{ fontSize: sz, lineHeight: `${lh}px`, color: tone }}>
      {Number(value).toFixed(1)}
    </span>
  );
}

// "Worth It" / "Skip" stamp — tiny, hand-stampy
function VoteStamp({ wouldAgain, size = 'sm' }) {
  const isWorth = wouldAgain;
  return (
    <span
      className="stamp"
      style={{
        color: isWorth ? 'var(--color-success)' : 'var(--color-text-tertiary)',
        background: isWorth ? 'rgba(22,163,74,0.06)' : 'rgba(118,118,118,0.06)',
        fontSize: size === 'lg' ? 12 : 10,
      }}
    >
      {isWorth ? '✓ Worth it' : '✗ Skip'}
    </span>
  );
}

// % "Worth It" badge — used in dish rows
function WorthBadge({ pct }) {
  if (pct == null) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 11, fontWeight: 600,
      color: pct >= 90 ? 'var(--color-success)' : 'var(--color-text-secondary)',
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      {pct}%<span style={{ fontSize: 9, opacity: 0.7 }}>worth</span>
    </span>
  );
}

// Dish thumbnail — emoji over warm tile (placeholder for real photos)
function DishThumb({ emoji, size = 56, rounded = 12 }) {
  return (
    <div className="dish-thumb" style={{ width: size, height: size, borderRadius: rounded, fontSize: size * 0.5 }}>
      {emoji || '🍽'}
    </div>
  );
}

// Section header w/ editorial eyebrow + optional rule
function SectionHead({ eyebrow, title, action, rule = true }) {
  return (
    <div style={{ padding: '20px 16px 8px' }}>
      {eyebrow && <div className="section-eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
      <div className="flex items-baseline justify-between" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0 }}>
          {title}
        </h2>
        {action}
      </div>
      {rule && <div className="rule" style={{ marginTop: 10 }} />}
    </div>
  );
}

// Tiny rank number (newspaper-style)
function RankNum({ n, size = 'md' }) {
  const sz = size === 'lg' ? 36 : size === 'sm' ? 16 : 24;
  return (
    <span className="font-display" style={{
      fontSize: sz, fontWeight: 700, lineHeight: 1,
      color: n === 1 ? 'var(--color-medal-gold)' : n === 2 ? 'var(--color-medal-silver)' : n === 3 ? 'var(--color-medal-bronze)' : 'var(--color-text-tertiary)',
      letterSpacing: '-0.04em',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {String(n).padStart(2, '0')}
    </span>
  );
}

// Town pill (subtle)
function TownPill({ town }) {
  if (!town) return null;
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, color: 'var(--color-text-tertiary)',
      letterSpacing: '0.02em',
    }}>
      {town}
    </span>
  );
}

// Honest delta tag — "you +0.8 vs crowd"
function DeltaTag({ mine, consensus }) {
  if (mine == null || consensus == null) return null;
  const d = mine - consensus;
  if (Math.abs(d) < 0.3) return <span className="delta-pill match">match</span>;
  const tone = d > 0 ? 'warm' : 'cool';
  const sign = d > 0 ? '+' : '−';
  return (
    <span className={`delta-pill ${tone}`}>
      {sign}{Math.abs(d).toFixed(1)} <span style={{ opacity: 0.7 }}>vs crowd</span>
    </span>
  );
}

// Compact icon
function Icon({ name, size = 20, stroke = 2, color = 'currentColor' }) {
  const props = { width: size, height: size, fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    search:    <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
    map:       <><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>,
    list:      <><path d="M3 6h18M3 12h18M3 18h18" /></>,
    home:      <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
    user:      <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0116 0v1" /></>,
    rest:      <><path d="M7 3v18M5 3h4v6a2 2 0 01-4 0V3z" /><path d="M17 3c2 0 3 2 3 5s-1 5-3 5v8" /></>,
    back:      <><path d="M15 18l-6-6 6-6" /></>,
    chev:      <><path d="M9 6l6 6-6 6" /></>,
    chevDown:  <><path d="M6 9l6 6 6-6" /></>,
    plus:      <><path d="M12 5v14M5 12h14" /></>,
    heart:     <><path d="M12 21s-8-5-8-12a5 5 0 019-3 5 5 0 019 3c0 7-8 12-8 12z" /></>,
    check:     <><path d="M5 12l5 5L20 7" /></>,
    x:         <><path d="M6 6l12 12M6 18L18 6" /></>,
    share:     <><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><path d="M16 6l-4-4-4 4M12 2v15" /></>,
    pin:       <><path d="M12 21s-7-7-7-12a7 7 0 0114 0c0 5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
    direction: <><circle cx="12" cy="12" r="9" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></>,
    star:      <><path d="M12 3l2.6 6 6.4.5-4.9 4.2 1.5 6.3L12 17l-5.6 3 1.5-6.3L3 9.5 9.4 9z" /></>,
    bookmark:  <><path d="M6 3h12v18l-6-4-6 4z" /></>,
    photo:     <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M21 17l-5-5-9 9" /></>,
    eye:       <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    edit:      <><path d="M12 20h9" /><path d="M16 4l4 4-12 12-5 1 1-5z" /></>,
    settings:  <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 010-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.6 1.6 0 001.8.3h.1a1.6 1.6 0 001-1.5V3a2 2 0 014 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8v.1a1.6 1.6 0 001.5 1H21a2 2 0 010 4h-.1a1.6 1.6 0 00-1.5 1z" /></>,
    flame:     <><path d="M12 2s5 5 5 11a5 5 0 01-10 0c0-2 1-3 1-3s2 2 2 4c0-3 2-7 2-12z" /></>,
    trend:     <><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></>,
    cal:       <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
    location:  <><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="9" /></>,
    clock:     <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  };
  return <svg viewBox="0 0 24 24" {...props}>{paths[name] || null}</svg>;
}

/* =============================================================
   STATUS BAR / HEADER for screens (inside iOS frame)
   ============================================================= */
function ScreenHeader({ title, eyebrow, onBack, rightSlot, sticky = true, transparent = false }) {
  return (
    <header style={{
      position: sticky ? 'sticky' : 'relative',
      top: 0, zIndex: 20,
      background: transparent ? 'transparent' : 'var(--color-bg)',
      borderBottom: transparent ? 'none' : '1px solid var(--color-divider)',
      padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
      backdropFilter: transparent ? 'none' : 'blur(12px) saturate(160%)',
    }}>
      {onBack && (
        <button onClick={onBack} className="tap" style={{
          width: 36, height: 36, borderRadius: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-primary)',
        }} aria-label="Back">
          <Icon name="back" size={20} stroke={2.5} />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow && <div className="section-eyebrow" style={{ fontSize: 10 }}>{eyebrow}</div>}
        {title && <div className="font-display" style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>}
      </div>
      {rightSlot}
    </header>
  );
}

/* Expose */
Object.assign(window, {
  Rating, VoteStamp, WorthBadge, DishThumb, SectionHead, RankNum, TownPill, DeltaTag, Icon, ScreenHeader,
});
