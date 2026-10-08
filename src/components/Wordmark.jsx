/**
 * Wordmark — the "What's Good Here" brand lockup.
 * Serif display type with "Good" set in italic. Sized in em, so pass `size`
 * (px) and the whole lockup scales with it.
 */
export function Wordmark({ size = 20, as = 'span', className = '', style }) {
  var Tag = as
  return (
    <Tag className={'wordmark ' + className} style={Object.assign({ fontSize: size + 'px' }, style)}>
      What{'’'}s <span className="wordmark__good">Good</span> Here
    </Tag>
  )
}
