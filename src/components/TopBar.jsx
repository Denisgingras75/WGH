import { NotificationBell } from './NotificationBell'
import { SettingsDropdown } from './SettingsDropdown'

/**
 * TopBar - Brand anchor with WGH wordmark, settings gear, and notification bell
 */
export function TopBar() {
  return (
    <header className="top-bar">
      <div className="top-bar-content" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%', padding: '0 12px' }}>
        {/* Empty left column keeps the wordmark centered regardless of the right group's width */}
        <div aria-hidden="true" />

        {/* WGH wordmark — centered, Amatic SC */}
        <span
          style={{
            fontFamily: "'Amatic SC', cursive",
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: '0.04em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          What's <span style={{ color: 'var(--color-primary)' }}>Good</span> Here
        </span>

        {/* Settings + Notifications grouped right */}
        <div className="flex items-center" style={{ justifySelf: 'end' }}>
          <SettingsDropdown />
          <NotificationBell />
        </div>
      </div>
    </header>
  )
}
