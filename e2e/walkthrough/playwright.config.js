import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    viewport: { width: 390, height: 844 },
    geolocation: { latitude: 41.43, longitude: -70.56 },
    permissions: ['geolocation'],
  },
  projects: [
    {
      name: 'walkthrough',
      use: { browserName: 'chromium' },
    },
  ],
})
