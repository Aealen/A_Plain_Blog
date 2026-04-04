'use server'
import prisma from '@/lib/prisma'
import { ArticleStatus } from '@prisma/client'

export async function getTags() {
  const tags = await prisma.tag.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          articles: {
            where: { article: { status: ArticleStatus.PUBLISHED } },
          },
        },
      },
    },
  })
  return tags
}

export async function getTagBySlug(slug: string) {
  return prisma.tag.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          articles: {
            where: { article: { status: ArticleStatus.PUBLISHED } },
          },
        },
      },
    },
  })
}
