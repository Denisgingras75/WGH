import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA with service worker for asset caching
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Cache JS, CSS, and image assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff2}'],
        // Allow larger files (splash image is ~2.4MB)
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB
        // Force new SW to take over immediately
        skipWaiting: true,
        clientsClaim: true,
        // Clean up old precache entries from previous SW versions
        cleanupOutdatedCaches: true,
        // Runtime caching for API calls and images
        runtimeCaching: [
          {
            // Cache Supabase storage images
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache Unsplash images
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Note: Supabase REST is NOT cached by the service worker.
          // React Query handles staleness and revalidation — caching here
          // would serve stale votes/reviews during flaky network.
        ],
      },
      // Minimal manifest (no installable PWA, just service worker)
      manifest: false,
    }),
    // Bundle analyzer - generates stats.html after build
    // Run: npm run build && open stats.html
    visualizer({
      filename: 'stats.html',
      open: false, // Don't auto-open
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - cached separately from app code
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          // Note: Sentry and PostHog are lazy-loaded via dynamic import
          // They get their own chunks automatically, not loaded on initial page
        },
      },
    },
  },
})
