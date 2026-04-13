import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      email: 'admin@example.com',
      nickname: '管理员',
      bio: '博客管理员',
      role: 'ADMIN',
    },
  })
  console.log(`Admin user: ${admin.username}`)

  // Create default category
  const defaultCategory = await prisma.category.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: '默认分类',
      slug: 'default',
      description: '默认文章分类',
      order: 0,
    },
  })
  console.log(`Category: ${defaultCategory.name}`)

  // Create sample tags
  const tagNames = ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Prisma']
  const tagRecords = []
  for (const tagName of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { slug: tagName.toLowerCase().replace('.', '').replace(' ', '') },
      update: {},
      create: {
        name: tagName,
        slug: tagName.toLowerCase().replace('.', '').replace(' ', ''),
      },
    })
    tagRecords.push(tag)
  }
  console.log(`Tags: ${tagNames.join(', ')}`)

  // Create sample article
  const nextjsTag = tagRecords.find(t => t.name === 'Next.js')!
  const reactTag = tagRecords.find(t => t.name === 'React')!

  const article = await prisma.article.create({
    data: {
      title: '欢迎来到我的博客',
      slug: 'hello-world',
      content: '# 欢迎来到我的博客\n\n这是第一篇文章。\n\n## 快速开始\n\n这是一个基于 **Next.js** 构建的博客系统。\n\n### 特性\n\n- Markdown 编辑器\n- 文章管理\n- 分类和标签\n- 访问统计\n- 阿里云 OSS 图片上传\n\n```javascript\nconsole.log(\'Hello, World!\')\n```',
      excerpt: '这是第一篇文章，描述了一个基于 Next.js 构建的博客系统。',
      status: 'PUBLISHED',
      isRecommended: true,
      sortOrder: 0,
      seoTitle: '欢迎来到我的博客',
      seoDescription: '基于 Next.js 构建的博客系统，支持 Markdown 编辑、分类标签管理、访问统计等功能。',
      publishedAt: new Date(),
      tags: {
        create: [
          { tagId: nextjsTag.id },
          { tagId: reactTag.id },
        ],
      },
      categories: {
        create: [
          { categoryId: defaultCategory.id },
        ],
      },
    },
  })
  console.log(`Article: ${article.title}`)

  // Create sample friend links
  const friendLinks = [
    { name: 'GitHub', url: 'https://github.com', description: '全球最大的代码托管平台', order: 0 },
    { name: 'Next.js', url: 'https://nextjs.org', description: 'React 全栈框架', order: 1 },
  ]
  for (const link of friendLinks) {
    await prisma.friendLink.create({ data: link })
  }
  console.log(`Friend links: ${friendLinks.map(l => l.name).join(', ')}`)

  // Create default site config
  await prisma.siteConfig.upsert({
    where: { key: 'favicon' },
    update: {},
    create: {
      key: 'favicon',
      value: '',
    },
  })
  console.log('Site config: favicon (empty)')

  console.log('\nSeed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
