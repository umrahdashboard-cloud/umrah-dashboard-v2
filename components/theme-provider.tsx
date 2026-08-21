'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  applyColorThemeId,
  applyThemeMode,
  persistColorTheme,
  persistThemeMode,
  readStoredColorTheme,
  readStoredTheme,
  type ColorThemeId,
  type ThemeMode,
} from '@/lib/theme-storage'

export type ColorTheme = ColorThemeId

interface ThemeContextType {
  theme: ThemeMode
  toggleTheme: () => void
  colorTheme: ColorTheme
  setColorTheme: (t: ColorTheme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme,
  defaultColorTheme,
}: {
  children: React.ReactNode
  defaultTheme: ThemeMode
  defaultColorTheme: ColorTheme
}) {
  const [theme, setTheme] = useState<ThemeMode>(defaultTheme)
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(defaultColorTheme)

  // Align React state with DOM/localStorage once — never re-apply theme classes here
  useEffect(() => {
    const storedTheme = readStoredTheme()
    const storedColor = readStoredColorTheme()
    setTheme((prev) => (prev !== storedTheme ? storedTheme : prev))
    setColorThemeState((prev) => (prev !== storedColor ? storedColor : prev))
    persistThemeMode(storedTheme)
    persistColorTheme(storedColor)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, [])

  const toggleTheme = () => {
    const newTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    applyThemeMode(newTheme)
    persistThemeMode(newTheme)
  }

  const setColorTheme = (t: ColorTheme) => {
    setColorThemeState(t)
    applyColorThemeId(t)
    persistColorTheme(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colorTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
