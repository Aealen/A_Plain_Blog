# 博客系统设计方案

> 创建日期: 2025-04-03
> 状态: 待审核

---

## 1. 概述

### 1.1 项目背景

构建一个基于 Next.js 的全栈博客系统，支持文章管理、访问统计、SEO 优化、Markdown 导入导出等功能。

### 1.2 技术栈

| 层级 | 技术选型 |
|------|----------|
| 框架 | Next.js 15 (App Router) |
| ORM | Prisma |
| 数据库 | PostgreSQL |
| 认证 | NextAuth.js (Credentials Provider) |
| 存储 | 阿里云 OSS (STS 临时凭证) |
| 样式 | 对接 Pencil 设计稿 |

### 1.3 核心功能

- 前台展示：文章列表、分类、标签、归档、关于、友链
- 后台管理：文章/分类/标签/友链 CRUD、访问统计、个人设置
- 文章系统：Markdown 编辑、多状态管理、置顶排序、TOC 目录
- 访问统计：PV/UV/VV 统计、趋势图表、热门页面
- SEO 优化：元数据管理、JSON-LD、Sitemap、robots.txt
- 导入导出：Markdown 批量导入导出、ZIP 打包

---

## 2. 数据模型设计

### 2.1 ER 图

```
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│     Category    │    │       Article       │    │      Tag        │
├─────────────────┤    ├─────────────────────┤    ├─────────────────┤
│ id              │◄───┤ id                  │◄───┤ id              │
│ name            │    │ title               │    │ name            │
│ slug            │    │ slug                │    │ slug            │
│ description     │    │ content(Markdown)   │    │ createdAt       │
│ order           │    │ excerpt             │    └─────────────────┘
│ createdAt       │    │ coverImage          │           ▲
│ updatedAt       │    │ categoryId          │           │
└─────────────────┘    │ status              │    ┌─────────────────┐
                       │ sortOrder           │    │  ArticleTag     │
                       │ isRecommended       │    ├─────────────────┤
                       │ viewCount           │    │ articleId       │
                       │ seoTitle            │    │ tagId           │
                       │ seoDescription      │    └─────────────────┘
                       │ seoKeywords         │
                       │ publishedAt         │    ┌─────────────────┐
                       │ createdAt           │    │   FriendLink    │
                       │ updatedAt           │    ├─────────────────┤
                       └─────────────────────┘    │ id              │
                                  │               │ name            │
                                  │               │ url             │
                                  ▼               │ avatar          │
┌─────────────────┐    ┌─────────────────────────┐│ description     │
│      User       │    │ PageVisitSummary        ││ order           │
├─────────────────┤    ├─────────────────────────┤│ isActive        │
│ id              │    │ id                      ││ createdAt       │
│ username        │    │ path                    ││ updatedAt       │
│ password(hash)  │    │ date                    │└─────────────────┘
│ email           │    │ pv                      │
│ nickname        │    │ uv                      │
│ avatarUrl       │    └─────────────────────────┘
│ bio             │              ▲
│ role            │              │
│ createdAt       │    ┌─────────────────────────┐
│ updatedAt       │    │       VisitLog          │
└─────────────────┘    ├─────────────────────────┤
                       │ id                      │
                       │ visitorId(指纹/UUID)    │
                       │ sessionId               │
                       │ path                    │
                       │ referrer                │
                       │ userAgent               │
                       │ ip                      │
                       │ visitedAt               │
                       └─────────────────────────┘
```

### 2.2 表结构详细定义

#### 2.2.1 Article 文章表

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | UUID | 是 | 主键 |
| title | VARCHAR(255) | 是 | 文章标题 |
| slug | VARCHAR(255) | 是 | URL 别名，唯一 |
| content | TEXT | 是 | Markdown 正文 |
| excerpt | VARCHAR(500) | 否 | 摘要 |
| coverImage | VARCHAR(500) | 否 | 封面图 URL |
| categoryId | UUID | 否 | 分类 ID |
| status | ENUM | 是 | 状态: PUBLISHED, DRAFT, PRIVATE, TRASH |
| sortOrder | INTEGER | 是 | 排序权重，默认 0，越大越靠前 |
| isRecommended | BOOLEAN | 是 | 是否推荐，默认 false |
| viewCount | INTEGER | 是 | 阅读量，默认 0 |
| seoTitle | VARCHAR(100) | 否 | SEO 标题 |
| seoDescription | VARCHAR(200) | 否 | SEO 描述 |
| seoKeywords | VARCHAR(200) | 否 | SEO 关键词 |
| publishedAt | TIMESTAMP | 否 | 发布时间 |
| createdAt | TIMESTAMP | 是 | 创建时间 |
| updatedAt | TIMESTAMP | 是 | 更新时间 |

**索引：**
- slug (UNIQUE)
- categoryId
- status
- sortOrder DESC, publishedAt DESC

#### 2.2.2 Category 分类表

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | UUID | 是 | 主键 |
| name | VARCHAR(100) | 是 | 分类名称 |
| slug | VARCHAR(100) | 是 | URL 别名，唯一 |
| description | VARCHAR(500) | 否 | 分类描述 |
| order | INTEGER | 是 | 显示顺序，默认 0 |
| createdAt | TIMESTAMP | 是 | 创建时间 |
| updatedAt | TIMESTAMP | 是 | 更新时间 |

#### 2.2.3 Tag 标签表

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | UUID | 是 | 主键 |
| name | VARCHAR(50) | 是 | 标签名称 |
| slug | VARCHAR(50) | 是 | URL 别名，唯一 |
| createdAt | TIMESTAMP | 是 | 创建时间 |

#### 2.2.4 ArticleTag 文章标签关联表

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| articleId | UUID | 是 | 文章 ID |
| tagId | UUID | 是 | 标签 ID |

**主键：** (articleId, tagId)

#### 2.2.5 User 用户表

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | UUID | 是 | 主键 |
| username | VARCHAR(50) | 是 | 用户名，唯一 |
| password | VARCHAR(255) | 是 | 密码哈希 |
| email | VARCHAR(100) | 是 | 邮箱，唯一 |
| nickname | VARCHAR(100) | 否 | 昵称 |
| avatarUrl | VARCHAR(500) | 否 | 头像 URL |
| bio | VARCHAR(500) | 否 | 个人简介 |
| role | ENUM | 是 | 角色: ADMIN, USER |
| createdAt | TIMESTAMP | 是 | 创建时间 |
| updatedAt | TIMESTAMP | 是 | 更新时间 |

#### 2.2.6 FriendLink 友情链接表

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | UUID | 是 | 主键 |
| name | VARCHAR(100) | 是 | 站点名称 |
| url | VARCHAR(500) | 是 | 站点 URL |
| avatar | VARCHAR(500) | 否 | 头像/Logo URL |
| description | VARCHAR(200) | 否 | 站点描述 |
| order | INTEGER | 是 | 显示顺序，默认 0 |
| isActive | BOOLEAN | 是 | 是否启用，默认 true |
| createdAt | TIMESTAMP | 是 | 创建时间 |
| updatedAt | TIMESTAMP | 是 | 更新时间 |

#### 2.2.7 PageVisitSummary 访问汇总表

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | UUID | 是 | 主键 |
| path | VARCHAR(500) | 是 | 页面路径 |
| date | DATE | 是 | 日期 |
| pv | INTEGER | 是 | 页面访问量 |
| uv | INTEGER | 是 | 独立访客数 |

**索引：** (path, date) UNIQUE

#### 2.2.8 VisitLog 访问日志表

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | UUID | 是 | 主键 |
| visitorId | VARCHAR(100) | 是 | 访客标识(指纹/UUID) |
| sessionId | VARCHAR(100) | 是 | 会话 ID |
| path | VARCHAR(500) | 是 | 访问路径 |
| referrer | VARCHAR(500) | 否 | 来源页面 |
| userAgent | VARCHAR(500) | 否 | 浏览器标识 |
| ip | VARCHAR(50) | 否 | IP 地址 |
| visitedAt | TIMESTAMP | 是 | 访问时间 |

**索引：**
- visitorId
- sessionId
- visitedAt

### 2.3 统计逻辑说明

| 指标 | 含义 | 计算方式 |
|------|------|----------|
| PV | 页面访问量 | 每次页面加载 +1 |
| UV | 独立访客数 | 同一 visitorId 当天只计一次 |
| VV | 访问会话数 | 同一 sessionId 为一次访问 |

- **PageVisitSummary**: 按路径 + 日期聚合的汇总数据，用于快速查询
- **VisitLog**: 原始访问日志，用于计算 UV/VV 和后续分析

---

## 3. 项目结构

```
blog/
├── prisma/
│   ├── schema.prisma              # 数据库模型定义
│   └── seed.ts                    # 初始数据种子
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # 根布局
│   │   ├── page.tsx               # 首页
│   │   ├── globals.css            # 全局样式
│   │   │
│   │   ├── (public)/              # 前台页面（公开访问）
│   │   │   ├── articles/
│   │   │   │   └── [slug]/page.tsx    # 文章详情
│   │   │   ├── categories/
│   │   │   │   ├── page.tsx           # 分类列表
│   │   │   │   └── [slug]/page.tsx    # 分类下的文章
│   │   │   ├── tags/
│   │   │   │   ├── page.tsx           # 标签云
│   │   │   │   └── [slug]/page.tsx    # 标签下的文章
│   │   │   ├── archives/
│   │   │   │   └── page.tsx           # 归档页
│   │   │   ├── about/
│   │   │   │   └── page.tsx           # 关于页
│   │   │   └── links/
│   │   │       └── page.tsx           # 友链页
│   │   │
│   │   ├── admin/                 # 后台管理（需认证）
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # 仪表盘
│   │   │   ├── articles/
│   │   │   │   ├── page.tsx           # 文章列表
│   │   │   │   ├── new/page.tsx       # 新建文章
│   │   │   │   └── [id]/page.tsx      # 编辑文章
│   │   │   ├── categories/
│   │   │   │   └── page.tsx           # 分类管理
│   │   │   ├── tags/
│   │   │   │   └── page.tsx           # 标签管理
│   │   │   ├── friend-links/
│   │   │   │   └── page.tsx           # 友链管理
│   │   │   ├── profile/
│   │   │   │   └── page.tsx           # 个人设置
│   │   │   └── analytics/
│   │   │       └── page.tsx           # 访问统计
│   │   │
│   │   ├── api/                   # API 路由
│   │   │   ├── auth/[...nextauth]/
│   │   │   │   └── route.ts           # NextAuth 认证
│   │   │   ├── upload/
│   │   │   │   └── route.ts           # OSS 上传
│   │   │   └── visit/
│   │   │       └── route.ts           # 访问记录
│   │   │
│   │   ├── sitemap.ts             # Sitemap 生成
│   │   └── robots.ts               # robots.txt 生成
│   │
│   ├── actions/                   # Server Actions
│   │   ├── public/                # 前台（公开访问）
│   │   │   ├── article.ts
│   │   │   ├── category.ts
│   │   │   ├── tag.ts
│   │   │   └── friendLink.ts
│   │   │
│   │   └── admin/                 # 后台（需认证）
│   │       ├── article.ts
│   │       ├── category.ts
│   │       ├── tag.ts
│   │       ├── friendLink.ts
│   │       ├── user.ts
│   │       ├── import.ts
│   │       └── export.ts
│   │
│   ├── components/                # 组件
│   │   ├── ui/                    # 基础 UI 组件
│   │   ├── public/                # 前台组件
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── TOC.tsx
│   │   │   ├── TagCloud.tsx
│   │   │   └── ShareButtons.tsx
│   │   └── admin/                 # 后台组件
│   │       ├── Sidebar.tsx
│   │       ├── MarkdownEditor.tsx
│   │       ├── StatsCard.tsx
│   │       └── FileUploader.tsx
│   │
│   ├── lib/                       # 工具库
│   │   ├── prisma.ts              # Prisma 客户端
│   │   ├── auth.ts                # 认证配置
│   │   ├── oss.ts                 # 阿里云 OSS
│   │   ├── visitor.ts             # 访客统计
│   │   ├── markdown.ts            # Markdown 解析
│   │   └── utils.ts               # 通用工具
│   │
│   └── types/                     # TypeScript 类型
│       └── index.ts
│
├── public/                        # 静态资源
├── .env.local                     # 环境变量
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 4. API 设计

### 4.1 Server Actions 结构

#### 4.1.1 前台 Actions (public/)

**article.ts**
```typescript
// 获取文章列表（分页）
getArticles(options: { page?, pageSize?, categoryId?, tagId?, status? })

// 获取文章详情
getArticleBySlug(slug: string)

// 获取置顶文章
getTopArticles(limit?: number)

// 获取推荐文章
getRecommendedArticles(limit?: number)

// 获取归档数据
getArchives()

// 获取热门文章
getPopularArticles(limit?: number)
```

**category.ts**
```typescript
// 获取所有分类
getCategories()

// 获取分类详情
getCategoryBySlug(slug: string)
```

**tag.ts**
```typescript
// 获取所有标签
getTags()

// 获取标签详情
getTagBySlug(slug: string)
```

**friendLink.ts**
```typescript
// 获取友链列表
getFriendLinks()
```

#### 4.1.2 后台 Actions (admin/)

**article.ts**
```typescript
// 创建文章
createArticle(data: ArticleInput)

// 更新文章
updateArticle(id: string, data: ArticleInput)

// 删除文章（移入回收站）
deleteArticle(id: string)

// 恢复文章
restoreArticle(id: string)

// 彻底删除
permanentDeleteArticle(id: string)

// 更新文章状态
updateArticleStatus(id: string, status: ArticleStatus)

// 批量操作
batchUpdateStatus(ids: string[], status: ArticleStatus)
batchDelete(ids: string[])
```

**category.ts**
```typescript
// 创建分类
createCategory(data: CategoryInput)

// 更新分类
updateCategory(id: string, data: CategoryInput)

// 删除分类
deleteCategory(id: string)

// 更新排序
updateCategoryOrder(id: string, order: number)
```

**tag.ts**
```typescript
// 创建标签
createTag(data: TagInput)

// 更新标签
updateTag(id: string, data: TagInput)

// 删除标签
deleteTag(id: string)

// 合并标签
mergeTags(sourceId: string, targetId: string)
```

**friendLink.ts**
```typescript
// 创建友链
createFriendLink(data: FriendLinkInput)

// 更新友链
updateFriendLink(id: string, data: FriendLinkInput)

// 删除友链
deleteFriendLink(id: string)

// 切换启用状态
toggleFriendLink(id: string)
```

**user.ts**
```typescript
// 更新个人资料
updateProfile(data: ProfileInput)

// 更新密码
updatePassword(currentPassword: string, newPassword: string)
```

**import.ts**
```typescript
// 解析 Markdown 文件
parseMarkdownFile(file: File)

// 批量导入文章
importArticles(articles: ParsedArticle[])

// 校验元数据
validateFrontMatter(data: unknown)
```

**export.ts**
```typescript
// 生成 Markdown
generateMarkdown(articleId: string)

// 导出文章
exportArticles(options: { scope: 'all' | 'selected' | 'status', ids?, status? })

// 创建 ZIP 压缩包
createZipArchive(articleIds: string[])
```

### 4.2 API Routes

#### 4.2.1 认证 (/api/auth/[...nextauth])

使用 NextAuth.js Credentials Provider：
- POST /api/auth/signin - 登录
- POST /api/auth/signout - 登出
- GET /api/auth/session - 获取会话

#### 4.2.2 OSS STS 上传 (/api/upload)

**GET /api/upload/sts**
- 获取 STS 临时凭证
- 返回: `{ accessKeyId, accessKeySecret, securityToken, expiration, region, bucket }`

#### 4.2.3 访问统计 (/api/visit)

**POST /api/visit**
```typescript
// 请求体
{
  path: string,
  referrer?: string
}

// 响应
{
  visitorId: string  // 设置到 Cookie/LocalStorage
}
```

---

## 5. OSS STS 上传方案

### 5.1 安全架构

```
┌─────────────┐         ┌─────────────────┐         ┌─────────────┐
│   浏览器     │  ────►  │  Next.js 服务端  │  ────►  │  PostgreSQL │
│  (前端代码)  │         │  (Server Actions)│         │             │
│             │         │                  │         └─────────────┘
│  无敏感信息   │         │  环境变量安全存储  │
└─────────────┘         └─────────────────┘
                                  │
                                  ▼
                        ┌─────────────────┐
                        │   阿里云 OSS     │
                        │  (STS 临时凭证)  │
                        └─────────────────┘
```

### 5.2 STS 上传流程

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   前端请求    │      │  后端生成    │      │  前端直传    │
│  STS Token   │ ───► │  STS 凭证   │ ───► │  文件到 OSS  │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │                    │
       │                    ▼                    │
       │           ┌─────────────────────────────────┐
       │           │  STS Token 包含：               │
       │           │  - AccessKeyId (临时)          │
       │           │  - AccessKeySecret (临时)      │
       │           │  - SecurityToken              │
       │           │  - 过期时间 (如 15 分钟)        │
       │           │  - 限制路径 (可选)             │
       │           └─────────────────────────────────┘
```

### 5.3 环境变量配置

```env
# 数据库（服务端使用，前端不可见）
DATABASE_URL="postgresql://user:password@localhost:5432/blog"

# 阿里云 OSS（服务端使用）
OSS_REGION="oss-cn-hangzhou"
OSS_BUCKET="your-bucket-name"
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"
OSS_ROLE_ARN="acs:ram::your-role-arn"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 6. SEO 优化设计

### 6.1 元数据配置

| 页面 | Title 模板 | Description |
|------|-----------|-------------|
| 首页 | `{站点名称}` | `{站点描述}` |
| 文章详情 | `{seoTitle/title} - {站点名称}` | `{seoDescription/excerpt}` |
| 分类页 | `{分类名} - {站点名称}` | `{分类描述}` |
| 标签页 | `{标签名}相关文章 - {站点名称}` | `包含 {标签名} 的所有文章` |
| 归档页 | `归档 - {站点名称}` | `所有文章归档` |

### 6.2 结构化数据 (JSON-LD)

文章页 BlogPosting Schema：
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "文章标题",
  "description": "文章描述",
  "image": "封面图URL",
  "datePublished": "2025-04-03T10:00:00Z",
  "dateModified": "2025-04-03T15:00:00Z",
  "author": {
    "@type": "Person",
    "name": "作者名",
    "url": "作者主页"
  },
  "publisher": {
    "@type": "Organization",
    "name": "站点名称",
    "logo": {
      "@type": "ImageObject",
      "url": "站点Logo"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "文章URL"
  }
}
```

### 6.3 Sitemap 结构

```
sitemap.xml
├── sitemap-articles.xml    # 文章页
├── sitemap-categories.xml  # 分类页
├── sitemap-tags.xml        # 标签页
└── sitemap-static.xml      # 静态页（首页、关于等）
```

- 自动生成，通过 ISR 每日更新
- 文章优先级：置顶 > 推荐 > 普通
- changefreq 根据更新时间动态计算

### 6.4 robots.txt

```
User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml

# 禁止后台
Disallow: /admin/
Disallow: /api/
```

### 6.5 文章 SEO 字段

后台文章编辑页包含可选的 SEO 设置：
- **seoTitle**: 自定义 SEO 标题（默认使用文章标题）
- **seoDescription**: 自定义 SEO 描述（默认使用摘要）
- **seoKeywords**: 自定义 SEO 关键词（默认使用标签）

包含实时预览功能，展示 Google 搜索结果样式。

---

## 7. Markdown 导入导出

### 7.1 导入功能

#### 支持的 Front Matter 格式

```markdown
---
title: 理解 React Hooks
date: 2025-03-15 10:30:00
updated: 2025-04-01 15:20:00
category: 技术笔记
tags:
  - React
  - JavaScript
cover: /images/cover.jpg
excerpt: 这是一篇关于 React Hooks 的深度解析...
---

# 理解 React Hooks

文章正文内容...
```

#### 字段映射

| Front Matter | 数据库字段 | 必填 | 默认值 |
|--------------|-----------|------|--------|
| title | title | 是 | 文件名 |
| date | publishedAt / createdAt | 否 | 当前时间 |
| updated | updatedAt | 否 | 当前时间 |
| category | categoryId (按名称匹配) | 否 | 默认分类 |
| tags | Tag (按名称创建/匹配) | 否 | 空 |
| cover / coverImage | coverImage | 否 | 空 |
| excerpt / description | excerpt | 否 | 自动截取正文前200字 |
| status | status | 否 | DRAFT |
| slug | slug | 否 | 根据 title 生成 |

#### 导入流程

1. 拖拽或选择 Markdown 文件（支持多选）
2. 解析 Front Matter 和正文
3. 展示预览列表，标识问题项
4. 用户确认后批量导入
5. 返回导入结果（成功数、失败数、问题说明）

### 7.2 导出功能

#### 导出的 Front Matter 格式

```markdown
---
title: 理解 React Hooks
slug: understanding-react-hooks
category: 技术笔记
tags:
  - React
  - JavaScript
status: PUBLISHED
isRecommended: true
sortOrder: 0
coverImage: https://oss.example.com/cover.jpg
excerpt: 这是一篇关于 React Hooks 的深度解析...
createdAt: 2025-03-15T10:30:00Z
updatedAt: 2025-04-01T15:20:00Z
publishedAt: 2025-03-15T10:30:00Z
stats:
  pv: 1234
  uv: 567
  vv: 890
---

# 理解 React Hooks

文章正文内容...
```

#### 导出选项

- **导出范围**: 全部文章 / 已选文章 / 按状态筛选
- **包含封面图**: 可选下载封面图到 images 目录
- **按分类组织**: 可选按分类创建子目录

#### 导出文件结构

```
blog-export-2025-04-03.zip
├── 技术笔记/
│   ├── understanding-react-hooks.md
│   └── nextjs-15-features.md
├── 随笔/
│   ├── 2025-annual-plan.md
│   └── my-thoughts.md
├── 转载/
│   └── awesome-article.md
├── images/                          (可选)
│   ├── cover-1.jpg
│   └── cover-2.jpg
└── README.md
```

---

## 8. 后台页面设计

### 8.1 整体布局

```
┌────────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌──────────────────────────────────────────────┐ │
│  │             │  │  Header (用户头像、退出登录)                   │ │
│  │   Sidebar   │  ├──────────────────────────────────────────────┤ │
│  │             │  │                                              │ │
│  │  📊 仪表盘   │  │              主内容区域                        │ │
│  │  📝 文章管理  │  │                                              │ │
│  │  📁 分类管理  │  │                                              │ │
│  │  🏷 标签管理  │  │                                              │ │
│  │  🔗 友链管理  │  │                                              │ │
│  │  📈 访问统计  │  │                                              │ │
│  │  ⚙️ 个人设置  │  │                                              │ │
│  │             │  │                                              │ │
│  └─────────────┘  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### 8.2 页面列表

| 页面 | 路由 | 功能 |
|------|------|------|
| 仪表盘 | /admin | 数据概览、近期趋势、热门文章 |
| 文章列表 | /admin/articles | 文章列表、搜索筛选、批量操作、导入导出 |
| 新建文章 | /admin/articles/new | Markdown 编辑器、SEO 设置、导入文件 |
| 编辑文章 | /admin/articles/[id] | 同上，编辑模式 |
| 分类管理 | /admin/categories | 分类 CRUD、拖拽排序 |
| 标签管理 | /admin/tags | 标签 CRUD、合并、查看关联文章数 |
| 友链管理 | /admin/friend-links | 友链 CRUD、启用/禁用 |
| 访问统计 | /admin/analytics | PV/UV/VV 图表、热门页面、来源分析 |
| 个人设置 | /admin/profile | 修改资料、修改密码 |

### 8.3 文章编辑页布局

```
┌────────────────────────────────────────────────────────────────────┐
│  ← 返回                    新建/编辑文章                           │
├────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  标题: [                                          ]          │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌───────────────────────────────┐ ┌────────────────────────────┐ │
│  │    Markdown 编辑器            │ │      实时预览              │ │
│  │    (工具栏 + 编辑区)           │ │                            │ │
│  └───────────────────────────────┘ └────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐  │
│  │ 封面图           │ │ 分类: [选择 ▼]   │ │ 标签: [+ 添加]   │  │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘  │
│                                                                    │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐  │
│  │ 状态: [草稿 ▼]   │ │ 排序权重: 0      │ │ ☐ 推荐          │  │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  SEO 设置（可折叠）                                          │  │
│  │  - SEO 标题 / 描述 / 关键词                                  │  │
│  │  - Google 搜索结果预览                                       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│                          [保存草稿]  [发布]                        │
└────────────────────────────────────────────────────────────────────┘
```

---

## 9. 认证方案

### 9.1 技术选型

使用 NextAuth.js (Auth.js) v5 + Credentials Provider

### 9.2 认证流程

1. 用户访问 /admin/* 路由
2. 中间件检查 session
3. 未登录重定向到 /admin/login
4. 用户输入用户名/密码
5. Credentials Provider 验证
6. 创建 session，重定向到仪表盘

### 9.3 Session 策略

- 使用 JWT session（无需数据库存储 session）
- Token 有效期: 7 天
- 支持刷新 token

### 9.4 密码安全

- 使用 bcrypt 加密，cost factor = 12
- 密码要求：至少 8 位，包含字母和数字

---

## 10. 后续扩展

以下功能在后续迭代中考虑：

| 功能 | 说明 |
|------|------|
| 富文本编辑器 | 所见即所得编辑体验 |
| 评论系统 | Giscus / Waline 第三方评论 |
| 全文搜索 | Meilisearch 集成 |
| RSS 订阅 | 自动生成 RSS/Atom feed |
| 文章定时发布 | 设置未来时间自动发布 |
| 多语言支持 | i18n 国际化 |
| 文章版本历史 | 保存修改历史，支持回滚 |

---

## 11. 开发计划建议

### 第一阶段：基础架构
1. 项目初始化、Prisma 模型定义
2. 数据库迁移、种子数据
3. NextAuth 认证配置
4. 后台基础布局

### 第二阶段：核心功能
1. 文章 CRUD、Markdown 编辑器
2. 分类/标签管理
3. 前台页面（对接 Pencil 设计）
4. OSS STS 上传

### 第三阶段：增强功能
1. 访问统计（PV/UV/VV）
2. SEO 优化（元数据、Sitemap）
3. 导入导出功能

### 第四阶段：优化打磨
1. 性能优化（ISR、图片优化）
2. 暗黑模式
3. 社交分享
4. 测试、部署
