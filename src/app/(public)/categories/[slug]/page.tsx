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
    <div className="max-w-[880px] mx-auto pt-[60px] pb-10 px-5">

      <header className="mb-8">
        <div className="flex items-center gap-2 font-mono text-[12px] text-muted-foreground uppercase tracking-[1.5px] mb-3">
          <Link href="/categories" className="hover:text-link-hover transition-colors">分类</Link>
          <span className="text-muted-foreground/20">/</span>
          <span className="text-foreground">{category.name}</span>
        </div>
        <h1 className="font-display text-[44px] font-bold uppercase tracking-[1px]">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground mt-2">{category.description}</p>
        )}
        <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[1.1px] mt-1">共 {category._count.articles} 篇文章</p>
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
