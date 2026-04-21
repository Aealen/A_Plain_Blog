import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ArticleContent from '@/components/public/ArticleContent'
import { getArticleBySlug, incrementViewCount } from '@/actions/public/article'
import { getItemColor } from '@/lib/colors'

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) return { title: '文章未找到' }

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt || undefined,
    keywords: article.seoKeywords?.split(',').map((k) => k.trim()) || undefined,
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt || undefined,
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) notFound()

  await incrementViewCount(article.id)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.seoDescription || article.excerpt || undefined,
    image: article.coverImage || undefined,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: 'Admin',
    },
    keywords: article.seoKeywords || undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>
        {/* Hero: Cover Image with Overlay Title */}
        {article.coverImage ? (
          <div className="relative w-full h-[320px] md:h-[520px] overflow-hidden rounded-[24px] mx-5 md:mx-[80px] border border-white/10">
            <img
              src={article.coverImage}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 md:pb-16 px-6">
              <div className="max-w-[680px] w-full text-center">
                {article.categories.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {article.categories.map(c => (
                      <Link
                        key={c.category.slug}
                        href={`/categories/${c.category.slug}`}
                        className="font-mono text-[11px] font-semibold uppercase tracking-[1.1px] text-black bg-mint px-3 py-1 rounded-[20px] hover:opacity-80 transition-opacity"
                      >
                        {c.category.name}
                      </Link>
                    ))}
                  </div>
                )}
                <h1 className="text-3xl md:text-5xl font-bold font-display text-white leading-[0.95] uppercase tracking-[1px] mb-4">
                  {article.title}
                </h1>
                <div className="flex items-center justify-center gap-4 font-mono text-[11px] text-white/60 uppercase tracking-[1.1px]">
                  {article.createdAt && (
                    <time dateTime={article.createdAt.toISOString()}>
                      创建于 {new Date(article.createdAt).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  )}
                  {article.publishedAt && (
                    <time dateTime={article.publishedAt.toISOString()}>
                      发布于 {new Date(article.publishedAt).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  )}
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {article.viewCount}
                  </span>
                </div>
                {article.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {article.tags.map(({ tag }) => (
                      <Link
                        key={tag.slug}
                        href={`/tags/${tag.slug}`}
                        className="font-mono text-[11px] font-semibold uppercase tracking-[1.1px] px-2.5 py-1 rounded-[20px] transition-opacity hover:opacity-80"
                        style={getItemColor(tag.name)}
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-[880px] mx-auto pt-12 pb-10 px-5 md:px-0">
            <header className="mb-10 text-center">
              {article.categories.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {article.categories.map(c => (
                    <Link
                      key={c.category.slug}
                      href={`/categories/${c.category.slug}`}
                      className="font-mono text-[11px] font-semibold uppercase tracking-[1.1px] px-3 py-1 rounded-[20px] transition-opacity hover:opacity-80"
                      style={getItemColor(c.category.name)}
                    >
                      {c.category.name}
                    </Link>
                  ))}
                </div>
              )}
              <h1 className="text-3xl md:text-5xl font-bold font-display text-foreground leading-[0.95] uppercase tracking-[1px] mb-5">
                {article.title}
              </h1>
              <div className="flex items-center justify-center gap-4 font-mono text-[11px] text-muted-foreground uppercase tracking-[1.1px]">
                {article.createdAt && (
                  <time dateTime={article.createdAt.toISOString()}>
                    创建于 {new Date(article.createdAt).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                )}
                {article.publishedAt && (
                  <time dateTime={article.publishedAt.toISOString()}>
                    发布于 {new Date(article.publishedAt).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {article.viewCount}
                </span>
              </div>
              {article.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {article.tags.map(({ tag }) => (
                    <Link
                      key={tag.slug}
                      href={`/tags/${tag.slug}`}
                      className="font-mono text-[11px] font-semibold uppercase tracking-[1.1px] px-2.5 py-1 rounded-[20px] transition-opacity hover:opacity-80"
                      style={getItemColor(tag.name)}
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </header>
          </div>
        )}

        {/* Content */}
        <div className="w-full mx-5 md:mx-[80px] py-10">
          <div className="prose prose-headings:scroll-mt-20 text-base md:text-[17px]" style={{ maxWidth: '100%' }}>
            <ArticleContent content={article.content} />
          </div>

          {/* Back Link */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground hover:text-mint transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回首页
            </Link>
          </div>
        </div>
      </article>
    </>
  )
}
