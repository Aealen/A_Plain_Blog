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
      <article className="max-w-[880px] mx-auto">
        {/* Article Header */}
        <header className="mb-10">
          {article.category && (
            <Link
              href={`/categories/${article.category.slug}`}
              className="inline-block text-xs font-mono font-medium text-primary bg-accent px-3 py-1 rounded-full mb-4 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {article.category.name}
            </Link>
          )}
          <h1 className="text-3xl md:text-4xl font-bold font-mono text-foreground leading-tight mb-5">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {article.publishedAt && (
              <time dateTime={article.publishedAt.toISOString()} className="font-mono">
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
            <div className="flex flex-wrap gap-2 mt-4">
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

        {/* Cover Image */}
        {article.coverImage && (
          <div className="mb-10 rounded-[var(--radius-lg)] overflow-hidden">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose max-w-none prose-headings:scroll-mt-20">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight, rehypeSlug]}>
            {article.content}
          </ReactMarkdown>
        </div>

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-border">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回首页
          </Link>
        </div>
      </article>
    </>
  )
}
