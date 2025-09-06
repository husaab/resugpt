import { NextAuthOptions } from "next-auth"
import NextAuth from "next-auth"
import GoogleProvider from 'next-auth/providers/google'
import { login } from '@/services/authService'

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
        async jwt({ token, account, user }) {
            if (account?.provider === 'google') {
                try {
                    // Fetch user data from backend on first login
                    const response = await login({
                        email: user.email!,
                        name: user.name!,
                        sub: account.providerAccountId
                    })
                    
                    token.googleId = account.providerAccountId
                    token.credits = response.data.credits
                    token.subscriptionStatus = response.data.subscriptionStatus
                } catch (error) {
                    console.error('JWT callback error:', error)
                }
            }
            return token
        },
        async session({ session, token }) {
            if (token.googleId) {
                session.user.googleId = token.googleId as string
                session.user.credits = token.credits as number
                session.user.subscriptionStatus = token.subscriptionStatus as string
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOption)
export { handler as GET, handler as POST }