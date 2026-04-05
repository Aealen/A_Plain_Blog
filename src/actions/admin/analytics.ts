'use server'

import { getVisitStats, getTopPages } from '@/lib/visitor'
import prisma from '@/lib/prisma'

export async function fetchVisitStats(days: number = 30) {
  return getVisitStats(days)
}

export async function fetchTopPages(limit: number = 10) {
  const pages = await getTopPages(limit)

  const articlePaths = pages.filter((p) => p.path.startsWith('/articles/'))
  const slugs = articlePaths.map((p) => p.path.replace('/articles/', ''))

  const articles = slugs.length > 0
    ? await prisma.article.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true, title: true },
      })
    : []

  const titleMap = new Map(articles.map((a) => [a.slug, a.title]))

  return pages.map((p) => {
    const slug = p.path.startsWith('/articles/') ? p.path.replace('/articles/', '') : null
    return { ...p, title: slug ? titleMap.get(slug) ?? null : null }
  })
}
