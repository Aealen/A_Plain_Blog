'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getArticles, deleteArticle, restoreArticle, permanentDeleteArticle, batchDelete } from '@/actions/admin/article'
import { ArticleStatus } from '@prisma/client'

const statusTabs: { label: string; value: ArticleStatus | 'ALL' }[] = [
  { label: '全部', value: 'ALL' },
  { label: '已发布', value: 'PUBLISHED' },
  { label: '草稿', value: 'DRAFT' },
  { label: '私密', value: 'PRIVATE' },
  { label: '回收站', value: 'TRASH' },
]

const statusConfig: Record<string, { label: string; color: string }> = {
  PUBLISHED: { label: '已发布', color: 'bg-green-100 text-green-700' },
  DRAFT: { label: '草稿', color: 'bg-yellow-100 text-yellow-700' },
  PRIVATE: { label: '私密', color: 'bg-purple-100 text-purple-700' },
  TRASH: { label: '回收站', color: 'bg-red-100 text-red-700' },
}

interface ArticleRow {
  id: string
  title: string
  status: string
  sortOrder: number
  viewCount: number
  category: { id: string; name: string; slug: string } | null
  tags: { tag: { id: string; name: string; slug: string } }[]
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [status, setStatus] = useState<ArticleStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const loadArticles = useCallback(async () => {
    setLoading(true)
    const result = await getArticles({
      page,
      pageSize: 20,
      status: status === 'ALL' ? undefined : status,
      search: search || undefined,
    })
    setArticles(result.data as ArticleRow[])
    setTotal(result.total)
    setTotalPages(result.totalPages)
    setLoading(false)
    setSelectedIds(new Set())
  }, [page, status, search])

  useEffect(() => { loadArticles() }, [loadArticles])

  function handleStatusTab(value: ArticleStatus | 'ALL') {
    setStatus(value)
    setPage(1)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    loadArticles()
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === articles.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(articles.map(a => a.id)))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要移入回收站吗？')) return
    await deleteArticle(id)
    await loadArticles()
  }

  async function handleRestore(id: string) {
    await restoreArticle(id)
    await loadArticles()
  }

  async function handlePermanentDelete(id: string) {
    if (!confirm('确定要永久删除吗？此操作不可恢复！')) return
    await permanentDeleteArticle(id)
    await loadArticles()
  }

  async function handleBatchDelete() {
    if (selectedIds.size === 0) return
    if (!confirm(`确定要将 ${selectedIds.size} 篇文章移入回收站吗？`)) return
    await batchDelete(Array.from(selectedIds))
    await loadArticles()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link href="/admin/articles/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          新建文章
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-lg shadow p-1">
        {statusTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleStatusTab(tab.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              status === tab.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Batch */}
      <div className="flex gap-4 mb-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索文章标题或内容..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            搜索
          </button>
        </form>
        {selectedIds.size > 0 && (
          <button
            onClick={handleBatchDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            批量删除 ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={articles.length > 0 && selectedIds.size === articles.length}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">标题</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600 w-24">分类</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600 w-24">状态</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600 w-20">排序</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600 w-20">阅读</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600 w-40">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">加载中...</td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">暂无文章</td>
              </tr>
            ) : (
              articles.map(article => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(article.id)}
                      onChange={() => toggleSelect(article.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {article.title}
                    </Link>
                    {article.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {article.tags.map(t => (
                          <span key={t.tag.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {t.tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {article.category?.name || '-'}
                  </td>
                  <td className="p-3">
                    <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${statusConfig[article.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                      {statusConfig[article.status]?.label || article.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{article.sortOrder}</td>
                  <td className="p-3 text-sm text-gray-600">{article.viewCount}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        编辑
                      </Link>
                      {article.status === 'TRASH' ? (
                        <>
                          <button onClick={() => handleRestore(article.id)} className="text-sm text-green-600 hover:text-green-800">
                            恢复
                          </button>
                          <button onClick={() => handlePermanentDelete(article.id)} className="text-sm text-red-600 hover:text-red-800">
                            永久删除
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleDelete(article.id)} className="text-sm text-red-600 hover:text-red-800">
                          删除
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">共 {total} 篇文章</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, i, arr) => (
                <span key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-gray-400">...</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 border rounded-lg text-sm ${
                      page === p ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))
            }
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
