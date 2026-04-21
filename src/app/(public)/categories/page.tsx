import Link from 'next/link'
import { getCategories } from '@/actions/public/category'
import { getItemColor } from '@/lib/colors'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '分类',
  description: '浏览所有文章分类',
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="max-w-[880px] mx-auto pt-[60px] pb-10 px-5">
      <h1 className="font-display text-[44px] md:text-[60px] font-bold uppercase tracking-[1px] mb-8">分类</h1>

      {categories.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">暂无分类</p>
          <p className="text-tertiary text-sm mt-2">分类正在整理中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group block bg-card rounded-[20px] border border-white/10 p-6 hover:text-link-hover transition-colors duration-150"
              style={{ borderLeftColor: getItemColor(category.name).backgroundColor, borderLeftWidth: '3px' }}
            >
              <h2 className="text-lg font-bold font-display uppercase mb-2 group-hover:text-link-hover transition-colors">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{category.description}</p>
              )}
              <span className="font-mono text-[11px] text-mint uppercase tracking-[1.1px]">
                {category._count.articles} 篇文章
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
