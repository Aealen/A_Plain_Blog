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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">分类</h1>

      {categories.length === 0 ? (
        <p className="text-gray-500 text-center py-12">暂无分类</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h2>
              {category.description && (
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{category.description}</p>
              )}
              <span className="text-sm text-blue-600">
                {category._count.articles} 篇文章
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
