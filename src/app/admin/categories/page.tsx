'use client'
import { useState, useEffect } from 'react'
import { createCategory, updateCategory, deleteCategory, getCategoriesWithCount } from '@/actions/admin/category'
interface CategoryWithCount {
  id: string
  name: string
  slug: string
  description: string | null
  order: number
  _count: { articles: number }
}
export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', order: 0 })
  const [error, setError] = useState('')
  useEffect(() => { loadCategories() }, [])
  async function loadCategories() {
    const data = await getCategoriesWithCount()
    setCategories(data as CategoryWithCount[])
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        await updateCategory(editingId, formData)
      } else {
        await createCategory(formData)
      }
      setFormData({ name: '', slug: '', description: '', order: 0 })
      setEditingId(null)
      await loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    }
  }
  async function handleDelete(id: string) {
    if (!confirm('确定要删除该分类吗？')) return
    try {
      await deleteCategory(id)
      await loadCategories()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }
  function handleEdit(category: CategoryWithCount) {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      order: category.order,
    })
  }
  function handleCancel() {
    setEditingId(null)
    setFormData({ name: '', slug: '', description: '', order: 0 })
    setError('')
  }
  return (
    <div>
      <h1 className="text-2xl font-display uppercase tracking-[1px] text-foreground mb-6">分类管理</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#2d2d2d] rounded-[24px] border border-white/10 p-6">
          <h2 className="text-base font-bold font-display text-foreground mb-4">{editingId ? '编辑分类' : '新建分类'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-[4px] text-sm">{error}</div>}
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">名称</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-3 py-2 border border-white/10 rounded-[4px] bg-[#2d2d2d] text-white focus:outline-none focus:border-mint" />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">Slug</label>
              <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="留空自动生成" className="w-full px-3 py-2 border border-white/10 rounded-[4px] bg-[#2d2d2d] text-white focus:outline-none focus:border-mint" />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">描述</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-white/10 rounded-[4px] bg-[#2d2d2d] text-white focus:outline-none focus:border-mint" />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">排序</label>
              <input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-white/10 rounded-[4px] bg-[#2d2d2d] text-white focus:outline-none focus:border-mint" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-mint text-black py-2 rounded-[24px] font-mono uppercase transition-colors">{editingId ? '更新' : '创建'}</button>
              {editingId && (
                <button type="button" onClick={handleCancel} className="px-4 py-2 border border-white/10 rounded-[4px] hover:bg-white/5 transition-colors">取消</button>
              )}
            </div>
          </form>
        </div>
        <div className="lg:col-span-2 bg-[#2d2d2d] rounded-[24px] border border-white/10">
          <div className="p-4 border-b border-white/10 bg-[#2d2d2d]"><h2 className="text-base font-bold font-display text-foreground">分类列表 ({categories.length})</h2></div>
          <div className="divide-y divide-white/10">
            {categories.map((category) => (
              <div key={category.id} className="p-4 flex items-center justify-between hover:bg-white/5">
                <div>
                  <span className="font-medium text-foreground">{category.name}</span>
                  <span className="text-muted-foreground text-sm ml-2 font-mono">/{category.slug}</span>
                  <span className="text-muted-foreground text-sm ml-2 font-mono">({category._count.articles} 篇)</span>
                  {category.description && <p className="text-muted-foreground text-sm mt-1">{category.description}</p>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleEdit(category)} className="text-sm text-mint hover:text-link-hover font-medium transition-colors">编辑</button>
                  <button onClick={() => handleDelete(category.id)} className="text-sm text-destructive font-medium transition-colors">删除</button>
                </div>
              </div>
            ))}
            {categories.length === 0 && <div className="p-8 text-center text-muted-foreground">暂无分类</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
