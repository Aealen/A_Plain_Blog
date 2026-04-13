import { getPublishedArticles } from '@/actions/public/article'
import ArticleCard from '@/components/public/ArticleCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '全部文章',
  description: '浏览所有文章',
}

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function ArticlesPage({ searchParams }: Props) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1', 10))
  const pageSize = 12

  const { data: articles, totalPages } = await getPublishedArticles({
    page: currentPage,
    pageSize,
  })

  return (
    <div className="px-5 md:px-[80px] pt-[60px] pb-[40px]">
      <h1 className="font-display text-[32px] md:text-[44px] font-bold tracking-tight mb-10">
        全部文章
      </h1>

      {articles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[32px]">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              {currentPage > 1 && (
                <Link
                  href={`/articles?page=${currentPage - 1}`}
                  className="px-4 py-2 border border-border rounded-[var(--radius-sm)] text-sm hover:bg-muted transition-colors"
                >
                  上一页
                </Link>
              )}
              <span className="text-sm text-muted-foreground font-mono">
                {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages && (
                <Link
                  href={`/articles?page=${currentPage + 1}`}
                  className="px-4 py-2 border border-border rounded-[var(--radius-sm)] text-sm hover:bg-muted transition-colors"
                >
                  下一页
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">暂无文章</p>
          <p className="text-tertiary text-sm mt-2">内容正在准备中...</p>
        </div>
      )}
    </div>
  )
}
