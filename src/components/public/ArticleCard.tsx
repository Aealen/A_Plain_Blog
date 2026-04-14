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
    createdAt: Date | null
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
  const formattedDate = article.createdAt ? formatDate(article.createdAt) : null
  const hasCover = !!article.coverImage

  return (
    <article className="group flex flex-col h-full">
      {hasCover && (
        <Link href={`/articles/${article.slug}`} className="block shrink-0">
          <div className="w-full h-[200px] rounded-lg overflow-hidden mb-4 relative">
            <Image
              src={article.coverImage!}
              alt={article.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </Link>
      )}

      <div className={hasCover ? '' : 'flex-1 flex flex-col min-h-0'}>
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
          <p className={`text-[13px] text-muted-foreground leading-[1.6] mb-3 ${hasCover ? 'line-clamp-2' : 'flex-1 min-h-0 overflow-hidden'}`}>
            {article.excerpt}
          </p>
        )}
      </div>

      {(formattedDate || article.viewCount > 0) && (
        <span className="text-[12px] text-tertiary mt-auto shrink-0 flex items-center gap-2">
          {formattedDate}
          {article.viewCount > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              {article.viewCount}
            </span>
          )}
        </span>
      )}
    </article>
  )
})
