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
      <h1 className="text-2xl font-bold mb-6">分类管理</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">{editingId ? '编辑分类' : '新建分类'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-500 p-3 rounded text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="留空自动生成" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
              <input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{editingId ? '更新' : '创建'}</button>
              {editingId && (
                <button type="button" onClick={handleCancel} className="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
              )}
            </div>
          </form>
        </div>
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-4 border-b"><h2 className="text-lg font-medium">分类列表 ({categories.length}))</h2></div>
          <div className="divide-y">
            {categories.map((category) => (
              <div key={category.id} className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-medium">{category.name}</span>
                  <span className="text-gray-400 text-sm ml-2">/{category.slug}</span>
                  <span className="text-gray-400 text-sm ml-2">({category._count.articles} 篇文章)</span>
                  {category.description && <p className="text-gray-500 text-sm mt-1">{category.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(category)} className="text-sm text-blue-600 hover:text-blue-800">编辑</button>
                  <button onClick={() => handleDelete(category.id)} className="text-sm text-red-600 hover:text-red-800">删除</button>
                </div>
              </div>
            ))}
            {categories.length === 0 && <div className="p-8 text-center text-gray-400">暂无分类</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
