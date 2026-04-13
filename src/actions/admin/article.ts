'use server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { ArticleStatus, Prisma } from '@prisma/client'
import { ArticleFormData } from '@/types'
import { generateSlug, generateExcerpt } from '@/lib/utils'
export async function getArticles(options: {
  page?: number
  pageSize?: number
  status?: ArticleStatus
  search?: string
  categoryId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) {
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  const where: Record<string, unknown> = {}
  if (options.status) where.status = options.status
  if (options.categoryId) where.categories = { some: { categoryId: options.categoryId } }
  if (options.search) {
    where.OR = [
      { title: { contains: options.search, mode: 'insensitive' } },
      { content: { contains: options.search, mode: 'insensitive' } },
    ]
  }
  const allowedSortFields = ['createdAt', 'updatedAt', 'publishedAt', 'sortOrder', 'viewCount', 'title']
  const sortBy = options.sortBy && allowedSortFields.includes(options.sortBy) ? options.sortBy : 'sortOrder'
  const sortOrder = options.sortOrder || 'desc'
  const orderBy = sortBy === 'sortOrder'
    ? [{ sortOrder: sortOrder } as const, { publishedAt: 'desc' as const }]
    : [{ [sortBy]: sortOrder } as const]

  const [data, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
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
    include: { categories: { select: { category: true } }, tags: { select: { tag: true } } },
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
      status: data.status,
      sortOrder: data.sortOrder,
      isRecommended: data.isRecommended,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      seoKeywords: data.seoKeywords,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
      categories: { create: data.categoryIds.map((categoryId) => ({ categoryId })) },
    },
  })
  revalidatePath('/admin/articles')
  revalidatePath('/')
  return article
}
export async function updateArticle(id: string, data: ArticleFormData) {
  const slug = data.slug || generateSlug(data.title)
  const current = await prisma.article.findUnique({ where: { id }, select: { status: true, draft: true } })
  if (!current) throw new Error('文章不存在')

  // For published articles: apply draft + update published content
  // For draft/private articles: update directly
  if (current.status === 'PUBLISHED' && current.draft) {
    // Merge draft into formal fields, then apply new data on top
    const d = current.draft as Record<string, unknown>
    await prisma.articleTag.deleteMany({ where: { articleId: id } })
    await prisma.articleCategory.deleteMany({ where: { articleId: id } })
    const article = await prisma.article.update({
      where: { id },
      data: {
        title: (d.title as string) || data.title,
        slug: slug || (d.slug as string),
        content: (d.content as string) || data.content,
        excerpt: (d.excerpt as string) || generateExcerpt((d.content as string) || data.content),
        coverImage: (d.coverImage as string) ?? data.coverImage,
        status: ArticleStatus.PUBLISHED,
        sortOrder: (d.sortOrder as number) ?? data.sortOrder,
        isRecommended: (d.isRecommended as boolean) ?? data.isRecommended,
        seoTitle: (d.seoTitle as string) ?? data.seoTitle,
        seoDescription: (d.seoDescription as string) ?? data.seoDescription,
        seoKeywords: (d.seoKeywords as string) ?? data.seoKeywords,
        publishedAt: new Date(),
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        draft: Prisma.JsonNull,
        tags: { create: ((d.tagIds as string[]) || data.tagIds).map((tagId) => ({ tagId })) },
        categories: { create: ((d.categoryIds as string[]) || data.categoryIds).map((categoryId) => ({ categoryId })) },
      },
    })
    revalidatePath('/admin/articles')
    revalidatePath('/')
    return article
  }

  // No draft or non-published article: update directly
  await prisma.articleTag.deleteMany({ where: { articleId: id } })
  await prisma.articleCategory.deleteMany({ where: { articleId: id } })
  const article = await prisma.article.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt || generateExcerpt(data.content),
      coverImage: data.coverImage,
      status: data.status,
      sortOrder: data.sortOrder,
      isRecommended: data.isRecommended,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      seoKeywords: data.seoKeywords,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      draft: Prisma.JsonNull,
      tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
      categories: { create: data.categoryIds.map((categoryId) => ({ categoryId })) },
    },
  })
  revalidatePath('/admin/articles')
  revalidatePath('/')
  return article
}

export async function saveDraft(id: string, data: ArticleFormData) {
  const current = await prisma.article.findUnique({ where: { id }, select: { status: true } })
  if (!current) throw new Error('文章不存在')

  // Published articles: save to draft field only, don't touch formal content
  if (current.status === 'PUBLISHED') {
    const draftData = {
      title: data.title,
      slug: data.slug || generateSlug(data.title),
      content: data.content,
      excerpt: data.excerpt || generateExcerpt(data.content),
      coverImage: data.coverImage || null,
      sortOrder: data.sortOrder,
      isRecommended: data.isRecommended,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      seoKeywords: data.seoKeywords || null,
      tagIds: data.tagIds,
      categoryIds: data.categoryIds,
      createdAt: data.createdAt || null,
    }
    const article = await prisma.article.update({
      where: { id },
      data: { draft: draftData },
    })
    revalidatePath('/admin/articles')
    return article
  }

  // Non-published articles (DRAFT/PRIVATE): save directly to formal fields
  const slug = data.slug || generateSlug(data.title)
  await prisma.articleTag.deleteMany({ where: { articleId: id } })
  await prisma.articleCategory.deleteMany({ where: { articleId: id } })
  const article = await prisma.article.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt || generateExcerpt(data.content),
      coverImage: data.coverImage,
      status: data.status,
      sortOrder: data.sortOrder,
      isRecommended: data.isRecommended,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      seoKeywords: data.seoKeywords,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
      categories: { create: data.categoryIds.map((categoryId) => ({ categoryId })) },
    },
  })
  revalidatePath('/admin/articles')
  return article
}

export async function discardDraft(id: string) {
  const article = await prisma.article.update({
    where: { id },
    data: { draft: Prisma.JsonNull },
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

export async function toggleRecommended(id: string) {
  const article = await prisma.article.findUnique({ where: { id }, select: { isRecommended: true } })
  if (!article) throw new Error('文章不存在')
  const updated = await prisma.article.update({
    where: { id },
    data: { isRecommended: !article.isRecommended },
  })
  revalidatePath('/admin/articles')
  revalidatePath('/')
  return updated
}
