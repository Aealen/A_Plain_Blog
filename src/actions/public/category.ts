'use server'
import prisma from '@/lib/prisma'
import { ArticleStatus } from '@prisma/client'

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: {
          articles: {
            where: { status: ArticleStatus.PUBLISHED },
          },
        },
      },
    },
  })
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          articles: {
            where: { status: ArticleStatus.PUBLISHED },
          },
        },
      },
    },
  })
}
