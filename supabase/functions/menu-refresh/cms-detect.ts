/**
 * Detect the CMS powering a website from its raw HTML and URL.
 * Returns the CMS id if it's a JS-rendered platform where raw HTML extraction will likely fail,
 * or null if it's plain/server-rendered HTML that should work with normal fetching.
 *
 * We only return a CMS id for platforms where the raw HTML response is essentially
 * a JavaScript framework loader, not actual content. WordPress, plain HTML, etc.
 * return null because those work fine with the existing extraction pipeline.
 */
export type CmsId = 'wix' | 'square' | 'weebly' | 'squarespace'

interface CmsSignature {
  id: CmsId
  urlPatterns: RegExp[]
  htmlPatterns: RegExp[]
}

const SIGNATURES: CmsSignature[] = [
  {
    id: 'wix',
    urlPatterns: [
      /\.wixsite\.com/i,
      /\.wix\.com/i,
    ],
    htmlPatterns: [
      /static\.wixstatic\.com/i,
      /static\.parastorage\.com/i,
      /wix-thunderbolt/i,
      /viewerModel/,
    ],
  },
  {
    id: 'square',
    urlPatterns: [
      /\.square\.site/i,
    ],
    htmlPatterns: [
      /square-cdn\.com/i,
      /squareup\.com\/online/i,
      /data-square-merchant-id/i,
    ],
  },
  {
    id: 'weebly',
    urlPatterns: [
      /\.weebly\.com/i,
    ],
    htmlPatterns: [
      /editmysite\.com/i,
      /weeblycloud\.com/i,
    ],
  },
  {
    id: 'squarespace',
    urlPatterns: [
      /\.squarespace\.com/i,
    ],
    htmlPatterns: [
      /static1\.squarespace\.com/i,
      /squarespace-cdn\.com/i,
    ],
  },
]

export function detectCms(html: string, url: string): CmsId | null {
  for (const sig of SIGNATURES) {
    for (const pattern of sig.urlPatterns) {
      if (pattern.test(url)) return sig.id
    }
    for (const pattern of sig.htmlPatterns) {
      if (pattern.test(html)) return sig.id
    }
  }
  return null
}

/**
 * Returns true if the CMS is known to require JavaScript rendering to surface menu content.
 * Squarespace actually serves content in raw HTML, so it's included for detection but not
 * marked as requiring render.
 */
export function cmsRequiresRender(cms: CmsId | null): boolean {
  return cms === 'wix' || cms === 'square' || cms === 'weebly'
}
