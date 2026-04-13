'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getArticles, deleteArticle, restoreArticle, permanentDeleteArticle, batchDelete, discardDraft } from '@/actions/admin/article'
import { importMarkdownFiles } from '@/actions/admin/import'
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
  coverImage: string | null
  status: string
  draft: unknown
  sortOrder: number
  viewCount: number
  createdAt: string
  updatedAt: string
  categories: { category: { id: string; name: string; slug: string } }[]
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
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const [sortBy, setSortBy] = useState('sortOrder')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const loadArticles = useCallback(async () => {
    setLoading(true)
    const result = await getArticles({
      page,
      pageSize: 20,
      status: status === 'ALL' ? undefined : status,
      search: search || undefined,
      sortBy,
      sortOrder,
    })
    setArticles(result.data as unknown as ArticleRow[])
    setTotal(result.total)
    setTotalPages(result.totalPages)
    setLoading(false)
    setSelectedIds(new Set())
  }, [page, status, search, sortBy, sortOrder])

  useEffect(() => { loadArticles() }, [loadArticles])

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setImporting(true); setImportResult(null)
    try {
      const entries = await Promise.all(
        Array.from(files).map(async f => ({ name: f.name, content: await f.text() }))
      )
      const result = await importMarkdownFiles(entries)
      setImportResult(result)
      if (result.imported > 0) await loadArticles()
    } catch (err) {
      setImportResult({ imported: 0, skipped: 1, errors: [err instanceof Error ? err.message : '导入失败'] })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  function handleStatusTab(value: ArticleStatus | 'ALL') {
    setStatus(value)
    setPage(1)
  }

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  function SortHeader({ field, children }: { field: string; children: React.ReactNode }) {
    const active = sortBy === field
    return (
      <th
        className="p-3 text-left text-sm font-medium font-mono text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
        onClick={() => handleSort(field)}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          <span className="text-xs">{active ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}</span>
        </span>
      </th>
    )
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

  async function handleDiscardDraft(id: string) {
    if (!confirm('确定要撤销改动吗？将恢复到上次发布的状态。')) return
    await discardDraft(id)
    await loadArticles()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-mono text-foreground">文章管理</h1>
        <div className="flex gap-2">
          <label className={`bg-muted text-foreground px-4 py-2 rounded-[var(--radius-sm)] font-medium transition-colors cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : 'hover:bg-border'}`}>
            {importing ? '导入中...' : '导入 Markdown'}
            <input type="file" accept=".md,.markdown" multiple onChange={handleImport} className="hidden" />
          </label>
          <Link href="/admin/articles/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-[var(--radius-sm)] hover:bg-primary/90 font-medium transition-colors">
            新建文章
          </Link>
        </div>
      </div>

      {importResult && (
        <div className={`p-3 rounded-[var(--radius-sm)] mb-4 text-sm ${importResult.errors.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
          导入完成：成功 {importResult.imported} 篇，跳过 {importResult.skipped} 篇
          {importResult.errors.length > 0 && (
            <ul className="mt-1 list-disc list-inside">{importResult.errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
          )}
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-1 mb-4 bg-card rounded-[var(--radius-lg)] border border-border p-1">
        {statusTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleStatusTab(tab.value)}
            className={`px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-all duration-200 ${
              status === tab.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
            className="flex-1 px-3 py-2 border border-border rounded-[var(--radius-sm)] bg-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <button type="submit" className="px-4 py-2 bg-muted rounded-[var(--radius-sm)] hover:bg-border transition-colors font-medium">
            搜索
          </button>
        </form>
        {selectedIds.size > 0 && (
          <button
            onClick={handleBatchDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-[var(--radius-sm)] hover:bg-red-600 transition-colors font-medium"
          >
            批量删除 ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-[var(--radius-lg)] border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="p-3 text-left w-10">
                <input type="checkbox" checked={articles.length > 0 && selectedIds.size === articles.length} onChange={toggleSelectAll} className="rounded accent-primary" />
              </th>
              <th className="p-3 text-left text-sm font-medium font-mono text-muted-foreground w-16">封面</th>
              <SortHeader field="title">标题</SortHeader>
              <th className="p-3 text-left text-sm font-medium font-mono text-muted-foreground w-24">分类</th>
              <th className="p-3 text-left text-sm font-medium font-mono text-muted-foreground w-24">状态</th>
              <SortHeader field="createdAt">创建时间</SortHeader>
              <SortHeader field="updatedAt">更新时间</SortHeader>
              <SortHeader field="sortOrder">排序</SortHeader>
              <SortHeader field="viewCount">阅读</SortHeader>
              <th className="p-3 text-left text-sm font-medium font-mono text-muted-foreground w-40">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">加载中...</td></tr>
            ) : articles.length === 0 ? (
              <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">暂无文章</td></tr>
            ) : (
              articles.map(article => (
                <tr key={article.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <input type="checkbox" checked={selectedIds.has(article.id)} onChange={() => toggleSelect(article.id)} className="rounded accent-primary" />
                  </td>
                  <td className="p-3">
                    {article.coverImage ? (
                      <Image
                        src={article.coverImage}
                        alt={article.title}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setPreviewImage(article.coverImage)}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">-</div>
                    )}
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/articles/${article.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                      {article.title}
                    </Link>
                    {Boolean(article.draft) && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">有改动</span>
                    )}
                    {article.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {article.tags.map(t => (
                          <span key={t.tag.id} className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{t.tag.name}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{article.categories.length > 0 ? article.categories.map(c => c.category.name).join(', ') : '-'}</td>
                  <td className="p-3">
                    <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${statusConfig[article.status]?.color || 'bg-muted text-muted-foreground'}`}>
                      {statusConfig[article.status]?.label || article.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground font-mono">{new Date(article.createdAt).toLocaleDateString('zh-CN')}</td>
                  <td className="p-3 text-sm text-muted-foreground font-mono">{new Date(article.updatedAt).toLocaleDateString('zh-CN')}</td>
                  <td className="p-3 text-sm text-muted-foreground font-mono">{article.sortOrder}</td>
                  <td className="p-3 text-sm text-muted-foreground font-mono">{article.viewCount}</td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      <Link href={`/admin/articles/${article.id}`} className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">编辑</Link>
                      {article.status === 'TRASH' ? (
                        <>
                          <button onClick={() => handleRestore(article.id)} className="text-sm text-green-600 hover:text-green-800 font-medium transition-colors">恢复</button>
                          <button onClick={() => handlePermanentDelete(article.id)} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">永久删除</button>
                        </>
                      ) : (
                        <button onClick={() => handleDelete(article.id)} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">删除</button>
                      )}
                      {article.status === 'PUBLISHED' && article.draft != null && (
                        <button onClick={() => handleDiscardDraft(article.id)} className="text-sm text-amber-600 hover:text-amber-800 font-medium transition-colors">撤销改动</button>
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
          <span className="text-sm text-muted-foreground font-mono">共 {total} 篇文章</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-border rounded-[var(--radius-sm)] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
            >
              上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, i, arr) => (
                <span key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-muted-foreground">...</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 border rounded-[var(--radius-sm)] text-sm font-mono transition-colors ${
                      page === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
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
              className="px-3 py-1 border border-border rounded-[var(--radius-sm)] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <Image
              src={previewImage}
              alt="预览"
              width={800}
              height={600}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
