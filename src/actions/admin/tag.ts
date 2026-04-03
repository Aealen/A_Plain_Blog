'use server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TagFormData } from '@/types'
import { generateSlug } from '@/lib/utils'
export async function createTag(data: TagFormData) {
  const slug = data.slug || generateSlug(data.name)
  const existing = await prisma.tag.findUnique({ where: { slug } })
  if (existing) throw new Error('slug 已存在')
  const tag = await prisma.tag.create({ data: { name: data.name, slug } })
  revalidatePath('/admin/tags')
  revalidatePath('/')
  return tag
}
export async function updateTag(id: string, data: TagFormData) {
  const slug = data.slug || generateSlug(data.name)
  const tag = await prisma.tag.update({ where: { id }, data: { name: data.name, slug } })
  revalidatePath('/admin/tags')
  revalidatePath('/')
  return tag
}
export async function deleteTag(id: string) {
  await prisma.tag.delete({ where: { id } })
  revalidatePath('/admin/tags')
  revalidatePath('/')
}
export async function getTagsWithCount() {
  return prisma.tag.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { articles: true } } },
  })
}
export async function mergeTags(sourceId: string, targetId: string) {
  if (sourceId === targetId) throw new Error('不能合并到自身')
  const sourceRelations = await prisma.articleTag.findMany({ where: { tagId: sourceId } })
  for (const rel of sourceRelations) {
    await prisma.articleTag.upsert({
      where: { articleId_tagId: { articleId: rel.articleId, tagId: targetId } },
      update: {},
      create: { articleId: rel.articleId, tagId: targetId },
    })
  }
  await prisma.tag.delete({ where: { id: sourceId } })
  revalidatePath('/admin/tags')
  revalidatePath('/')
}
