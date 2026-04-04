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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">标签</h1>

      {tags.length === 0 ? (
        <p className="text-gray-500 text-center py-12">暂无标签</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white rounded-full border border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm transition-all"
            >
              <span className="font-medium">{tag.name}</span>
              <span className="text-xs text-gray-400">({tag._count.articles})</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
