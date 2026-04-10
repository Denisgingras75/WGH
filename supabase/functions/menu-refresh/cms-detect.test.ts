import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts'
import { detectCms, cmsRequiresRender } from './cms-detect.ts'

Deno.test('detects Wix by wixstatic URL', () => {
  const html = '<html><link href="https://static.wixstatic.com/main.css"></html>'
  assertEquals(detectCms(html, 'http://example.com'), 'wix')
})

Deno.test('detects Wix by wixsite in URL', () => {
  const html = '<html></html>'
  assertEquals(detectCms(html, 'https://example.wixsite.com/mysite'), 'wix')
})

Deno.test('detects Wix by parastorage asset URL', () => {
  const html = '<html><script src="https://static.parastorage.com/services/wix-thunderbolt/dist/main.js"></script></html>'
  assertEquals(detectCms(html, 'http://example.com'), 'wix')
})

Deno.test('detects Wix Thunderbolt framework marker', () => {
  const html = '<html><script>window.viewerModel = {}; // Wix Thunderbolt</script></html>'
  assertEquals(detectCms(html, 'http://example.com'), 'wix')
})

Deno.test('detects Square Online by square-cdn', () => {
  const html = '<html><link href="https://square-cdn.com/styles.css"></html>'
  assertEquals(detectCms(html, 'http://example.com'), 'square')
})

Deno.test('detects Square Online by square.site URL', () => {
  const html = '<html></html>'
  assertEquals(detectCms(html, 'https://example.square.site/'), 'square')
})

Deno.test('detects Weebly by weeblycloud asset', () => {
  const html = '<html><link href="https://cdn2.editmysite.com/css/main.css"></html>'
  assertEquals(detectCms(html, 'http://example.com'), 'weebly')
})

Deno.test('detects Squarespace by squarespace-cdn', () => {
  const html = '<html><link href="https://static1.squarespace.com/static/main.css"></html>'
  assertEquals(detectCms(html, 'http://example.com'), 'squarespace')
})

Deno.test('returns null for plain HTML with no CMS signatures', () => {
  const html = '<html><body><h1>My Restaurant</h1><p>Menu items here</p></body></html>'
  assertEquals(detectCms(html, 'http://example.com'), null)
})

Deno.test('returns null for WordPress (not a JS-rendered CMS)', () => {
  const html = '<html><link href="https://example.com/wp-content/themes/main.css"></html>'
  assertEquals(detectCms(html, 'http://example.com'), null)
})

Deno.test('case-insensitive URL matching', () => {
  const html = '<html></html>'
  assertEquals(detectCms(html, 'https://EXAMPLE.WIXSITE.COM/'), 'wix')
})

Deno.test('cmsRequiresRender: wix/square/weebly need render, squarespace does not', () => {
  assertEquals(cmsRequiresRender('wix'), true)
  assertEquals(cmsRequiresRender('square'), true)
  assertEquals(cmsRequiresRender('weebly'), true)
  assertEquals(cmsRequiresRender('squarespace'), false)
  assertEquals(cmsRequiresRender(null), false)
})
