import { NavLink } from 'react-router-dom'
import { prefetchRoutes } from '../App'

export function BottomNav() {
  const tabs = [
    {
      to: '/restaurants',
      label: 'Spots',
      prefetch: prefetchRoutes.restaurants,
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      ),
    },
    {
      to: '/',
      label: 'Home',
      prefetch: prefetchRoutes.map,
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5z" />
        </svg>
      ),
    },
    {
      to: '/profile',
      label: 'You',
      prefetch: prefetchRoutes.profile,
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="8" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </svg>
      ),
    },
  ]

  return (
    <nav
      aria-label="Main navigation"
      className="navbar"
      style={{ gridTemplateColumns: 'repeat(' + tabs.length + ', 1fr)' }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          onMouseEnter={() => tab.prefetch?.()}
          onFocus={() => tab.prefetch?.()}
          className={({ isActive }) => 'nav-btn press' + (isActive ? ' active' : '')}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
