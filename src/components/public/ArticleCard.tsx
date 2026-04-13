import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getItemColor } from '@/lib/colors'

interface ArticleCardProps {
  article: {
    id: string
    title: string
    slug: string
    excerpt?: string | null
    coverImage?: string | null
    publishedAt: Date | null
    viewCount: number
    categories: { category: { name: string; slug: string } }[]
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

export default React.memo(function ArticleCard({ article }: ArticleCardProps) {
  const formattedDate = article.publishedAt ? formatDate(article.publishedAt) : null

  return (
    <article className="group">
      {article.coverImage && (
        <Link href={`/articles/${article.slug}`} className="block">
          <div className="w-full h-[200px] rounded-lg overflow-hidden mb-4 relative">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </Link>
      )}

      {article.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {article.categories.map(c => (
            <Link
              key={c.category.slug}
              href={`/categories/${c.category.slug}`}
              className="inline-block text-[11px] font-medium px-2 py-0.5 rounded transition-opacity hover:opacity-80"
              style={getItemColor(c.category.name)}
            >
              {c.category.name}
            </Link>
          ))}
        </div>
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
})
