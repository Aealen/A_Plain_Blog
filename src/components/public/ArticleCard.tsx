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
  const hasCover = !!article.coverImage
  const tags = article.tags.map((t) => t.tag)
  const categoryTag = article.category ? (
    <Link
      href={`/categories/${article.category.slug}`}
      className="text-primary hover:text-primary/80 font-medium font-mono transition-colors"
    >
      {article.category.name}
    </Link>
  ) : null

  const formattedDate = article.publishedAt ? formatDate(article.publishedAt) : null

  return (
    <article className="group bg-card rounded-[var(--radius-lg)] border border-border overflow-hidden hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      {hasCover ? (
        <>
          <Link href={`/articles/${article.slug}`} className="block relative aspect-video overflow-hidden">
            <Image
              src={article.coverImage!}
              alt={article.title}
              fill
              sizes="(min-width: 600px)"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
          <div className="p-5">
            {/* text content */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              {categoryTag}
              {formattedDate && <span>{formattedDate}</span>}
            </div>

            <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 font-mono leading-snug">
              <Link href={`/articles/${article.slug}`} className="hover:text-primary transition-colors">
                {article.title}
              </Link>
            </h3>

            {article.excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/tags/${t.slug}`}
                    className="inline-block text-xs px-2.5 py-1 bg-muted text-muted-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="p-5">
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {categoryTag}
            {formattedDate && <span>{formattedDate}</span>}
          </div>

          <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 font-mono leading-snug">
            <Link href={`/articles/${article.slug}`} className="hover:text-primary transition-colors">
              {article.title}
            </Link>
          </h3>

          {article.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
              {article.excerpt}
            </p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tags/${t.slug}`}
                  className="inline-block text-xs px-2.5 py-1 bg-muted text-muted-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  #{t.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
