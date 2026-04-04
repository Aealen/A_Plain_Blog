export const dynamic = 'force-dynamic'

export const metadata = {
  title: '关于',
  description: '关于本站',
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">关于</h1>

      <div className="prose prose-lg max-w-none">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">关于本站</h2>
            <p className="text-gray-600 leading-relaxed">
              这是一个基于 Next.js 15 构建的博客系统，使用 TypeScript 和 Tailwind CSS 开发。
              后端采用 Prisma ORM 连接 PostgreSQL 数据库，支持 Markdown 写作、分类管理、标签管理等功能。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">技术栈</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Next.js 15 (App Router)</li>
              <li>TypeScript</li>
              <li>Tailwind CSS</li>
              <li>Prisma ORM</li>
              <li>PostgreSQL</li>
              <li>NextAuth.js</li>
              <li>React Markdown</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">功能特性</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Markdown 文章编辑与渲染</li>
              <li>分类与标签管理</li>
              <li>文章归档</li>
              <li>SEO 优化（元数据、结构化数据）</li>
              <li>访问统计</li>
              <li>友链管理</li>
              <li>后台管理系统</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">联系方式</h2>
            <p className="text-gray-600">
              如有问题或建议，欢迎通过以下方式联系：
            </p>
            <p className="text-gray-600 mt-2">
              Email: <span className="text-blue-600">admin@example.com</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
