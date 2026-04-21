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
    <div className="max-w-[880px] mx-auto pt-[60px] pb-10 px-5">

      <header className="mb-8">
        <div className="flex items-center gap-2 font-mono text-[12px] text-muted-foreground uppercase tracking-[1.5px] mb-3">
          <Link href="/tags" className="hover:text-link-hover transition-colors">标签</Link>
          <span className="text-white/20">/</span>
          <span className="text-foreground">{tag.name}</span>
        </div>
        <h1 className="font-display text-[44px] font-bold uppercase tracking-[1px]">{tag.name}</h1>
        <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[1.1px] mt-1">共 {tag._count.articles} 篇文章</p>
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
