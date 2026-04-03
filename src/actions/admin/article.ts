'use server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { ArticleStatus, from '@prisma/client'
import { ArticleFormData } from '@/types'
import { generateSlug, generateExcerpt } from '@/lib/utils'
export async function getArticles(options: {
  page?: number
  pageSize?: number
  status?: ArticleStatus
  search?: string
  categoryId?: string
}) {
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  const where: Record<string, unknown> = {}
  if (options.status) where.status = options.status
  if (options.categoryId) where.categoryId = options.categoryId
  if (options.search) {
    where.OR = [
      { title: { contains: options.search, mode: 'insensitive' } },
      { content: { contains: options.search, mode: 'insensitive' } },
    ]
  }
  const [data, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ sortOrder: 'desc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    }),
    prisma.article.count({ where }),
  ])
  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}
export async function getArticleById(id: string) {
  return prisma.article.findUnique({
    where: { id },
    include: { category: true, tags: { select: { tag: true } } },
  })
}
export async function createArticle(data: ArticleFormData) {
  const slug = data.slug || generateSlug(data.title)
  const existing = await prisma.article.findUnique({ where: { slug } })
  if (existing) throw new Error('slug 已存在')
  const excerpt = data.excerpt || generateExcerpt(data.content)
  const article = await prisma.article.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt,
      coverImage: data.coverImage,
      categoryId: data.categoryId || null,
      status: data.status,
      sortOrder: data.sortOrder,
      isRecommended: data.isRecommended,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      seoKeywords: data.seoKeywords,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
    },
  })
  revalidatePath('/admin/articles')
  revalidatePath('/')
  return article
}
export async function updateArticle(id: string, data: ArticleFormData) {
  const slug = data.slug || generateSlug(data.title)
  await prisma.articleTag.deleteMany({ where: { articleId: id } })
  const article = await prisma.article.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt || generateExcerpt(data.content),
      coverImage: data.coverImage,
      categoryId: data.categoryId || null,
      status: data.status,
      sortOrder: data.sortOrder,
      isRecommended: data.isRecommended,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      seoKeywords: data.seoKeywords,
      publishedAt: data.status === 'PUBLISHED' ? (data.publishedAt || new Date()) : data.publishedAt,
      tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
    },
  })
  revalidatePath('/admin/articles')
  revalidatePath('/')
  return article
}
export async function deleteArticle(id: string) {
  await prisma.article.update({ where: { id }, data: { status: 'TRASH' } })
  revalidatePath('/admin/articles')
  revalidatePath('/')
}
export async function restoreArticle(id: string) {
  await prisma.article.update({ where: { id }, data: { status: 'DRAFT' } })
  revalidatePath('/admin/articles')
}
export async function permanentDeleteArticle(id: string) {
  await prisma.article.delete({ where: { id } })
  revalidatePath('/admin/articles')
  revalidatePath('/')
}
export async function updateArticleStatus(id: string, status: ArticleStatus) {
  const updateData: Record<string, unknown> = { status }
  if (status === 'PUBLISHED') updateData.publishedAt = new Date()
  await prisma.article.update({ where: { id }, data: updateData })
  revalidatePath('/admin/articles')
  revalidatePath('/')
}
export async function batchUpdateStatus(ids: string[], status: ArticleStatus) {
  const updateData: Record<string, unknown> = { status }
  if (status === 'PUBLISHED') updateData.publishedAt = new Date()
  await prisma.article.updateMany({ where: { id: { in: ids } }, data: updateData })
  revalidatePath('/admin/articles')
}
export async function batchDelete(ids: string[]) {
  await prisma.article.updateMany({ where: { id: { in: ids } }, data: { status: 'TRASH' } })
  revalidatePath('/admin/articles')
}
