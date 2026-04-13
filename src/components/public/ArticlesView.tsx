'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ArticleCard from './ArticleCard'
import { getPublishedArticles } from '@/actions/public/article'

type ViewMode = 'grid' | 'masonry'

interface ArticleData {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  createdAt: Date | null
  viewCount: number
  categories: { category: { name: string; slug: string } }[]
  tags: { tag: { name: string; slug: string } }[]
}

interface ArticlesViewProps {
  initialArticles: ArticleData[]
  totalPages: number
  currentPage: number
  view: ViewMode
}

function splitIntoColumns<T>(items: T[], numColumns: number): T[][] {
  const columns: T[][] = Array.from({ length: numColumns }, () => [])
  items.forEach((item, index) => {
    columns[index % numColumns].push(item)
  })
  return columns
}

function useColumnCount() {
  const [count, setCount] = useState(3)

  useEffect(() => {
    function update() {
      if (window.innerWidth < 768) setCount(1)
      else if (window.innerWidth < 1024) setCount(2)
      else setCount(3)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return count
}

export default function ArticlesView({
  initialArticles,
  totalPages,
  currentPage,
  view: initialView,
}: ArticlesViewProps) {
  const router = useRouter()
  const [view, setView] = useState<ViewMode>(initialView)

  // Masonry state
  const [masonryArticles, setMasonryArticles] = useState<ArticleData[]>(initialArticles)
  const [masonryPage, setMasonryPage] = useState(1)
  const [masonryHasMore, setMasonryHasMore] = useState(totalPages > 1)
  const [loadingMore, setLoadingMore] = useState(false)

  const columnCount = useColumnCount()
  const columns = useMemo(
    () => splitIntoColumns(masonryArticles, columnCount),
    [masonryArticles, columnCount]
  )

  // 同步服务端 props 变化到客户端状态
  useEffect(() => {
    setView(initialView)
    if (initialView === 'masonry') {
      setMasonryArticles(initialArticles)
      setMasonryPage(1)
      setMasonryHasMore(totalPages > 1)
    }
  }, [initialView, initialArticles, totalPages])

  function switchView(newView: ViewMode) {
    if (newView === 'grid') {
      router.push('/articles', { scroll: false })
    } else {
      router.push('/articles?view=masonry', { scroll: false })
    }
  }

  const loadMore = useCallback(async () => {
    if (loadingMore) return
    setLoadingMore(true)
    const nextPage = masonryPage + 1
    try {
      const result = await getPublishedArticles({ page: nextPage, pageSize: 12 })
      setMasonryArticles(prev => [...prev, ...result.data])
      setMasonryPage(nextPage)
      setMasonryHasMore(nextPage < result.totalPages)
    } finally {
      setLoadingMore(false)
    }
  }, [masonryPage, loadingMore])

  return (
    <>
      {/* View Toggle */}
      <div className="flex justify-end mb-6">
        <div className="inline-flex bg-muted rounded-[var(--radius-sm)] p-1 gap-0.5">
          <button
            onClick={() => switchView('grid')}
            className={`p-2 rounded-[var(--radius-sm)] transition-colors ${
              view === 'grid'
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="分页视图"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => switchView('masonry')}
            className={`p-2 rounded-[var(--radius-sm)] transition-colors ${
              view === 'masonry'
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="瀑布流视图"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="12" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="3" y="17" rx="1" />
              <rect width="7" height="12" x="14" y="12" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[32px] items-stretch">
            {initialArticles.map((article) => (
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[32px] items-stretch">
            {columns.map((column, i) => (
              <div key={i} className="flex flex-col gap-[32px]">
                {column.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ))}
          </div>

          {masonryHasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2 border border-border rounded-[var(--radius-sm)] text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                {loadingMore ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
