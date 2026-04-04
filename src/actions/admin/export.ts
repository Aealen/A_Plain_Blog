'use server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

interface ExportArticle {
  title: string
  slug: string
  content: string
  excerpt: string | null
  coverImage: string | null
  status: string
  sortOrder: number
  isRecommended: boolean
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  category: { name: string; slug: string } | null
  tags: { tag: { name: string; slug: string } }[]
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
}

function formatFrontMatter(article: ExportArticle): string {
  const lines: string[] = ['---']
  lines.push(`title: "${article.title.replace(/"/g, '\\"')}"`)
  lines.push(`slug: "${article.slug}"`)
  lines.push(`date: ${article.publishedAt?.toISOString() || article.createdAt.toISOString()}`)
  lines.push(`updated: ${article.updatedAt.toISOString()}`)
  if (article.excerpt) lines.push(`excerpt: "${article.excerpt.replace(/"/g, '\\"')}"`)
  if (article.coverImage) lines.push(`coverImage: "${article.coverImage}"`)
  if (article.category) lines.push(`category: "${article.category.name}"`)
  if (article.tags.length > 0) lines.push(`tags: [${article.tags.map(t => `"${t.tag.name}"`).join(', ')}]`)
  lines.push(`status: ${article.status}`)
  if (article.isRecommended) lines.push('isRecommended: true')
  if (article.seoTitle) lines.push(`seoTitle: "${article.seoTitle}"`)
  if (article.seoDescription) lines.push(`seoDescription: "${article.seoDescription}"`)
  if (article.seoKeywords) lines.push(`seoKeywords: "${article.seoKeywords}"`)
  lines.push('---')
  return lines.join('\n')
}

export async function exportArticle(id: string): Promise<{ filename: string; content: string }> {
  const session = await auth()
  if (!session) throw new Error('未授权')

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, slug: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  })
  if (!article) throw new Error('文章不存在')

  const a = article as unknown as ExportArticle
  const frontMatter = formatFrontMatter(a)
  const content = `${frontMatter}\n\n${a.content}`

  return {
    filename: `${a.slug}.md`,
    content,
  }
}

export async function exportAllArticles(): Promise<{ filename: string; content: string }[]> {
  const session = await auth()
  if (!session) throw new Error('未授权')

  const articles = await prisma.article.findMany({
    where: { status: { not: 'TRASH' } },
    include: {
      category: { select: { name: true, slug: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
    orderBy: { publishedAt: 'desc' },
  })

  return (articles as unknown as ExportArticle[]).map(article => ({
    filename: `${article.slug}.md`,
    content: `${formatFrontMatter(article)}\n\n${article.content}`,
  }))
}
