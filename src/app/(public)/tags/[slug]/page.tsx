import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTagBySlug } from '@/actions/public/tag'
import { getPublishedArticles } from '@/actions/public/article'
import ArticleCard from '@/components/public/ArticleCard'

interface TagArticlesPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: TagArticlesPageProps): Promise<Metadata> {
  const { slug } = await params
  const tag = await getTagBySlug(slug)
  if (!tag) return { title: '标签未找到' }
  return {
    title: `${tag.name} - 标签`,
    description: `浏览带有「${tag.name}」标签的所有文章`,
  }
}

export default async function TagArticlesPage({ params }: TagArticlesPageProps) {
  const { slug } = await params
  const tag = await getTagBySlug(slug)

  if (!tag) notFound()

  const { data: articles } = await getPublishedArticles({ tagId: tag.id })

  return (
    <div className="max-w-[880px] mx-auto py-10 px-5">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 font-mono">
          <Link href="/tags" className="hover:text-primary transition-colors">标签</Link>
          <span className="text-border">/</span>
          <span className="text-foreground">{tag.name}</span>
        </div>
        <h1 className="text-3xl font-bold font-mono text-foreground">{tag.name}</h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">共 {tag._count.articles} 篇文章</p>
      </header>

      {articles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">该标签下暂无文章</p>
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
