import { BottomNav } from './BottomNav'
import { WelcomeSplash } from './WelcomeSplash'
import { TopBar } from './TopBar'

export function Layout({ children }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg)',
        minHeight: '100dvh',
        // 64px nav + safe area inset for devices with home indicator
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 16px))',
      }}
    >
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[99999] focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium"
        style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
      >
        Skip to main content
      </a>
      <WelcomeSplash />
      <TopBar />
      <main id="main-content">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
