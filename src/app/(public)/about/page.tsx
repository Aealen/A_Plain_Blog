export const dynamic = 'force-dynamic'

export const metadata = {
  title: '关于',
  description: '关于本站',
}

export default function AboutPage() {
  const techs = [
    'Next.js 15',
    'TypeScript',
    'Tailwind CSS',
    'Prisma ORM',
    'PostgreSQL',
    'NextAuth.js',
    'React Markdown',
  ]

  return (
    <div className="max-w-[880px] mx-auto pt-[60px] pb-10 px-5">

      {/* Centered profile section */}
      <div className="flex flex-col items-center">
        <div className="w-[120px] h-[120px] rounded-full bg-accent flex items-center justify-center text-primary text-4xl font-bold font-display mb-10">
          P
        </div>

        <h1 className="text-3xl font-bold font-display text-foreground">Maxon's Blog</h1>

        <p className="text-tertiary mt-4 text-sm">一个简洁的博客</p>
      </div>

      {/* Full-width divider */}
      <div className="border-t border-border my-10" />

      {/* Description sections, centered */}
      <div className="max-w-[600px] mx-auto space-y-6">
        <p className="text-muted-foreground leading-relaxed text-center">
          这是一个基于 Next.js 15 构建的博客系统，使用 TypeScript 和 Tailwind CSS
          开发。后端采用 Prisma ORM 连接 PostgreSQL
          数据库，支持 Markdown 写作、分类管理、标签管理等功能。
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          {techs.map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground font-display"
            >
              {tech}
            </span>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          联系方式：
          <a
            href="mailto:admin@example.com"
            className="text-primary font-display"
          >
            admin@example.com
          </a>
        </p>
      </div>
    </div>
  )
}
