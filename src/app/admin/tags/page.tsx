'use client'
import { useState, useEffect } from 'react'
import { createTag, updateTag, deleteTag, getTagsWithCount, mergeTags } from '@/actions/admin/tag'
import type { TagFormData } from '@/types'

interface TagWithCount {
  id: string
  name: string
  slug: string
  _count: { articles: number }
}

const emptyForm: TagFormData = { name: '', slug: '' }

export default function TagsPage() {
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<TagFormData>(emptyForm)
  const [error, setError] = useState('')
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null)
  const [mergeTargetId, setMergeTargetId] = useState<string>('')

  useEffect(() => { loadTags() }, [])

  async function loadTags() {
    const data = await getTagsWithCount()
    setTags(data as TagWithCount[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        await updateTag(editingId, formData)
      } else {
        await createTag(formData)
      }
      setFormData(emptyForm)
      setEditingId(null)
      await loadTags()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除该标签吗？')) return
    try {
      await deleteTag(id)
      await loadTags()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  function handleEdit(tag: TagWithCount) {
    setEditingId(tag.id)
    setFormData({ name: tag.name, slug: tag.slug })
    setError('')
  }

  function handleCancel() {
    setEditingId(null)
    setFormData(emptyForm)
    setError('')
  }

  function startMerge(tagId: string) {
    setMergeSourceId(tagId)
    setMergeTargetId('')
  }

  function cancelMerge() {
    setMergeSourceId(null)
    setMergeTargetId('')
  }

  async function handleMerge() {
    if (!mergeSourceId || !mergeTargetId) return
    if (!confirm('确定要合并这两个标签吗？源标签将被删除。')) return
    try {
      await mergeTags(mergeSourceId, mergeTargetId)
      setMergeSourceId(null)
      setMergeTargetId('')
      await loadTags()
    } catch (err) {
      alert(err instanceof Error ? err.message : '合并失败')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-display uppercase tracking-[1px] text-foreground mb-6">标签管理</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-card rounded-[24px] border border-border p-6">
          <h2 className="text-base font-bold font-display text-foreground mb-4">{editingId ? '编辑标签' : '新建标签'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-destructive/10 text-destructive p-3 rounded-[4px] text-sm">{error}</div>}
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-border rounded-[4px] bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                placeholder="留空自动生成"
                className="w-full px-3 py-2 border border-border rounded-[4px] bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2 rounded-[24px] font-mono uppercase transition-colors">
                {editingId ? '更新' : '创建'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} className="px-4 py-2 border border-border rounded-[4px] hover:bg-hover transition-colors">
                  取消
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tag List */}
        <div className="lg:col-span-2 bg-card rounded-[24px] border border-border">
          <div className="p-4 border-b border-border bg-card">
            <h2 className="text-base font-bold font-display text-foreground">标签列表 ({tags.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {tags.map(tag => (
              <div key={tag.id} className="p-4">
                {mergeSourceId === tag.id ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      将 <span className="font-medium text-foreground">{tag.name}</span> 合并到:
                    </p>
                    <select
                      value={mergeTargetId}
                      onChange={e => setMergeTargetId(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-[4px] bg-card text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">选择目标标签</option>
                      {tags.filter(t => t.id !== tag.id).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleMerge}
                        disabled={!mergeTargetId}
                        className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-[24px] font-mono uppercase disabled:opacity-50 transition-colors"
                      >
                        确认合并
                      </button>
                      <button
                        onClick={cancelMerge}
                        className="px-3 py-1.5 border border-border text-sm rounded-[4px] hover:bg-hover transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between hover:bg-hover -mx-4 -my-0 px-4 py-4">
                    <div>
                      <span className="font-medium text-foreground">{tag.name}</span>
                      <span className="text-muted-foreground text-sm ml-2 font-mono">/{tag.slug}</span>
                      <span className="text-muted-foreground text-sm ml-2 font-mono">({tag._count.articles} 篇)</span>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(tag)} className="text-sm text-primary hover:text-link-hover font-medium transition-colors">
                        编辑
                      </button>
                      <button onClick={() => startMerge(tag.id)} className="text-sm text-primary hover:text-link-hover font-medium transition-colors">
                        合并
                      </button>
                      <button onClick={() => handleDelete(tag.id)} className="text-sm text-destructive font-medium transition-colors">
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {tags.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">暂无标签</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
