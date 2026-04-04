export const dynamic = 'force-dynamic'

export const metadata = {
  title: '关于',
  description: '关于本站',
}

export default function AboutPage() {
  return (
    <div className="max-w-[880px] mx-auto py-10 px-5">
      <h1 className="text-3xl font-bold font-mono text-foreground mb-8">关于</h1>

      <div className="bg-card rounded-[var(--radius-lg)] border border-border p-8 space-y-8">
        <section>
          <h2 className="text-xl font-bold font-mono text-foreground mb-3">关于本站</h2>
          <p className="text-muted-foreground leading-relaxed">
            这是一个基于 Next.js 15 构建的博客系统，使用 TypeScript 和 Tailwind CSS 开发。
            后端采用 Prisma ORM 连接 PostgreSQL 数据库，支持 Markdown 写作、分类管理、标签管理等功能。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-mono text-foreground mb-3">技术栈</h2>
          <ul className="list-none text-muted-foreground space-y-2">
            {['Next.js 15 (App Router)', 'TypeScript', 'Tailwind CSS', 'Prisma ORM', 'PostgreSQL', 'NextAuth.js', 'React Markdown'].map((tech) => (
              <li key={tech} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {tech}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold font-mono text-foreground mb-3">功能特性</h2>
          <ul className="list-none text-muted-foreground space-y-2">
            {['Markdown 文章编辑与渲染', '分类与标签管理', '文章归档', 'SEO 优化（元数据、结构化数据）', '访问统计', '友链管理', '后台管理系统'].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold font-mono text-foreground mb-3">联系方式</h2>
          <p className="text-muted-foreground">
            如有问题或建议，欢迎通过以下方式联系：
          </p>
          <p className="text-primary font-mono mt-2">
            Email: admin@example.com
          </p>
        </section>
      </div>
    </div>
  )
}
