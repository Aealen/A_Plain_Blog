import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTagBySlug } from '@/actions/public/tag'
import { getPublishedArticles } from '@/actions/public/article'

interface TagArticlesPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: TagArticlesPageProps): Promise<Metadata> {
  const { slug } = await params
  const tag = await getTagBySlug(slug)
  if (!tag) return { title: '标签未找到' }
  return {
    title: `${tag.name} - 标签`,
    description: `浏览带有「${tag.name}」标签的所有文章`,
  }
}

export default async function TagArticlesPage({ params }: TagArticlesPageProps) {
  const { slug } = await params
  const tag = await getTagBySlug(slug)

  if (!tag) notFound()

  const { data: articles } = await getPublishedArticles({ tagId: tag.id })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/tags" className="hover:text-blue-600">标签</Link>
          <span>/</span>
          <span>{tag.name}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{tag.name}</h1>
        <p className="text-sm text-gray-400 mt-1">共 {tag._count.articles} 篇文章</p>
      </header>

      {articles.length === 0 ? (
        <p className="text-gray-500 text-center py-12">该标签下暂无文章</p>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => (
            <article key={article.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <Link href={`/articles/${article.slug}`} className="group">
                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                  {article.title}
                </h2>
              </Link>
              {article.excerpt && (
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{article.excerpt}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-400">
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
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
