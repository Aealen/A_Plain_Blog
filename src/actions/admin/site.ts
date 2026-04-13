'use server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getSiteConfig(key: string) {
  const config = await prisma.siteConfig.findUnique({ where: { key } })
  return config?.value ?? null
}

export async function setSiteConfig(key: string, value: string) {
  const config = await prisma.siteConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
  revalidatePath('/')
  return config
}
