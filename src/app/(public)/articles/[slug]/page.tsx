import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import { getArticleBySlug, incrementViewCount } from '@/actions/public/article'

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
          <div className="relative w-full h-[320px] md:h-[520px] overflow-hidden rounded-[var(--radius-lg)] mx-5 md:mx-[80px]">
            <img
              src={article.coverImage}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 md:pb-16 px-6">
              <div className="max-w-[680px] w-full text-center">
                {article.category && (
                  <Link
                    href={`/categories/${article.category.slug}`}
                    className="inline-block text-xs font-display font-medium text-white/90 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full mb-4 hover:bg-white/25 transition-colors"
                  >
                    {article.category.name}
                  </Link>
                )}
                <h1 className="text-2xl md:text-4xl font-bold font-display text-white leading-tight mb-4 drop-shadow-lg">
                  {article.title}
                </h1>
                <div className="flex items-center justify-center gap-4 text-sm text-white/75">
                  {article.publishedAt && (
                    <time dateTime={article.publishedAt.toISOString()}>
                      {new Date(article.publishedAt).toLocaleDateString('zh-CN', {
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
                        className="text-xs px-2.5 py-1 bg-white/15 text-white/80 rounded-full backdrop-blur-sm hover:bg-white/25 transition-colors"
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
              {article.category && (
                <Link
                  href={`/categories/${article.category.slug}`}
                  className="inline-block text-xs font-display font-medium text-primary bg-accent px-3 py-1 rounded-full mb-4 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {article.category.name}
                </Link>
              )}
              <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground leading-tight mb-5">
                {article.title}
              </h1>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                {article.publishedAt && (
                  <time dateTime={article.publishedAt.toISOString()}>
                    {new Date(article.publishedAt).toLocaleDateString('zh-CN', {
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
                      className="text-xs px-2.5 py-1 bg-muted text-muted-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
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
        <div className="max-w-[880px] mx-auto px-5 md:px-0 py-10">
          <div className="prose max-w-[680px] mx-auto prose-headings:scroll-mt-20 text-base md:text-[17px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight, rehypeSlug]}>
              {article.content}
            </ReactMarkdown>
          </div>

          {/* Back Link */}
          <div className="mt-12 pt-8 border-t border-border max-w-[680px] mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-display"
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
