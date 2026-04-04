import Link from 'next/link'
import { getCategories } from '@/actions/public/category'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '分类',
  description: '浏览所有文章分类',
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="max-w-[880px] mx-auto py-10 px-5">
      <h1 className="text-3xl font-bold font-mono text-foreground mb-8">分类</h1>

      {categories.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">暂无分类</p>
          <p className="text-muted-foreground/60 text-sm mt-2">分类正在整理中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group block bg-card rounded-[var(--radius-lg)] border border-border p-6 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
            >
              <h2 className="text-lg font-bold font-mono text-foreground mb-2 group-hover:text-primary transition-colors">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{category.description}</p>
              )}
              <span className="text-sm text-primary font-mono">
                {category._count.articles} 篇文章
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
