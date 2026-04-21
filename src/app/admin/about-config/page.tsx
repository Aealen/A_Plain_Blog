'use client'
import { useState, useEffect } from 'react'
import { getSiteConfig, setSiteConfig } from '@/actions/admin/site'
import FileUploader from '@/components/admin/FileUploader'

const inputClass = "w-full px-3 py-2 border border-border rounded-[4px] bg-card text-foreground focus:outline-none focus:border-primary transition-colors"

const CONFIG_KEYS = [
  'about_avatar',
  'about_nickname',
  'about_subtitle',
  'about_bio',
  'about_techs',
  'about_contact',
] as const

type AboutConfigKey = typeof CONFIG_KEYS[number]

const DEFAULTS: Record<AboutConfigKey, string> = {
  about_avatar: '',
  about_nickname: '',
  about_subtitle: '一个简洁的博客',
  about_bio: '',
  about_techs: 'Next.js 15, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL, NextAuth.js, React Markdown',
  about_contact: '',
}

export default function AboutConfigPage() {
  const [config, setConfig] = useState<Record<AboutConfigKey, string>>({ ...DEFAULTS })
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all(CONFIG_KEYS.map(key => getSiteConfig(key))).then(values => {
      const newConfig = { ...DEFAULTS }
      values.forEach((val, i) => {
        if (val) newConfig[CONFIG_KEYS[i]] = val
      })
      setConfig(newConfig)
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setMsg({ type: '', text: '' })
    try {
      await Promise.all(
        CONFIG_KEYS.map(key => setSiteConfig(key, config[key]))
      )
      setMsg({ type: 'success', text: '关于页面配置已保存' })
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : '保存失败' })
    }
  }

  function updateConfig(key: AboutConfigKey, value: string) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">加载中...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-display uppercase tracking-[1px] text-foreground mb-6">关于页面</h1>

      <form onSubmit={handleSave} className="space-y-6 max-w-xl">
        {msg.text && (
          <div className={`p-3 rounded-[4px] text-sm ${msg.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
            {msg.text}
          </div>
        )}

        <div className="bg-card rounded-[24px] border border-border p-6">
          <h2 className="text-base font-bold font-display text-foreground mb-4">个人信息</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">头像</label>
              {config.about_avatar && (
                <div className="mb-2">
                  <img src={config.about_avatar} alt="头像预览" className="w-16 h-16 rounded-full object-cover border border-border" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
              <div className="mb-2">
                <input type="url" value={config.about_avatar} onChange={e => updateConfig('about_avatar', e.target.value)} placeholder="输入头像 URL 或通过下方上传" className={inputClass} />
              </div>
              <FileUploader onUpload={url => updateConfig('about_avatar', url)} accept="image/*" purpose="avatars" />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">昵称</label>
              <input type="text" value={config.about_nickname} onChange={e => updateConfig('about_nickname', e.target.value)} placeholder="留空则使用博客名称" className={inputClass} />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">小标题</label>
              <input type="text" value={config.about_subtitle} onChange={e => updateConfig('about_subtitle', e.target.value)} placeholder={DEFAULTS.about_subtitle} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[24px] border border-border p-6">
          <h2 className="text-base font-bold font-display text-foreground mb-4">简介内容</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">个人简介</label>
              <textarea value={config.about_bio} onChange={e => updateConfig('about_bio', e.target.value)} rows={4} placeholder="写一段关于你自己或本站的介绍..." className={inputClass} />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">技术栈标签</label>
              <input type="text" value={config.about_techs} onChange={e => updateConfig('about_techs', e.target.value)} placeholder="用英文逗号分隔，如：React, Node.js, PostgreSQL" className={inputClass} />
              <p className="mt-1 text-xs text-muted-foreground">多个标签用英文逗号分隔</p>
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">联系方式</label>
              <input type="text" value={config.about_contact} onChange={e => updateConfig('about_contact', e.target.value)} placeholder="邮箱地址，如：admin@example.com" className={inputClass} />
            </div>
          </div>
        </div>

        <button type="submit" className="w-full max-w-xl bg-primary text-primary-foreground py-2 rounded-[24px] font-mono uppercase transition-colors">
          保存
        </button>
      </form>
    </div>
  )
}
