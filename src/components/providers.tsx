'use client'

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "./theme-provider"
import { SessionRefreshProvider } from "./providers/SessionRefreshProvider"
import { AnalyticsProvider } from "./providers/AnalyticsProvider"
import { CreditProvider } from "@/contexts/CreditContext"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <SessionRefreshProvider>
        <AnalyticsProvider>
          <CreditProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </CreditProvider>
        </AnalyticsProvider>
      </SessionRefreshProvider>
    </SessionProvider>
  )
}