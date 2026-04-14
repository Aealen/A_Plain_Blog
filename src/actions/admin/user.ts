'use server'
import prisma from '@/lib/prisma'
import { compare, hash } from 'bcryptjs'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { ProfileFormData, PasswordFormData } from '@/types'
export async function updateProfile(data: ProfileFormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('未登录')

  if (data.username) {
    const existing = await prisma.user.findFirst({
      where: { username: data.username, NOT: { id: session.user.id } },
    })
    if (existing) throw new Error('该用户名已被使用')
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      username: data.username,
      nickname: data.nickname,
      email: data.email,
      avatarUrl: data.avatarUrl,
      bio: data.bio,
    },
  })
  revalidatePath('/admin/profile')
  return user
}
export async function updatePassword(data: PasswordFormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('未登录')
  if (data.newPassword !== data.confirmPassword) {
    throw new Error('两次输入的密码不一致')
  }
  if (data.newPassword.length < 8) {
    throw new Error('密码长度至少 8 位')
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw new Error('用户不存在')
  const isValid = await compare(data.currentPassword, user.password)
  if (!isValid) throw new Error('当前密码错误')
  const hashedPassword = await hash(data.newPassword, 12)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  })
}
export async function getUserProfile() {
  const session = await auth()
  if (!session?.user?.id) return null
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, username: true, email: true, nickname: true, avatarUrl: true, bio: true, role: true },
  })
}
