'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getArticleById, updateArticle } from '@/actions/admin/article'
import { getCategoriesWithCount } from '@/actions/admin/category'
import { getTagsWithCount } from '@/actions/admin/tag'
import MarkdownEditor from '@/components/admin/MarkdownEditor'
import { ArticleStatus } from '@prisma/client'
import type { ArticleFormData } from '@/types'

interface CategoryItem {
  id: string
  name: string
  slug: string
  _count: { articles: number }
}

interface TagItem {
  id: string
  name: string
  slug: string
  _count: { articles: number }
}

interface ArticleDetail {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  coverImage: string | null
  categoryId: string | null
  status: string
  sortOrder: number
  isRecommended: boolean
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  publishedAt: Date | null
  category: { id: string; name: string } | null
  tags: { tag: { id: string; name: string } }[]
}

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [showSEO, setShowSEO] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    coverImage: '',
    categoryId: '',
    status: 'DRAFT' as ArticleStatus,
    sortOrder: 0,
    isRecommended: false,
    tagIds: [] as string[],
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [articleData, cats, tagList] = await Promise.all([
          getArticleById(id),
          getCategoriesWithCount(),
          getTagsWithCount(),
        ])
        if (!articleData) {
          setError('文章不存在')
          setLoading(false)
          return
        }
        const a = articleData as ArticleDetail
        setArticle(a)
        setCategories(cats as CategoryItem[])
        setTags(tagList as TagItem[])
        setFormData({
          title: a.title,
          slug: a.slug,
          content: a.content,
          excerpt: a.excerpt || '',
          coverImage: a.coverImage || '',
          categoryId: a.categoryId || '',
          status: a.status as ArticleStatus,
          sortOrder: a.sortOrder,
          isRecommended: a.isRecommended,
          tagIds: a.tags.map(t => t.tag.id),
          seoTitle: a.seoTitle || '',
          seoDescription: a.seoDescription || '',
          seoKeywords: a.seoKeywords || '',
        })
        if (a.seoTitle || a.seoDescription || a.seoKeywords) {
          setShowSEO(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  function toggleTag(tagId: string) {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(tid => tid !== tagId)
        : [...prev.tagIds, tagId],
    }))
  }

  async function handleSubmit(status: ArticleStatus) {
    setError('')
    setSaving(true)
    try {
      const data: ArticleFormData = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt || undefined,
        coverImage: formData.coverImage || undefined,
        categoryId: formData.categoryId || undefined,
        status,
        sortOrder: formData.sortOrder,
        isRecommended: formData.isRecommended,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        seoKeywords: formData.seoKeywords || undefined,
        tagIds: formData.tagIds,
      }
      await updateArticle(id, data)
      router.push('/admin/articles')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  if (error && !article) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Link href="/admin/articles" className="text-blue-600 hover:underline">返回列表</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">编辑文章</h1>
        <Link href="/admin/articles" className="text-gray-500 hover:text-gray-700">
          返回列表
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="文章标题"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
              <MarkdownEditor
                value={formData.content}
                onChange={value => setFormData({ ...formData, content: value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
              <textarea
                value={formData.excerpt}
                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                placeholder="留空将自动从内容中提取"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* SEO Section */}
          <div className="bg-white rounded-lg shadow">
            <button
              type="button"
              onClick={() => setShowSEO(!showSEO)}
              className="w-full p-4 flex justify-between items-center text-left"
            >
              <span className="font-medium">SEO 设置</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showSEO ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showSEO && (
              <div className="px-6 pb-6 space-y-4 border-t">
                <div className="pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">SEO 标题</label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={e => setFormData({ ...formData, seoTitle: e.target.value })}
                    placeholder="留空使用文章标题"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SEO 描述</label>
                  <textarea
                    value={formData.seoDescription}
                    onChange={e => setFormData({ ...formData, seoDescription: e.target.value })}
                    rows={2}
                    placeholder="搜索引擎结果中显示的描述"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SEO 关键词</label>
                  <input
                    type="text"
                    value={formData.seoKeywords}
                    onChange={e => setFormData({ ...formData, seoKeywords: e.target.value })}
                    placeholder="多个关键词用逗号分隔"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <button
              onClick={() => handleSubmit('PUBLISHED')}
              disabled={saving || !formData.title}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              更新并发布
            </button>
            <button
              onClick={() => handleSubmit(formData.status === 'TRASH' ? 'DRAFT' : formData.status)}
              disabled={saving || !formData.title}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              保存修改
            </button>
            <Link
              href="/admin/articles"
              className="block w-full text-center py-2 text-gray-500 hover:text-gray-700"
            >
              取消
            </Link>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as ArticleStatus })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">已发布</option>
              <option value="PRIVATE">私密</option>
            </select>
          </div>

          {/* Category */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
            <select
              value={formData.categoryId}
              onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">无分类</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                    formData.tagIds.includes(tag.id)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
              {tags.length === 0 && (
                <span className="text-sm text-gray-400">暂无标签</span>
              )}
            </div>
          </div>

          {/* Other Options */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">封面图片</label>
              <input
                type="text"
                value={formData.coverImage}
                onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="图片 URL"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                placeholder="留空自动生成"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecommended"
                checked={formData.isRecommended}
                onChange={e => setFormData({ ...formData, isRecommended: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isRecommended" className="text-sm text-gray-700">推荐文章</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
