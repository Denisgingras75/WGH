import { PageHeader } from './PageHeader'

/**
 * InviteShell — standalone page shell for the invite-acceptance pages
 * (AcceptInvite, AcceptCuratorInvite): sticky back header, safe-area padding,
 * and a centered max-w-md content column.
 */
export function InviteShell({ children }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-bg)', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
    >
      <PageHeader standalone />
      <div className="flex-1 flex items-center">
        <div className="w-full max-w-2xl mx-auto px-4 py-6">
          <div className="text-center max-w-md mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InviteShell
