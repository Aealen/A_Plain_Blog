import Link from 'next/link'
import Image from 'next/image'
import { getPublishedArticles, getRecommendedArticles } from '@/actions/public/article'
import ArticleCard from '@/components/public/ArticleCard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [recommended, articlesResult] = await Promise.all([
    getRecommendedArticles(),
    getPublishedArticles({ page: 1, pageSize: 20 }),
  ])

  const articles = articlesResult.data
  const heroArticle = recommended[0]
  const moreRecommended = recommended.slice(1)

  return (
    <div className="max-w-[1280px] mx-auto w-full px-5 py-10">
      {/* Hero Section */}
      {heroArticle && (
        <section className="mb-16">
          <Link href={`/articles/${heroArticle.slug}`} className="group block">
            <div className="relative rounded-[var(--radius-lg)] overflow-hidden aspect-[21/9] bg-card border border-border">
              {heroArticle.coverImage ? (
                <Image
                  src={heroArticle.coverImage}
                  alt={heroArticle.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                {heroArticle.category && (
                  <span className="inline-block text-xs font-mono font-medium text-primary-foreground/90 bg-primary/80 px-3 py-1 rounded-full mb-3">
                    {heroArticle.category.name}
                  </span>
                )}
                <h2 className="text-2xl md:text-3xl font-bold font-mono text-white mb-2 line-clamp-2">
                  {heroArticle.title}
                </h2>
                {heroArticle.excerpt && (
                  <p className="text-sm text-white/70 line-clamp-2 max-w-2xl">
                    {heroArticle.excerpt}
                  </p>
                )}
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* More Recommended */}
      {moreRecommended.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xl font-bold font-mono text-foreground mb-6">推荐阅读</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moreRecommended.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Articles */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-mono text-foreground">最新文章</h2>
          <Link href="/categories" className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono">
            查看全部 →
          </Link>
        </div>
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">暂无文章</p>
            <p className="text-muted-foreground/60 text-sm mt-2">内容正在准备中...</p>
          </div>
        )}
      </section>
    </div>
  )
}
