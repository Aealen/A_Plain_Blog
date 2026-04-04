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
      <article className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {article.publishedAt && (
              <time dateTime={article.publishedAt.toISOString()}>
                {new Date(article.publishedAt).toLocaleDateString('zh-CN')}
              </time>
            )}
            <span>{article.viewCount} 阅读</span>
            {article.category && (
              <Link
                href={`/categories/${article.category.slug}`}
                className="text-blue-600 hover:underline"
              >
                {article.category.name}
              </Link>
            )}
          </div>
          {article.tags.length > 0 && (
            <div className="flex gap-2 mt-3">
              {article.tags.map(({ tag }) => (
                <Link
                  key={tag.slug}
                  href={`/tags/${tag.slug}`}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </header>

        {article.coverImage && (
          <div className="mb-8">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full rounded-lg"
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none prose-headings:scroll-mt-20 prose-a:text-blue-600 prose-img:rounded-lg">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight, rehypeSlug]}>
            {article.content}
          </ReactMarkdown>
        </div>
      </article>
    </>
  )
}
