/**
 * Wordmark — the "What's Good Here" brand lockup.
 * Condensed display type with "Good" on a butter sticker. Sized entirely in em,
 * so pass `size` (px) and everything — outline, shadow, tilt — scales with it.
 */
export function Wordmark({ size = 20, as = 'span', className = '', style }) {
  var Tag = as
  return (
    <Tag className={'wordmark ' + className} style={Object.assign({ fontSize: size + 'px' }, style)}>
      What{'’'}s <span className="wordmark__good">Good</span> Here
    </Tag>
  )
}
