'use client'

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "./theme-provider"
import { SessionRefreshProvider } from "./providers/SessionRefreshProvider"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <SessionRefreshProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </SessionRefreshProvider>
    </SessionProvider>
  )
}