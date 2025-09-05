import { NextAuthOptions } from "next-auth"
import NextAuth from "next-auth"
import GoogleProvider from 'next-auth/providers/google'
import { login } from '@/services/authService'
import { useUserStore } from '@/store/userStore'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

const authOption: NextAuthOptions = {
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
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google') {
                try {
                    // Call backend to create/find user
                    const response = await login({
                        email: user.email!,
                        name: user.name!,
                        sub: account.providerAccountId
                    })
                    
                    // Store user data in Zustand (accessible on client-side)
                    if (typeof window !== 'undefined') {
                        useUserStore.getState().setUser({
                            googleId: account.providerAccountId,
                            email: user.email!,
                            name: user.name!,
                            credits: response.data.credits,
                            subscriptionStatus: response.data.subscriptionStatus as 'free' | 'premium' | 'pro'
                        })
                    }
                    
                    return true
                } catch (error) {
                    console.error('Backend login error:', error)
                    return false
                }
            }
            return true
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOption)
export { handler as GET, handler as POST }