'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createArticle } from '@/actions/admin/article'
import { createCategory, getCategoriesWithCount } from '@/actions/admin/category'
import { createTag, getTagsWithCount } from '@/actions/admin/tag'
import { generateSlug } from '@/lib/utils'
import MarkdownEditor from '@/components/admin/MarkdownEditor'
import FileUploader from '@/components/admin/FileUploader'
import { ArticleStatus } from '@prisma/client'
import type { ArticleFormData } from '@/types'

interface CategoryItem { id: string; name: string; slug: string; _count: { articles: number } }
interface TagItem { id: string; name: string; slug: string; _count: { articles: number } }

const inputClass = "w-full px-3 py-2 border border-white/10 rounded-[4px] bg-[#2d2d2d] text-white focus:outline-none focus:ring-2 focus:ring-[#3cffd0] focus:border-[#3cffd0] transition-colors"

const SLUG_REGEX = /^[a-z0-9-]+$/

export default function NewArticlePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [showSEO, setShowSEO] = useState(false)
  const [showCoverUploader, setShowCoverUploader] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [slugError, setSlugError] = useState('')
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
    async function loadOptions() {
      const [cats, tagList] = await Promise.all([getCategoriesWithCount(), getTagsWithCount()])
      setCategories(cats as CategoryItem[])
      setTags(tagList as TagItem[])
    }
    loadOptions()
  }, [])

  function handleSlugChange(value: string) {
    setFormData(prev => ({ ...prev, slug: value }))
    if (value.trim() && !SLUG_REGEX.test(value.trim())) {
      setSlugError('Slug 只允许小写字母、数字和连字符')
    } else {
      setSlugError('')
    }
  }

  function toggleTag(tagId: string) {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId) ? prev.tagIds.filter(id => id !== tagId) : [...prev.tagIds, tagId],
    }))
  }

  function toggleCategory(catId: string) {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(catId) ? prev.categoryIds.filter(id => id !== catId) : [...prev.categoryIds, catId],
    }))
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

  async function handleSubmit(status: ArticleStatus) {
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
      await createArticle(data)
      router.push('/admin/articles')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-display uppercase tracking-[1px] text-white">新建文章</h1>
        <Link href="/admin/articles" className="text-sm font-mono text-white/50 hover:text-white transition-colors">← 返回列表</Link>
      </div>

      {error && <div className="bg-red-500/15 text-red-400 border border-red-500/20 p-3 rounded-[4px] mb-4 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#2d2d2d] rounded-[24px] border border-white/10 p-6 space-y-4">
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-white/50 mb-1">标题</label>
              <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="文章标题" required className={`${inputClass} text-lg`} />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-white/50 mb-1">内容</label>
              <MarkdownEditor value={formData.content} onChange={value => setFormData({ ...formData, content: value })} />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-white/50 mb-1">摘要</label>
              <textarea value={formData.excerpt} onChange={e => setFormData({ ...formData, excerpt: e.target.value })} rows={3} placeholder="留空将自动从内容中提取" className={inputClass} />
            </div>
          </div>

          <div className="bg-[#2d2d2d] rounded-[24px] border border-white/10">
            <button type="button" onClick={() => setShowSEO(!showSEO)} className="w-full p-4 flex justify-between items-center text-left">
              <span className="font-medium font-mono text-white">SEO 设置</span>
              <svg className={`w-5 h-5 text-white/50 transition-transform ${showSEO ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showSEO && (
              <div className="px-6 pb-6 space-y-4 border-t border-white/10">
                <div className="pt-4">
                  <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-white/50 mb-1">SEO 标题</label>
                  <input type="text" value={formData.seoTitle} onChange={e => setFormData({ ...formData, seoTitle: e.target.value })} placeholder="留空使用文章标题" className={inputClass} />
                </div>
                <div>
                  <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-white/50 mb-1">SEO 描述</label>
                  <textarea value={formData.seoDescription} onChange={e => setFormData({ ...formData, seoDescription: e.target.value })} rows={2} placeholder="搜索引擎结果中显示的描述" className={inputClass} />
                </div>
                <div>
                  <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-white/50 mb-1">SEO 关键词</label>
                  <input type="text" value={formData.seoKeywords} onChange={e => setFormData({ ...formData, seoKeywords: e.target.value })} placeholder="多个关键词用逗号分隔" className={inputClass} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#2d2d2d] rounded-[24px] border border-white/10 p-6 space-y-4">
            <button onClick={() => handleSubmit('PUBLISHED')} disabled={saving || !formData.title} className="w-full bg-[#3cffd0] text-black py-2 rounded-[24px] hover:bg-[#3cffd0]/90 font-mono uppercase text-sm tracking-[1px] transition-colors disabled:opacity-50">发布</button>
            <button onClick={() => handleSubmit('DRAFT')} disabled={saving || !formData.title} className="w-full bg-white/5 text-white py-2 rounded-[24px] hover:bg-white/10 font-mono uppercase text-sm tracking-[1px] transition-colors disabled:opacity-50">保存草稿</button>
            <Link href="/admin/articles" className="block w-full text-center py-2 text-sm font-mono text-white/50 hover:text-white transition-colors">取消</Link>
          </div>

          <div className="bg-[#2d2d2d] rounded-[24px] border border-white/10 p-6">
            <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-white/50 mb-2">分类</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)} className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                  formData.categoryIds.includes(cat.id) ? 'bg-[#3cffd0] text-black border-[#3cffd0]' : 'bg-[#2d2d2d] text-white border-white/10 hover:border-[#3cffd0]'
                }`}>{cat.name}</button>
              ))}
              {categories.length === 0 && <span className="text-sm text-white/30">暂无分类</span>}
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
                className="shrink-0 px-3 py-2 border border-white/10 rounded-[4px] bg-[#5200ff] text-white hover:bg-[#5200ff]/80 transition-colors text-sm font-mono uppercase tracking-[1px] disabled:opacity-50"
              >
                {creatingCategory ? '...' : '新建'}
              </button>
            </div>
            {newCategoryError && <p className="mt-1 text-xs text-red-400">{newCategoryError}</p>}
          </div>

          <div className="bg-[#2d2d2d] rounded-[24px] border border-white/10 p-6">
            <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-white/50 mb-2">标签</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                  formData.tagIds.includes(tag.id) ? 'bg-[#3cffd0] text-black border-[#3cffd0]' : 'bg-[#2d2d2d] text-white border-white/10 hover:border-[#3cffd0]'
                }`}>{tag.name}</button>
              ))}
              {tags.length === 0 && <span className="text-sm text-white/30">暂无标签</span>}
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
                className="shrink-0 px-3 py-2 border border-white/10 rounded-[4px] bg-[#5200ff] text-white hover:bg-[#5200ff]/80 transition-colors text-sm font-mono uppercase tracking-[1px] disabled:opacity-50"
              >
                {creatingTag ? '...' : '新建'}
              </button>
            </div>
            {newTagError && <p className="mt-1 text-xs text-red-400">{newTagError}</p>}
          </div>

          <div className="bg-[#2d2d2d] rounded-[24px] border border-white/10 p-6 space-y-4">
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-white/50 mb-1">封面图片</label>
              <div className="flex gap-2">
                <input type="text" value={formData.coverImage} onChange={e => setFormData({ ...formData, coverImage: e.target.value })} placeholder="图片 URL" className={inputClass} />
                <button
                  type="button"
                  onClick={() => setShowCoverUploader(true)}
                  className="shrink-0 px-3 py-2 border border-white/10 rounded-[4px] bg-[#5200ff] text-white hover:bg-[#5200ff]/80 transition-colors text-sm font-mono uppercase tracking-[1px]"
                >
                  上传图片
                </button>
              </div>
              {formData.coverImage && (
                <div className="mt-2">
                  <img src={formData.coverImage} alt="封面预览" className="w-full h-32 object-cover rounded-[4px] border border-white/10" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
            </div>

            {showCoverUploader && (
              <div className="border border-white/10 rounded-[4px] p-4 bg-white/5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-white">上传封面图片</span>
                  <button type="button" onClick={() => setShowCoverUploader(false)} className="text-sm text-white/50 hover:text-white transition-colors">关闭</button>
                </div>
                <FileUploader onUpload={handleCoverUpload} accept="image/*" purpose="covers" />
              </div>
            )}

            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-white/50 mb-1">
                URL Slug
                {resolvedSlug && resolvedSlug !== formData.slug && (
                  <span className="ml-2 text-xs text-white/40/70">（将自动生成为: {resolvedSlug}）</span>
                )}
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={e => handleSlugChange(e.target.value)}
                placeholder="留空自动从标题生成"
                className={`${inputClass} ${slugError ? 'border-red-400 focus:ring-red-400/50' : ''}`}
              />
              {slugError && <p className="mt-1 text-xs text-red-400">{slugError}</p>}
              <p className="mt-1 text-xs text-white/40">仅允许小写字母、数字和连字符（-）</p>
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-white/50 mb-1">创建时间</label>
              <input
                type="datetime-local"
                value={formData.createdAt}
                onChange={e => setFormData({ ...formData, createdAt: e.target.value })}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-white/40">留空则自动使用当前时间</p>
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-white/50 mb-1">排序</label>
              <input type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} className={inputClass} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isRecommended" checked={formData.isRecommended} onChange={e => setFormData({ ...formData, isRecommended: e.target.checked })} className="rounded accent-[#3cffd0]" />
              <label htmlFor="isRecommended" className="text-sm text-white/50">推荐文章</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
