import prisma from '@/lib/prisma'
interface VisitData {
  visitorId: string
  sessionId: string
  path: string
  referrer?: string
  userAgent?: string
  ip?: string
}
export async function recordVisit(data: VisitData) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  await prisma.visitLog.create({
    data: {
      visitorId: data.visitorId,
      sessionId: data.sessionId,
      path: data.path,
      referrer: data.referrer,
      userAgent: data.userAgent,
      ip: data.ip,
    },
  })
  const existing = await prisma.pageVisitSummary.findUnique({
    where: { path_date: { path: data.path, date: today } },
  })
  if (existing) {
    const todayVisits = await prisma.visitLog.findMany({
      where: { visitorId: data.visitorId, path: data.path, visitedAt: { gte: today } },
    })
    const isNewVisitor = todayVisits.length <= 1
    await prisma.pageVisitSummary.update({
      where: { id: existing.id },
      data: {
        pv: { increment: 1 },
        uv: isNewVisitor ? { increment: 1 } : undefined,
      },
    })
  } else {
    await prisma.pageVisitSummary.create({
      data: { path: data.path, date: today, pv: 1, uv: 1 },
    })
  }
}
export async function getVisitStats(days: number = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)
  const dailyStats = await prisma.pageVisitSummary.findMany({
    where: { date: { gte: since } },
    orderBy: { date: 'asc' },
  })
  const statsByDate = new Map<string, { pv: number; uv: number }>()
  for (const stat of dailyStats) {
    const dateKey = stat.date.toISOString().split('T')[0]
    const existing = statsByDate.get(dateKey) || { pv: 0, uv: 0 }
    existing.pv += stat.pv
    existing.uv += stat.uv
    statsByDate.set(dateKey, existing)
  }
  return Array.from(statsByDate.entries()).map(([date, stats]) => ({ date, pv: stats.pv, uv: stats.uv }))
}
export async function getTopPages(limit: number = 10) {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const summaries = await prisma.pageVisitSummary.findMany({
    where: { date: { gte: since } },
    orderBy: { pv: 'desc' },
    take: limit,
  })
  const pageMap = new Map<string, { pv: number; uv: number }>()
  for (const s of summaries) {
    const existing = pageMap.get(s.path) || { pv: 0, uv: 0 }
    existing.pv += s.pv
    existing.uv += s.uv
    pageMap.set(s.path, existing)
  }
  return Array.from(pageMap.entries()).map(([path, stats]) => ({ path, ...stats })).sort((a, b) => b.pv - a.pv).slice(0, limit)
}
