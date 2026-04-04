'use server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { parseMarkdownFile, type ParsedFrontMatter } from '@/lib/markdown'
import { generateSlug, generateExcerpt } from '@/lib/utils'
import { ArticleStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import JSZip from 'jszip'

export async function importMarkdownFiles(files: { name: string; content: string }[]): Promise<{
  imported: number
  skipped: number
  errors: string[]
}> {
  const session = await auth()
  if (!session) throw new Error('未授权')

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const file of files) {
    try {
      const parsed: ParsedFrontMatter = parseMarkdownFile(file.content)

      const slug = parsed.slug || generateSlug(parsed.title || file.name)
      if (!parsed.title) {
        errors.push(`${file.name}: 缺少标题`)
        skipped++
        continue
      }

      const existing = await prisma.article.findUnique({ where: { slug } })
      if (existing) {
        errors.push(`${file.name}: slug "${slug}" 已存在`)
        skipped++
        continue
      }

      let categoryId: string | null = null
      if (parsed.category) {
        const category = await prisma.category.upsert({
          where: { slug: generateSlug(parsed.category) },
          update: {},
          create: { name: parsed.category, slug: generateSlug(parsed.category) },
        })
        categoryId = category.id
      }

      const tagIds: string[] = []
      for (const tagName of parsed.tags) {
        const tag = await prisma.tag.upsert({
          where: { slug: generateSlug(tagName) },
          update: {},
          create: { name: tagName, slug: generateSlug(tagName) },
        })
        tagIds.push(tag.id)
      }

      await prisma.article.create({
        data: {
          title: parsed.title,
          slug,
          content: parsed.content,
          excerpt: parsed.excerpt || generateExcerpt(parsed.content),
          coverImage: parsed.coverImage,
          categoryId,
          status: (parsed.status as ArticleStatus) || ArticleStatus.PUBLISHED,
          publishedAt: parsed.status === 'PUBLISHED' || !parsed.status ? (parsed.date || new Date()) : null,
          tags: { create: tagIds.map(tagId => ({ tagId })) },
        },
      })
      imported++
    } catch (err) {
      errors.push(`${file.name}: ${err instanceof Error ? err.message : '导入失败'}`)
      skipped++
    }
  }

  revalidatePath('/admin/articles')
  revalidatePath('/')
  return { imported, skipped, errors }
}

export async function importFromZip(file: File): Promise<{
  imported: number
  skipped: number
  errors: string[]
}> {
  const session = await auth()
  if (!session) throw new Error('未授权')

  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  const markdownFiles: { name: string; content: string }[] = []

  // Collect all .md files from the ZIP (forEach recursively iterates all paths)
  const promises: Promise<void>[] = []
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir && relativePath.endsWith('.md')) {
      promises.push(
        zipEntry.async('string').then((content) => {
          markdownFiles.push({ name: relativePath, content })
        })
      )
    }
  })
  await Promise.all(promises)

  if (markdownFiles.length === 0) {
    return { imported: 0, skipped: 0, errors: ['ZIP 文件中未找到 Markdown 文件'] }
  }

  return importMarkdownFiles(markdownFiles)
}
