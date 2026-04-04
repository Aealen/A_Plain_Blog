import Link from 'next/link'
import Image from 'next/image'

interface ArticleCardProps {
  article: {
    id: string
    title: string
    slug: string
    excerpt?: string | null
    coverImage?: string | null
    publishedAt: Date | null
    viewCount: number
    category: { name: string; slug: string } | null
    tags: { tag: { name: string; slug: string } }[]
  }
}

function formatDate(date: Date | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {article.coverImage && (
        <Link href={`/articles/${article.slug}`} className="block relative aspect-video overflow-hidden">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
        </Link>
      )}
      <div className="p-5">
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          {article.category && (
            <Link
              href={`/categories/${article.category.slug}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {article.category.name}
            </Link>
          )}
          {article.publishedAt && (
            <span>{formatDate(article.publishedAt)}</span>
          )}
          <span>{article.viewCount} 次阅读</span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          <Link href={`/articles/${article.slug}`} className="hover:text-blue-600 transition-colors">
            {article.title}
          </Link>
        </h3>

        {article.excerpt && (
          <p className="text-sm text-gray-500 line-clamp-3 mb-4">
            {article.excerpt}
          </p>
        )}

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <Link
                key={t.tag.slug}
                href={`/tags/${t.tag.slug}`}
                className="inline-block text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-blue-100 hover:text-blue-600 transition-colors"
              >
                {t.tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
