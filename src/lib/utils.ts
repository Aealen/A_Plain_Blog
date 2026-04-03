import slugify from 'slugify'

export function generateSlug(text: string): string {
  return slugify(text, { lower: true, strict: true })
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
export function generateExcerpt(content: string, maxLength: number = 200): string {
  const plainText = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+)\)/g, '$1')
    .replace(/!\[([^\]]+)\]\([^)]+)\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[-*_#>`|]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
  return truncate(plainText, maxLength)
}
