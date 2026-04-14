'use server'
import prisma from '@/lib/prisma'
import { DEFAULT_SITE_NAME } from '@/lib/constants'

export async function getSiteFavicon(): Promise<string | null> {
  const config = await prisma.siteConfig.findUnique({ where: { key: 'favicon' } })
  return config?.value ?? null
}

export async function getSiteName(): Promise<string> {
  const config = await prisma.siteConfig.findUnique({ where: { key: 'siteName' } })
  return config?.value || DEFAULT_SITE_NAME
}
