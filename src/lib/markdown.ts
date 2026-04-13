import matter from 'gray-matter'
import { generateSlug } from './utils'
export interface ParsedFrontMatter {
  title: string
  slug: string
  content: string
  excerpt?: string
  coverImage?: string
  category?: string
  categories: string[]
  tags: string[]
  date?: Date
  updated?: Date
  status?: string
  warnings: string[]
}
export function parseMarkdownFile(fileContent: string, fileName?: string): ParsedFrontMatter {
  const warnings: string[] = []
  const { data, content } = matter(fileContent)
  const title = data.title || fileName?.replace(/\.md$/, '') || '未命名文章'
  const slug = data.slug || generateSlug(title)
  if (!data.title) warnings.push('缺少 title 字段，使用文件名作为标题')
  if (!data.date) warnings.push('缺少 date 字段')
  return {
    title,
    slug,
    content,
    excerpt: data.excerpt || data.description,
    coverImage: data.cover || data.coverImage,
    category: data.category,
    categories: Array.isArray(data.categories) ? data.categories : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    date: data.date ? new Date(data.date) : undefined,
    updated: data.updated ? new Date(data.updated) : undefined,
    status: data.status,
    warnings,
  }
}
export function extractTOC(content: string): Array<{ id: string; text: string; level: number }> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const toc: Array<{ id: string; text: string; level: number }> = []
  let match
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = generateSlug(text)
    toc.push({ id, text, level })
  }
  return toc
}
