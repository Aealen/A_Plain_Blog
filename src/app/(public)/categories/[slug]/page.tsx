import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCategoryBySlug } from '@/actions/public/category'
import { getPublishedArticles } from '@/actions/public/article'
import ArticleCard from '@/components/public/ArticleCard'

interface CategoryArticlesPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryArticlesPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: '分类未找到' }
  return {
    title: `${category.name} - 分类`,
    description: category.description || `浏览${category.name}分类下的所有文章`,
  }
}

export default async function CategoryArticlesPage({ params }: CategoryArticlesPageProps) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) notFound()

  const { data: articles } = await getPublishedArticles({ categoryId: category.id })

  return (
    <div className="max-w-[880px] mx-auto py-10 px-5">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 font-mono">
          <Link href="/categories" className="hover:text-primary transition-colors">分类</Link>
          <span className="text-border">/</span>
          <span className="text-foreground">{category.name}</span>
        </div>
        <h1 className="text-3xl font-bold font-mono text-foreground">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground mt-2">{category.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1 font-mono">共 {category._count.articles} 篇文章</p>
      </header>

      {articles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">该分类下暂无文章</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
