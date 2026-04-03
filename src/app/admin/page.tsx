import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Link from 'next/link'
export default async function DashboardPage() {
  const session = await auth()
  const [
    totalArticles,
    publishedArticles
    draftArticles
    totalCategories
    totalTags
    recentArticles
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
        category: { select: { name: true } },
      },
    }),
  ])
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        欢迎回来, {session?.user?.nickname || session?.user?.username}!
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">总文章数</p>
          <p className="text-3xl font-bold mt-2">{totalArticles}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">已发布</p>
          <p className="text-3xl font-bold mt-2 text-green-600">{publishedArticles}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">草稿</p>
          <p className="text-3xl font-bold mt-2 text-yellow-600">{draftArticles}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">分类数</p>
          <p className="text-3xl font-bold mt-2">{totalCategories}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">标签数</p>
          <p className="text-3xl font-bold mt-2">{totalTags}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">最近发布</h2>
          <Link href="/admin/articles" className="text-sm text-blue-600 hover:underline">查看全部</Link>
        </div>
        <div className="divide-y">
          {recentArticles.map((article) => (
            <div key={article.id} className="p-4 flex items-center justify-between">
              <div>
                <Link href={`/admin/articles/${article.id}`} className="font-medium hover:text-blue-600">{article.title}</Link>
                <div className="text-sm text-gray-500 mt-1">
                  {article.category?.name && <span className="mr-3">{article.category.name}</span>}
                  <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('zh-CN') : ''}</span>
                </div>
              </div>
              <span className="text-sm text-gray-500">{article.viewCount} 阅读</span>
            </div>
          ))}
          {recentArticles.length === 0 && (
            <div className="p-8 text-center text-gray-400">暂无文章</div>
          )}
        </div>
      </div>
    </div>
  )
}
