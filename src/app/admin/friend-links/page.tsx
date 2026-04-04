'use client'
import { useState, useEffect } from 'react'
import {
  getFriendLinks,
  createFriendLink,
  updateFriendLink,
  deleteFriendLink,
  toggleFriendLink,
} from '@/actions/admin/friendLink'
import type { FriendLinkFormData } from '@/types'

interface FriendLinkItem {
  id: string
  name: string
  url: string
  avatar: string | null
  description: string | null
  order: number
  isActive: boolean
}

const emptyForm: FriendLinkFormData = {
  name: '',
  url: '',
  avatar: '',
  description: '',
  order: 0,
  isActive: true,
}

export default function FriendLinksPage() {
  const [links, setLinks] = useState<FriendLinkItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FriendLinkFormData>(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => { loadLinks() }, [])

  async function loadLinks() {
    const data = await getFriendLinks()
    setLinks(data as FriendLinkItem[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        await updateFriendLink(editingId, formData)
      } else {
        await createFriendLink(formData)
      }
      setFormData(emptyForm)
      setEditingId(null)
      await loadLinks()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除该友链吗？')) return
    try {
      await deleteFriendLink(id)
      await loadLinks()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleFriendLink(id)
      await loadLinks()
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    }
  }

  function handleEdit(link: FriendLinkItem) {
    setEditingId(link.id)
    setFormData({
      name: link.name,
      url: link.url,
      avatar: link.avatar || '',
      description: link.description || '',
      order: link.order,
      isActive: link.isActive,
    })
    setError('')
  }

  function handleCancel() {
    setEditingId(null)
    setFormData(emptyForm)
    setError('')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">友链管理</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">{editingId ? '编辑友链' : '新建友链'}</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                required
                placeholder="https://"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">头像</label>
              <input
                type="text"
                value={formData.avatar}
                onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="头像图片 URL"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
              <input
                type="number"
                value={formData.order}
                onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">启用</label>
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

        {/* Link List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">友链列表 ({links.length})</h2>
          </div>
          <div className="divide-y">
            {links.map(link => (
              <div key={link.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {link.avatar ? (
                    <img
                      src={link.avatar}
                      alt={link.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                      {link.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{link.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        link.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {link.isActive ? '启用' : '禁用'}
                      </span>
                      <span className="text-xs text-gray-400">排序: {link.order}</span>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {link.url}
                    </a>
                    {link.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{link.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(link.id)}
                    className={`text-sm ${
                      link.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'
                    }`}
                  >
                    {link.isActive ? '禁用' : '启用'}
                  </button>
                  <button onClick={() => handleEdit(link)} className="text-sm text-blue-600 hover:text-blue-800">
                    编辑
                  </button>
                  <button onClick={() => handleDelete(link.id)} className="text-sm text-red-600 hover:text-red-800">
                    删除
                  </button>
                </div>
              </div>
            ))}
            {links.length === 0 && (
              <div className="p-8 text-center text-gray-400">暂无友链</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
