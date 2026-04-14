import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import prisma from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: '用户名', type: 'text' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null
        }

        const username = credentials.username as string | undefined
        const password = credentials.password as string | undefined

        if (!username || !password) {
          return null
        }

        const isEmail = username.includes('@')
        const user = await prisma.user.findUnique({
          where: isEmail ? { email: username } : { username },
        })

        if (!user) return null

        const isPasswordValid = await compare(password, user.password)
        if (!isPasswordValid) return null

        return {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role,
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
        token.nickname = (user as any).nickname
        token.avatarUrl = (user as any).avatarUrl
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          nickname: token.nickname as string,
          avatarUrl: token.avatarUrl as string | null,
        }
      }
      return session
    },
  },
})
