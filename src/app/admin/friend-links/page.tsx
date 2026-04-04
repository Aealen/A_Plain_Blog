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

  const inputClass = "w-full px-3 py-2 border border-border rounded-[var(--radius-sm)] bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"

  return (
    <div>
      <h1 className="text-2xl font-bold font-mono text-foreground mb-6">友链管理</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-[var(--radius-lg)] border border-border p-6">
          <h2 className="text-base font-bold font-mono text-foreground mb-4">{editingId ? '编辑友链' : '新建友链'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-[var(--radius-sm)] text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">名称</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">URL</label>
              <input type="url" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} required placeholder="https://" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">头像</label>
              <input type="text" value={formData.avatar} onChange={e => setFormData({ ...formData, avatar: e.target.value })} placeholder="头像图片 URL" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">描述</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">排序</label>
              <input type="number" value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} className={inputClass} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="rounded accent-primary" />
              <label htmlFor="isActive" className="text-sm text-muted-foreground">启用</label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2 rounded-[var(--radius-sm)] hover:bg-primary/90 font-medium transition-colors">
                {editingId ? '更新' : '创建'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} className="px-4 py-2 border border-border rounded-[var(--radius-sm)] hover:bg-muted transition-colors">取消</button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-card rounded-[var(--radius-lg)] border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-base font-bold font-mono text-foreground">友链列表 ({links.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {links.map(link => (
              <div key={link.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {link.avatar ? (
                    <img src={link.avatar} alt={link.name} className="w-10 h-10 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary text-sm font-bold font-mono">
                      {link.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{link.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        link.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                      }`}>
                        {link.isActive ? '启用' : '禁用'}
                      </span>
                    </div>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary/80 transition-colors">{link.url}</a>
                    {link.description && <p className="text-sm text-muted-foreground mt-0.5">{link.description}</p>}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleToggle(link.id)} className={`text-sm font-medium transition-colors ${link.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}>
                    {link.isActive ? '禁用' : '启用'}
                  </button>
                  <button onClick={() => handleEdit(link)} className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">编辑</button>
                  <button onClick={() => handleDelete(link.id)} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">删除</button>
                </div>
              </div>
            ))}
            {links.length === 0 && <div className="p-8 text-center text-muted-foreground">暂无友链</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
