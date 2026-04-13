'use client'
import { useState, useEffect } from 'react'
import { getSiteConfig, setSiteConfig } from '@/actions/admin/site'
import FileUploader from '@/components/admin/FileUploader'

const inputClass = "w-full px-3 py-2 border border-border rounded-[var(--radius-sm)] bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"

export default function SettingsPage() {
  const [faviconUrl, setFaviconUrl] = useState('')
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSiteConfig('favicon').then(url => {
      setFaviconUrl(url || '')
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setMsg({ type: '', text: '' })
    try {
      await setSiteConfig('favicon', faviconUrl)
      setMsg({ type: 'success', text: 'Favicon 已保存' })
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : '保存失败' })
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">加载中...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold font-mono text-foreground mb-6">系统管理</h1>

      <div className="bg-card rounded-[var(--radius-lg)] border border-border p-6 max-w-xl">
        <h2 className="text-base font-bold font-mono text-foreground mb-4">网站图标 (Favicon)</h2>
        <form onSubmit={handleSave} className="space-y-4">
          {msg.text && (
            <div className={`p-3 rounded-[var(--radius-sm)] text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {msg.text}
            </div>
          )}
          {faviconUrl && (
            <div className="flex items-center gap-3 mb-2">
              <img src={faviconUrl} alt="Favicon 预览" className="w-10 h-10 rounded border border-border object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span className="text-sm text-muted-foreground">当前图标预览</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">图标地址</label>
            <input type="url" value={faviconUrl} onChange={e => setFaviconUrl(e.target.value)} placeholder="输入图标 URL 或通过下方上传" className={inputClass} />
          </div>
          <FileUploader onUpload={url => setFaviconUrl(url)} accept="image/*" purpose="site" />
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-[var(--radius-sm)] hover:bg-primary/90 font-medium transition-colors">
            保存
          </button>
        </form>
      </div>
    </div>
  )
}
