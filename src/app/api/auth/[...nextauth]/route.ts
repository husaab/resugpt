import { NextAuthOptions } from "next-auth"
import NextAuth from "next-auth"
import GoogleProvider from 'next-auth/providers/google'
import { login } from '@/services/authService'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60, 
    },
    providers: [
        GoogleProvider({
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET
        })
    ],
    callbacks: {
        async jwt({ token, account, user, trigger }) {
            // Initial Google login
            if (account?.provider === 'google') {
                try {
                    const response = await login({
                        email: user.email!,
                        name: user.name!,
                        sub: account.providerAccountId
                    })

                    token.googleId = account.providerAccountId
                    token.credits = response.data.credits
                    token.subscriptionStatus = response.data.subscriptionStatus
                    token.cancelAtPeriodEnd = response.data.cancelAtPeriodEnd ?? false
                    token.subscriptionEndsAt = response.data.subscriptionEndsAt ?? null
                } catch (error) {
                    console.error('JWT callback error:', error)
                }
            }

            // Session update triggered - refetch user data from backend
            if (trigger === 'update' && token.googleId) {
                try {
                    const response = await login({
                        email: token.email!,
                        name: token.name!,
                        sub: token.googleId as string
                    })
                    token.credits = response.data.credits
                    token.subscriptionStatus = response.data.subscriptionStatus
                    token.cancelAtPeriodEnd = response.data.cancelAtPeriodEnd ?? false
                    token.subscriptionEndsAt = response.data.subscriptionEndsAt ?? null
                } catch (error) {
                    console.error('Session update error:', error)
                }
            }

            return token
        },
        async session({ session, token }) {
            if (token.googleId) {
                session.user.googleId = token.googleId as string
                session.user.credits = token.credits as number
                session.user.subscriptionStatus = token.subscriptionStatus as string
                session.user.cancelAtPeriodEnd = token.cancelAtPeriodEnd as boolean
                session.user.subscriptionEndsAt = token.subscriptionEndsAt as string | null
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }