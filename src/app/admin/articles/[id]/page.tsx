'use client'
import { useState, useEffect, use, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getArticleById, updateArticle, saveDraft, discardDraft } from '@/actions/admin/article'
import { createCategory, getCategoriesWithCount } from '@/actions/admin/category'
import { createTag, getTagsWithCount } from '@/actions/admin/tag'
import { generateSlug } from '@/lib/utils'
import MarkdownEditor from '@/components/admin/MarkdownEditor'
import FileUploader from '@/components/admin/FileUploader'
import { ArticleStatus } from '@prisma/client'
import type { ArticleFormData } from '@/types'

interface CategoryItem { id: string; name: string; slug: string; _count: { articles: number } }
interface TagItem { id: string; name: string; slug: string; _count: { articles: number } }

interface DraftData {
  title?: string; slug?: string; content?: string; excerpt?: string
  coverImage?: string | null
  sortOrder?: number; isRecommended?: boolean
  seoTitle?: string | null; seoDescription?: string | null; seoKeywords?: string | null
  tagIds?: string[]; categoryIds?: string[]; createdAt?: string | null
}

interface ArticleDetail {
  id: string; title: string; slug: string; content: string
  excerpt: string | null; coverImage: string | null
  status: string; sortOrder: number; isRecommended: boolean
  seoTitle: string | null; seoDescription: string | null; seoKeywords: string | null
  createdAt: Date; publishedAt: Date | null; draft: DraftData | null
  categories: { category: { id: string; name: string } }[]
  tags: { tag: { id: string; name: string } }[]
}

const inputClass = "w-full px-3 py-2 border border-border rounded-[var(--radius-sm)] bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"

const SLUG_REGEX = /^[a-z0-9-]+$/

function toDatetimeLocal(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [showSEO, setShowSEO] = useState(false)
  const [showCoverUploader, setShowCoverUploader] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [slugError, setSlugError] = useState('')
  const [hasDraft, setHasDraft] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryError, setNewCategoryError] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagError, setNewTagError] = useState('')
  const [creatingTag, setCreatingTag] = useState(false)

  const [formData, setFormData] = useState({
    title: '', slug: '', content: '', excerpt: '', coverImage: '',
    categoryIds: [] as string[], status: 'DRAFT' as ArticleStatus, sortOrder: 0,
    isRecommended: false, tagIds: [] as string[],
    seoTitle: '', seoDescription: '', seoKeywords: '',
    createdAt: '',
  })

  const resolvedSlug = useMemo(() => {
    const raw = formData.slug.trim()
    if (raw && SLUG_REGEX.test(raw)) return raw
    if (formData.title.trim()) return generateSlug(formData.title)
    return ''
  }, [formData.slug, formData.title])

  useEffect(() => {
    async function loadData() {
      try {
        const [articleData, cats, tagList] = await Promise.all([getArticleById(id), getCategoriesWithCount(), getTagsWithCount()])
        if (!articleData) { setError('文章不存在'); setLoading(false); return }
        const a = articleData as ArticleDetail
        setArticle(a); setCategories(cats as CategoryItem[]); setTags(tagList as TagItem[])

        // If published article has draft, use draft content for editing
        const d = a.draft as DraftData | null
        const useDraft = a.status === 'PUBLISHED' && d
        setHasDraft(!!useDraft)

        const source = useDraft ? d : a
        setFormData({
          title: (source?.title as string) || '',
          slug: (source?.slug as string) || a.slug,
          content: (source?.content as string) || '',
          excerpt: (source?.excerpt as string) || '',
          coverImage: ((source?.coverImage as string) || a.coverImage) || '',
          categoryIds: ((source as DraftData)?.categoryIds) || a.categories.map(c => c.category.id),
          status: a.status as ArticleStatus,
          sortOrder: (source?.sortOrder as number) ?? a.sortOrder,
          isRecommended: (source?.isRecommended as boolean) ?? a.isRecommended,
          tagIds: ((source as DraftData)?.tagIds) || a.tags.map(t => t.tag.id),
          seoTitle: ((source?.seoTitle as string) || a.seoTitle) || '',
          seoDescription: ((source?.seoDescription as string) || a.seoDescription) || '',
          seoKeywords: ((source?.seoKeywords as string) || a.seoKeywords) || '',
          createdAt: toDatetimeLocal((source as DraftData)?.createdAt ?? a.createdAt),
        })
        if (a.seoTitle || a.seoDescription || a.seoKeywords) setShowSEO(true)
      } catch (err) { setError(err instanceof Error ? err.message : '加载失败') }
      finally { setLoading(false) }
    }
    loadData()
  }, [id])

  function handleSlugChange(value: string) {
    setFormData(prev => ({ ...prev, slug: value }))
    if (value.trim() && !SLUG_REGEX.test(value.trim())) {
      setSlugError('Slug 只允许小写字母、数字和连字符')
    } else {
      setSlugError('')
    }
  }

  function toggleTag(tagId: string) {
    setFormData(prev => ({ ...prev, tagIds: prev.tagIds.includes(tagId) ? prev.tagIds.filter(tid => tid !== tagId) : [...prev.tagIds, tagId] }))
  }

  function toggleCategory(catId: string) {
    setFormData(prev => ({ ...prev, categoryIds: prev.categoryIds.includes(catId) ? prev.categoryIds.filter(id => id !== catId) : [...prev.categoryIds, catId] }))
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim()
    if (!name) return
    setNewCategoryError(''); setCreatingCategory(true)
    try {
      const cat = await createCategory({ name, slug: '', order: 0 })
      setCategories(prev => [...prev, { id: cat.id, name: cat.name, slug: cat.slug, _count: { articles: 0 } }])
      setFormData(prev => ({ ...prev, categoryIds: [...prev.categoryIds, cat.id] }))
      setNewCategoryName('')
    } catch (err) {
      setNewCategoryError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreatingCategory(false)
    }
  }

  async function handleCreateTag() {
    const name = newTagName.trim()
    if (!name) return
    setNewTagError(''); setCreatingTag(true)
    try {
      const tag = await createTag({ name, slug: '' })
      setTags(prev => [...prev, { id: tag.id, name: tag.name, slug: tag.slug, _count: { articles: 0 } }])
      setFormData(prev => ({ ...prev, tagIds: [...prev.tagIds, tag.id] }))
      setNewTagName('')
    } catch (err) {
      setNewTagError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreatingTag(false)
    }
  }

  function handleCoverUpload(url: string) {
    setFormData(prev => ({ ...prev, coverImage: url }))
    setShowCoverUploader(false)
  }

  async function handleUpdate(status: ArticleStatus) {
    setError(''); setSaving(true)
    try {
      const data: ArticleFormData = {
        title: formData.title,
        slug: resolvedSlug,
        content: formData.content,
        excerpt: formData.excerpt || undefined,
        coverImage: formData.coverImage || undefined,
        categoryIds: formData.categoryIds,
        status,
        sortOrder: formData.sortOrder,
        isRecommended: formData.isRecommended,
        tagIds: formData.tagIds,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        seoKeywords: formData.seoKeywords || undefined,
        createdAt: formData.createdAt || null,
      }
      await updateArticle(id, data)
      router.push('/admin/articles')
    } catch (err) { setError(err instanceof Error ? err.message : '保存失败'); setSaving(false) }
  }

  async function handleSaveDraft() {
    setError(''); setSaving(true)
    try {
      const data: ArticleFormData = {
        title: formData.title,
        slug: resolvedSlug,
        content: formData.content,
        excerpt: formData.excerpt || undefined,
        coverImage: formData.coverImage || undefined,
        categoryIds: formData.categoryIds,
        status: formData.status as ArticleStatus,
        sortOrder: formData.sortOrder,
        isRecommended: formData.isRecommended,
        tagIds: formData.tagIds,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        seoKeywords: formData.seoKeywords || undefined,
        createdAt: formData.createdAt || null,
      }
      await saveDraft(id, data)
      setHasDraft(true)
      router.push('/admin/articles')
    } catch (err) { setError(err instanceof Error ? err.message : '保存失败'); setSaving(false) }
  }

  async function handleDiscardDraft() {
    if (!confirm('确定要撤销改动吗？将恢复到上次发布的状态。')) return
    setError(''); setSaving(true)
    try {
      await discardDraft(id)
      router.push('/admin/articles')
    } catch (err) { setError(err instanceof Error ? err.message : '撤销失败'); setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-muted-foreground font-mono">加载中...</div></div>

  if (error && !article) return (
    <div className="text-center py-12">
      <p className="text-red-500 mb-4">{error}</p>
      <Link href="/admin/articles" className="text-primary hover:text-primary/80 transition-colors">返回列表</Link>
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-mono text-foreground">编辑文章</h1>
        <Link href="/admin/articles" className="text-sm text-muted-foreground hover:text-primary font-mono transition-colors">← 返回列表</Link>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-[var(--radius-sm)] mb-4 text-sm">{error}</div>}

      {hasDraft && (
        <div className="bg-amber-50 text-amber-700 p-3 rounded-[var(--radius-sm)] mb-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          此文章有未发布的草稿修改，前台仍展示旧版本
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card rounded-[var(--radius-lg)] border border-border p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">标题</label>
              <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="文章标题" required className={`${inputClass} text-lg`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">内容</label>
              <MarkdownEditor value={formData.content} onChange={value => setFormData({ ...formData, content: value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">摘要</label>
              <textarea value={formData.excerpt} onChange={e => setFormData({ ...formData, excerpt: e.target.value })} rows={3} placeholder="留空将自动从内容中提取" className={inputClass} />
            </div>
          </div>

          <div className="bg-card rounded-[var(--radius-lg)] border border-border">
            <button type="button" onClick={() => setShowSEO(!showSEO)} className="w-full p-4 flex justify-between items-center text-left">
              <span className="font-medium font-mono text-foreground">SEO 设置</span>
              <svg className={`w-5 h-5 text-muted-foreground transition-transform ${showSEO ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showSEO && (
              <div className="px-6 pb-6 space-y-4 border-t border-border">
                <div className="pt-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">SEO 标题</label>
                  <input type="text" value={formData.seoTitle} onChange={e => setFormData({ ...formData, seoTitle: e.target.value })} placeholder="留空使用文章标题" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">SEO 描述</label>
                  <textarea value={formData.seoDescription} onChange={e => setFormData({ ...formData, seoDescription: e.target.value })} rows={2} placeholder="搜索引擎结果中显示的描述" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">SEO 关键词</label>
                  <input type="text" value={formData.seoKeywords} onChange={e => setFormData({ ...formData, seoKeywords: e.target.value })} placeholder="多个关键词用逗号分隔" className={inputClass} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-[var(--radius-lg)] border border-border p-6 space-y-4">
            <button onClick={() => handleUpdate('PUBLISHED')} disabled={saving || !formData.title} className="w-full bg-primary text-primary-foreground py-2 rounded-[var(--radius-sm)] hover:bg-primary/90 font-medium transition-colors disabled:opacity-50">更新并发布</button>
            <button onClick={handleSaveDraft} disabled={saving || !formData.title} className="w-full bg-muted text-foreground py-2 rounded-[var(--radius-sm)] hover:bg-border transition-colors disabled:opacity-50">保存修改</button>
            {hasDraft && (
              <button onClick={handleDiscardDraft} disabled={saving} className="w-full text-red-500 border border-red-200 py-2 rounded-[var(--radius-sm)] hover:bg-red-50 transition-colors disabled:opacity-50 text-sm">撤销改动</button>
            )}
            <Link href="/admin/articles" className="block w-full text-center py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">取消</Link>
          </div>

          <div className="bg-card rounded-[var(--radius-lg)] border border-border p-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">状态</label>
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as ArticleStatus })} className={inputClass}>
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">已发布</option>
              <option value="PRIVATE">私密</option>
            </select>
          </div>

          <div className="bg-card rounded-[var(--radius-lg)] border border-border p-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">分类</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)} className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                  formData.categoryIds.includes(cat.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:border-primary'
                }`}>{cat.name}</button>
              ))}
              {categories.length === 0 && <span className="text-sm text-muted-foreground">暂无分类</span>}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={e => { setNewCategoryName(e.target.value); setNewCategoryError('') }}
                placeholder="新建分类..."
                className={`${inputClass} flex-1 text-sm`}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory() } }}
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={creatingCategory || !newCategoryName.trim()}
                className="shrink-0 px-3 py-2 border border-border rounded-[var(--radius-sm)] bg-muted text-foreground hover:bg-border transition-colors text-sm disabled:opacity-50"
              >
                {creatingCategory ? '...' : '新建'}
              </button>
            </div>
            {newCategoryError && <p className="mt-1 text-xs text-red-500">{newCategoryError}</p>}
          </div>

          <div className="bg-card rounded-[var(--radius-lg)] border border-border p-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">标签</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                  formData.tagIds.includes(tag.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:border-primary'
                }`}>{tag.name}</button>
              ))}
              {tags.length === 0 && <span className="text-sm text-muted-foreground">暂无标签</span>}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={e => { setNewTagName(e.target.value); setNewTagError('') }}
                placeholder="新建标签..."
                className={`${inputClass} flex-1 text-sm`}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTag() } }}
              />
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={creatingTag || !newTagName.trim()}
                className="shrink-0 px-3 py-2 border border-border rounded-[var(--radius-sm)] bg-muted text-foreground hover:bg-border transition-colors text-sm disabled:opacity-50"
              >
                {creatingTag ? '...' : '新建'}
              </button>
            </div>
            {newTagError && <p className="mt-1 text-xs text-red-500">{newTagError}</p>}
          </div>

          <div className="bg-card rounded-[var(--radius-lg)] border border-border p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">封面图片</label>
              <div className="flex gap-2">
                <input type="text" value={formData.coverImage} onChange={e => setFormData({ ...formData, coverImage: e.target.value })} placeholder="图片 URL" className={inputClass} />
                <button
                  type="button"
                  onClick={() => setShowCoverUploader(true)}
                  className="shrink-0 px-3 py-2 border border-border rounded-[var(--radius-sm)] bg-muted text-foreground hover:bg-border transition-colors text-sm"
                >
                  上传图片
                </button>
              </div>
              {formData.coverImage && (
                <div className="mt-2">
                  <img src={formData.coverImage} alt="封面预览" className="w-full h-32 object-cover rounded-[var(--radius-sm)] border border-border" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
            </div>

            {showCoverUploader && (
              <div className="border border-border rounded-[var(--radius-sm)] p-4 bg-muted/30">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-foreground">上传封面图片</span>
                  <button type="button" onClick={() => setShowCoverUploader(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">关闭</button>
                </div>
                <FileUploader onUpload={handleCoverUpload} accept="image/*" purpose="covers" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                URL Slug
                {resolvedSlug && resolvedSlug !== formData.slug && (
                  <span className="ml-2 text-xs text-muted-foreground/70">（将自动生成为: {resolvedSlug}）</span>
                )}
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={e => handleSlugChange(e.target.value)}
                placeholder="留空自动从标题生成"
                className={`${inputClass} ${slugError ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              {slugError && <p className="mt-1 text-xs text-red-500">{slugError}</p>}
              <p className="mt-1 text-xs text-muted-foreground">仅允许小写字母、数字和连字符（-）</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">创建时间</label>
              <input
                type="datetime-local"
                value={formData.createdAt}
                onChange={e => setFormData({ ...formData, createdAt: e.target.value })}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted-foreground">留空则自动使用当前时间</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">排序</label>
              <input type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} className={inputClass} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isRecommended" checked={formData.isRecommended} onChange={e => setFormData({ ...formData, isRecommended: e.target.checked })} className="rounded accent-primary" />
              <label htmlFor="isRecommended" className="text-sm text-muted-foreground">推荐文章</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
