'use server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CategoryFormData } from '@/types'
import { generateSlug } from '@/lib/utils'

export async function createCategory(data: CategoryFormData) {
  const slug = data.slug || generateSlug(data.name)
  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing) throw new Error('slug 已存在')
  const category = await prisma.category.create({
    data: { name: data.name, slug, description: data.description, order: data.order },
  })
  revalidatePath('/admin/categories')
  revalidatePath('/')
  return category
}
export async function updateCategory(id: string, data: CategoryFormData) {
  const slug = data.slug || generateSlug(data.name)
  const category = await prisma.category.update({
    where: { id },
    data: { name: data.name, slug, description: data.description, order: data.order },
  })
  revalidatePath('/admin/categories')
  revalidatePath('/')
  return category
}
export async function deleteCategory(id: string) {
  const articlesCount = await prisma.articleCategory.count({ where: { categoryId: id } })
  if (articlesCount > 0) throw new Error('该分类下还有文章，无法删除')
  await prisma.category.delete({ where: { id } })
  revalidatePath('/admin/categories')
  revalidatePath('/')
}
export async function updateCategoryOrder(id: string, order: number) {
  await prisma.category.update({ where: { id }, data: { order } })
  revalidatePath('/admin/categories')
}
export async function getCategoriesWithCount() {
  return prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { articles: true } } },
  })
}
