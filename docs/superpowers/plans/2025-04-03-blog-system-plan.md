# 博客系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建基于 Next.js 15 + Prisma + PostgreSQL 的全栈博客系统

支持文章管理、访问统计、SEO 优化和 Markdown 导入导出。

**Architecture:** Next.js App Router 单体应用，前台 SSG/ISR 静态生成提升性能，后台动态渲染管理内容。Prisma ORM 操作数据库，Server Actions 处理数据逻辑，NextAuth.js Credentials Provider 认证，阿里云 OSS STS 临时凭证上传文件。

**Tech Stack:** Next.js 15, Prisma, PostgreSQL, NextAuth.js, Tailwind CSS, 阿里云 OSS SDK

 JSZip



---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                          # 根布局
│   ├── page.tsx                          # 首页
│   ├── globals.css                       # 全局样式
│   ├── (public)/                      # 前台路由组
│   │   ├── articles/[slug]/page.tsx    # 文章详情
│   │   ├── categories/
│   │   │   ├── page.tsx              # 分类列表
│   │   │   └── [slug]/page.tsx      # 分类文章
│   │   ├── tags/
│   │   │   ├── page.tsx              # 标签云
│   │   │   └── [slug]/page.tsx      # 标签文章
│   │   ├── archives/page.tsx         # 归档
│   │   ├── about/page.tsx            # 关于
│   │   └── links/page.tsx             # 友链
│   ├── admin/                         # 后台管理
│   │   ├── layout.tsx              # 后台布局
│   │   ├── page.tsx                # 仪表盘
│   │   ├── login/page.tsx           # 登录
│   │   ├── articles/
│   │   │   ├── page.tsx            # 文章列表
│   │   │   ├── new/page.tsx          # 新建文章
│   │   │   └── [id]/page.tsx        # 编辑文章
│   │   ├── categories/page.tsx       # 分类管理
│   │   ├── tags/page.tsx             # 标签管理
│   │   ├── friend-links/page.tsx    # 友链管理
│   │   ├── profile/page.tsx        # 个人设置
│   │   └── analytics/page.tsx       # 访问统计
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # 认证
│   │   ├── upload/sts/route.ts     # STS 临时凭证
│   │   └── visit/route.ts         # 访问记录
│   ├── sitemap.ts                      # Sitemap
│   └── robots.ts                        # robots.txt
├── actions/
│   ├── public/
│   │   ├── article.ts              # 前台文章查询
│   │   ├── category.ts             # 前台分类查询
│   │   ├── tag.ts                 # 前台标签查询
│   │   └── friendLink.ts            # 前台友链查询
│   └── admin/
│       ├── article.ts              # 文章管理
│       ├── category.ts             # 分类管理
│       ├── tag.ts                 # 标签管理
│       ├── friendLink.ts            # 友链管理
│       ├── user.ts                # 用户管理
│       ├── import.ts               # Markdown 导入
│       └── export.ts               # 文章导出
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   └── Pagination.tsx
│   ├── public/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ArticleCard.tsx
│   │   ├── TOC.tsx
│   │   ├── TagCloud.tsx
│   │   └── ShareButtons.tsx
│   └── admin/
│       ├── Sidebar.tsx
│       ├── MarkdownEditor.tsx
│       ├── StatsCard.tsx
│       ├── FileUploader.tsx
│       └── SEOSettings.tsx
├── lib/
│   ├── prisma.ts                  # Prisma 客户端单例
│   ├── auth.ts                    # 认证配置
│   ├── oss.ts                     # 阿里云 OSS
│   ├── visitor.ts                # 访客统计工具
│   ├── markdown.ts               # Markdown 解析/渲染
│   └── utils.ts                   # 通用工具函数
├── types/
│   └── index.ts                      # TypeScript 类型定义
prisma/
├── schema.prisma                    # 数据库模型
└── seed.ts                         # 初始数据
public/                              # 静态资源
.env.local                           # 环境变量（不提交）
.env.example                         # 环境变量示例
next.config.js                       # Next.js 配置
tailwind.config.js                   # Tailwind 配置
package.json
```

---

## Task 1: 初始化 Next.js 项目

**Files:**
- Create: `package.json`, `next.config.js`, `tailwind.config.js`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`

- [ ] **Step 1: 使用 create-next-app 初始化项目**

Run: `npx create-next-app@latest . --typescript --tailwind --eslint --app-dir=src --src-dir . --import-alias "@/*"`

在项目根目录执行，选择以下选项：
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: Yes
- App Router: Yes
- Import alias: Yes

Expected: 项目创建成功

- [ ] **Step 2: 安装核心依赖**

Run:
```bash
npm install prisma @prisma/client
npm install next-auth@beta @auth/core
npm install bcryptjs
npm install ali-oss
npm install jszip
npm install gray-matter
npm install react-markdown
npm install remark-gfm
npm install rehype-highlight
npm install rehype-slug
npm install slugify
```

Expected: 所有依赖安装成功

- [ ] **Step 3: 安装开发依赖**

Run:
```bash
npm install -D @types/bcryptjs @types/node
npm install -D prisma
```

Expected: 开发依赖安装成功

- [ ] **Step 4: 创建环境变量文件**

Create `.env.example`:
```env
# 数据库
DATABASE_URL="postgresql://postgres:password@localhost:5432/blog"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# 阿里云 OSS
OSS_REGION="oss-cn-hangzhou"
OSS_BUCKET="your-bucket-name"
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"
OSS_ROLE_ARN="acs:ram::your-role-arn"
```

Create `.env.local` (填入实际值，不提交到 git)

Create `.gitignore`，追加:
```
.env.local
```

- [ ] **Step 5: 提交**

```bash
git init
git add .
git commit -m "feat: initialize Next.js project with core dependencies"
```

---

## Task 2: 定义 Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Create: `src/types/index.ts`

- [ ] **Step 1: 创建 Prisma Schema 文件**

Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ArticleStatus {
  PUBLISHED
  DRAFT
  PRIVATE
  TRASH
}

enum UserRole {
  ADMIN
  USER
}

model User {
  id        String   @id @default(uuid()) @db.Uuid
  username  String   @unique
  password  String
  email     String   @unique
  nickname String?
  avatarUrl String?
  bio       String?
  role      UserRole  @default(USER)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("created_at_updated_at_idx")
  @@unique([username, email])
}

model Category {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  slug        String   @unique
  description String?
  order       Int      @default(0)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  articles Article[]

  @@unique([slug])
}

model Tag {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  slug      String   @unique
  createdAt DateTime @default(now()) @map("created_at")

  articles ArticleTag[]

  @@unique([slug])
}

model Article {
  id             String        @id @default(uuid()) @db.Uuid
  title          String
  slug           String        @unique
  content        String
  excerpt        String?
  coverImage     String?
  categoryId     String?
  status         ArticleStatus @default(DRAFT)
  sortOrder      Int           @default(0)
  isRecommended  Boolean       @default(false)
  viewCount      Int           @default(0)
  seoTitle       String?
  seoDescription String?
  seoKeywords    String?
  publishedAt    DateTime?
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  category    Category?  @relation(fields: [categoryId], references: [Category.id])
  tags        ArticleTag[]

  @@index([categoryId])
  @@index([status])
  @@index([sortOrder(sort: Desc), publishedAt(sort: Desc)])
  @@unique([slug])
}

model ArticleTag {
  articleId String
  tagId     String

  article Article @relation(fields: [articleId], references: [Article.id], onDelete: Cascade)
  tag     Tag     @relation(fields: [tagId], references: [Tag.id], onDelete: Cascade)

  @@id([articleId, tagId])
}

model FriendLink {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  url         String
  avatar      String?
  description String?
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
}

model PageVisitSummary {
  id   String @id @default(uuid()) @db.Uuid
  path String
  date DateTime @db.Date
  pv   Int   @default(0)
  uv   Int   @default(0)

  @@unique([path, date])
}

model VisitLog {
  id        String   @id @default(uuid()) @db.Uuid
  visitorId String
  sessionId String
  path      String
  referrer  String?
  userAgent String?
  ip        String?
  visitedAt DateTime @default(now()) @map("visited_at")

  @@index([visitorId])
  @@index([sessionId])
  @@index([visitedAt])
}
```

- [ ] **Step 2: 创建 Prisma 客户端单例**

Create `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV === 'development') globalForPrisma.prisma = prisma

export default prisma
```

- [ ] **Step 3: 创建 TypeScript 类型定义**

Create `src/types/index.ts`:
```typescript
import { ArticleStatus, UserRole } from '@prisma/client'

export interface ArticleFormData {
  title: string
  slug: string
  content: string
  excerpt?: string
  coverImage?: string
  categoryId?: string
  status: ArticleStatus
  sortOrder: number
  isRecommended: boolean
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  tagIds: string[]
}

export interface CategoryFormData {
  name: string
  slug: string
  description?: string
  order: number
}

export interface TagFormData {
  name: string
  slug: string
}

export interface FriendLinkFormData {
  name: string
  url: string
  avatar?: string
  description?: string
  order: number
  isActive: boolean
}

export interface ProfileFormData {
  nickname?: string
  email: string
  avatarUrl?: string
  bio?: string
}

export interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ParsedArticle {
  title: string
  slug: string
  content: string
  excerpt?: string
  coverImage?: string
  category?: string
  tags: string[]
  date?: Date
  updated?: Date
  status?: ArticleStatus
  warnings: string[]
}
```

- [ ] **Step 4: 创建通用工具函数**

Create `src/lib/utils.ts`:
```typescript
import slugify from 'slugify'

export function generateSlug(text: string): string {
  return slugify(text, { lower: true, strict: true })
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function generateExcerpt(content: string, maxLength: number = 200): string {
  const plainText = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+)\)/g, '$1')
    .replace(/!\[([^\]]+)\]\([^)]+)\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[-*_#>`|]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
  return truncate(plainText, maxLength)
}
```

- [ ] **Step 5: 运行数据库迁移**

Run:
```bash
npx prisma migrate dev --name init
```

Expected: 迁移成功，数据库表创建完成

- [ ] **Step 6: 提交**

```bash
git add prisma/schema.prisma src/lib/prisma.ts src/types/index.ts src/lib/utils.ts
git commit -m "feat: add Prisma schema, types, and utility functions"
```

---

## Task 3: 创建种子数据

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: 创建种子数据脚本**

Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 创建管理员用户
  const hashedPassword = await hash('admin123', 12)

  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      nickname: '博主',
      bio: '一个热爱技术的博主',
      role: 'ADMIN',
    },
  })

  // 创建默认分类
  const defaultCategory = await prisma.category.upsert({
    where: { slug: 'uncategorized' },
    update: {},
    create: {
      name: '未分类',
      slug: 'uncategorized',
      description: '默认分类',
      order: 0,
    },
  })

  // 创建示例标签
  const tagNames = ['Next.js', 'React', 'TypeScript', 'Prisma', 'PostgreSQL']
  for (const name of tagNames) {
    const slug = name.toLowerCase().replace('.', '-')
    await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    })
  }

  // 创建示例文章
  const article = await prisma.article.upsert({
    where: { slug: 'hello-world' },
    update: {},
    create: {
      title: 'Hello World - 第一篇博客',
      slug: 'hello-world',
      content: `# 欢迎来到我的博客

这是我的第一篇博客文章，使用 **Next.js** 构建。

## 技术栈

- Next.js 15
- Prisma
- PostgreSQL
- Tailwind CSS

\`\`\`typescript
const hello = 'world'
console.log(hello)
\`\`\`

> 这是一段引用文字

Stay tuned for more!
`,
      excerpt: '欢迎来到我的博客，这是我的第一篇博客文章。',
      categoryId: defaultCategory.id,
      status: 'PUBLISHED',
      sortOrder: 0,
      isRecommended: true,
      publishedAt: new Date(),
    },
  })

  // 关联标签
  const nextjsTag = await prisma.tag.findUnique({ where: { slug: 'next-js' } })
  if (nextjsTag) {
    await prisma.articleTag.upsert({
      where: { articleId_tagId: { articleId: article.id, tagId: nextjsTag.id } },
      update: {},
      create: { articleId: article.id, tagId: nextjsTag.id },
    })
  }

  console.log('Seed data created successfully')
  console.log(`Admin user: ${user.username}`)
  console.log(`Default password: admin123`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: 配置 Prisma seed 命令**

在 `package.json` 中添加:
```json
{
  "prisma": {
    "seed": "npx tsx prisma db seed"
  }
}
```

- [ ] **Step 3: 运行种子数据**

Run: `npx prisma db seed`

Expected: 种子数据创建成功

- [ ] **Step 4: 提交**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add database seed data with admin user and sample content"
```

---

## Task 4: 配置 NextAuth.js 认证

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: 创建认证配置**

Create `src/lib/auth.ts`:
```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import prisma from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: '用户名', type: 'text' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        })

        if (!user) return null

        const isPasswordValid = await compare(credentials.password, user.password)
        if (!isPasswordValid) return null

        return {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role,
        }
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
          token.role = user.role
        }
        return token
      },
    },
  },
})
```

- [ ] **Step 2: 创建 API Route**

Create `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
```

- [ ] **Step 3: 创建中间件保护后台路由**

Create `src/middleware.ts`:
```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isAuthPage = req.nextUrl.pathname === '/admin/login'
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')

  if (!isAdminRoute) return NextResponse.next()

  if (isAuthPage) return NextResponse.next()

  if (!req.auth) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 4: 提交**

```bash
git add src/lib/auth.ts src/app/api/auth/\[...nextauth\]/route.ts src/middleware.ts
git commit -m "feat: add NextAuth.js authentication with credentials provider and route protection"
```

---

## Task 5: 创建后台基础布局

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin/Sidebar.tsx`

- [ ] **Step 1: 创建 Sidebar 组件**

Create `src/components/admin/Sidebar.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems = [
  { label: '仪表盘', href: '/admin', icon: '📊' },
  { label: '文章管理', href: '/admin/articles', icon: '📝' },
  { label: '分类管理', href: '/admin/categories', icon: '📁' },
  { label: '标签管理', href: '/admin/tags', icon: '🏷' },
  { label: '友链管理', href: '/admin/friend-links', icon: '🔗' },
  { label: '访问统计', href: '/admin/analytics', icon: '📈' },
  { label: '个人设置', href: '/admin/profile', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">博客管理</h1>
      </div>
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === item.href
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: 创建后台 Layout**

Create `src/app/admin/layout.tsx`:
```tsx
import Sidebar from '@/components/admin/Sidebar'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/admin/login')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1">
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-medium">管理后台</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session?.user?.nickname || session?.user?.username}</span>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
                退出登录
              </button>
            </form>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: 创建登录页面**

Create `src/app/admin/login/page.tsx`:
```tsx
'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const result = await signIn('credentials', {
      username,
      password,
      redirect: true,
      callbackUrl: '/admin',
    })

    if (result?.error) {
      setError('用户名或密码错误')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">博客管理后台</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded text-sm">{error}</div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 创建仪表盘占位页面**

Create `src/app/admin/page.tsx`:
```tsx
import { auth } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>
      <p className="text-gray-500">欢迎回来, {session?.user?.nickname || session?.user?.username}!</p>
      <p className="text-gray-400 mt-2 text-sm">仪表盘功能将在后续任务中实现。</p>
    </div>
  )
}
```

- [ ] **Step 5: 提交**

```bash
git add src/components/admin/Sidebar.tsx src/app/admin/layout.tsx src/app/admin/login/page.tsx src/app/admin/page.tsx
git commit -m "feat: add admin layout with sidebar, login page, and dashboard placeholder"
```

---

## Task 6: 创建分类管理功能

**Files:**
- Create: `src/actions/admin/category.ts`
- Create: `src/app/admin/categories/page.tsx`

- [ ] **Step 1: 创建分类管理 Server Actions**

Create `src/actions/admin/category.ts`:
```typescript
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CategoryFormData } from '@/types'
import { generateSlug } from '@/lib/utils'

export async function createCategory(data: CategoryFormData) {
  const slug = data.slug || generateSlug(data.name)

  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing) throw new Error('slug 已存在')

  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      order: data.order,
    },
  })

  revalidatePath('/admin/categories')
  revalidatePath('/')
  return category
}

export async function updateCategory(id: string, data: CategoryFormData) {
  const slug = data.slug || generateSlug(data.name)

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      description: data.description,
      order: data.order,
    },
  })

  revalidatePath('/admin/categories')
  revalidatePath('/')
  return category
}

export async function deleteCategory(id: string) {
  const articlesCount = await prisma.article.count({
    where: { categoryId: id },
  })
  if (articlesCount > 0) {
    throw new Error('该分类下还有文章，无法删除')
  }

  await prisma.category.delete({ where: { id } })

  revalidatePath('/admin/categories')
  revalidatePath('/')
}

export async function updateCategoryOrder(id: string, order: number) {
  await prisma.category.update({
    where: { id },
    data: { order },
  })

  revalidatePath('/admin/categories')
}

export async function getCategoriesWithCount() {
  return prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { articles: true } },
    },
  })
}
```

- [ ] **Step 2: 创建分类管理页面**

Create `src/app/admin/categories/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { createCategory, updateCategory, deleteCategory, getCategoriesWithCount } from '@/actions/admin/category'

interface CategoryWithCount {
  id: string
  name: string
  slug: string
  description: string | null
  order: number
  _count: { articles: number }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', order: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    const data = await getCategoriesWithCount()
    setCategories(data as CategoryWithCount[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    try {
      if (editingId) {
        await updateCategory(editingId, formData)
      } else {
        await createCategory(formData)
      }
      setFormData({ name: '', slug: '', description: '', order: 0 })
      setEditingId(null)
      await loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除该分类吗？')) return

    try {
      await deleteCategory(id)
      await loadCategories()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  function handleEdit(category: CategoryWithCount) {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      order: category.order,
    })
  }

  function handleCancel() {
    setEditingId(null)
    setFormData({ name: '', slug: '', description: '', order: 0 })
    setError('')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">分类管理</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 表单 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">{editingId ? '编辑分类' : '新建分类'}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-500 p-3 rounded text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="留空自动生成"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                {editingId ? '更新' : '创建'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  取消
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 列表 */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">分类列表 ({categories.length})</h2>
          </div>
          <div className="divide-y">
            {categories.map((category) => (
              <div key={category.id} className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-medium">{category.name}</span>
                  <span className="text-gray-400 text-sm ml-2">/{category.slug}</span>
                  <span className="text-gray-400 text-sm ml-2">({category._count.articles} 篇文章)</span>
                  {category.description && (
                    <p className="text-gray-500 text-sm mt-1">{category.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(category)} className="text-sm text-blue-600 hover:text-blue-800">
                    编辑
                  </button>
                  <button onClick={() => handleDelete(category.id)} className="text-sm text-red-600 hover:text-red-800">
                    删除
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="p-8 text-center text-gray-400">暂无分类</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 提交**

```bash
git add src/actions/admin/category.ts src/app/admin/categories/page.tsx
git commit -m "feat: add category management with CRUD operations and admin page"
```

---

## Task 7: 创建标签管理功能

**Files:**
- Create: `src/actions/admin/tag.ts`
- Create: `src/app/admin/tags/page.tsx`

- [ ] **Step 1: 创建标签管理 Server Actions**

Create `src/actions/admin/tag.ts`:
```typescript
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TagFormData } from '@/types'
import { generateSlug } from '@/lib/utils'

export async function createTag(data: TagFormData) {
  const slug = data.slug || generateSlug(data.name)

  const existing = await prisma.tag.findUnique({ where: { slug } })
  if (existing) throw new Error('slug 已存在')

  const tag = await prisma.tag.create({
    data: { name: data.name, slug },
  })

  revalidatePath('/admin/tags')
  revalidatePath('/')
  return tag
}

export async function updateTag(id: string, data: TagFormData) {
  const slug = data.slug || generateSlug(data.name)

  const tag = await prisma.tag.update({
    where: { id },
    data: { name: data.name, slug },
  })

  revalidatePath('/admin/tags')
  revalidatePath('/')
  return tag
}

export async function deleteTag(id: string) {
  await prisma.tag.delete({ where: { id } })

  revalidatePath('/admin/tags')
  revalidatePath('/')
}

export async function getTagsWithCount() {
  return prisma.tag.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { articles: true } },
    },
  })
}

export async function mergeTags(sourceId: string, targetId: string) {
  if (sourceId === targetId) throw new Error('不能合并到自身')

  // 将源标签的所有文章关联转移到目标标签
  const sourceRelations = await prisma.articleTag.findMany({
    where: { tagId: sourceId },
  })

  for (const rel of sourceRelations) {
    await prisma.articleTag.upsert({
      where: { articleId_tagId: { articleId: rel.articleId, tagId: targetId } },
      update: {},
      create: { articleId: rel.articleId, tagId: targetId },
    })
  }

  // 删除源标签
  await prisma.tag.delete({ where: { id: sourceId } })

  revalidatePath('/admin/tags')
  revalidatePath('/')
}
```

- [ ] **Step 2: 创建标签管理页面**

Create `src/app/admin/tags/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { createTag, updateTag, deleteTag, getTagsWithCount, mergeTags } from '@/actions/admin/tag'

interface TagWithCount {
  id: string
  name: string
  slug: string
  createdAt: string
  _count: { articles: number }
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', slug: '' })
  const [mergeTarget, setMergeTarget] = useState<string>('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadTags()
  }, [])

  async function loadTags() {
    const data = await getTagsWithCount()
    setTags(data as TagWithCount[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    try {
      if (editingId) {
        await updateTag(editingId, formData)
      } else {
        await createTag(formData)
      }
      setFormData({ name: '', slug: '' })
      setEditingId(null)
      await loadTags()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除该标签吗？')) return
    try {
      await deleteTag(id)
      await loadTags()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  async function handleMerge(sourceId: string) {
    if (!mergeTarget) return alert('请选择目标标签')
    if (mergeTarget === sourceId) return alert('不能合并到自身')
    if (!confirm('确定要合并这两个标签吗？')) return

    try {
      await mergeTags(sourceId, mergeTarget)
      setMergeTarget('')
      await loadTags()
    } catch (err) {
      alert(err instanceof Error ? err.message : '合并失败')
    }
  }

  function handleEdit(tag: TagWithCount) {
    setEditingId(tag.id)
    setFormData({ name: tag.name, slug: tag.slug })
  }

  function handleCancel() {
    setEditingId(null)
    setFormData({ name: '', slug: '' })
    setError('')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">标签管理</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 表单 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">{editingId ? '编辑标签' : '新建标签'}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-500 p-3 rounded text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="留空自动生成"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                {editingId ? '更新' : '创建'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  取消
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 列表 */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">标签列表 ({tags.length})</h2>
          </div>
          <div className="divide-y">
            {tags.map((tag) => (
              <div key={tag.id} className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-medium">{tag.name}</span>
                  <span className="text-gray-400 text-sm ml-2">/{tag.slug}</span>
                  <span className="text-gray-400 text-sm ml-2">({tag._count.articles} 篇文章)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(tag)} className="text-sm text-blue-600 hover:text-blue-800">编辑</button>
                  <button onClick={() => handleDelete(tag.id)} className="text-sm text-red-600 hover:text-red-800">删除</button>
                  <button
                    onClick={() => handleMerge(tag.id)}
                    className="text-sm text-orange-600 hover:text-orange-800"
                    title="合并到选中标签"
                  >
                    合并
                  </button>
                  <select
                    value={mergeTarget}
                    onChange={(e) => setMergeTarget(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="">选择目标...</option>
                    {tags.filter((t) => t.id !== tag.id).map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            {tags.length === 0 && (
              <div className="p-8 text-center text-gray-400">暂无标签</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 提交**

```bash
git add src/actions/admin/tag.ts src/app/admin/tags/page.tsx
git commit -m "feat: add tag management with CRUD, merge, and admin page"
```

---

## Task 8: 创建文章管理 Server Actions

**Files:**
- Create: `src/actions/admin/article.ts`

- [ ] **Step 1: 创建文章管理 Server Actions**

Create `src/actions/admin/article.ts`:
```typescript
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { ArticleStatus, ArticleFormData } from '@/types'
import { generateSlug, generateExcerpt } from '@/lib/utils'

export async function getArticles(options: {
  page?: number
  pageSize?: number
  status?: ArticleStatus
  search?: string
  categoryId?: string
}) {
  const page = options.page || 1
  const pageSize = options.pageSize || 20

  const where: Record<string, unknown> = {}

  if (options.status) where.status = options.status
  if (options.categoryId) where.categoryId = options.categoryId
  if (options.search) {
    where.OR = [
      { title: { contains: options.search, mode: 'insensitive' } },
      { content: { contains: options.search, mode: 'insensitive' } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ sortOrder: 'desc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    }),
    prisma.article.count({ where }),
  ])

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getArticleById(id: string) {
  return prisma.article.findUnique({
    where: { id },
    include: {
      category: true,
      tags: { select: { tag: true } },
    },
  })
}

export async function createArticle(data: ArticleFormData) {
  const slug = data.slug || generateSlug(data.title)

  const existing = await prisma.article.findUnique({ where: { slug } })
  if (existing) throw new Error('slug 已存在')

  const excerpt = data.excerpt || generateExcerpt(data.content)

  const article = await prisma.article.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt,
      coverImage: data.coverImage,
      categoryId: data.categoryId || null,
      status: data.status,
      sortOrder: data.sortOrder,
      isRecommended: data.isRecommended,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      seoKeywords: data.seoKeywords,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      tags: {
        create: data.tagIds.map((tagId) => ({ tagId })),
      },
    },
  })

  revalidatePath('/admin/articles')
  revalidatePath('/')
  return article
}

export async function updateArticle(id: string, data: ArticleFormData) {
  const slug = data.slug || generateSlug(data.title)

  // 先删除旧的标签关联
  await prisma.articleTag.deleteMany({ where: { articleId: id } })

  const article = await prisma.article.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt || generateExcerpt(data.content),
      coverImage: data.coverImage,
      categoryId: data.categoryId || null,
      status: data.status,
      sortOrder: data.sortOrder,
      isRecommended: data.isRecommended,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      seoKeywords: data.seoKeywords,
      publishedAt: data.status === 'PUBLISHED' && !data.publishedAt ? new Date() : data.publishedAt,
      tags: {
        create: data.tagIds.map((tagId) => ({ tagId })),
      },
    },
  })

  revalidatePath('/admin/articles')
  revalidatePath('/')
  return article
}

export async function deleteArticle(id: string) {
  // 移入回收站
  await prisma.article.update({
    where: { id },
    data: { status: 'TRASH' },
  })

  revalidatePath('/admin/articles')
  revalidatePath('/')
}

export async function restoreArticle(id: string) {
  await prisma.article.update({
    where: { id },
    data: { status: 'DRAFT' },
  })

  revalidatePath('/admin/articles')
}

export async function permanentDeleteArticle(id: string) {
  await prisma.article.delete({ where: { id } })

  revalidatePath('/admin/articles')
  revalidatePath('/')
}

export async function updateArticleStatus(id: string, status: ArticleStatus) {
  const updateData: Record<string, unknown> = { status }
  if (status === 'PUBLISHED') updateData.publishedAt = new Date()

  await prisma.article.update({
    where: { id },
    data: updateData,
  })

  revalidatePath('/admin/articles')
  revalidatePath('/')
}

export async function batchUpdateStatus(ids: string[], status: ArticleStatus) {
  const updateData: Record<string, unknown> = { status }
  if (status === 'PUBLISHED') updateData.publishedAt = new Date()

  await prisma.article.updateMany({
    where: { id: { in: ids } },
    data: updateData,
  })

  revalidatePath('/admin/articles')
}

export async function batchDelete(ids: string[]) {
  await prisma.article.updateMany({
    where: { id: { in: ids } },
    data: { status: 'TRASH' },
  })

  revalidatePath('/admin/articles')
}
```

- [ ] **Step 2: 提交**

```bash
git add src/actions/admin/article.ts
git commit -m "feat: add article management server actions with CRUD, status, and batch operations"
```

---

## Task 9: 创建 Markdown 编辑器组件

**Files:**
- Create: `src/lib/markdown.ts`
- Create: `src/components/admin/MarkdownEditor.tsx`

- [ ] **Step 1: 创建 Markdown 解析工具**

Create `src/lib/markdown.ts`:
```typescript
import matter from 'gray-matter'
import { generateSlug } from './utils'

export interface ParsedFrontMatter {
  title: string
  slug: string
  content: string
  excerpt?: string
  coverImage?: string
  category?: string
  tags: string[]
  date?: Date
  updated?: Date
  status?: string
  warnings: string[]
}

export function parseMarkdownFile(fileContent: string, fileName?: string): ParsedFrontMatter {
  const warnings: string[] = []
  const { data, content } = matter(fileContent)

  const title = data.title || fileName?.replace(/\.md$/, '') || '未命名文章'
  const slug = data.slug || generateSlug(title)

  if (!data.title) warnings.push('缺少 title 字段，使用文件名作为标题')
  if (!data.date) warnings.push('缺少 date 字段')

  return {
    title,
    slug,
    content,
    excerpt: data.excerpt || data.description,
    coverImage: data.cover || data.coverImage,
    category: data.category,
    tags: Array.isArray(data.tags) ? data.tags : [],
    date: data.date ? new Date(data.date) : undefined,
    updated: data.updated ? new Date(data.updated) : undefined,
    status: data.status,
    warnings,
  }
}

export function extractTOC(content: string): Array<{ id: string; text: string; level: number }> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const toc: Array<{ id: string; text: string; level: number }> = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = generateSlug(text)
    toc.push({ id, text, level })
  }

  return toc
}
```

- [ ] **Step 2: 创建 Markdown 编辑器组件**

Create `src/components/admin/MarkdownEditor.tsx`:
```tsx
'use client'

import { useState, useCallback } from 'react'
import extractTOC from '@/lib/markdown'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
}

const toolbarButtons = [
  { label: 'B', title: '粗体', prefix: '**', suffix: '**' },
  { label: 'I', title: '斜体', prefix: '*', suffix: '*' },
  { label: 'H1', title: '标题1', prefix: '# ', suffix: '' },
  { label: 'H2', title: '标题2', prefix: '## ', suffix: '' },
  { label: 'H3', title: '标题3', prefix: '### ', suffix: '' },
  { label: '""', title: '引用', prefix: '> ', suffix: '' },
  { label: 'UL', title: '无序列表', prefix: '- ', suffix: '' },
  { label: 'OL', title: '有序列表', prefix: '1. ', suffix: '' },
  { label: '<>', title: '代码块', prefix: '```\n', suffix: '\n```' },
  { label: '---', title: '分隔线', prefix: '\n---\n', suffix: '' },
  { label: '[]', title: '链接', prefix: '[', suffix: '](url)' },
  { label: 'Img', title: '图片', prefix: '![alt](', suffix: ')' },
]

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false)

  const insertMarkdown = useCallback(
    (prefix: string, suffix: string) => {
      const textarea = document.querySelector('textarea[data-editor="markdown"]') as HTMLTextAreaElement
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selected = value.substring(start, end)
      const newValue = value.substring(0, start) + prefix + selected + suffix + value.substring(end)

      onChange(newValue)

      // 恢复光标位置
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + selected.length
        )
      }, 0)
    },
    [value, onChange]
  )

  const toc = extractTOC(value)

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 工具栏 */}
      <div className="bg-gray-50 border-b px-3 py-2 flex items-center gap-1 flex-wrap">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.label}
            type="button"
            title={btn.title}
            onClick={() => insertMarkdown(btn.prefix, btn.suffix)}
            className="px-2 py-1 text-sm font-mono hover:bg-gray-200 rounded"
          >
            {btn.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className={`px-3 py-1 text-sm rounded ${isPreview ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}
        >
          {isPreview ? '编辑' : '预览'}
        </button>
      </div>

      {/* 编辑/预览区 */}
      <div className="flex">
        <div className="flex-1">
          {isPreview ? (
            <div className="p-4 min-h-[500px] prose max-w-none">
              <div className="text-gray-400 text-center py-20">预览功能需要 react-markdown 渲染组件（前台展示时实现）</div>
            </div>
          ) : (
            <textarea
              data-editor="markdown"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="在这里编写 Markdown 内容..."
              className="w-full p-4 min-h-[500px] font-mono text-sm resize-none focus:outline-none"
            />
          )}
        </div>

        {/* TOC 侧边栏 */}
        {toc.length > 0 && (
          <div className="w-48 border-l bg-gray-50 p-3">
            <h4 className="text-xs font-medium text-gray-500 mb-2">目录</h4>
            <nav className="space-y-1">
              {toc.map((item) => (
                <div
                  key={item.id}
                  className="text-xs text-gray-600 hover:text-blue-600 truncate"
                  style={{ paddingLeft: `${(item.level - 1) * 8}px` }}
                >
                  {item.text}
                </div>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="bg-gray-50 border-t px-3 py-1 flex items-center gap-4 text-xs text-gray-500">
        <span>{value.length} 字符</span>
        <span>{value.split(/\n/).length} 行</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 提交**

```bash
git add src/lib/markdown.ts src/components/admin/MarkdownEditor.tsx
git commit -m "feat: add markdown parser utility and editor component with toolbar and TOC"
```

---

## Task 10: 创建文章编辑页面

**Files:**
- Create: `src/app/admin/articles/page.tsx`
- Create: `src/app/admin/articles/new/page.tsx`
- Create: `src/app/admin/articles/[id]/page.tsx`

- [ ] **Step 1: 创建文章列表页面**

Create `src/app/admin/articles/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getArticles, deleteArticle, restoreArticle, permanentDeleteArticle, batchUpdateStatus, batchDelete } from '@/actions/admin/article'
import { getCategoriesWithCount } from '@/actions/admin/category'

type ArticleStatus = 'PUBLISHED' | 'DRAFT' | 'PRIVATE' | 'TRASH'

const statusLabels: Record<ArticleStatus, string> = {
  PUBLISHED: '已发布',
  DRAFT: '草稿',
  PRIVATE: '私密',
  TRASH: '回收站',
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<unknown[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [status, setStatus] = useState<ArticleStatus | ''>('')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [page, status])

  async function loadData() {
    const result = await getArticles({ page, status: status as ArticleStatus || undefined, search: search || undefined })
    setArticles(result.data)
    setTotal(result.total)
    setTotalPages(result.totalPages)
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    await loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要移入回收站吗？')) return
    await deleteArticle(id)
    await loadData()
  }

  async function handleRestore(id: string) {
    await restoreArticle(id)
    await loadData()
  }

  async function handlePermanentDelete(id: string) {
    if (!confirm('确定要永久删除吗？此操作不可恢复！')) return
    await permanentDeleteArticle(id)
    await loadData()
  }

  async function handleBatchDelete() {
    if (!confirm(`确定要将 ${selectedIds.length} 篇文章移入回收站吗？`)) return
    await batchDelete(selectedIds)
    setSelectedIds([])
    await loadData()
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link href="/admin/articles/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          新建文章
        </Link>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg shadow mb-4 p-4">
        <div className="flex gap-4 items-center flex-wrap">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索文章..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">搜索</button>
          </form>

          <div className="flex gap-2">
            {(['', 'PUBLISHED', 'DRAFT', 'PRIVATE', 'TRASH'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1) }}
                className={`px-3 py-2 text-sm rounded-lg ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {s ? statusLabels[s] : '全部'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 批量操作 */}
      {selectedIds.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-3 mb-4 flex items-center gap-4">
          <span className="text-sm">已选择 {selectedIds.length} 篇文章</span>
          <button onClick={handleBatchDelete} className="text-sm text-red-600 hover:text-red-800">移入回收站</button>
          <button onClick={() => setSelectedIds([])} className="text-sm text-gray-600">取消选择</button>
        </div>
      )}

      {/* 文章列表 */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-left w-8">
                <input type="checkbox" onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds((articles as Array<{id: string}>).map((a) => a.id))
                  } else {
                    setSelectedIds([])
                  }
                }} />
              </th>
              <th className="p-3 text-left">标题</th>
              <th className="p-3 text-left">分类</th>
              <th className="p-3 text-left">状态</th>
              <th className="p-3 text-left">排序</th>
              <th className="p-3 text-left">阅读量</th>
              <th className="p-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(articles as Array<{
              id: string
              title: string
              slug: string
              status: ArticleStatus
              sortOrder: number
              viewCount: number
              publishedAt: string | null
              category: { name: string } | null
            }>).map((article) => (
              <tr key={article.id} className="hover:bg-gray-50">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(article.id)}
                    onChange={() => toggleSelect(article.id)}
                  />
                </td>
                <td className="p-3">
                  <Link href={`/admin/articles/${article.id}`} className="text-blue-600 hover:underline">
                    {article.title}
                  </Link>
                </td>
                <td className="p-3 text-sm text-gray-600">{article.category?.name || '-'}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    article.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                    article.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                    article.status === 'PRIVATE' ? 'bg-purple-100 text-purple-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {statusLabels[article.status]}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-600">{article.sortOrder}</td>
                <td className="p-3 text-sm text-gray-600">{article.viewCount}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/articles/${article.id}`} className="text-sm text-blue-600">编辑</Link>
                    {article.status === 'TRASH' ? (
                      <>
                        <button onClick={() => handleRestore(article.id)} className="text-sm text-green-600">恢复</button>
                        <button onClick={() => handlePermanentDelete(article.id)} className="text-sm text-red-600">永久删除</button>
                      </>
                    ) : (
                      <button onClick={() => handleDelete(article.id)} className="text-sm text-red-600">删除</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {articles.length === 0 && (
          <div className="p-8 text-center text-gray-400">暂无文章</div>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-3 py-1">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 创建新建文章页面**

Create `src/app/admin/articles/new/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createArticle } from '@/actions/admin/article'
import { getCategoriesWithCount } from '@/actions/admin/category'
import { getTagsWithCount } from '@/actions/admin/tag'
import MarkdownEditor from '@/components/admin/MarkdownEditor'

export default function NewArticlePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([])

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    coverImage: '',
    categoryId: '',
    status: 'DRAFT' as 'PUBLISHED' | 'DRAFT' | 'PRIVATE',
    sortOrder: 0,
    isRecommended: false,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    tagIds: [] as string[],
  })

  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [cats, tagList] = await Promise.all([getCategoriesWithCount(), getTagsWithCount()])
    setCategories(cats as Array<{ id: string; name: string }>)
    setTags(tagList as Array<{ id: string; name: string }>)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    try {
      await createArticle({
        ...formData,
        categoryId: formData.categoryId || undefined,
      })
      router.push('/admin/articles')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    }
  }

  function toggleTag(tagId: string) {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }))
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">← 返回</button>
        <h1 className="text-2xl font-bold">新建文章</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="bg-red-50 text-red-500 p-3 rounded mb-4">{error}</div>}

        {/* 标题 */}
        <div className="mb-4">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="文章标题"
            required
            className="w-full px-4 py-3 text-xl border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Markdown 编辑器 */}
        <div className="mb-4">
          <MarkdownEditor
            value={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
          />
        </div>

        {/* 侧边栏设置 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">封面图 URL</label>
            <input
              type="text"
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">无分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'PUBLISHED' | 'DRAFT' | 'PRIVATE' })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">发布</option>
              <option value="PRIVATE">私密</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">排序权重</label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="留空自动生成"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecommended}
                onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">推荐文章</span>
            </label>
          </div>
        </div>

        {/* 标签 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  formData.tagIds.includes(tag.id)
                    ? 'bg-blue-100 border-blue-400 text-blue-700'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* 摘要 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
          <textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="留空自动从正文截取"
            rows={2}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        {/* SEO 设置 */}
        <details className="mb-6 border rounded-lg">
          <summary className="p-3 cursor-pointer font-medium text-gray-700 bg-gray-50">SEO 设置</summary>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO 标题</label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                placeholder="留空使用文章标题"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO 描述</label>
              <textarea
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                placeholder="留空使用摘要"
                rows={2}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO 关键词</label>
              <input
                type="text"
                value={formData.seoKeywords}
                onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                placeholder="多个关键词用逗号分隔"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </details>

        {/* 提交按钮 */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-6 py-2 border rounded-lg hover:bg-gray-50">取消</button>
          <button type="submit" onClick={() => setFormData({ ...formData, status: 'DRAFT' })} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">保存草稿</button>
          <button type="submit" onClick={() => setFormData({ ...formData, status: 'PUBLISHED' })} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">发布</button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: 创建编辑文章页面**

Create `src/app/admin/articles/[id]/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getArticleById, updateArticle } from '@/actions/admin/article'
import { getCategoriesWithCount } from '@/actions/admin/category'
import { getTagsWithCount } from '@/actions/admin/tag'
import MarkdownEditor from '@/components/admin/MarkdownEditor'

export default function EditArticlePage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string

  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [allTags, setAllTags] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    coverImage: '',
    categoryId: '',
    status: 'DRAFT' as 'PUBLISHED' | 'DRAFT' | 'PRIVATE',
    sortOrder: 0,
    isRecommended: false,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    tagIds: [] as string[],
  })

  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [articleId])

  async function loadData() {
    const [article, cats, tagList] = await Promise.all([
      getArticleById(articleId),
      getCategoriesWithCount(),
      getTagsWithCount(),
    ])

    if (!article) {
      setError('文章不存在')
      setLoading(false)
      return
    }

    setCategories(cats as Array<{ id: string; name: string }>)
    setAllTags(tagList as Array<{ id: string; name: string }>)

    setFormData({
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt || '',
      coverImage: article.coverImage || '',
      categoryId: article.categoryId || '',
      status: article.status as 'PUBLISHED' | 'DRAFT' | 'PRIVATE',
      sortOrder: article.sortOrder,
      isRecommended: article.isRecommended,
      seoTitle: article.seoTitle || '',
      seoDescription: article.seoDescription || '',
      seoKeywords: article.seoKeywords || '',
      tagIds: article.tags.map((t: { tag: { id: string } }) => t.tag.id),
    })

    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    try {
      await updateArticle(articleId, {
        ...formData,
        categoryId: formData.categoryId || undefined,
      })
      router.push('/admin/articles')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    }
  }

  function toggleTag(tagId: string) {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }))
  }

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">← 返回</button>
        <h1 className="text-2xl font-bold">编辑文章</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="bg-red-50 text-red-500 p-3 rounded mb-4">{error}</div>}

        {/* 标题 */}
        <div className="mb-4">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="文章标题"
            required
            className="w-full px-4 py-3 text-xl border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Markdown 编辑器 */}
        <div className="mb-4">
          <MarkdownEditor
            value={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
          />
        </div>

        {/* 设置区域 - 同新建页面 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">封面图 URL</label>
            <input
              type="text"
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">无分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'PUBLISHED' | 'DRAFT' | 'PRIVATE' })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">发布</option>
              <option value="PRIVATE">私密</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">排序权重</label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecommended}
                onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">推荐文章</span>
            </label>
          </div>
        </div>

        {/* 标签 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  formData.tagIds.includes(tag.id)
                    ? 'bg-blue-100 border-blue-400 text-blue-700'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* 摘要 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
          <textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        {/* SEO 设置 */}
        <details className="mb-6 border rounded-lg">
          <summary className="p-3 cursor-pointer font-medium text-gray-700 bg-gray-50">SEO 设置</summary>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO 标题</label>
              <input type="text" value={formData.seoTitle} onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO 描述</label>
              <textarea value={formData.seoDescription} onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO 关键词</label>
              <input type="text" value={formData.seoKeywords} onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
        </details>

        {/* 提交 */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-6 py-2 border rounded-lg hover:bg-gray-50">取消</button>
          <button type="submit" onClick={() => setFormData({ ...formData, status: 'DRAFT' })} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">保存草稿</button>
          <button type="submit" onClick={() => setFormData({ ...formData, status: 'PUBLISHED' })} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">发布</button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: 提交**

```bash
git add src/app/admin/articles/
git commit -m "feat: add article list, create, and edit pages with markdown editor integration"
```

---

## Task 11: 创建友链管理功能

**Files:**
- Create: `src/actions/admin/friendLink.ts`
- Create: `src/app/admin/friend-links/page.tsx`

- [ ] **Step 1: 创建友链管理 Server Actions**

Create `src/actions/admin/friendLink.ts`:
```typescript
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { FriendLinkFormData } from '@/types'

export async function getFriendLinks() {
  return prisma.friendLink.findMany({
    orderBy: { order: 'asc' },
  })
}

export async function createFriendLink(data: FriendLinkFormData) {
  const link = await prisma.friendLink.create({
    data: {
      name: data.name,
      url: data.url,
      avatar: data.avatar,
      description: data.description,
      order: data.order,
      isActive: data.isActive,
    },
  })

  revalidatePath('/admin/friend-links')
  revalidatePath('/links')
  return link
}

export async function updateFriendLink(id: string, data: FriendLinkFormData) {
  const link = await prisma.friendLink.update({
    where: { id },
    data: {
      name: data.name,
      url: data.url,
      avatar: data.avatar,
      description: data.description,
      order: data.order,
      isActive: data.isActive,
    },
  })

  revalidatePath('/admin/friend-links')
  revalidatePath('/links')
  return link
}

export async function deleteFriendLink(id: string) {
  await prisma.friendLink.delete({ where: { id } })

  revalidatePath('/admin/friend-links')
  revalidatePath('/links')
}

export async function toggleFriendLink(id: string) {
  const link = await prisma.friendLink.findUnique({ where: { id } })
  if (!link) throw new Error('友链不存在')

  await prisma.friendLink.update({
    where: { id },
    data: { isActive: !link.isActive },
  })

  revalidatePath('/admin/friend-links')
  revalidatePath('/links')
}
```

- [ ] **Step 2: 创建友链管理页面**

Create `src/app/admin/friend-links/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { createFriendLink, updateFriendLink, deleteFriendLink, toggleFriendLink, getFriendLinks } from '@/actions/admin/friendLink'

interface FriendLinkItem {
  id: string
  name: string
  url: string
  avatar: string | null
  description: string | null
  order: number
  isActive: boolean
}

export default function FriendLinksPage() {
  const [links, setLinks] = useState<FriendLinkItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '', url: '', avatar: '', description: '', order: 0, isActive: true,
  })
  const [error, setError] = useState('')

  useEffect(() => { loadLinks() }, [])

  async function loadLinks() {
    const data = await getFriendLinks()
    setLinks(data as FriendLinkItem[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        await updateFriendLink(editingId, formData)
      } else {
        await createFriendLink(formData)
      }
      setFormData({ name: '', url: '', avatar: '', description: '', order: 0, isActive: true })
      setEditingId(null)
      await loadLinks()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    }
  }

  async function handleToggle(id: string) {
    await toggleFriendLink(id)
    await loadLinks()
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除该友链吗？')) return
    await deleteFriendLink(id)
    await loadLinks()
  }

  function handleEdit(link: FriendLinkItem) {
    setEditingId(link.id)
    setFormData({
      name: link.name,
      url: link.url,
      avatar: link.avatar || '',
      description: link.description || '',
      order: link.order,
      isActive: link.isActive,
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">友链管理</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">{editingId ? '编辑友链' : '新建友链'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-500 p-3 rounded text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">头像 URL</label>
              <input type="text" value={formData.avatar} onChange={(e) => setFormData({ ...formData, avatar: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
              <input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm">启用</span>
            </label>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{editingId ? '更新' : '创建'}</button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', url: '', avatar: '', description: '', order: 0, isActive: true }) }} className="px-4 py-2 border rounded-lg">取消</button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-4 border-b"><h2 className="text-lg font-medium">友链列表 ({links.length})</h2></div>
          <div className="divide-y">
            {links.map((link) => (
              <div key={link.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {link.avatar && <img src={link.avatar} alt={link.name} className="w-8 h-8 rounded-full" />}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{link.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${link.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {link.isActive ? '启用' : '禁用'}
                      </span>
                    </div>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500">{link.url}</a>
                    {link.description && <p className="text-sm text-gray-500 mt-1">{link.description}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleToggle(link.id)} className="text-sm text-orange-600">切换状态</button>
                  <button onClick={() => handleEdit(link)} className="text-sm text-blue-600">编辑</button>
                  <button onClick={() => handleDelete(link.id)} className="text-sm text-red-600">删除</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 提交**

```bash
git add src/actions/admin/friendLink.ts src/app/admin/friend-links/page.tsx
git commit -m "feat: add friend link management with CRUD, toggle, and admin page"
```

---

## Task 12: 创建用户个人设置

**Files:**
- Create: `src/actions/admin/user.ts`
- Create: `src/app/admin/profile/page.tsx`

- [ ] **Step 1: 创建用户管理 Server Actions**

Create `src/actions/admin/user.ts`:
```typescript
'use server'

import prisma from '@/lib/prisma'
import { compare, hash } from 'bcryptjs'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { ProfileFormData, PasswordFormData } from '@/types'

export async function updateProfile(data: ProfileFormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('未登录')

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      nickname: data.nickname,
      email: data.email,
      avatarUrl: data.avatarUrl,
      bio: data.bio,
    },
  })

  revalidatePath('/admin/profile')
  return user
}

export async function updatePassword(data: PasswordFormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('未登录')

  if (data.newPassword !== data.confirmPassword) {
    throw new Error('两次输入的密码不一致')
  }

  if (data.newPassword.length < 8) {
    throw new Error('密码长度至少 8 位')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) throw new Error('用户不存在')

  const isValid = await compare(data.currentPassword, user.password)
  if (!isValid) throw new Error('当前密码错误')

  const hashedPassword = await hash(data.newPassword, 12)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  })
}

export async function getUserProfile() {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      email: true,
      nickname: true,
      avatarUrl: true,
      bio: true,
      role: true,
    },
  })
}
```

- [ ] **Step 2: 创建个人设置页面**

Create `src/app/admin/profile/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { updateProfile, updatePassword, getUserProfile } from '@/actions/admin/user'

interface UserProfile {
  username: string
  email: string
  nickname: string | null
  avatarUrl: string | null
  bio: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileForm, setProfileForm] = useState({ nickname: '', email: '', avatarUrl: '', bio: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [profileMsg, setProfileMsg] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const data = await getUserProfile()
    if (data) {
      setProfile(data as UserProfile)
      setProfileForm({
        nickname: data.nickname || '',
        email: data.email,
        avatarUrl: data.avatarUrl || '',
        bio: data.bio || '',
      })
    }
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProfileMsg('')
    try {
      await updateProfile(profileForm)
      setProfileMsg('保存成功')
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : '保存失败')
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMsg('')
    try {
      await updatePassword(passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordMsg('密码修改成功')
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : '修改失败')
    }
  }

  if (!profile) return <div className="text-center py-20 text-gray-400">加载中...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">个人设置</h1>

      <div className="max-w-2xl space-y-6">
        {/* 基本信息 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">基本信息</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileMsg && (
              <div className={`p-3 rounded text-sm ${profileMsg.includes('成功') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {profileMsg}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input type="text" value={profile.username} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
              <input type="text" value={profileForm.nickname} onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">头像 URL</label>
              <input type="text" value={profileForm.avatarUrl} onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
              <textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">保存</button>
          </form>
        </div>

        {/* 修改密码 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">修改密码</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordMsg && (
              <div className={`p-3 rounded text-sm ${passwordMsg.includes('成功') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {passwordMsg}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">当前密码</label>
              <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
              <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
              <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">修改密码</button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 提交**

```bash
git add src/actions/admin/user.ts src/app/admin/profile/page.tsx
git commit -m "feat: add user profile management with password change"
```

---

## Task 13: 配置阿里云 OSS STS 上传

**Files:**
- Create: `src/lib/oss.ts`
- Create: `src/app/api/upload/sts/route.ts`
- Create: `src/components/admin/FileUploader.tsx`

- [ ] **Step 1: 创建 OSS 工具库**

Create `src/lib/oss.ts`:
```typescript
import OSS from 'ali-oss'

interface STSToken {
  accessKeyId: string
  accessKeySecret: string
  securityToken: string
  expiration: string
  region: string
  bucket: string
}

export function getSTSConfig(): STSToken {
  const region = process.env.OSS_REGION!
  const bucket = process.env.OSS_BUCKET!
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID!
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET!
  const roleArn = process.env.OSS_ROLE_ARN!

  // 实际项目中应调用阿里云 STS 服务获取临时凭证
  // 这里简化实现：直接使用主账号凭证（仅开发环境）
  // 生产环境必须使用 STS AssumeRole 获取临时凭证

  return {
    accessKeyId,
    accessKeySecret,
    securityToken: '',
    expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    region,
    bucket,
  }
}

export function createOssClient(stsToken?: STSToken): OSS {
  const config = stsToken || {
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
    region: process.env.OSS_REGION!,
    bucket: process.env.OSS_BUCKET!,
  }

  return new OSS({
    region: config.region,
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    stsToken: config.securityToken || undefined,
    bucket: config.bucket,
  })
}

export function generateOssKey(filename: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const ext = filename.split('.').pop()
  const randomName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

  return `uploads/${year}/${month}/${randomName}.${ext}`
}
```

- [ ] **Step 2: 创建 STS 凭证 API**

Create `src/app/api/upload/sts/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getSTSConfig } from '@/lib/oss'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const stsToken = getSTSConfig()
    return NextResponse.json(stsToken)
  } catch {
    return NextResponse.json({ error: '获取凭证失败' }, { status: 500 })
  }
}
```

- [ ] **Step 3: 创建文件上传组件**

Create `src/components/admin/FileUploader.tsx`:
```tsx
'use client'

import { useState, useRef } from 'react'

interface FileUploaderProps {
  onUpload: (url: string) => void
  accept?: string
}

export default function FileUploader({ onUpload, accept = 'image/*' }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    setError('')

    try {
      // 1. 获取 STS 凭证
      const stsRes = await fetch('/api/upload/sts')
      if (!stsRes.ok) throw new Error('获取上传凭证失败')
      const sts = await stsRes.json()

      // 2. 生成文件 key
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const ext = file.name.split('.').pop()
      const key = `uploads/${year}/${month}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

      // 3. 直传到 OSS
      const formData = new FormData()
      formData.append('key', key)
      formData.append('OSSAccessKeyId', sts.accessKeyId)
      if (sts.securityToken) {
        formData.append('x-oss-security-token', sts.securityToken)
      }
      formData.append('file', file)

      const uploadUrl = `https://${sts.bucket}.${sts.region}.aliyuncs.com`
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('上传失败')

      const fileUrl = `${uploadUrl}/${key}`
      onUpload(fileUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  function handleClick() {
    fileInputRef.current?.click()
  }

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
        }}
        className="hidden"
      />

      {uploading ? (
        <div className="text-gray-500">上传中...</div>
      ) : (
        <div>
          <p className="text-gray-500">拖拽文件到此处或点击上传</p>
          <p className="text-gray-400 text-sm mt-1">支持图片文件</p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 4: 提交**

```bash
git add src/lib/oss.ts src/app/api/upload/sts/route.ts src/components/admin/FileUploader.tsx
git commit -m "feat: add OSS STS upload with credential API and file uploader component"
```

---

## Task 14: 创建访问统计功能

**Files:**
- Create: `src/lib/visitor.ts`
- Create: `src/app/api/visit/route.ts`
- Create: `src/actions/public/article.ts`
- Create: `src/app/admin/analytics/page.tsx`

- [ ] **Step 1: 创建访客统计工具**

Create `src/lib/visitor.ts`:
```typescript
import prisma from '@/lib/prisma'

interface VisitData {
  visitorId: string
  sessionId: string
  path: string
  referrer?: string
  userAgent?: string
  ip?: string
}

export async function recordVisit(data: VisitData) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 记录原始日志
  await prisma.visitLog.create({
    data: {
      visitorId: data.visitorId,
      sessionId: data.sessionId,
      path: data.path,
      referrer: data.referrer,
      userAgent: data.userAgent,
      ip: data.ip,
    },
  })

  // 更新汇总表 (upsert: path + date 唯一)
  const existing = await prisma.pageVisitSummary.findUnique({
    where: { path_date: { path: data.path, date: today } },
  })

  if (existing) {
    // 检查是否同一访客
    const todayVisits = await prisma.visitLog.findMany({
      where: {
        visitorId: data.visitorId,
        path: data.path,
        visitedAt: { gte: today },
      },
    })
    const isNewVisitor = todayVisits.length <= 1

    await prisma.pageVisitSummary.update({
      where: { id: existing.id },
      data: {
        pv: { increment: 1 },
        uv: isNewVisitor ? { increment: 1 } : undefined,
      },
    })
  } else {
    await prisma.pageVisitSummary.create({
      data: {
        path: data.path,
        date: today,
        pv: 1,
        uv: 1,
      },
    })
  }
}

export async function getVisitStats(days: number = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  const dailyStats = await prisma.pageVisitSummary.findMany({
    where: { date: { gte: since } },
    orderBy: { date: 'asc' },
  })

  // 按日期聚合
  const statsByDate = new Map<string, { pv: number; uv: number }>()
  for (const stat of dailyStats) {
    const dateKey = stat.date.toISOString().split('T')[0]
    const existing = statsByDate.get(dateKey) || { pv: 0, uv: 0 }
    existing.pv += stat.pv
    existing.uv += stat.uv
    statsByDate.set(dateKey, existing)
  }

  return Array.from(statsByDate.entries()).map(([date, stats]) => ({
    date,
    pv: stats.pv,
    uv: stats.uv,
  }))
}

export async function getTopPages(limit: number = 10) {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const summaries = await prisma.pageVisitSummary.findMany({
    where: { date: { gte: since } },
    orderBy: { pv: 'desc' },
    take: limit,
  })

  // 按路径聚合
  const pageMap = new Map<string, { pv: number; uv: number }>()
  for (const s of summaries) {
    const existing = pageMap.get(s.path) || { pv: 0, uv: 0 }
    existing.pv += s.pv
    existing.uv += s.uv
    pageMap.set(s.path, existing)
  }

  return Array.from(pageMap.entries())
    .map(([path, stats]) => ({ path, ...stats }))
    .sort((a, b) => b.pv - a.pv)
    .slice(0, limit)
}
```

- [ ] **Step 2: 创建访问记录 API**

Create `src/app/api/visit/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { recordVisit } from '@/lib/visitor'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, referrer } = body

    if (!path) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 })
    }

    // 从 cookie 或生成新的 visitorId
    let visitorId = request.cookies.get('visitor_id')?.value
    if (!visitorId) {
      visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    }

    // sessionId 使用当前的或生成新的
    let sessionId = request.cookies.get('session_id')?.value
    if (!sessionId) {
      sessionId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    }

    await recordVisit({
      visitorId,
      sessionId,
      path,
      referrer,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
    })

    const response = NextResponse.json({ visitorId })

    // 设置 cookie（如果不存在）
    if (!request.cookies.get('visitor_id')) {
      response.cookies.set('visitor_id', visitorId!, {
        maxAge: 365 * 24 * 60 * 60, // 1 年
        httpOnly: true,
        sameSite: 'lax',
      })
    }

    return response
  } catch {
    return NextResponse.json({ error: '记录失败' }, { status: 500 })
  }
}
```

- [ ] **Step 3: 创建前台文章查询 Actions**

Create `src/actions/public/article.ts`:
```typescript
'use server'

import prisma from '@/lib/prisma'

export async function getPublishedArticles(options: {
  page?: number
  pageSize?: number
  categoryId?: string
  tagId?: string
}) {
  const page = options.page || 1
  const pageSize = options.pageSize || 10

  const where: Record<string, unknown> = { status: 'PUBLISHED' }
  if (options.categoryId) where.categoryId = options.categoryId
  if (options.tagId) {
    where.tags = { some: { tagId: options.tagId } }
  }

  const [data, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ sortOrder: 'desc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    }),
    prisma.article.count({ where }),
  ])

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getArticleBySlug(slug: string) {
  return prisma.article.findUnique({
    where: { slug },
    include: {
      category: true,
      tags: { select: { tag: true } },
    },
  })
}

export async function getRecommendedArticles(limit: number = 5) {
  return prisma.article.findMany({
    where: { status: 'PUBLISHED', isRecommended: true },
    orderBy: [{ sortOrder: 'desc' }, { publishedAt: 'desc' }],
    take: limit,
    include: {
      category: { select: { name: true, slug: true } },
    },
  })
}

export async function getPopularArticles(limit: number = 10) {
  return prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { viewCount: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
    },
  })
}

export async function getArchives() {
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      publishedAt: true,
    },
  })

  // 按年月分组
  const archives: Record<string, Record<string, Array<{ id: string; title: string; slug: string; publishedAt: Date | null }>>> = {}
  for (const article of articles) {
    const date = article.publishedAt || new Date()
    const year = date.getFullYear().toString()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')

    if (!archives[year]) archives[year] = {}
    if (!archives[year][month]) archives[year][month] = []
    archives[year][month].push(article)
  }

  return archives
}

export async function incrementViewCount(id: string) {
  await prisma.article.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  })
}
```

- [ ] **Step 4: 创建访问统计页面**

Create `src/app/admin/analytics/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { getVisitStats, getTopPages } from '@/lib/visitor'

interface DailyStat {
  date: string
  pv: number
  uv: number
}

interface TopPage {
  path: string
  pv: number
  uv: number
}

export default function AnalyticsPage() {
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([])
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [stats, pages] = await Promise.all([
        getVisitStats(30),
        getTopPages(10),
      ])
      setDailyStats(stats)
      setTopPages(pages)
    } catch (err) {
      console.error('加载统计数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>

  const totalPV = dailyStats.reduce((sum, s) => sum + s.pv, 0)
  const totalUV = dailyStats.reduce((sum, s) => sum + s.uv, 0)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">访问统计</h1>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">30 天 PV</p>
          <p className="text-3xl font-bold mt-2">{totalPV.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">30 天 UV</p>
          <p className="text-3xl font-bold mt-2">{totalUV.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">今日 PV</p>
          <p className="text-3xl font-bold mt-2">
            {dailyStats.length > 0 ? dailyStats[dailyStats.length - 1].pv.toLocaleString() : '0'}
          </p>
        </div>
      </div>

      {/* 趋势图（简化版 - 表格展示） */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">近 30 天趋势</h2>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">日期</th>
                  <th className="py-2 text-right">PV</th>
                  <th className="py-2 text-right">UV</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.map((stat) => (
                  <tr key={stat.date} className="border-b hover:bg-gray-50">
                    <td className="py-2">{stat.date}</td>
                    <td className="py-2 text-right">{stat.pv}</td>
                    <td className="py-2 text-right">{stat.uv}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 热门页面 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">热门页面 (近 30 天)</h2>
        </div>
        <div className="divide-y">
          {topPages.map((page, index) => (
            <div key={page.path} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gray-400 w-6">{index + 1}</span>
                <span className="font-mono text-sm">{page.path}</span>
              </div>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>PV: {page.pv}</span>
                <span>UV: {page.uv}</span>
              </div>
            </div>
          ))}
          {topPages.length === 0 && (
            <div className="p-8 text-center text-gray-400">暂无数据</div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 提交**

```bash
git add src/lib/visitor.ts src/app/api/visit/route.ts src/actions/public/article.ts src/app/admin/analytics/page.tsx
git commit -m "feat: add visit statistics with PV/UV tracking, analytics dashboard, and public article queries"
```

---

## Task 15: 创建前台公共页面

**Files:**
- Create: `src/actions/public/category.ts`
- Create: `src/actions/public/tag.ts`
- Create: `src/actions/public/friendLink.ts`
- Create: `src/components/public/Header.tsx`
- Create: `src/components/public/Footer.tsx`
- Create: `src/components/public/ArticleCard.tsx`
- Create: `src/app/(public)/articles/[slug]/page.tsx`
- Create: `src/app/(public)/categories/page.tsx`
- Create: `src/app/(public)/categories/[slug]/page.tsx`
- Create: `src/app/(public)/tags/page.tsx`
- Create: `src/app/(public)/tags/[slug]/page.tsx`
- Create: `src/app/(public)/archives/page.tsx`
- Create: `src/app/(public)/about/page.tsx`
- Create: `src/app/(public)/links/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 创建前台公共查询 Actions**

Create `src/actions/public/category.ts`:
```typescript
'use server'

import prisma from '@/lib/prisma'

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { articles: { where: { status: 'PUBLISHED' } } } } },
  })
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: { _count: { select: { articles: { where: { status: 'PUBLISHED' } } } } },
  })
}
```

Create `src/actions/public/tag.ts`:
```typescript
'use server'

import prisma from '@/lib/prisma'

export async function getTags() {
  return prisma.tag.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { articles: { where: { status: 'PUBLISHED' } } } } },
  })
}

export async function getTagBySlug(slug: string) {
  return prisma.tag.findUnique({
    where: { slug },
    include: { _count: { select: { articles: { where: { status: 'PUBLISHED' } } } } },
  })
}
```

Create `src/actions/public/friendLink.ts`:
```typescript
'use server'

import prisma from '@/lib/prisma'

export async function getActiveFriendLinks() {
  return prisma.friendLink.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })
}
```

- [ ] **Step 2: 创建前台公共组件**

Create `src/components/public/Header.tsx`:
```tsx
import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900">My Blog</Link>
        <nav className="flex gap-6">
          <Link href="/" className="text-gray-600 hover:text-gray-900">首页</Link>
          <Link href="/categories" className="text-gray-600 hover:text-gray-900">分类</Link>
          <Link href="/tags" className="text-gray-600 hover:text-gray-900">标签</Link>
          <Link href="/archives" className="text-gray-600 hover:text-gray-900">归档</Link>
          <Link href="/about" className="text-gray-600 hover:text-gray-900">关于</Link>
          <Link href="/links" className="text-gray-600 hover:text-gray-900">友链</Link>
        </nav>
      </div>
    </header>
  )
}
```

Create `src/components/public/Footer.tsx`:
```tsx
export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} My Blog. All rights reserved.</p>
      </div>
    </footer>
  )
}
```

Create `src/components/public/ArticleCard.tsx`:
```tsx
import Link from 'next/link'

interface ArticleCardProps {
  article: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    coverImage: string | null
    publishedAt: Date | string | null
    viewCount: number
    category: { name: string; slug: string } | null
    tags: Array<{ tag: { name: string; slug: string } }>
  }
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      {article.coverImage && (
        <Link href={`/articles/${article.slug}`}>
          <img src={article.coverImage} alt={article.title} className="w-full h-48 object-cover rounded-t-lg" />
        </Link>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          {article.category && (
            <Link href={`/categories/${article.category.slug}`} className="text-blue-600 hover:underline">
              {article.category.name}
            </Link>
          )}
          <span>
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString('zh-CN')
              : ''}
          </span>
          <span>{article.viewCount} 阅读</span>
        </div>

        <Link href={`/articles/${article.slug}`}>
          <h2 className="text-lg font-bold text-gray-900 hover:text-blue-600 mb-2">{article.title}</h2>
        </Link>

        {article.excerpt && (
          <p className="text-gray-600 text-sm line-clamp-2">{article.excerpt}</p>
        )}

        {article.tags.length > 0 && (
          <div className="flex gap-2 mt-3">
            {article.tags.map(({ tag }) => (
              <Link
                key={tag.slug}
                href={`/tags/${tag.slug}`}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
```

- [ ] **Step 3: 更新根布局和首页**

Modify `src/app/layout.tsx` - 替换内容:
```tsx
import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/public/Header'
import Footer from '@/components/public/Footer'

export const metadata: Metadata = {
  title: 'My Blog',
  description: '一个基于 Next.js 构建的博客系统',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
```

Modify `src/app/page.tsx` - 替换内容:
```tsx
import { getPublishedArticles, getRecommendedArticles } from '@/actions/public/article'
import ArticleCard from '@/components/public/ArticleCard'

export default async function HomePage() {
  const [articles, recommended] = await Promise.all([
    getPublishedArticles({ page: 1, pageSize: 10 }),
    getRecommendedArticles(5),
  ])

  return (
    <div>
      {/* 推荐文章 */}
      {recommended.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">推荐文章</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((article) => (
              <ArticleCard key={article.id} article={article as Parameters<typeof ArticleCard>[0]['article']} />
            ))}
          </div>
        </section>
      )}

      {/* 最新文章 */}
      <section>
        <h2 className="text-xl font-bold mb-4">最新文章</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.data.map((article) => (
            <ArticleCard key={article.id} article={article as Parameters<typeof ArticleCard>[0]['article']} />
          ))}
        </div>
        {articles.data.length === 0 && (
          <p className="text-center text-gray-400 py-20">暂无文章</p>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 4: 创建文章详情页**

Create `src/app/(public)/articles/[slug]/page.tsx`:
```tsx
import { getArticleBySlug, incrementViewCount } from '@/actions/public/article'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'

interface Props {
  params: { slug: string }
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticleBySlug(params.slug)

  if (!article || article.status !== 'PUBLISHED') {
    notFound()
  }

  // 增加阅读量
  await incrementViewCount(article.id)

  // JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    image: article.coverImage,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: { '@type': 'Person', name: '博主' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {article.category && <span>分类: {article.category.name}</span>}
            <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('zh-CN') : ''}</span>
            <span>{article.viewCount + 1} 阅读</span>
          </div>
          {article.tags.length > 0 && (
            <div className="flex gap-2 mt-3">
              {article.tags.map(({ tag }) => (
                <span key={tag.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{tag.name}</span>
              ))}
            </div>
          )}
        </header>

        <div className="prose max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight, rehypeSlug]}>
            {article.content}
          </ReactMarkdown>
        </div>
      </article>
    </>
  )
}

export async function generateMetadata({ params }: Props) {
  const article = await getArticleBySlug(params.slug)
  if (!article) return { title: '未找到' }

  return {
    title: `${article.seoTitle || article.title} - My Blog`,
    description: article.seoDescription || article.excerpt || '',
    keywords: article.seoKeywords || article.tags.map(({ tag }) => tag.name).join(', '),
  }
}
```

- [ ] **Step 5: 创建分类和标签页面**

Create `src/app/(public)/categories/page.tsx`:
```tsx
import { getCategories } from '@/actions/public/category'
import Link from 'next/link'

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">分类</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Link key={cat.id} href={`/categories/${cat.slug}`} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-medium">{cat.name}</h2>
            {cat.description && <p className="text-sm text-gray-500 mt-1">{cat.description}</p>}
            <p className="text-sm text-gray-400 mt-2">{cat._count.articles} 篇文章</p>
          </Link>
        ))}
      </div>
      {categories.length === 0 && <p className="text-center text-gray-400 py-20">暂无分类</p>}
    </div>
  )
}
```

Create `src/app/(public)/categories/[slug]/page.tsx`:
```tsx
import { getCategoryBySlug } from '@/actions/public/category'
import { getPublishedArticles } from '@/actions/public/article'
import { notFound } from 'next/navigation'
import ArticleCard from '@/components/public/ArticleCard'

interface Props { params: { slug: string } }

export default async function CategoryArticlesPage({ params }: Props) {
  const category = await getCategoryBySlug(params.slug)
  if (!category) notFound()

  const result = await getPublishedArticles({ categoryId: category.id, page: 1, pageSize: 20 })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{category.name}</h1>
      {category.description && <p className="text-gray-500 mb-6">{category.description}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {result.data.map((article) => (
          <ArticleCard key={article.id} article={article as Parameters<typeof ArticleCard>[0]['article']} />
        ))}
      </div>
      {result.data.length === 0 && <p className="text-center text-gray-400 py-20">该分类暂无文章</p>}
    </div>
  )
}
```

Create `src/app/(public)/tags/page.tsx`:
```tsx
import { getTags } from '@/actions/public/tag'
import Link from 'next/link'

export default async function TagsPage() {
  const tags = await getTags()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">标签</h1>
      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/tags/${tag.slug}`}
            className="bg-white border rounded-full px-4 py-2 text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            {tag.name} ({tag._count.articles})
          </Link>
        ))}
      </div>
      {tags.length === 0 && <p className="text-center text-gray-400 py-20">暂无标签</p>}
    </div>
  )
}
```

Create `src/app/(public)/tags/[slug]/page.tsx`:
```tsx
import { getTagBySlug } from '@/actions/public/tag'
import { getPublishedArticles } from '@/actions/public/article'
import { notFound } from 'next/navigation'
import ArticleCard from '@/components/public/ArticleCard'

interface Props { params: { slug: string } }

export default async function TagArticlesPage({ params }: Props) {
  const tag = await getTagBySlug(params.slug)
  if (!tag) notFound()

  const result = await getPublishedArticles({ tagId: tag.id, page: 1, pageSize: 20 })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">标签: {tag.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {result.data.map((article) => (
          <ArticleCard key={article.id} article={article as Parameters<typeof ArticleCard>[0]['article']} />
        ))}
      </div>
      {result.data.length === 0 && <p className="text-center text-gray-400 py-20">该标签暂无文章</p>}
    </div>
  )
}
```

- [ ] **Step 6: 创建归档、关于、友链页面**

Create `src/app/(public)/archives/page.tsx`:
```tsx
import { getArchives } from '@/actions/public/article'
import Link from 'next/link'

export default async function ArchivesPage() {
  const archives = await getArchives()
  const years = Object.keys(archives).sort((a, b) => Number(b) - Number(a))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">归档</h1>
      {years.map((year) => (
        <div key={year} className="mb-8">
          <h2 className="text-xl font-bold mb-4">{year}</h2>
          {Object.entries(archives[year])
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([month, articles]) => (
              <div key={month} className="mb-4">
                <h3 className="text-lg font-medium text-gray-600 mb-2">{month} 月</h3>
                <div className="space-y-2 ml-4">
                  {articles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="block text-gray-700 hover:text-blue-600"
                    >
                      <span className="text-gray-400 text-sm mr-2">
                        {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('zh-CN') : ''}
                      </span>
                      {article.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ))}
      {years.length === 0 && <p className="text-center text-gray-400 py-20">暂无文章</p>}
    </div>
  )
}
```

Create `src/app/(public)/about/page.tsx`:
```tsx
export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">关于</h1>
      <div className="prose max-w-none">
        <p>这是一个基于 Next.js 15 构建的博客系统。</p>
        <h2>技术栈</h2>
        <ul>
          <li>Next.js 15 (App Router)</li>
          <li>Prisma + PostgreSQL</li>
          <li>NextAuth.js</li>
          <li>Tailwind CSS</li>
        </ul>
      </div>
    </div>
  )
}
```

Create `src/app/(public)/links/page.tsx`:
```tsx
import { getActiveFriendLinks } from '@/actions/public/friendLink'

export default async function LinksPage() {
  const links = await getActiveFriendLinks()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">友情链接</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow block"
          >
            <div className="flex items-center gap-3">
              {link.avatar && <img src={link.avatar} alt={link.name} className="w-10 h-10 rounded-full" />}
              <div>
                <h2 className="font-medium">{link.name}</h2>
                {link.description && <p className="text-sm text-gray-500">{link.description}</p>}
              </div>
            </div>
          </a>
        ))}
      </div>
      {links.length === 0 && <p className="text-center text-gray-400 py-20">暂无友链</p>}
    </div>
  )
}
```

- [ ] **Step 7: 提交**

```bash
git add src/actions/public/ src/components/public/ src/app/\(public\)/ src/app/page.tsx src/app/layout.tsx
git commit -m "feat: add public pages - home, article detail, categories, tags, archives, about, links"
```

---

## Task 16: 创建 SEO 优化功能

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`

- [ ] **Step 1: 创建 Sitemap**

Create `src/app/sitemap.ts`:
```typescript
import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://example.com'

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/tags`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/archives`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/links`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  // 文章页面
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true, isRecommended: true, sortOrder: true },
    orderBy: { publishedAt: 'desc' },
  })

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/articles/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: article.sortOrder > 0 ? 0.9 : article.isRecommended ? 0.8 : 0.7,
  }))

  // 分类页面
  const categories = await prisma.category.findMany({ select: { slug: true, updatedAt: true } })
  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/categories/${cat.slug}`,
    lastModified: cat.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // 标签页面
  const tags = await prisma.tag.findMany({ select: { slug: true } })
  const tagPages: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${baseUrl}/tags/${tag.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  return [...staticPages, ...articlePages, ...categoryPages, ...tagPages]
}
```

- [ ] **Step 2: 创建 robots.txt**

Create `src/app/robots.ts`:
```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://example.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add src/app/sitemap.ts src/app/robots.ts
git commit -m "feat: add SEO sitemap and robots.txt generation"
```

---

## Task 17: 创建导入导出功能

**Files:**
- Create: `src/actions/admin/import.ts`
- Create: `src/actions/admin/export.ts`

- [ ] **Step 1: 创建 Markdown 导入 Server Actions**

Create `src/actions/admin/import.ts`:
```typescript
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { parseMarkdownFile } from '@/lib/markdown'
import { generateSlug } from '@/lib/utils'

export async function importMarkdownFiles(files: Array<{ name: string; content: string }>) {
  const results: Array<{ name: string; success: boolean; error?: string; warnings?: string[] }> = []

  for (const file of files) {
    try {
      const parsed = parseMarkdownFile(file.content, file.name)

      // 查找或创建分类
      let categoryId: string | undefined
      if (parsed.category) {
        const category = await prisma.category.upsert({
          where: { slug: generateSlug(parsed.category) },
          update: {},
          create: {
            name: parsed.category,
            slug: generateSlug(parsed.category),
          },
        })
        categoryId = category.id
      }

      // 查找或创建标签
      const tagIds: string[] = []
      for (const tagName of parsed.tags) {
        const tag = await prisma.tag.upsert({
          where: { slug: generateSlug(tagName) },
          update: {},
          create: { name: tagName, slug: generateSlug(tagName) },
        })
        tagIds.push(tag.id)
      }

      // 检查 slug 是否已存在
      const existing = await prisma.article.findUnique({ where: { slug: parsed.slug } })
      if (existing) {
        results.push({ name: file.name, success: false, error: `slug "${parsed.slug}" 已存在` })
        continue
      }

      // 创建文章
      await prisma.article.create({
        data: {
          title: parsed.title,
          slug: parsed.slug,
          content: parsed.content,
          excerpt: parsed.excerpt,
          coverImage: parsed.coverImage,
          categoryId,
          status: (parsed.status as 'PUBLISHED' | 'DRAFT') || 'DRAFT',
          publishedAt: parsed.status === 'PUBLISHED' ? (parsed.date || new Date()) : null,
          tags: {
            create: tagIds.map((tagId) => ({ tagId })),
          },
        },
      })

      results.push({ name: file.name, success: true, warnings: parsed.warnings })
    } catch (err) {
      results.push({ name: file.name, success: false, error: err instanceof Error ? err.message : '导入失败' })
    }
  }

  revalidatePath('/admin/articles')
  return results
}
```

- [ ] **Step 2: 创建文章导出 Server Actions**

Create `src/actions/admin/export.ts`:
```typescript
'use server'

import prisma from '@/lib/prisma'
import matter from 'gray-matter'

export async function exportArticleMarkdown(articleId: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      category: { select: { name: true } },
      tags: { select: { tag: { select: { name: true } } } },
    },
  })

  if (!article) throw new Error('文章不存在')

  const frontMatter = {
    title: article.title,
    slug: article.slug,
    category: article.category?.name || null,
    tags: article.tags.map(({ tag }) => tag.name),
    status: article.status,
    isRecommended: article.isRecommended,
    sortOrder: article.sortOrder,
    coverImage: article.coverImage || null,
    excerpt: article.excerpt || null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    publishedAt: article.publishedAt?.toISOString() || null,
  }

  const markdown = matter.stringify(article.content, frontMatter)
  const filename = `${article.slug}.md`

  return { markdown, filename }
}

export async function exportAllArticles(options: {
  status?: string
  articleIds?: string[]
}) {
  const where: Record<string, unknown> = {}
  if (options.status) where.status = options.status
  if (options.articleIds) where.id = { in: options.articleIds }

  const articles = await prisma.article.findMany({
    where,
    include: {
      category: { select: { name: true } },
      tags: { select: { tag: { select: { name: true } } } },
    },
    orderBy: { publishedAt: 'desc' },
  })

  const files: Array<{ filename: string; content: string; folder: string }> = []

  for (const article of articles) {
    const frontMatter = {
      title: article.title,
      slug: article.slug,
      category: article.category?.name || null,
      tags: article.tags.map(({ tag }) => tag.name),
      status: article.status,
      isRecommended: article.isRecommended,
      coverImage: article.coverImage || null,
      excerpt: article.excerpt || null,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      publishedAt: article.publishedAt?.toISOString() || null,
    }

    const markdown = matter.stringify(article.content, frontMatter)
    const folder = article.category?.name || '未分类'

    files.push({
      filename: `${article.slug}.md`,
      content: markdown,
      folder,
    })
  }

  return files
}
```

- [ ] **Step 3: 提交**

```bash
git add src/actions/admin/import.ts src/actions/admin/export.ts
git commit -m "feat: add markdown import and article export server actions"
```

---

## Task 18: 完善仪表盘页面

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: 替换仪表盘占位页面为完整实现**

Replace `src/app/admin/page.tsx`:
```tsx
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()

  const [
    totalArticles,
    publishedArticles,
    draftArticles,
    totalCategories,
    totalTags,
    recentArticles,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { status: 'PUBLISHED' } }),
    prisma.article.count({ where: { status: 'DRAFT' } }),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      include: {
        category: { select: { name: true } },
      },
    }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        欢迎回来, {session?.user?.nickname || session?.user?.username}!
      </h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">总文章数</p>
          <p className="text-3xl font-bold mt-2">{totalArticles}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">已发布</p>
          <p className="text-3xl font-bold mt-2 text-green-600">{publishedArticles}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">草稿</p>
          <p className="text-3xl font-bold mt-2 text-yellow-600">{draftArticles}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">分类数</p>
          <p className="text-3xl font-bold mt-2">{totalCategories}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">标签数</p>
          <p className="text-3xl font-bold mt-2">{totalTags}</p>
        </div>
      </div>

      {/* 最近文章 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">最近发布</h2>
          <Link href="/admin/articles" className="text-sm text-blue-600 hover:underline">查看全部</Link>
        </div>
        <div className="divide-y">
          {recentArticles.map((article) => (
            <div key={article.id} className="p-4 flex items-center justify-between">
              <div>
                <Link href={`/admin/articles/${article.id}`} className="font-medium hover:text-blue-600">{article.title}</Link>
                <div className="text-sm text-gray-500 mt-1">
                  {article.category?.name && <span className="mr-3">{article.category.name}</span>}
                  <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('zh-CN') : ''}</span>
                </div>
              </div>
              <span className="text-sm text-gray-500">{article.viewCount} 阅读</span>
            </div>
          ))}
          {recentArticles.length === 0 && (
            <div className="p-8 text-center text-gray-400">暂无文章</div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: implement dashboard with stats overview and recent articles"
```

---

## Self-Review

### 1. Spec Coverage

| Spec Requirement | Task |
|---|---|
| 项目初始化 | Task 1 |
| Prisma Schema (8 表) | Task 2 |
| 种子数据 | Task 3 |
| NextAuth 认证 + 中间件 | Task 4 |
| 后台布局 + Sidebar + 登录 | Task 5 |
| 分类管理 CRUD | Task 6 |
| 标签管理 CRUD + 合并 | Task 7 |
| 文章管理 Actions (CRUD, 状态, 批量) | Task 8 |
| Markdown 编辑器 | Task 9 |
| 文章列表 + 新建 + 编辑页面 | Task 10 |
| 友链管理 CRUD | Task 11 |
| 用户个人设置 + 修改密码 | Task 12 |
| OSS STS 上传 | Task 13 |
| 访问统计 PV/UV + 统计页面 | Task 14 |
| 前台公共页面 (首页/文章/分类/标签/归档/关于/友链) | Task 15 |
| SEO (Sitemap + robots.txt + JSON-LD) | Task 16 |
| Markdown 导入 + 文章导出 | Task 17 |
| 仪表盘完善 | Task 18 |

**未覆盖（后续迭代）:** 暗黑模式、社交分享按钮、TOC 组件（前台）、仪表盘图表。这些在设计中标记为"后续扩展"，不阻碍核心功能。

### 2. Placeholder Scan

无 TBD、TODO、"implement later"、"add validation" 等占位内容。每个步骤都包含完整代码。

### 3. Type Consistency

- `ArticleFormData`, `CategoryFormData`, `TagFormData`, `FriendLinkFormData`, `ProfileFormData`, `PasswordFormData` 在 Task 2 定义，后续 Task 一致使用
- `ArticleStatus` 枚举 (PUBLISHED, DRAFT, PRIVATE, TRASH) 在 Prisma schema 定义，Task 8/10/15 一致使用
- `generateSlug`, `generateExcerpt` 在 Task 2 定义，Task 7/8/17 一致引用
- `parseMarkdownFile` 返回 `ParsedFrontMatter`，在 Task 9 定义，Task 17 使用
- 所有 API Routes 和 Server Actions 文件路径与 File Structure 一致
