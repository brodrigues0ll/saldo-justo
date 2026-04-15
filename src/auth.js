import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import User from '@/models/User'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        await connectDB()
        const user = await User.findOne({
          email: String(credentials.email).toLowerCase().trim(),
        })

        if (!user) return null

        const valid = await bcrypt.compare(String(credentials.password), user.password)
        if (!valid) return null

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.name = user.name
        token.email = user.email
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.name = token.name
        session.user.email = token.email
      }
      return session
    },
  },
})
