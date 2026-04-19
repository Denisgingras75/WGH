/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../lib/storage'

export var THEMES = [
  { id: 'paper', name: 'Paper', subtitle: 'Warm editorial (default)', swatch: ['#F4EFE8', '#1A1714', '#C5412A', '#B8893A'] },
  { id: 'dusk', name: 'Dusk', subtitle: 'Dark editorial', swatch: ['#1C1B19', '#F3EADA', '#E56A4C', '#D9A655'] },
  { id: 'zine', name: 'Zine Punk', subtitle: 'Magenta · cyan · canary', swatch: ['#F2EDE0', '#0A0A0A', '#FF2D87', '#FFE94A'] },
  { id: 'diner', name: 'Diner Chrome', subtitle: 'Ketchup · mustard · cream', swatch: ['#F6EBD0', '#2B1810', '#C8201E', '#E5A22C'] },
  { id: 'chalk', name: 'Chalkboard', subtitle: 'Slate board + chalk script', swatch: ['#1E2A26', '#F2F4EC', '#E8B54A', '#A8C970'] },
  { id: 'neon', name: 'Neon Night', subtitle: 'Vaporwave glow', swatch: ['#0E0B1F', '#F2F0FF', '#FF3D9A', '#00E0C7'] },
]

export var ThemeContext = createContext({ theme: 'paper', setTheme: function () {}, openStudio: function () {}, closeStudio: function () {}, studioOpen: false })

export function ThemeProvider({ children }) {
  var [theme, setThemeState] = useState(function () {
    var stored = getStorageItem(STORAGE_KEYS.THEME)
    if (stored && THEMES.some(function (t) { return t.id === stored })) return stored
    return 'paper'
  })

  var [studioOpen, setStudioOpen] = useState(function () {
    // Auto-open on first run (user hasn't picked a theme yet)
    return !getStorageItem(STORAGE_KEYS.THEMED)
  })

  var setTheme = useCallback(function (next) {
    if (!THEMES.some(function (t) { return t.id === next })) return
    setThemeState(next)
    setStorageItem(STORAGE_KEYS.THEME, next)
    setStorageItem(STORAGE_KEYS.THEMED, '1')
  }, [])

  var openStudio = useCallback(function () { setStudioOpen(true) }, [])
  var closeStudio = useCallback(function () {
    setStudioOpen(false)
    // If user dismisses without picking, still mark themed so we don't nag
    setStorageItem(STORAGE_KEYS.THEMED, '1')
  }, [])

  // Set data-theme on <html> so CSS vars cascade everywhere
  useEffect(function () {
    document.documentElement.setAttribute('data-theme', theme)
    return function () {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme])

  // URL hash triggers: #studio opens picker, #reset-theme clears + opens
  useEffect(function () {
    function checkHash() {
      var h = window.location.hash
      if (h === '#studio') {
        setStudioOpen(true)
        history.replaceState(null, '', window.location.pathname + window.location.search)
      } else if (h === '#reset-theme') {
        try { localStorage.removeItem(STORAGE_KEYS.THEME); localStorage.removeItem(STORAGE_KEYS.THEMED) } catch (_e) {}
        setThemeState('paper')
        setStudioOpen(true)
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return function () { window.removeEventListener('hashchange', checkHash) }
  }, [])

  var value = {
    theme: theme,
    setTheme: setTheme,
    openStudio: openStudio,
    closeStudio: closeStudio,
    studioOpen: studioOpen,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  var ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
