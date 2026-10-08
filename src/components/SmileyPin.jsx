/**
 * SmileyPin — The WGH mark.
 * Flat brand-red pin silhouette → white plate face → ink eyes with a glint → ink smile.
 * The only place the brand red appears in the UI.
 *
 * Pass `animated` to enable the splash-screen pierce sequence (the whole pin drops from above,
 * then plate/eyes/smile reveal in turn, then a wink). Without it, the mark is rendered static —
 * suitable for headers, login, favicons.
 */
export function SmileyPin({ size = 64, animated = false, className = '', style = {} }) {
  const BRAND = 'var(--color-brand)'
  const INK = 'var(--color-ink)'
  const PLATE = 'var(--color-card)'
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
      <path d={PIN_PATH} fill={BRAND} />
      <circle className={animated ? 'plate-pop' : undefined} cx="100" cy="90" r="46" fill={PLATE} />
      {/* Left eye stays open; right eye winks when animated */}
      <circle className={animated ? 'eye left' : undefined} cx="84" cy="80" r="7" fill={INK} />
      <circle className={animated ? 'eye' : undefined} cx="116" cy="80" r="7" fill={INK} />
      <circle className={animated ? 'eye left' : undefined} cx="81.5" cy="77.5" r="2" fill={PLATE} opacity="0.95" />
      <circle className={animated ? 'eye' : undefined} cx="113.5" cy="77.5" r="2" fill={PLATE} opacity="0.95" />
      <path
        className={animated ? 'smile-draw' : undefined}
        d="M78 100 Q 100 124, 122 100"
        stroke={INK}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
