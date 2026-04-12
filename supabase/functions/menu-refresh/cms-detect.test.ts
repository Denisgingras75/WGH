import { describe, expect, it } from 'vitest'
import { detectCms, cmsRequiresRender } from './cms-detect.ts'

describe('cms-detect', () => {
it('detects Wix by wixstatic URL', () => {
  const html = '<html><link href="https://static.wixstatic.com/main.css"></html>'
  expect(detectCms(html, 'http://example.com')).toBe('wix')
})

it('detects Wix by wixsite in URL', () => {
  const html = '<html></html>'
  expect(detectCms(html, 'https://example.wixsite.com/mysite')).toBe('wix')
})

it('detects Wix by parastorage asset URL', () => {
  const html = '<html><script src="https://static.parastorage.com/services/wix-thunderbolt/dist/main.js"></script></html>'
  expect(detectCms(html, 'http://example.com')).toBe('wix')
})

it('detects Wix Thunderbolt framework marker', () => {
  const html = '<html><script>window.viewerModel = {}; // Wix Thunderbolt</script></html>'
  expect(detectCms(html, 'http://example.com')).toBe('wix')
})

it('detects Square Online by square-cdn', () => {
  const html = '<html><link href="https://square-cdn.com/styles.css"></html>'
  expect(detectCms(html, 'http://example.com')).toBe('square')
})

it('detects Square Online by square.site URL', () => {
  const html = '<html></html>'
  expect(detectCms(html, 'https://example.square.site/')).toBe('square')
})

it('detects Weebly by weeblycloud asset', () => {
  const html = '<html><link href="https://cdn2.editmysite.com/css/main.css"></html>'
  expect(detectCms(html, 'http://example.com')).toBe('weebly')
})

it('detects Squarespace by squarespace-cdn', () => {
  const html = '<html><link href="https://static1.squarespace.com/static/main.css"></html>'
  expect(detectCms(html, 'http://example.com')).toBe('squarespace')
})

it('returns null for plain HTML with no CMS signatures', () => {
  const html = '<html><body><h1>My Restaurant</h1><p>Menu items here</p></body></html>'
  expect(detectCms(html, 'http://example.com')).toBeNull()
})

it('returns null for WordPress (not a JS-rendered CMS)', () => {
  const html = '<html><link href="https://example.com/wp-content/themes/main.css"></html>'
  expect(detectCms(html, 'http://example.com')).toBeNull()
})

it('case-insensitive URL matching', () => {
  const html = '<html></html>'
  expect(detectCms(html, 'https://EXAMPLE.WIXSITE.COM/')).toBe('wix')
})

it('cmsRequiresRender: wix/square/weebly need render, squarespace does not', () => {
  expect(cmsRequiresRender('wix')).toBe(true)
  expect(cmsRequiresRender('square')).toBe(true)
  expect(cmsRequiresRender('weebly')).toBe(true)
  expect(cmsRequiresRender('squarespace')).toBe(false)
  expect(cmsRequiresRender(null)).toBe(false)
})
})
