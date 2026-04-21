import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Link from 'next/link'
export default async function DashboardPage() {
  const session = await auth()
  const [
    totalArticles,
    publishedArticles,
    draftArticles,
    totalCategories,
    totalTags,
    recentArticles,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { status: 'PUBLISHED' } }),
    prisma.article.count({ where: { status: 'DRAFT' } }),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      include: {
        categories: { select: { category: { select: { name: true } } } },
      },
    }),
  ])

  const stats = [
    { label: '总文章数', value: totalArticles, color: 'text-foreground' },
    { label: '已发布', value: publishedArticles, color: 'text-primary' },
    { label: '草稿', value: draftArticles, color: 'text-primary' },
    { label: '分类数', value: totalCategories, color: 'text-foreground' },
    { label: '标签数', value: totalTags, color: 'text-foreground' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-display uppercase tracking-[1px] text-foreground mb-6">
        欢迎回来, {session?.user?.nickname || session?.user?.name}!
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-[20px] p-5">
            <p className="font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground">{stat.label}</p>
            <p className={`text-3xl font-bold font-display mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-[20px]">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-base font-bold font-display text-foreground">最近发布</h2>
          <Link href="/admin/articles" className="text-sm text-primary hover:text-primary/80 font-mono transition-colors">查看全部</Link>
        </div>
        <div className="divide-y divide-border">
          {recentArticles.map((article) => (
            <div key={article.id} className="p-4 flex items-center justify-between">
              <div>
                <Link href={`/admin/articles/${article.id}`} className="font-medium text-foreground hover:text-primary transition-colors font-display">{article.title}</Link>
                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-3">
                  {article.categories.length > 0 && <span>{article.categories.map(c => c.category.name).join(', ')}</span>}
                  <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('zh-CN') : ''}</span>
                </div>
              </div>
              <span className="text-sm text-muted-foreground font-mono">{article.viewCount} <span className="text-primary">阅读</span></span>
            </div>
          ))}
          {recentArticles.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">暂无文章</div>
          )}
        </div>
      </div>
    </div>
  )
}
