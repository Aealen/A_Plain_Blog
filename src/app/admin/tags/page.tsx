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
      <h1 className="text-2xl font-bold mb-6">标签管理</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">{editingId ? '编辑标签' : '新建标签'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-500 p-3 rounded text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
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
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                {editingId ? '更新' : '创建'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  取消
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tag List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">标签列表 ({tags.length})</h2>
          </div>
          <div className="divide-y">
            {tags.map(tag => (
              <div key={tag.id} className="p-4">
                {mergeSourceId === tag.id ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      将 <span className="font-medium">{tag.name}</span> 合并到:
                    </p>
                    <select
                      value={mergeTargetId}
                      onChange={e => setMergeTargetId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 disabled:opacity-50"
                      >
                        确认合并
                      </button>
                      <button
                        onClick={cancelMerge}
                        className="px-3 py-1.5 border text-sm rounded-lg hover:bg-gray-50"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{tag.name}</span>
                      <span className="text-gray-400 text-sm ml-2">/{tag.slug}</span>
                      <span className="text-gray-400 text-sm ml-2">({tag._count.articles} 篇文章)</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(tag)} className="text-sm text-blue-600 hover:text-blue-800">
                        编辑
                      </button>
                      <button onClick={() => startMerge(tag.id)} className="text-sm text-orange-600 hover:text-orange-800">
                        合并
                      </button>
                      <button onClick={() => handleDelete(tag.id)} className="text-sm text-red-600 hover:text-red-800">
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {tags.length === 0 && (
              <div className="p-8 text-center text-gray-400">暂无标签</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
