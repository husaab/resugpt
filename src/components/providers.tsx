'use client'

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "./theme-provider"
import { SessionRefreshProvider } from "./providers/SessionRefreshProvider"
import { CreditProvider } from "@/contexts/CreditContext"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <SessionRefreshProvider>
        <CreditProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </CreditProvider>
      </SessionRefreshProvider>
    </SessionProvider>
  )
}