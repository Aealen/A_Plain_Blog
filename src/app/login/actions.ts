'use server'
import { signIn } from '@/lib/auth'

export async function loginAction(credentials: {
  username: string
  password: string
}) {
  const result = await signIn('credentials', {
    username: credentials.username,
    password: credentials.password,
    redirect: false,
  })

  return result
}
