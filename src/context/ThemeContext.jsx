/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../lib/storage'
import { useAuth } from './AuthContext'
import { profileApi } from '../api/profileApi'
import { logger } from '../utils/logger'

// THEMES — shape is verbatim from Claude Design reference (designs/Whats Good Here.html).
// swatch: [paper, ink, accent-1, accent-2] — used only by the Design Studio preview.
// Actual theme tokens cascade via [data-theme="…"] blocks in claude-design.css.
export const THEMES = [
  { id: 'paper', name: 'Paper',        tag: 'Editorial · warm',       font: 'Fraunces',      swatch: ['#F4EFE8', '#1A1714', '#C5412A', '#B8893A'] },
  { id: 'dusk',  name: 'Dusk',         tag: 'Supper club · dim',      font: 'Fraunces',      swatch: ['#1C1B19', '#F3EADA', '#E56A4C', '#D9A655'] },
  { id: 'zine',  name: 'Zine',         tag: 'Punk · riso print',      font: 'Bowlby One SC', swatch: ['#F2EDE0', '#0A0A0A', '#FF2D87', '#FFE94A'] },
  { id: 'diner', name: 'Diner',        tag: 'Matchbook · retro',      font: 'Alfa Slab One', swatch: ['#F6EBD0', '#2B1810', '#C8201E', '#E5A22C'] },
  { id: 'chalk', name: 'Chalkboard',   tag: 'Blackboard · handwritten', font: 'Caveat Brush', swatch: ['#1E2A26', '#F5F0DF', '#F48F5A', '#FFD65C'] },
  { id: 'neon',  name: 'Neon Night',   tag: 'Vaporwave · glowing',    font: 'Archivo',       swatch: ['#0B0421', '#F8E9FF', '#FF3C9A', '#3BF4E8'] },
]

const THEME_IDS = THEMES.map(function (t) { return t.id })

export function getTheme(id) {
  return THEMES.find(function (t) { return t.id === id }) || THEMES[0]
}

function isValidTheme(id) {
  return typeof id === 'string' && THEME_IDS.indexOf(id) !== -1
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const { user } = useAuth()

  const [theme, setThemeState] = useState(function () {
    const stored = getStorageItem(STORAGE_KEYS.THEME)
    if (isValidTheme(stored)) return stored
    return 'paper'
  })

  // Social theme override: when visiting another user's profile/list, we re-skin
  // the app in their theme for the duration. null = use own theme.
  const [overrideTheme, setOverrideThemeState] = useState(null)

  const [studioMode, setStudioMode] = useState(null) // null | 'onboard' | 'edit'
  const didScheduleOnboard = useRef(false)
  const hydratedFromProfileRef = useRef(false)

  // First-run auto-open at 400ms per spec — only if not onboarded
  useEffect(function () {
    if (didScheduleOnboard.current) return
    didScheduleOnboard.current = true
    if (getStorageItem(STORAGE_KEYS.THEMED)) return
    const t = setTimeout(function () {
      if (!getStorageItem(STORAGE_KEYS.THEMED)) setStudioMode('onboard')
    }, 400)
    return function () { clearTimeout(t) }
  }, [])

  // Hydrate theme from the user's profile on first auth — overrides localStorage
  // if the profile has a server-side preference set (they might be on a new device).
  // Graceful fallback: if profiles.theme column doesn't exist yet (migration pending),
  // swallow the error and keep using local state.
  useEffect(function () {
    if (!user) {
      hydratedFromProfileRef.current = false
      return
    }
    if (hydratedFromProfileRef.current) return
    hydratedFromProfileRef.current = true

    let cancelled = false
    profileApi.getProfile(user.id)
      .then(function (p) {
        if (cancelled || !p) return
        if (isValidTheme(p.theme) && p.theme !== getStorageItem(STORAGE_KEYS.THEME)) {
          setThemeState(p.theme)
          setStorageItem(STORAGE_KEYS.THEME, p.theme)
          setStorageItem(STORAGE_KEYS.THEMED, '1')
        }
      })
      .catch(function (err) {
        // Column may not exist yet — that's fine, localStorage drives the experience
        logger.debug('Theme hydrate skipped:', err)
      })
    return function () { cancelled = true }
  }, [user])

  const setTheme = useCallback(function (next) {
    if (!isValidTheme(next)) return
    setThemeState(next)
    setStorageItem(STORAGE_KEYS.THEME, next)
    setStorageItem(STORAGE_KEYS.THEMED, '1')
    // Fire-and-forget persist to server. Swallow errors (offline / column missing / RLS).
    if (user) {
      profileApi.updateProfile({ theme: next }).catch(function (err) {
        logger.debug('Theme persist failed:', err)
      })
    }
  }, [user])

  const openStudio = useCallback(function () { setStudioMode('edit') }, [])
  const closeStudio = useCallback(function () {
    setStudioMode(null)
    setStorageItem(STORAGE_KEYS.THEMED, '1')
  }, [])

  // Imperative social-override control — consumed via the useOverrideTheme hook below.
  // Public shape on the context to keep the one-way flow obvious from consumer site.
  const setOverrideTheme = useCallback(function (id) {
    setOverrideThemeState(isValidTheme(id) ? id : null)
  }, [])

  const effectiveTheme = overrideTheme || theme

  // Apply data-theme on <html> so every page (prototype + legacy Layout pages) cascades.
  // PrototypeApp also applies data-theme on .app-shell for its own subtree — both point
  // at the same effective theme, so they agree.
  useEffect(function () {
    document.documentElement.setAttribute('data-theme', effectiveTheme)
    return function () { document.documentElement.removeAttribute('data-theme') }
  }, [effectiveTheme])

  // Legacy hash triggers for manual open / reset during dev
  useEffect(function () {
    function checkHash() {
      const h = window.location.hash
      if (h === '#studio') {
        setStudioMode('edit')
        history.replaceState(null, '', window.location.pathname + window.location.search)
      } else if (h === '#reset-theme') {
        try {
          localStorage.removeItem(STORAGE_KEYS.THEME)
          localStorage.removeItem(STORAGE_KEYS.THEMED)
        } catch (_e) { /* ignore */ }
        setThemeState('paper')
        setStudioMode('onboard')
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return function () { window.removeEventListener('hashchange', checkHash) }
  }, [])

  // Expose window.__openStudio so legacy ported buttons ("Design your feed", etc.)
  // that use `onClick={()=>window.__openStudio && window.__openStudio()}` keep working.
  useEffect(function () {
    window.__openStudio = function () { setStudioMode('edit') }
    return function () { try { delete window.__openStudio } catch (_e) { /* ignore */ } }
  }, [])

  const value = {
    theme: theme,
    effectiveTheme: effectiveTheme,
    setTheme: setTheme,
    overrideTheme: overrideTheme,
    setOverrideTheme: setOverrideTheme,
    openStudio: openStudio,
    closeStudio: closeStudio,
    studioMode: studioMode,
    studioOpen: studioMode !== null,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}

/**
 * Apply another user's theme for the duration this component is mounted.
 * Used on `/user/:userId` and public list pages — when a visitor lands on
 * someone else's content, the app re-skins in that user's theme. On unmount,
 * the visitor's own theme is restored. Passing null/undefined is a no-op.
 */
export function useOverrideTheme(themeId) {
  const ctx = useContext(ThemeContext)
  useEffect(function () {
    if (!ctx) return
    if (!isValidTheme(themeId)) return
    ctx.setOverrideTheme(themeId)
    return function () { ctx.setOverrideTheme(null) }
  }, [ctx, themeId])
}
