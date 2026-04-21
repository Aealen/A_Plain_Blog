'use client'
import { useState, useEffect } from 'react'
import { fetchVisitStats, fetchTopPages } from '@/actions/admin/analytics'

interface DailyStat {
  date: string
  pv: number
  uv: number
}

interface TopPage {
  path: string
  pv: number
  uv: number
  title: string | null
}

export default function AnalyticsPage() {
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([])
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [stats, pages] = await Promise.all([fetchVisitStats(30), fetchTopPages(10)])
      setDailyStats(stats)
      setTopPages(pages)
    } finally {
      setLoading(false)
    }
  }

  const totalPv = dailyStats.reduce((sum, s) => sum + s.pv, 0)
  const totalUv = dailyStats.reduce((sum, s) => sum + s.uv, 0)
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const todayPv = dailyStats.find((s) => s.date === todayStr)?.pv || 0

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">加载中...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-display uppercase tracking-[1px] text-foreground mb-6">访问统计</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#2d2d2d] border border-white/10 rounded-[20px] p-6">
          <p className="font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground">30 天 PV</p>
          <p className="text-3xl font-bold font-display mt-2 text-[#3cffd0]">{totalPv.toLocaleString()}</p>
        </div>
        <div className="bg-[#2d2d2d] border border-white/10 rounded-[20px] p-6">
          <p className="font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground">30 天 UV</p>
          <p className="text-3xl font-bold font-display mt-2 text-[#3cffd0]">{totalUv.toLocaleString()}</p>
        </div>
        <div className="bg-[#2d2d2d] border border-white/10 rounded-[20px] p-6">
          <p className="font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground">今日 PV</p>
          <p className="text-3xl font-bold font-display mt-2 text-white">{todayPv.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#2d2d2d] border border-white/10 rounded-[20px]">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-base font-bold font-display text-foreground">每日统计（最近 30 天）</h2>
          </div>
          <div className="overflow-auto max-h-96">
            <table className="w-full">
              <thead className="bg-[#2d2d2d] sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground">日期</th>
                  <th className="px-4 py-3 text-right font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground">PV</th>
                  <th className="px-4 py-3 text-right font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground">UV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {dailyStats.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td></tr>
                ) : (
                  dailyStats.sort((a, b) => b.date.localeCompare(a.date)).map((stat) => (
                    <tr key={stat.date} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-foreground font-mono">{stat.date}</td>
                      <td className="px-4 py-3 text-sm text-[#3cffd0] text-right font-mono">{stat.pv.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-foreground text-right font-mono">{stat.uv.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#2d2d2d] border border-white/10 rounded-[20px]">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-base font-bold font-display text-foreground">热门页面（30 天）</h2>
          </div>
          <div className="divide-y divide-white/10">
            {topPages.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">暂无数据</div>
            ) : (
              topPages.map((page, index) => (
                <div key={page.path} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-medium font-mono text-muted-foreground w-6 shrink-0">{index + 1}.</span>
                    {page.title ? (
                      <span className="text-sm text-foreground truncate">{page.title}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground truncate">{page.path}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono shrink-0">
                    <span>PV: <span className="text-[#3cffd0]">{page.pv.toLocaleString()}</span></span>
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
