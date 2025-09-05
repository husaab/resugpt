import { NextAuthOptions } from "next-auth"
import NextAuth from "next-auth"
import GoogleProvider from 'next-auth/providers/google'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

const authOption: NextAuthOptions = {
    session: {
        strategy: 'jwt', // Keep JWT for now, we'll implement database sessions in Express
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    providers: [
        GoogleProvider({
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOption)
export { handler as GET, handler as POST }