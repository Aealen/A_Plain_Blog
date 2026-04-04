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
    <div className="max-w-[880px] mx-auto py-10 px-5">
      <h1 className="text-3xl font-bold font-mono text-foreground mb-8">归档</h1>

      {years.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">暂无文章</p>
        </div>
      ) : (
        <div className="space-y-10">
          {years.map((year) => (
            <section key={year}>
              <h2 className="text-2xl font-bold font-mono text-foreground mb-4 border-b border-border pb-2">{year}</h2>
              <div className="space-y-6">
                {Object.entries(archives[year])
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([month, articles]) => (
                    <div key={month}>
                      <h3 className="text-sm font-mono font-medium text-muted-foreground mb-3">{month} 月</h3>
                      <ul className="space-y-2 ml-2">
                        {articles.map((article) => (
                          <li key={article.id} className="flex items-center gap-4 group">
                            {article.publishedAt && (
                              <time
                                dateTime={article.publishedAt.toISOString()}
                                className="text-xs font-mono text-muted-foreground/60 shrink-0 w-20"
                              >
                                {new Date(article.publishedAt).toLocaleDateString('zh-CN')}
                              </time>
                            )}
                            <Link
                              href={`/articles/${article.slug}`}
                              className="text-foreground hover:text-primary transition-colors font-medium"
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
