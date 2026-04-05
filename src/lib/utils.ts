import slugify from 'slugify'
import { pinyin } from 'pinyin-pro'

export function generateSlug(text: string): string {
  // Convert Chinese characters to pinyin, preserve non-Chinese segments
  const converted = text.replace(/[\u4e00-\u9fff]+/g, (match) =>
    pinyin(match, { toneType: 'none', separator: '-' })
  )
  const result = slugify(converted, { lower: true, strict: true })
  // Fallback: if slug is empty, use timestamp
  return result || Date.now().toString()
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
export function generateExcerpt(content: string, maxLength: number = 200): string {
  const plainText = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[-*_#>`|]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
  return truncate(plainText, maxLength)
}
