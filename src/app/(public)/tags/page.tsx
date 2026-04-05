import Link from 'next/link'
import { getTags } from '@/actions/public/tag'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '标签',
  description: '浏览所有文章标签',
}

export default async function TagsPage() {
  const tags = await getTags()

  return (
    <div className="max-w-[880px] mx-auto pt-[60px] pb-10 px-5">

      <h1 className="text-3xl font-bold font-display text-foreground mb-8">标签</h1>

      {tags.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">暂无标签</p>
          <p className="text-tertiary text-sm mt-2">标签正在整理中...</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-card rounded-full border border-border text-foreground hover:border-primary/40 hover:text-primary hover:shadow-sm transition-all duration-300"
            >
              <span className="font-medium font-display"># {tag.name}</span>
              <span className="text-xs text-muted-foreground">({tag._count.articles})</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
