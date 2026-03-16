/**
 * Hero Identity Card for the Profile page
 * Centered layout: avatar, name, stats row
 */
export function HeroIdentityCard({
  user,
  profile,
  stats,
  followCounts,
  editingName,
  newName,
  nameStatus,
  setEditingName,
  setNewName,
  setNameStatus,
  handleSaveName,
  setFollowListModal,
}) {
  return (
    <div
      className="relative px-4 pt-8 pb-5 overflow-hidden"
      style={{
        background: 'var(--color-bg)',
        borderBottom: '3px double var(--color-text-primary)',
      }}
    >

      {/* Centered avatar */}
      <div className="flex flex-col items-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-text-on-primary)',
            boxShadow: '0 0 0 3px var(--color-primary-muted)',
          }}
        >
          {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
        </div>

        {/* Display Name */}
        <div className="mt-3 text-center">
          {editingName ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value.replace(/\s/g, ''))}
                    className="w-48 px-3 py-1.5 border rounded-lg text-lg font-bold text-center focus:outline-none pr-8"
                    style={{
                      background: 'var(--color-surface-elevated)',
                      borderColor: nameStatus === 'taken' ? 'var(--color-red)' : nameStatus === 'available' ? 'var(--color-emerald)' : 'var(--color-divider)',
                      color: 'var(--color-text-primary)'
                    }}
                    autoFocus
                    maxLength={30}
                  />
                  {nameStatus && nameStatus !== 'same' && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">
                      {nameStatus === 'checking' && '\u23F3'}
                      {nameStatus === 'available' && '\u2713'}
                      {nameStatus === 'taken' && '\u2717'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleSaveName}
                  disabled={nameStatus === 'taken' || nameStatus === 'checking'}
                  className="px-3 py-1 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingName(false)
                    setNewName(profile?.display_name || '')
                    setNameStatus(null)
                  }}
                  className="px-3 py-1 rounded-lg text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
              {nameStatus === 'taken' && (
                <p className="text-xs" style={{ color: 'var(--color-red)' }}>This username is already taken</p>
              )}
              {nameStatus === 'available' && (
                <p className="text-xs" style={{ color: 'var(--color-emerald)' }}>Username available!</p>
              )}
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="font-bold transition-colors inline-flex items-center gap-1.5"
              style={{
                fontFamily: 'var(--font-headline)',
                color: 'var(--color-text-primary)',
                fontSize: '20px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: '1.2',
              }}
            >
              {profile?.display_name || 'Set your name'}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
            </button>
          )}
        </div>

        {/* Stats row — dishes · restaurants · followers */}
        <div className="flex items-center gap-3 mt-3" style={{ fontSize: '13px' }}>
          {stats.totalVotes > 0 && (
            <>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.totalVotes}</span> dishes
              </span>
              {stats.uniqueRestaurants > 0 && (
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.uniqueRestaurants}</span> restaurants
                </span>
              )}
            </>
          )}
          <button
            onClick={() => setFollowListModal('followers')}
            className="hover:underline transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {followCounts.followers}
            </span> followers
          </button>
          <button
            onClick={() => setFollowListModal('following')}
            className="hover:underline transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {followCounts.following}
            </span> following
          </button>
        </div>
      </div>
    </div>
  )
}

export default HeroIdentityCard
