/**
 * WghLogo — Location pin with island silhouette inside.
 * Uses the actual mv-outline.png image inside a pin shape.
 */
export function WghLogo({ size = 64, color = 'var(--color-primary)', className = '', style = {} }) {
  const pinHeight = size * 1.3

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: pinHeight,
        ...style,
      }}
    >
      {/* Pin shape */}
      <svg
        width={size}
        height={pinHeight}
        viewBox="0 0 24 31"
        fill="none"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          fill={color}
        />
      </svg>
      {/* MV island image — centered in the pin head */}
      <img
        src="/mv-outline.webp"
        alt=""
        style={{
          position: 'absolute',
          top: size * 0.15,
          left: size * 0.2,
          width: size * 0.6,
          height: 'auto',
          filter: 'brightness(0) invert(1)',
          opacity: 0.9,
        }}
        draggable={false}
      />
    </div>
  )
}
