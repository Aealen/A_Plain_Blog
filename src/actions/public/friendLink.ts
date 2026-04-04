'use server'
import prisma from '@/lib/prisma'

export async function getActiveFriendLinks() {
  return prisma.friendLink.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })
}
