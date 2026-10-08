import { NotificationBell } from './NotificationBell'
import { SettingsDropdown } from './SettingsDropdown'
import { Wordmark } from './Wordmark'

/**
 * TopBar - Brand anchor with WGH wordmark, settings gear, and notification bell
 */
export function TopBar() {
  return (
    <div className="top-bar">
      <div className="top-bar-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 12px' }}>
        {/* Spacer for symmetry */}
        <div style={{ width: '60px' }} />

        <Wordmark size={21} />

        {/* Settings + Notifications grouped right */}
        <div className="flex items-center">
          <SettingsDropdown />
          <NotificationBell />
        </div>
      </div>
    </div>
  )
}
