import { NotificationBell } from './NotificationBell'
import { SettingsDropdown } from './SettingsDropdown'

/**
 * TopBar - Brand anchor with WGH wordmark, settings gear, and notification bell
 */
export function TopBar() {
  return (
    <div className="top-bar">
      <div className="top-bar-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 12px' }}>
        {/* Spacer for symmetry */}
        <div style={{ width: '60px' }} />

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
          What's <span style={{ color: 'var(--color-accent-gold)' }}>Good</span> Here
        </span>

        {/* Settings + Notifications grouped right */}
        <div className="flex items-center">
          <SettingsDropdown />
          <NotificationBell />
        </div>
      </div>
    </div>
  )
}
