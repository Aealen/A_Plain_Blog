import Link from 'next/link'
import { getPublishedArticles, getRecommendedArticles } from '@/actions/public/article'
import ArticleCard from '@/components/public/ArticleCard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [recommendedResult, articlesResult] = await Promise.all([
    getRecommendedArticles(),
    getPublishedArticles({ page: 1, pageSize: 20 }),
  ])

  const recommended = recommendedResult
  const articles = articlesResult.data

  return (
    <div className="space-y-12">
      {recommended.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">推荐文章</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommended.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">最新文章</h2>
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">暂无文章</p>
        )}
      </section>
    </div>
  )
}
