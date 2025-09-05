'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Get system preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  // Resolve the actual theme to apply
  const resolveTheme = (currentTheme: Theme): 'light' | 'dark' => {
    if (currentTheme === 'system') {
      return getSystemTheme()
    }
    return currentTheme
  }

  // Set theme and update DOM
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    
    const resolved = resolveTheme(newTheme)
    setResolvedTheme(resolved)
    
    // Update HTML class
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(resolved)
    }
  }

  // Toggle between light and dark (skipping system)
  const toggleTheme = () => {
    if (resolvedTheme === 'light') {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true)
    
    // Get saved theme or default to system
    const savedTheme = localStorage.getItem('theme') as Theme
    const initialTheme = savedTheme || 'system'
    
    setThemeState(initialTheme)
    const resolved = resolveTheme(initialTheme)
    setResolvedTheme(resolved)
    
    // Apply to DOM
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(resolved)
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        const newResolved = getSystemTheme()
        setResolvedTheme(newResolved)
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(newResolved)
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Update resolved theme when theme changes
  useEffect(() => {
    if (mounted) {
      const resolved = resolveTheme(theme)
      setResolvedTheme(resolved)
      
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(resolved)
      }
    }
  }, [theme, mounted])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      <div suppressHydrationWarning={!mounted}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}