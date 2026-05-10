import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'
import { DEFAULT_BASE_URL } from '@/lib/constants'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const config = await prisma.siteConfig.findUnique({ where: { key: 'baseUrl' } })
  const baseUrl = config?.value || process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE_URL

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
