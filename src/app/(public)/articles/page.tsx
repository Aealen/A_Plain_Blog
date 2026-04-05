import { getPublishedArticles } from '@/actions/public/article'
import ArticleCard from '@/components/public/ArticleCard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '全部文章',
  description: '浏览所有文章',
}

export default async function ArticlesPage() {
  const { data: articles, totalPages } = await getPublishedArticles({
    page: 1,
    pageSize: 12,
  })

  return (
    <div className="px-5 md:px-[80px] pt-[60px] pb-[40px]">
      <h1 className="font-display text-[32px] md:text-[44px] font-bold tracking-tight mb-10">
        全部文章
      </h1>

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
    </div>
  )
}
