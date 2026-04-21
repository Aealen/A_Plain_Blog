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
    <article className="group flex flex-col h-full bg-card rounded-[20px] border border-border overflow-hidden">
      {hasCover && (
        <Link href={`/articles/${article.slug}`} className="block shrink-0">
          <div className="w-full h-[200px] overflow-hidden relative">
            <Image
              src={article.coverImage!}
              alt={article.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </Link>
      )}

      <div className={`p-6 ${hasCover ? '' : 'flex-1 flex flex-col min-h-0'}`}>
        {article.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {article.categories.map(c => (
              <Link
                key={c.category.slug}
                href={`/categories/${c.category.slug}`}
                className="inline-block font-mono text-[11px] font-semibold uppercase tracking-[1.1px] px-2 py-0.5 rounded-[20px] transition-opacity hover:opacity-80"
                style={getItemColor(c.category.name)}
              >
                {c.category.name}
              </Link>
            ))}
          </div>
        )}

        <h3 className="font-display text-[20px] font-bold leading-[1.0] uppercase mb-3">
          <Link
            href={`/articles/${article.slug}`}
            className="hover:text-link-hover transition-colors duration-150"
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
        <span className="px-6 pb-4 font-mono text-[10px] text-tertiary uppercase tracking-[1.5px] mt-auto shrink-0 flex items-center gap-2">
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
