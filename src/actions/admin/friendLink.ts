'use server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { FriendLinkFormData } from '@/types'
export async function getFriendLinks() {
  return prisma.friendLink.findMany({ orderBy: { order: 'asc' } })
}
export async function createFriendLink(data: FriendLinkFormData) {
  const link = await prisma.friendLink.create({
    data: {
      name: data.name,
      url: data.url,
      avatar: data.avatar,
      description: data.description,
      order: data.order,
      isActive: data.isActive,
    },
  })
  revalidatePath('/admin/friend-links')
  revalidatePath('/links')
  return link
}
export async function updateFriendLink(id: string, data: FriendLinkFormData) {
  const link = await prisma.friendLink.update({
    where: { id },
    data: {
      name: data.name,
      url: data.url,
      avatar: data.avatar,
      description: data.description,
      order: data.order,
      isActive: data.isActive,
    },
  })
  revalidatePath('/admin/friend-links')
  revalidatePath('/links')
  return link
}
export async function deleteFriendLink(id: string) {
  await prisma.friendLink.delete({ where: { id } })
  revalidatePath('/admin/friend-links')
  revalidatePath('/links')
}
export async function toggleFriendLink(id: string) {
  const link = await prisma.friendLink.findUnique({ where: { id } })
  if (!link) throw new Error('友链不存在')
  await prisma.friendLink.update({
    where: { id },
    data: { isActive: !link.isActive },
  })
  revalidatePath('/admin/friend-links')
  revalidatePath('/links')
}
