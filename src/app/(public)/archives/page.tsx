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
    <div className="max-w-[880px] mx-auto pt-[60px] pb-10 px-5">

      <h1 className="font-display text-[44px] md:text-[60px] font-bold uppercase tracking-[1px] mb-8">归档</h1>

      {years.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">暂无文章</p>
        </div>
      ) : (
        <div className="space-y-10">
          {years.map((year) => (
            <section key={year}>
              <h2 className="font-display text-[32px] font-bold uppercase tracking-[0.5px] mb-4 border-b border-primary pb-2">{year}</h2>
              <div className="space-y-6">
                {Object.entries(archives[year])
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([month, articles]) => (
                    <div key={month}>
                      <h3 className="font-mono text-[12px] font-medium text-muted-foreground uppercase tracking-[1.5px] mb-3">{month} 月</h3>
                      <ul className="space-y-2 ml-2 border-l border-accent/40 pl-4">
                        {articles.map((article) => (
                          <li key={article.id} className="flex items-center gap-4 group">
                            {article.createdAt && (
                              <time
                                dateTime={article.createdAt.toISOString()}
                                className="font-mono text-[10px] text-tertiary uppercase tracking-[1.5px] shrink-0 w-20"
                              >
                                {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                              </time>
                            )}
                            <Link
                              href={`/articles/${article.slug}`}
                              prefetch={false}
                              className="text-foreground hover:text-link-hover transition-colors font-medium"
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
