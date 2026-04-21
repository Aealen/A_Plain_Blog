'use client'
import { useState, useEffect } from 'react'
import { getSiteConfig, setSiteConfig } from '@/actions/admin/site'
import FileUploader from '@/components/admin/FileUploader'
import { DEFAULT_SITE_NAME } from '@/lib/constants'

const inputClass = "w-full px-3 py-2 border border-border rounded-[4px] bg-card text-foreground focus:outline-none focus:border-primary transition-colors"

export default function SettingsPage() {
  const [siteName, setSiteName] = useState('')
  const [faviconUrl, setFaviconUrl] = useState('')
  const [nameMsg, setNameMsg] = useState({ type: '', text: '' })
  const [faviconMsg, setFaviconMsg] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getSiteConfig('siteName'),
      getSiteConfig('favicon'),
    ]).then(([name, favicon]) => {
      setSiteName(name || '')
      setFaviconUrl(favicon || '')
      setLoading(false)
    })
  }, [])

  async function handleNameSave(e: React.FormEvent) {
    e.preventDefault()
    setNameMsg({ type: '', text: '' })
    try {
      await setSiteConfig('siteName', siteName)
      setNameMsg({ type: 'success', text: '博客名称已保存' })
    } catch (err) {
      setNameMsg({ type: 'error', text: err instanceof Error ? err.message : '保存失败' })
    }
  }

  async function handleFaviconSave(e: React.FormEvent) {
    e.preventDefault()
    setFaviconMsg({ type: '', text: '' })
    try {
      await setSiteConfig('favicon', faviconUrl)
      setFaviconMsg({ type: 'success', text: 'Favicon 已保存' })
    } catch (err) {
      setFaviconMsg({ type: 'error', text: err instanceof Error ? err.message : '保存失败' })
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">加载中...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-display uppercase tracking-[1px] text-foreground mb-6">系统管理</h1>

      <div className="space-y-6 max-w-xl">
        <div className="bg-card border border-border rounded-[20px] p-6">
          <h2 className="text-base font-bold font-display text-foreground mb-4">博客名称</h2>
          <form onSubmit={handleNameSave} className="space-y-4">
            {nameMsg.text && (
              <div className={`p-3 rounded-[4px] text-sm ${nameMsg.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                {nameMsg.text}
              </div>
            )}
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">网站名称</label>
              <input type="text" value={siteName} onChange={e => setSiteName(e.target.value)} placeholder={DEFAULT_SITE_NAME} className={inputClass} />
              <p className="mt-1 text-xs text-muted-foreground">留空则使用默认名称「{DEFAULT_SITE_NAME}」</p>
            </div>
            <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-[24px] font-mono uppercase hover:bg-primary/90 transition-colors">
              保存
            </button>
          </form>
        </div>

        <div className="bg-card border border-border rounded-[20px] p-6">
          <h2 className="text-base font-bold font-display text-foreground mb-4">网站图标 (Favicon)</h2>
          <form onSubmit={handleFaviconSave} className="space-y-4">
            {faviconMsg.text && (
              <div className={`p-3 rounded-[4px] text-sm ${faviconMsg.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                {faviconMsg.text}
              </div>
            )}
            {faviconUrl && (
              <div className="flex items-center gap-3 mb-2">
                <img src={faviconUrl} alt="Favicon 预览" className="w-10 h-10 rounded border border-border object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <span className="text-sm text-muted-foreground">当前图标预览</span>
              </div>
            )}
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">图标地址</label>
              <input type="url" value={faviconUrl} onChange={e => setFaviconUrl(e.target.value)} placeholder="输入图标 URL 或通过下方上传" className={inputClass} />
            </div>
            <FileUploader onUpload={url => setFaviconUrl(url)} accept="image/*" purpose="site" />
            <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-[24px] font-mono uppercase hover:bg-primary/90 transition-colors">
              保存
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}