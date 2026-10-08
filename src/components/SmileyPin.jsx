/**
 * SmileyPin — The WGH mark.
 * Lobster pin silhouette (ink outline + hard offset shadow, sticker-style like the
 * food icons) → cream plate face → ink eyes with cream glisten → ink smile.
 *
 * Pass `animated` to enable the splash-screen pierce sequence (the whole pin drops from above,
 * then plate/eyes/smile reveal in turn, then a wink). Without it, the mark is rendered static —
 * suitable for headers, login, favicons.
 */
export function SmileyPin({ size = 64, animated = false, className = '', style = {} }) {
  const LOBSTER = 'var(--color-primary)'
  const INK = 'var(--color-ink)'
  const CREAM = 'var(--color-surface-elevated)'
  const PIN_PATH = 'M100 20 C60 20, 30 50, 30 90 C30 130, 100 185, 100 185 C100 185, 170 130, 170 90 C170 50, 140 20, 100 20 Z'

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={[animated ? 'pin-drop' : '', className].filter(Boolean).join(' ')}
      style={{ overflow: 'visible', display: 'block', ...style }}
      aria-hidden="true"
    >
      {/* Hard offset shadow, then the outlined pin */}
      <path d={PIN_PATH} fill={INK} transform="translate(7 7)" />
      <path d={PIN_PATH} fill={LOBSTER} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
      <circle className={animated ? 'plate-pop' : undefined} cx="100" cy="90" r="46" fill={CREAM} stroke={INK} strokeWidth="5" />
      {/* Left eye stays open; right eye winks when animated */}
      <circle className={animated ? 'eye left' : undefined} cx="84" cy="80" r="7" fill={INK} />
      <circle className={animated ? 'eye' : undefined} cx="116" cy="80" r="7" fill={INK} />
      <circle className={animated ? 'eye left' : undefined} cx="81.5" cy="77.5" r="2" fill={CREAM} opacity="0.95" />
      <circle className={animated ? 'eye' : undefined} cx="113.5" cy="77.5" r="2" fill={CREAM} opacity="0.95" />
      <path
        className={animated ? 'smile-draw' : undefined}
        d="M78 100 Q 100 124, 122 100"
        stroke={INK}
        strokeWidth="5.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
