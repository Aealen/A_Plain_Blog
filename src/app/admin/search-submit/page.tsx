'use client'
import { useState, useEffect } from 'react'
import {
  getSubmitUrls,
  getUrlSubmitStatus,
  getSearchEngineConfigs,
  saveSearchEngineConfigs,
  submitToBaidu,
  submitToBing,
  submitToGoogle,
  syncSubmitQueue,
  getSubmitStats,
  submitToBaiduBatch,
  resetFailedRecords,
} from '@/actions/admin/search-submit'

const inputClass = "w-full px-3 py-2 border border-border rounded-[4px] bg-card text-foreground focus:outline-none focus:border-primary transition-colors font-mono text-sm"
const btnClass = "px-6 py-2.5 rounded-[24px] font-mono uppercase text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

interface SubmitResult {
  success: boolean
  message: string
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-border'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4.5 ml-[18px]' : 'ml-[3px]'}`} />
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'submitted') {
    return <span className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-[4px]">已收录</span>
  }
  return <span className="text-[11px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-[4px]">未收录</span>
}

export default function SearchSubmitPage() {
  const [urls, setUrls] = useState<string[]>([])
  const [urlStatuses, setUrlStatuses] = useState<{ url: string; baidu: string; bing: string; google: string }[]>([])
  const [stats, setStats] = useState({ pending: 0, submitted: 0, todayCount: 0, failed: 0, quota: 100, remaining: 100 })
  const [configs, setConfigs] = useState({
    baiduEnabled: false, baiduToken: '', baiduSite: '', baiduDailyQuota: '100',
    bingEnabled: false, bingApiKey: '', bingSite: '',
    googleEnabled: false, googleClientEmail: '', googlePrivateKey: '',
  })
  const [configMsg, setConfigMsg] = useState('')
  const [syncMsg, setSyncMsg] = useState('')
  const [batchResult, setBatchResult] = useState<SubmitResult | null>(null)
  const [baiduResult, setBaiduResult] = useState<SubmitResult | null>(null)
  const [bingResult, setBingResult] = useState<SubmitResult | null>(null)
  const [googleResult, setGoogleResult] = useState<SubmitResult | null>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterUrl, setFilterUrl] = useState('')
  const [filterBaidu, setFilterBaidu] = useState('')
  const [filterBing, setFilterBing] = useState('')
  const [filterGoogle, setFilterGoogle] = useState('')

  const filteredStatuses = urlStatuses.filter(row => {
    if (filterUrl && !row.url.toLowerCase().includes(filterUrl.toLowerCase())) return false
    if (filterBaidu && row.baidu !== filterBaidu) return false
    if (filterBing && row.bing !== filterBing) return false
    if (filterGoogle && row.google !== filterGoogle) return false
    return true
  })

  useEffect(() => {
    Promise.all([getSubmitUrls(), getUrlSubmitStatus(), getSearchEngineConfigs(), getSubmitStats()]).then(([urlList, statuses, c, s]) => {
      setUrls(urlList)
      setUrlStatuses(statuses)
      setConfigs(c)
      setStats(s)
      setLoading(false)
    })
  }, [])

  async function refreshStats() {
    const s = await getSubmitStats()
    setStats(s)
  }

  async function refreshRecords() {
    const [urlList, statuses] = await Promise.all([getSubmitUrls(), getUrlSubmitStatus()])
    setUrls(urlList)
    setUrlStatuses(statuses)
  }

  async function handleSaveConfigs(e: React.FormEvent) {
    e.preventDefault()
    setConfigMsg('')
    try {
      await saveSearchEngineConfigs(configs)
      setConfigMsg('配置已保存')
      refreshStats()
      setTimeout(() => setConfigMsg(''), 3000)
    } catch {
      setConfigMsg('保存失败')
    }
  }

  async function handleSync() {
    setSyncMsg('同步中...')
    try {
      const result = await syncSubmitQueue()
      setSyncMsg(`已同步，新增 ${result.added} 条，共 ${result.total} 条 URL`)
      refreshStats()
      refreshRecords()
      setTimeout(() => setSyncMsg(''), 5000)
    } catch {
      setSyncMsg('同步失败')
    }
  }

  async function handleResetFailed() {
    const result = await resetFailedRecords()
    setSyncMsg(`已重置 ${result.reset} 条失败记录为待提交`)
    refreshStats()
    refreshRecords()
    setTimeout(() => setSyncMsg(''), 3000)
  }

  async function handleBatchSubmit() {
    setSubmitting('baidu-batch')
    setBatchResult(null)
    try {
      const result = await submitToBaiduBatch()
      setBatchResult(result)
      refreshStats()
      refreshRecords()
    } catch {
      setBatchResult({ success: false, message: '请求失败' })
    } finally {
      setSubmitting(null)
    }
  }

  async function handleSubmit(engine: 'baidu' | 'bing' | 'google') {
    const setResult = engine === 'baidu' ? setBaiduResult : engine === 'bing' ? setBingResult : setGoogleResult
    setSubmitting(engine)
    setResult(null)
    try {
      const submitFn = engine === 'baidu' ? submitToBaidu : engine === 'bing' ? submitToBing : submitToGoogle
      const result = await submitFn(urls)
      setResult(result)
      refreshRecords()
    } catch {
      setResult({ success: false, message: '请求失败，请检查网络连接' })
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">加载中...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-display uppercase tracking-[1px] text-foreground mb-6">搜索收录</h1>

      {configMsg && (
        <div className="p-3 rounded-[4px] text-sm bg-primary/10 text-primary mb-4">{configMsg}</div>
      )}

      <div className="flex gap-6">
        {/* 左侧：配置区域 */}
        <div className="w-[480px] shrink-0 space-y-6">
          <form onSubmit={handleSaveConfigs} className="space-y-6">
            {/* 百度 */}
            <div className="bg-card border border-border rounded-[20px] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold font-display text-foreground">百度推送</h2>
                <Toggle checked={configs.baiduEnabled} onChange={v => setConfigs(c => ({ ...c, baiduEnabled: v }))} />
              </div>
              <div className={`${!configs.baiduEnabled ? 'opacity-40 pointer-events-none' : ''} space-y-4`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">Token</label>
                    <input type="text" value={configs.baiduToken} onChange={e => setConfigs(c => ({ ...c, baiduToken: e.target.value }))} placeholder="百度推送 token" className={inputClass} />
                  </div>
                  <div>
                    <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">站点域名</label>
                    <input type="text" value={configs.baiduSite} onChange={e => setConfigs(c => ({ ...c, baiduSite: e.target.value }))} placeholder="https://blog.aowu.tech" className={inputClass} />
                  </div>
                  <div>
                    <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">每日配额</label>
                    <input type="number" value={configs.baiduDailyQuota} onChange={e => setConfigs(c => ({ ...c, baiduDailyQuota: e.target.value }))} placeholder="100" className={inputClass} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">在百度搜索资源平台 → 普通收录 → 资源提交 → API提交 中获取</p>

                <div className="grid grid-cols-4 gap-3 p-4 bg-background rounded-[8px] border border-border">
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-foreground">{stats.pending}</p>
                    <p className="text-[11px] font-mono uppercase tracking-[1px] text-muted-foreground">待提交</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-primary">{stats.todayCount}</p>
                    <p className="text-[11px] font-mono uppercase tracking-[1px] text-muted-foreground">今日已提交</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-foreground">{stats.remaining}</p>
                    <p className="text-[11px] font-mono uppercase tracking-[1px] text-muted-foreground">剩余配额</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-destructive">{stats.failed}</p>
                    <p className="text-[11px] font-mono uppercase tracking-[1px] text-muted-foreground">失败</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={handleSync} className={`${btnClass} border border-border text-foreground hover:bg-hover`}>
                    同步队列
                  </button>
                  <button type="button" onClick={handleBatchSubmit} disabled={submitting !== null} className={`${btnClass} bg-foreground text-background hover:opacity-90`}>
                    {submitting === 'baidu-batch' ? '提交中...' : '按配额提交'}
                  </button>
                  {stats.failed > 0 && (
                    <button type="button" onClick={handleResetFailed} className={`${btnClass} border border-destructive text-destructive hover:bg-destructive/10`}>
                      重置失败
                    </button>
                  )}
                </div>

                {syncMsg && <p className="text-xs text-primary">{syncMsg}</p>}
                {batchResult && (
                  <p className={`text-xs ${batchResult.success ? 'text-primary' : 'text-destructive'}`}>{batchResult.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  定时任务：<code className="px-1 py-0.5 bg-background rounded text-[11px]">GET /api/cron/baidu-submit</code>
                </p>
              </div>
            </div>

            {/* Bing */}
            <div className="bg-card border border-border rounded-[20px] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold font-display text-foreground">Bing</h2>
                <Toggle checked={configs.bingEnabled} onChange={v => setConfigs(c => ({ ...c, bingEnabled: v }))} />
              </div>
              <div className={`space-y-4 ${!configs.bingEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">API Key</label>
                    <input type="text" value={configs.bingApiKey} onChange={e => setConfigs(c => ({ ...c, bingApiKey: e.target.value }))} placeholder="IndexNow Key" className={inputClass} />
                  </div>
                  <div>
                    <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">站点域名（可选）</label>
                    <input type="text" value={configs.bingSite} onChange={e => setConfigs(c => ({ ...c, bingSite: e.target.value }))} placeholder="留空使用默认站点地址" className={inputClass} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">在 Bing Webmaster Tools → URL 提交 中获取 API Key</p>
                <button type="button" onClick={() => handleSubmit('bing')} disabled={submitting !== null} className={`${btnClass} bg-foreground text-background hover:opacity-90`}>
                  {submitting === 'bing' ? '提交中...' : '提交到 Bing'}
                </button>
                {bingResult && (
                  <p className={`text-xs ${bingResult.success ? 'text-primary' : 'text-destructive'}`}>{bingResult.message}</p>
                )}
              </div>
            </div>

            {/* Google */}
            <div className="bg-card border border-border rounded-[20px] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold font-display text-foreground">Google</h2>
                <Toggle checked={configs.googleEnabled} onChange={v => setConfigs(c => ({ ...c, googleEnabled: v }))} />
              </div>
              <div className={`space-y-4 ${!configs.googleEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">服务账号邮箱</label>
                    <input type="text" value={configs.googleClientEmail} onChange={e => setConfigs(c => ({ ...c, googleClientEmail: e.target.value }))} placeholder="xxx@xxx.iam.gserviceaccount.com" className={inputClass} />
                  </div>
                  <div>
                    <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">私钥（PEM）</label>
                    <textarea value={configs.googlePrivateKey} onChange={e => setConfigs(c => ({ ...c, googlePrivateKey: e.target.value }))} placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----" className={`${inputClass} h-20 resize-none`} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">在 Google Cloud Console → IAM → 服务账号 中创建，需启用 Indexing API</p>
                <button type="button" onClick={() => handleSubmit('google')} disabled={submitting !== null} className={`${btnClass} bg-foreground text-background hover:opacity-90`}>
                  {submitting === 'google' ? '提交中...' : '提交到 Google'}
                </button>
                {googleResult && (
                  <p className={`text-xs ${googleResult.success ? 'text-primary' : 'text-destructive'}`}>{googleResult.message}</p>
                )}
              </div>
            </div>

            <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-[24px] font-mono uppercase hover:bg-primary/90 transition-colors">
              保存配置
            </button>
          </form>
        </div>

        {/* 右侧：URL 列表 */}
        <div className="flex-1 min-w-0">
          <div className="bg-card border border-border rounded-[20px] sticky top-6">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-bold font-display text-foreground">URL 收录状态</h2>
              <span className="text-sm text-muted-foreground font-mono">共 {filteredStatuses.length} 条</span>
            </div>

            {/* 筛选条件 */}
            <div className="p-4 border-b border-border grid grid-cols-4 gap-3">
              <input
                type="text"
                value={filterUrl}
                onChange={e => setFilterUrl(e.target.value)}
                placeholder="搜索 URL..."
                className="px-3 py-1.5 border border-border rounded-[4px] bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <select value={filterBaidu} onChange={e => setFilterBaidu(e.target.value)} className="px-3 py-1.5 border border-border rounded-[4px] bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors">
                <option value="">百度 - 全部</option>
                <option value="submitted">百度 - 已收录</option>
                <option value="pending">百度 - 未收录</option>
                <option value="failed">百度 - 失败</option>
              </select>
              <select value={filterBing} onChange={e => setFilterBing(e.target.value)} className="px-3 py-1.5 border border-border rounded-[4px] bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors">
                <option value="">Bing - 全部</option>
                <option value="submitted">Bing - 已收录</option>
                <option value="pending">Bing - 未收录</option>
                <option value="failed">Bing - 失败</option>
              </select>
              <select value={filterGoogle} onChange={e => setFilterGoogle(e.target.value)} className="px-3 py-1.5 border border-border rounded-[4px] bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors">
                <option value="">Google - 全部</option>
                <option value="submitted">Google - 已收录</option>
                <option value="pending">Google - 未收录</option>
                <option value="failed">Google - 失败</option>
              </select>
            </div>

            <div className="overflow-auto max-h-[calc(100vh-260px)]">
              <table className="w-full">
                <thead className="bg-card sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground w-[25%]">URL</th>
                    <th className="px-4 py-3 text-center font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground w-[25%]">百度</th>
                    <th className="px-4 py-3 text-center font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground w-[25%]">Bing</th>
                    <th className="px-4 py-3 text-center font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground w-[25%]">Google</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStatuses.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td></tr>
                  ) : (
                    filteredStatuses.map(row => {
                      const path = row.url.replace(/^https?:\/\/[^/]+/, '')
                      return (
                        <tr key={row.url} className="hover:bg-hover transition-colors">
                          <td className="px-4 py-2.5 text-sm text-foreground font-mono truncate" title={row.url}>{path || '/'}</td>
                          <td className="px-4 py-2.5 text-center"><StatusBadge status={row.baidu} /></td>
                          <td className="px-4 py-2.5 text-center"><StatusBadge status={row.bing} /></td>
                          <td className="px-4 py-2.5 text-center"><StatusBadge status={row.google} /></td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
