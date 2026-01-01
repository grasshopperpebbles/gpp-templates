/**
 * NextAuth.js Configuration for WooCommerce
 * 
 * IMPORTANT: This file requires NextAuth.js to be installed.
 * Run: npm install next-auth
 * 
 * Also add to .env.local:
 * NEXTAUTH_URL="http://localhost:3004"
 * NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32
 */

import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { authenticateWooUser } from "@/lib/auth-woocommerce"

interface ExtendedUser {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
  authToken?: string
  refreshToken?: string
  firstName?: string
  lastName?: string
  customerId?: number
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "woocommerce",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await authenticateWooUser(credentials.email, credentials.password)
        
        if (user) {
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            image: user.avatar,
            // Store WooCommerce specific data
            authToken: user.authToken,
            refreshToken: user.refreshToken,
            firstName: user.firstName,
            lastName: user.lastName
          }
        }
        return null
      }
    })
  ],
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Store WooCommerce auth token in JWT
      if (user && account) {
        const extendedUser = user as ExtendedUser
        token.authToken = extendedUser.authToken || ''
        token.refreshToken = extendedUser.refreshToken || ''
        token.firstName = extendedUser.firstName || ''
        token.lastName = extendedUser.lastName || ''
        token.customerId = parseInt(user.id)
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token && token.sub) {
        session.user.id = token.sub
        session.authToken = (token.authToken as string) || ''
        session.refreshToken = (token.refreshToken as string) || ''
        session.customerId = (token.customerId as number) || 0
        session.user.firstName = (token.firstName as string) || ''
        session.user.lastName = (token.lastName as string) || ''
      }
      return session
    }
  },
  events: {
    async signOut({ token }) {
      // Could implement WooCommerce logout here if needed
      if (process.env.NODE_ENV === 'development') {
        console.log('User signed out:', token.sub)
      }
    }
  },
  debug: process.env.NODE_ENV === 'development'
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }