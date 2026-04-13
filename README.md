# Maxon's Blog

一个基于 Next.js 构建的简洁博客系统，支持 Markdown 编辑、分类标签管理、访问统计、阿里云 OSS 图片上传等功能。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| 前端 | React 19, Tailwind CSS v4 |
| 数据库 | PostgreSQL + Prisma ORM |
| 认证 | NextAuth.js v5 (Credentials) |
| 存储 | 阿里云 OSS (STS 临时凭证上传) |
| Markdown | react-markdown + remark-gfm + rehype-highlight |

## 项目结构

```
src/
├── actions/          # Server Actions
│   ├── admin/        #   管理端（文章/分类/标签/友链/统计/系统配置/用户）
│   └── public/       #   公开端（文章/分类/标签/友链/系统配置）
├── app/
│   ├── (public)/     # 前台页面
│   │   ├── page.tsx            # 首页（Hero 轮播 + 最新文章）
│   │   ├── articles/           # 全部文章（分页/瀑布流视图切换）
│   │   ├── categories/         # 分类页
│   │   ├── tags/               # 标签页
│   │   ├── archives/           # 归档页
│   │   └── links/              # 友链页
│   ├── admin/        # 管理后台
│   │   ├── page.tsx            # 仪表盘
│   │   ├── articles/           # 文章管理（列表/新建/编辑）
│   │   ├── categories/         # 分类管理
│   │   ├── tags/               # 标签管理
│   │   ├── friend-links/       # 友链管理
│   │   ├── analytics/          # 访问统计
│   │   ├── settings/           # 系统管理（Favicon 等配置）
│   │   └── profile/            # 个人设置
│   ├── api/          # API 路由
│   │   ├── auth/               # NextAuth 认证
│   │   ├── upload/sts/         # OSS STS 上传凭证
│   │   └── visit/              # 访问记录
│   └── layout.tsx              # 根布局（动态 Favicon 注入）
├── components/
│   ├── admin/        # 管理端组件（MarkdownEditor, FileUploader, Sidebar）
│   └── public/       # 前台组件（Header, Footer, ArticleCard, HeroCarousel, ArticlesView）
├── lib/              # 工具库
│   ├── auth.ts                 # NextAuth 配置
│   ├── prisma.ts               # Prisma 客户端
│   ├── oss.ts                  # 阿里云 OSS STS 签名
│   ├── upload-client.ts        # 客户端上传
│   ├── markdown.ts             # Markdown 解析 / TOC 提取
│   ├── colors.ts               # 分类/标签配色方案
│   ├── visitor.ts              # 访客追踪
│   └── utils.ts                # 通用工具函数
└── types/            # TypeScript 类型定义
```

## 数据模型

- **User** — 用户账号，支持 ADMIN / USER 角色
- **Article** — 文章，含草稿/发布/私密/回收站状态、SEO 字段、推荐标记
- **Category** — 分类，支持排序和描述
- **Tag** — 标签
- **FriendLink** — 友情链接
- **SiteConfig** — 站点配置（键值对，如 favicon）
- **PageVisitSummary / VisitLog** — 访问统计（PV/UV）

## 主要功能

### 前台

- 首页 Hero 轮播展示推荐文章
- 文章列表支持分页视图和瀑布流视图切换
- 分类和标签基于名称的彩色配色
- 文章详情页支持目录导航、代码高亮、代码主题切换
- 归档页按年月分组展示
- 站点 Favicon 动态配置

### 管理后台

- Markdown 编辑器，支持实时预览、目录导航、图片拖拽/粘贴上传
- 文章管理：列表排序/搜索/筛选、推荐快捷切换、批量删除、草稿改动管理
- 分类/标签/友链 CRUD
- Markdown 文件批量导入
- 访问统计仪表盘（PV/UV 趋势、热门页面）
- 系统管理：Favicon 配置
- 个人设置：头像上传、密码修改

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填写数据库连接、OSS 配置、NextAuth 密钥等

# 同步数据库
npx prisma db push

# 初始化数据
npx prisma db seed

# 启动开发服务器
npm run dev
```
