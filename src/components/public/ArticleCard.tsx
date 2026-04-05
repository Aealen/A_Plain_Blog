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
  const formattedDate = article.publishedAt ? formatDate(article.publishedAt) : null

  return (
    <article className="group">
      <Link href={`/articles/${article.slug}`} className="block">
        <div className="w-full h-[200px] rounded-lg overflow-hidden mb-4 relative">
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-200" />
          )}
        </div>
      </Link>

      {article.category && (
        <Link
          href={`/categories/${article.category.slug}`}
          className="inline-block text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded mb-3 hover:bg-border transition-colors"
        >
          {article.category.name}
        </Link>
      )}

      <h3 className="font-display text-[18px] font-semibold leading-[1.3] mb-3">
        <Link
          href={`/articles/${article.slug}`}
          className="hover:text-indigo-600 transition-colors duration-200"
        >
          {article.title}
        </Link>
      </h3>

      {article.excerpt && (
        <p className="text-[13px] text-muted-foreground leading-[1.6] mb-3 line-clamp-2">
          {article.excerpt}
        </p>
      )}

      {formattedDate && (
        <span className="text-[12px] text-tertiary">{formattedDate}</span>
      )}
    </article>
  )
}
