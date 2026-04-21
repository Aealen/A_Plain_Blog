import { getPublishedArticles } from '@/actions/public/article'
import ArticlesView from '@/components/public/ArticlesView'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '全部文章',
  description: '浏览所有文章',
}

interface Props {
  searchParams: Promise<{ page?: string; view?: string }>
}

export default async function ArticlesPage({ searchParams }: Props) {
  const params = await searchParams
  const view = params.view === 'masonry' ? 'masonry' : 'grid'
  const currentPage = view === 'masonry' ? 1 : Math.max(1, parseInt(params.page || '1', 10))
  const pageSize = 12

  const { data: articles, totalPages } = await getPublishedArticles({
    page: currentPage,
    pageSize,
  })

  return (
    <div className="px-5 md:px-[80px] pt-[60px] pb-[40px]">
      <h1 className="font-display text-[44px] md:text-[60px] font-bold uppercase tracking-[1px] mb-10">
        全部文章
      </h1>

      {articles.length > 0 ? (
        <ArticlesView
          initialArticles={articles}
          totalPages={totalPages}
          currentPage={currentPage}
          view={view}
        />
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">暂无文章</p>
          <p className="text-tertiary text-sm mt-2">内容正在准备中...</p>
        </div>
      )}
    </div>
  )
}
