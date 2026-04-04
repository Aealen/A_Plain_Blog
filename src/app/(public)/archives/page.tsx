import Link from 'next/link'
import { getArchives } from '@/actions/public/article'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '归档',
  description: '按时间浏览所有文章',
}

export default async function ArchivesPage() {
  const archives = await getArchives()
  const years = Object.keys(archives).sort((a, b) => Number(b) - Number(a))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">归档</h1>

      {years.length === 0 ? (
        <p className="text-gray-500 text-center py-12">暂无文章</p>
      ) : (
        <div className="space-y-10">
          {years.map((year) => (
            <section key={year}>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">{year}</h2>
              <div className="space-y-6">
                {Object.entries(archives[year])
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([month, articles]) => (
                    <div key={month}>
                      <h3 className="text-lg font-semibold text-gray-600 mb-3">{month} 月</h3>
                      <ul className="space-y-2 ml-4">
                        {articles.map((article) => (
                          <li key={article.id} className="flex items-center gap-3">
                            {article.publishedAt && (
                              <time
                                dateTime={article.publishedAt.toISOString()}
                                className="text-sm text-gray-400 shrink-0"
                              >
                                {new Date(article.publishedAt).toLocaleDateString('zh-CN')}
                              </time>
                            )}
                            <Link
                              href={`/articles/${article.slug}`}
                              className="text-gray-700 hover:text-blue-600 hover:underline"
                            >
                              {article.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
