import NextAuth from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      googleId: string
      credits: number
      subscriptionStatus: string
      cancelAtPeriodEnd: boolean
      subscriptionEndsAt: string | null
      isAdmin: boolean
    }
  }

  interface User {
    googleId: string
    credits: number
    subscriptionStatus: string
    cancelAtPeriodEnd: boolean
    subscriptionEndsAt: string | null
    isAdmin: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    googleId: string
    credits: number
    subscriptionStatus: string
    cancelAtPeriodEnd: boolean
    subscriptionEndsAt: string | null
    isAdmin: boolean
  }
}