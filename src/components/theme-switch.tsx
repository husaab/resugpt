'use client'

import { useTheme } from './theme-provider'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

export function ThemeSwitch() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, toggleTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [resolvedTheme])

  const handleClick = () => {
    if (mounted && toggleTheme) {
      toggleTheme()
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-md border transition-all duration-200 cursor-pointer ${
        mounted 
          ? 'border-gray-300 dark:border-gray-600 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
          : 'border-gray-300 text-gray-500'
      }`}
      aria-label={mounted ? `Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode` : "Theme toggle"}
    >
      {mounted && resolvedTheme === 'dark' ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  )
}