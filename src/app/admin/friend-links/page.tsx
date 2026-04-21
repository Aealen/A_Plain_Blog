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
import FileUploader from '@/components/admin/FileUploader'

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
  const [showAvatarUploader, setShowAvatarUploader] = useState(false)

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
      setShowAvatarUploader(false)
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
    setShowAvatarUploader(false)
    setError('')
  }

  function handleAvatarUpload(url: string) {
    setFormData({ ...formData, avatar: url })
    setShowAvatarUploader(false)
  }

  const inputClass = "w-full px-3 py-2 border border-white/10 rounded-[4px] bg-[#2d2d2d] text-white focus:outline-none focus:border-mint"

  return (
    <div>
      <h1 className="text-2xl font-display uppercase tracking-[1px] text-foreground mb-6">友链管理</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#2d2d2d] rounded-[24px] border border-white/10 p-6">
          <h2 className="text-base font-bold font-display text-foreground mb-4">{editingId ? '编辑友链' : '新建友链'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-[4px] text-sm">{error}</div>}
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">名称</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className={inputClass} />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">URL</label>
              <input type="url" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} required placeholder="https://" className={inputClass} />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">头像</label>
              {formData.avatar && (
                <div className="mb-2">
                  <img src={formData.avatar} alt="头像预览" className="w-10 h-10 rounded-full object-cover border border-white/10" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
              <div className="mb-2 flex gap-2">
                <input type="text" value={formData.avatar} onChange={e => setFormData({ ...formData, avatar: e.target.value })} placeholder="头像图片 URL" className={inputClass} />
                <button
                  type="button"
                  onClick={() => setShowAvatarUploader(!showAvatarUploader)}
                  className="shrink-0 px-3 py-2 border border-white/10 rounded-[4px] bg-white/5 text-foreground hover:bg-white/10 transition-colors text-sm"
                >
                  上传
                </button>
              </div>
              {showAvatarUploader && (
                <div className="mb-2 border border-white/10 rounded-[4px] p-3 bg-[#2d2d2d]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-foreground">上传头像</span>
                    <button type="button" onClick={() => setShowAvatarUploader(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">关闭</button>
                  </div>
                  <FileUploader onUpload={handleAvatarUpload} accept="image/*" purpose="avatars" />
                </div>
              )}
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">描述</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className={inputClass} />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">排序</label>
              <input type="number" value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} className={inputClass} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="rounded accent-primary" />
              <label htmlFor="isActive" className="text-sm text-muted-foreground">启用</label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-mint text-black py-2 rounded-[24px] font-mono uppercase transition-colors">
                {editingId ? '更新' : '创建'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} className="px-4 py-2 border border-white/10 rounded-[4px] hover:bg-white/5 transition-colors">取消</button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-[#2d2d2d] rounded-[24px] border border-white/10">
          <div className="p-4 border-b border-white/10 bg-[#2d2d2d]">
            <h2 className="text-base font-bold font-display text-foreground">友链列表 ({links.length})</h2>
          </div>
          <div className="divide-y divide-white/10">
            {links.map(link => (
              <div key={link.id} className="p-4 flex items-center justify-between hover:bg-white/5">
                <div className="flex items-center gap-3">
                  {link.avatar ? (
                    <img src={link.avatar} alt={link.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary text-sm font-bold font-mono">
                      {link.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{link.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-mono uppercase ${
                        link.isActive ? 'bg-mint/20 text-mint' : 'bg-white/5 text-muted-foreground'
                      }`}>
                        {link.isActive ? '启用' : '禁用'}
                      </span>
                    </div>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-mint hover:text-link-hover transition-colors">{link.url}</a>
                    {link.description && <p className="text-sm text-muted-foreground mt-0.5">{link.description}</p>}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleToggle(link.id)} className={`text-sm font-medium transition-colors ${link.isActive ? 'text-yellow-400 hover:text-yellow-300' : 'text-mint hover:text-link-hover'}`}>
                    {link.isActive ? '禁用' : '启用'}
                  </button>
                  <button onClick={() => handleEdit(link)} className="text-sm text-mint hover:text-link-hover font-medium transition-colors">编辑</button>
                  <button onClick={() => handleDelete(link.id)} className="text-sm text-destructive font-medium transition-colors">删除</button>
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
