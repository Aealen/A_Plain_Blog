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

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [stats, pages] = await Promise.all([
        getVisitStats(30),
        getTopPages(10),
      ])
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
    return <div className="text-center py-12 text-gray-500">加载中...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">访问统计</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">30 天 PV</p>
          <p className="text-3xl font-bold mt-2 text-blue-600">{totalPv.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">30 天 UV</p>
          <p className="text-3xl font-bold mt-2 text-green-600">{totalUv.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">今日 PV</p>
          <p className="text-3xl font-bold mt-2 text-orange-600">{todayPv.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Stats Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">每日统计（最近 30 天）</h2>
          </div>
          <div className="overflow-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">日期</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">PV</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">UV</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dailyStats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400">暂无数据</td>
                  </tr>
                ) : (
                  dailyStats
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((stat) => (
                      <tr key={stat.date} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">{stat.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right">{stat.pv.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right">{stat.uv.toLocaleString()}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">热门页面（30 天）</h2>
          </div>
          <div className="divide-y">
            {topPages.length === 0 ? (
              <div className="p-8 text-center text-gray-400">暂无数据</div>
            ) : (
              topPages.map((page, index) => (
                <div key={page.path} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400 w-6">{index + 1}.</span>
                    <span className="text-sm text-gray-700 truncate max-w-xs">{page.path}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
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
