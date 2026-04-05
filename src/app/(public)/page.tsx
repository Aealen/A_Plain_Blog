import Link from 'next/link'
import Image from 'next/image'
import { getPublishedArticles, getRecommendedArticles } from '@/actions/public/article'
import ArticleCard from '@/components/public/ArticleCard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [recommended, articlesResult] = await Promise.all([
    getRecommendedArticles(),
    getPublishedArticles({ page: 1, pageSize: 6 }),
  ])

  const heroArticle = recommended[0]
  const articles = articlesResult.data

  return (
    <div className="px-5 md:px-[80px]">
      {/* Hero Section */}
      {heroArticle && (
        <section className="flex flex-col md:flex-row items-center gap-[40px] md:gap-[60px] pt-[60px]">
          {/* Left: Text Content */}
          <div className="w-full md:w-[740px] flex flex-col justify-center">
            {heroArticle.category && (
              <span className="inline-block text-[12px] text-tertiary tracking-widest mb-6">
                ✦ {heroArticle.category.name}
              </span>
            )}
            <h1 className="font-display text-[32px] md:text-[44px] font-bold leading-[1.2] tracking-tight mb-6">
              <Link
                href={`/articles/${heroArticle.slug}`}
                className="hover:opacity-80 transition-opacity"
              >
                {heroArticle.title}
              </Link>
            </h1>
            {heroArticle.excerpt && (
              <p className="text-[15px] text-muted-foreground leading-[1.6] mb-6">
                {heroArticle.excerpt}
              </p>
            )}
            <div className="flex items-center gap-4">
              <Link
                href={`/articles/${heroArticle.slug}`}
                className="text-[13px] font-medium hover:underline"
              >
                阅读全文
              </Link>
              <span className="text-tertiary text-[12px]">·</span>
              <Link
                href="/articles"
                className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                查看更多
              </Link>
            </div>
          </div>

          {/* Right: Image */}
          <div className="w-full md:w-[480px] h-[300px] md:h-[400px] rounded-lg overflow-hidden shrink-0 relative">
            {heroArticle.coverImage ? (
              <Image
                src={heroArticle.coverImage}
                alt={heroArticle.title}
                fill
                sizes="480px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[200px] h-[200px] rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 opacity-60" />
                </div>
                <div className="absolute bottom-8 right-8 w-[120px] h-[120px] rounded-full bg-gradient-to-tl from-zinc-200 to-zinc-300 opacity-40" />
                <div className="absolute top-12 left-12 w-[80px] h-[80px] rounded-lg bg-gradient-to-br from-zinc-200 to-zinc-300 opacity-30 rotate-12" />
              </div>
            )}
          </div>
        </section>
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
