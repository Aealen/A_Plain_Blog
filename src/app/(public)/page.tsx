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
    <div className="max-w-[1280px] mx-auto w-full px-5 lg:px-0 pt-[60px] pb-10">
      {/* Hero Section */}
      {heroArticle && (
        <section className="mb-16">
          <Link href={`/articles/${heroArticle.slug}`} className="group block">
            <div className="flex items-stretch gap-[60px] h-[400px]">
              {/* Left text area */}
              <div className="flex flex-col justify-center w-[740px] shrink-0">
                {heroArticle.category && (
                  <span className="inline-block text-xs font-display font-medium text-primary bg-accent px-3 py-1 rounded-full mb-4 w-fit">
                    {heroArticle.category.name}
                  </span>
                )}
                <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground leading-tight mb-4 line-clamp-2 group-hover:text-primary transition-colors">
                  {heroArticle.title}
                </h2>
                {heroArticle.excerpt && (
                  <p className="text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                    {heroArticle.excerpt}
                  </p>
                )}
                <div className="text-sm text-muted-foreground">
                  {heroArticle.publishedAt && (
                    <time className="font-display">
                      {new Date(heroArticle.publishedAt).toLocaleDateString('zh-CN')}
                    </time>
                  )}
                </div>
              </div>
              {/* Right image area */}
              <div className="relative w-[480px] h-[400px] shrink-0 rounded-[var(--radius-lg)] overflow-hidden">
                {heroArticle.coverImage ? (
                  <Image
                    src={heroArticle.coverImage}
                    alt={heroArticle.title}
                    fill
                    sizes="480px"
                    className="object-cover rounded-[var(--radius-lg)] group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-[var(--radius-lg)]" />
                )}
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* More Recommended */}
      {moreRecommended.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xl font-bold font-display text-foreground mb-6">推荐阅读</h2>
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
          <h2 className="text-xl font-bold font-display text-foreground">最新文章</h2>
          <Link href="/categories" className="text-sm text-muted-foreground hover:text-primary transition-colors font-display">
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
            <p className="text-tertiary text-sm mt-2">内容正在准备中...</p>
          </div>
        )}
      </section>
    </div>
  )
}
