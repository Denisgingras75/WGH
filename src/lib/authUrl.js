// Parses universal-link / deep-link URLs returning from email confirmation,
// password reset, or magic link. Returns null for anything not an auth return.
// Used by AuthLifecycle when @capacitor/app fires appUrlOpen.
//
// Recognized URL shapes:
//   /auth/callback?code=...&type=...   → generic callback (OAuth, magic, signup)
//   /reset-password?code=...           → Supabase resetPasswordForEmail redirect
//                                        (type is implicit; we force 'recovery')

const AUTH_PATH_PREFIX = '/auth/'
const RESET_PATH = '/reset-password'

export function parse(input) {
  if (!input || typeof input !== 'string') return null
  let url
  try {
    url = new URL(input)
  } catch {
    return null
  }
  const path = url.pathname
  const isAuthPath = path.startsWith(AUTH_PATH_PREFIX)
  // Accept exact /reset-password or /reset-password/... (trailing segment / slash)
  const isResetPath = path === RESET_PATH || path.startsWith(`${RESET_PATH}/`)
  if (!isAuthPath && !isResetPath) return null
  const code = url.searchParams.get('code')
  if (!code) return null
  // Reset-password redirect URLs don't carry ?type=; the path itself implies recovery.
  const rawType = isResetPath ? 'recovery' : url.searchParams.get('type')
  const type = normalizeType(rawType)
  return { code, type }
}

function normalizeType(raw) {
  if (raw === 'recovery') return 'recovery'
  if (raw === 'signup' || raw === 'confirm') return 'confirm'
  return 'magiclink'
}
