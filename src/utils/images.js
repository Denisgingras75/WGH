/**
 * Image utilities for responsive image loading
 */

/**
 * Check if URL is from Unsplash (supports width parameter)
 */
function isUnsplashUrl(url) {
  return url?.includes('images.unsplash.com')
}

/**
 * Check if URL is from Supabase storage
 */
function isSupabaseStorageUrl(url) {
  return url?.includes('supabase.co/storage')
}

/**
 * Get responsive image props with srcSet for supported image hosts
 * @param {string} url - Original image URL
 * @param {number[]} widths - Array of widths for srcSet (e.g., [400, 600, 800])
 * @returns {Object} Props object with src and optionally srcSet
 */
export function getResponsiveImageProps(url, widths = [400, 600, 800]) {
  if (!url) {
    return { src: '' }
  }

  // Unsplash images support width parameter
  if (isUnsplashUrl(url)) {
    try {
      // Use URL parsing for robust parameter handling
      const urlObj = new URL(url)
      urlObj.searchParams.delete('w')
      urlObj.searchParams.delete('q')

      const srcSet = widths
        .map(w => {
          const u = new URL(urlObj.href)
          u.searchParams.set('w', w)
          u.searchParams.set('q', '80')
          return `${u.href} ${w}w`
        })
        .join(', ')

      // Default src uses middle width
      const defaultWidth = widths[Math.floor(widths.length / 2)]
      urlObj.searchParams.set('w', defaultWidth)
      urlObj.searchParams.set('q', '80')

      return { src: urlObj.href, srcSet }
    } catch {
      // If URL parsing fails, return original
      return { src: url }
    }
  }

  // Supabase storage with image transformation
  // Rewrites /storage/v1/object/public/... → /storage/v1/render/image/public/...?width=N&quality=80
  if (isSupabaseStorageUrl(url)) {
    try {
      const urlObj = new URL(url)
      // Only rewrite if it's an object URL (not already a render URL)
      if (urlObj.pathname.includes('/storage/v1/object/public/')) {
        urlObj.pathname = urlObj.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
        urlObj.searchParams.delete('width')
        urlObj.searchParams.delete('quality')

        const srcSet = widths
          .map(w => {
            const u = new URL(urlObj.href)
            u.searchParams.set('width', w)
            u.searchParams.set('quality', '80')
            return `${u.href} ${w}w`
          })
          .join(', ')

        const defaultWidth = widths[Math.floor(widths.length / 2)]
        urlObj.searchParams.set('width', defaultWidth)
        urlObj.searchParams.set('quality', '80')

        return { src: urlObj.href, srcSet }
      }
    } catch {
      // If URL parsing fails, fall through to original URL
    }
    return { src: url }
  }

  // Default: return original URL without srcSet
  return { src: url }
}

/**
 * Get optimized thumbnail URL
 * @param {string} url - Original image URL
 * @param {number} width - Desired thumbnail width
 * @returns {string} Optimized URL
 */
export function getThumbnailUrl(url, width = 400) {
  if (!url) return ''

  if (isUnsplashUrl(url)) {
    try {
      const urlObj = new URL(url)
      urlObj.searchParams.set('w', width)
      urlObj.searchParams.set('q', '80')
      return urlObj.href
    } catch {
      return url
    }
  }

  return url
}
