'use server'
import prisma from '@/lib/prisma'

export async function getSiteFavicon(): Promise<string | null> {
  const config = await prisma.siteConfig.findUnique({ where: { key: 'favicon' } })
  return config?.value ?? null
}
