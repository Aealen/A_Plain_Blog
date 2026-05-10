import prisma from '@/lib/prisma'
import { DEFAULT_BASE_URL } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [config, articles, categories, tags] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { key: 'baseUrl' } }),
    prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      select: { slug: true, updatedAt: true },
    }),
    prisma.tag.findMany({
      select: { slug: true, createdAt: true },
    }),
  ])

  const baseUrl = config?.value || process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE_URL

  const entries = [
    { url: baseUrl, changefreq: 'daily', priority: '1.0' },
    { url: `${baseUrl}/categories`, changefreq: 'weekly', priority: '0.7' },
    { url: `${baseUrl}/tags`, changefreq: 'weekly', priority: '0.7' },
    { url: `${baseUrl}/archives`, changefreq: 'weekly', priority: '0.6' },
    { url: `${baseUrl}/about`, changefreq: 'monthly', priority: '0.5' },
    { url: `${baseUrl}/links`, changefreq: 'monthly', priority: '0.4' },
    ...articles.map(a => ({ url: `${baseUrl}/articles/${a.slug}`, lastmod: a.updatedAt.toISOString(), changefreq: 'weekly', priority: '0.8' })),
    ...categories.map(c => ({ url: `${baseUrl}/categories/${c.slug}`, lastmod: c.updatedAt.toISOString(), changefreq: 'weekly', priority: '0.6' })),
    ...tags.map(t => ({ url: `${baseUrl}/tags/${t.slug}`, lastmod: t.createdAt.toISOString(), changefreq: 'weekly', priority: '0.5' })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url>
    <loc>${e.url}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
