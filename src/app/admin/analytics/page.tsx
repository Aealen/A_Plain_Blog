'use client'
import { useState, useEffect } from 'react'
import { getVisitStats, getTopPages } from '@/lib/visitor'

interface DailyStat {
  date: string
  pv: number
  uv: number
}

interface TopPage {
  path: string
  pv: number
  uv: number
}

export default function AnalyticsPage() {
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([])
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [stats, pages] = await Promise.all([getVisitStats(30), getTopPages(10)])
      setDailyStats(stats)
      setTopPages(pages)
    } finally {
      setLoading(false)
    }
  }

  const totalPv = dailyStats.reduce((sum, s) => sum + s.pv, 0)
  const totalUv = dailyStats.reduce((sum, s) => sum + s.uv, 0)
  const todayStr = new Date().toISOString().split('T')[0]
  const todayPv = dailyStats.find((s) => s.date === todayStr)?.pv || 0

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">加载中...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold font-mono text-foreground mb-6">访问统计</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-[var(--radius-lg)] border border-border p-6">
          <p className="text-sm text-muted-foreground font-mono">30 天 PV</p>
          <p className="text-3xl font-bold font-mono mt-2 text-primary">{totalPv.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-[var(--radius-lg)] border border-border p-6">
          <p className="text-sm text-muted-foreground font-mono">30 天 UV</p>
          <p className="text-3xl font-bold font-mono mt-2 text-green-600">{totalUv.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-[var(--radius-lg)] border border-border p-6">
          <p className="text-sm text-muted-foreground font-mono">今日 PV</p>
          <p className="text-3xl font-bold font-mono mt-2 text-foreground">{todayPv.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-[var(--radius-lg)] border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-base font-bold font-mono text-foreground">每日统计（最近 30 天）</h2>
          </div>
          <div className="overflow-auto max-h-96">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium font-mono text-muted-foreground">日期</th>
                  <th className="px-4 py-3 text-right text-sm font-medium font-mono text-muted-foreground">PV</th>
                  <th className="px-4 py-3 text-right text-sm font-medium font-mono text-muted-foreground">UV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dailyStats.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td></tr>
                ) : (
                  dailyStats.sort((a, b) => b.date.localeCompare(a.date)).map((stat) => (
                    <tr key={stat.date} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-foreground font-mono">{stat.date}</td>
                      <td className="px-4 py-3 text-sm text-foreground text-right font-mono">{stat.pv.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-foreground text-right font-mono">{stat.uv.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card rounded-[var(--radius-lg)] border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-base font-bold font-mono text-foreground">热门页面（30 天）</h2>
          </div>
          <div className="divide-y divide-border">
            {topPages.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">暂无数据</div>
            ) : (
              topPages.map((page, index) => (
                <div key={page.path} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium font-mono text-muted-foreground w-6">{index + 1}.</span>
                    <span className="text-sm text-foreground truncate max-w-xs">{page.path}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono">
                    <span>PV: {page.pv.toLocaleString()}</span>
                    <span>UV: {page.uv.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
