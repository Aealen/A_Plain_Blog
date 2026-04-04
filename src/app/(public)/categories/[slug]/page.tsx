import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCategoryBySlug } from '@/actions/public/category'
import { getPublishedArticles } from '@/actions/public/article'

interface CategoryArticlesPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryArticlesPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: '分类未找到' }
  return {
    title: `${category.name} - 分类`,
    description: category.description || `浏览${category.name}分类下的所有文章`,
  }
}

export default async function CategoryArticlesPage({ params }: CategoryArticlesPageProps) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) notFound()

  const { data: articles } = await getPublishedArticles({ categoryId: category.id })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/categories" className="hover:text-blue-600">分类</Link>
          <span>/</span>
          <span>{category.name}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        {category.description && (
          <p className="text-gray-500 mt-2">{category.description}</p>
        )}
        <p className="text-sm text-gray-400 mt-1">共 {category._count.articles} 篇文章</p>
      </header>

      {articles.length === 0 ? (
        <p className="text-gray-500 text-center py-12">该分类下暂无文章</p>
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
                {article.tags.length > 0 && (
                  <div className="flex gap-1">
                    {article.tags.map(({ tag }) => (
                      <Link
                        key={tag.slug}
                        href={`/tags/${tag.slug}`}
                        className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
