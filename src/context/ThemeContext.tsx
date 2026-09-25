import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type MotionMode = 'normal' | 'reduce'

export const PALETTES: [string, string][] = [
  ['forest', 'Forest'],
  ['ocean', 'Ocean'],
  ['sunset', 'Sunset'],
  ['berry', 'Berry'],
  ['slate', 'Slate'],
]

interface ThemeState {
  theme: ThemeMode
  palette: string
  motion: MotionMode
  setTheme: (t: ThemeMode) => void
  setPalette: (p: string) => void
  setMotion: (m: MotionMode) => void
}

const ThemeContext = createContext<ThemeState | undefined>(undefined)

function readLocal(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}

function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* localStorage may be unavailable (private mode, disabled storage) — theme just won't persist */
  }
}

/**
 * Appearance is a per-device preference, not org data, so it lives in
 * localStorage (like the original artifact) rather than Supabase.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => readLocal('pitchly-theme', 'system') as ThemeMode)
  const [palette, setPaletteState] = useState<string>(() => readLocal('pitchly-palette', 'forest'))
  const [motion, setMotionState] = useState<MotionMode>(() => readLocal('pitchly-motion', 'normal') as MotionMode)

  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      root.classList.toggle('dark', isDark)
    }
    apply()
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', palette)
  }, [palette])

  useEffect(() => {
    document.documentElement.setAttribute('data-motion', motion)
  }, [motion])

  const setTheme = (t: ThemeMode) => {
    setThemeState(t)
    writeLocal('pitchly-theme', t)
  }
  const setPalette = (p: string) => {
    setPaletteState(p)
    writeLocal('pitchly-palette', p)
  }
  const setMotion = (m: MotionMode) => {
    setMotionState(m)
    writeLocal('pitchly-motion', m)
  }

  const value = useMemo(() => ({ theme, palette, motion, setTheme, setPalette, setMotion }), [theme, palette, motion])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
