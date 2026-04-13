'use server'
import prisma from '@/lib/prisma'
import { ArticleStatus } from '@prisma/client'

export async function getPublishedArticles(options: {
  page?: number
  pageSize?: number
  categoryId?: string
  tagId?: string
  search?: string
}) {
  const page = options.page || 1
  const pageSize = options.pageSize || 10
  const where: Record<string, unknown> = { status: ArticleStatus.PUBLISHED }

  if (options.categoryId) where.categories = { some: { categoryId: options.categoryId } }
  if (options.tagId) {
    where.tags = { some: { tagId: options.tagId } }
  }
  if (options.search) {
    where.OR = [
      { title: { contains: options.search, mode: 'insensitive' } },
      { content: { contains: options.search, mode: 'insensitive' } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        categories: { select: { category: { select: { name: true, slug: true } } } },
        tags: { select: { tag: { select: { name: true, slug: true } } } },
      },
    }),
    prisma.article.count({ where }),
  ])

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getArticleBySlug(slug: string) {
  return prisma.article.findUnique({
    where: { slug },
    include: {
      categories: { select: { category: { select: { name: true, slug: true } } } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  })
}

export async function getRecommendedArticles() {
  return prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED, isRecommended: true },
    orderBy: { publishedAt: 'desc' },
    take: 6,
    include: {
      categories: { select: { category: { select: { name: true, slug: true } } } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  })
}

export async function getPopularArticles(limit: number = 10) {
  return prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED },
    orderBy: { viewCount: 'desc' },
    take: limit,
    include: {
      categories: { select: { category: { select: { name: true, slug: true } } } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  })
}

export async function getArchives() {
  const articles = await prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      publishedAt: true,
    },
  })

  const archives: Record<string, Record<string, { id: string; title: string; slug: string; publishedAt: Date | null }[]>> = {}
  for (const article of articles) {
    if (!article.publishedAt) continue
    const date = new Date(article.publishedAt)
    const year = String(date.getFullYear())
    const month = String(date.getMonth() + 1).padStart(2, '0')

    if (!archives[year]) archives[year] = {}
    if (!archives[year][month]) archives[year][month] = []
    archives[year][month].push(article)
  }

  return archives
}

export async function incrementViewCount(id: string) {
  return prisma.article.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  })
}
