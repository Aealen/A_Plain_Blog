import Image from 'next/image'
import Link from 'next/link'
import { getPublishedArticles, getRecommendedArticles } from '@/actions/public/article'
import ArticleCard from '@/components/public/ArticleCard'
import HeroCarousel from '@/components/public/HeroCarousel'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [recommended, articlesResult] = await Promise.all([
    getRecommendedArticles(),
    getPublishedArticles({ page: 1, pageSize: 6 }),
  ])

  const articles = articlesResult.data

  return (
    <div className="px-5 md:px-[80px]">
      {/* Hero Carousel */}
      {recommended.length > 0 && (
        <HeroCarousel articles={recommended} />
      )}

      {/* Latest Articles Section */}
      <section id="articles" className="pt-[60px] pb-[40px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-[24px] md:text-[28px] font-bold tracking-tight">最新文章</h2>
          <Link
            href="/articles"
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            查看全部 →
          </Link>
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[32px]">
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
