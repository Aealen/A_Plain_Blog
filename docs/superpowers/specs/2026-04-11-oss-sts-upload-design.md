# 阿里云 OSS STS 临时凭证直传 — 设计文档

**日期**: 2026-04-11
**状态**: 待实现

## 概述

补全博客系统的阿里云 OSS 上传功能，采用 STS 临时凭证 + PostObject Policy 签名直传方案。覆盖四个上传场景：文章封面、个人头像、友链头像、编辑器图片。

## 方案选择

**选定方案：FormData + Policy 签名直传**

- 服务端用 `ali-oss` SDK 调用 STS AssumeRole 获取临时凭证
- 服务端用临时凭证生成 PostObject Policy 签名
- 前端用原生 fetch + FormData POST 直传到 OSS
- 前端零额外依赖

选择理由：前端零依赖保持博客轻量；博客场景主要是图片上传不需要超大文件分片；与现有 FileUploader FormData 框架契合。

## 架构

```
浏览器 ──GET /api/upload/sts?purpose=covers──→ 服务端
服务端 ──ali-oss STS AssumeRole──→ 阿里云 STS API
阿里云 ──临时 AK/SK/Token──→ 服务端
服务端 ──生成 PostObject Policy 签名──→ 返回签名信息 + 文件路径
浏览器 ──POST https://{bucket}.{region}.aliyuncs.com (FormData)──→ OSS
浏览器 ←──文件 URL──→ 回传给表单
```

### 文件路径规则

用途 + 时间组合：

```
uploads/{用途}/{年}/{月}/{日}/{时间戳}-{随机6位}.{扩展名}
```

用途分类：
- `covers` — 文章封面图
- `avatars` — 个人头像和友链头像
- `editor` — 编辑器中插入的图片

## 涉及修改的文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/lib/oss.ts` | 重写 | STS AssumeRole + PostObject Policy 签名 |
| `src/app/api/upload/sts/route.ts` | 重写 | 接受 purpose 参数，返回签名信息 |
| `src/components/admin/FileUploader.tsx` | 重写 | Policy 签名上传方式，新增 purpose 属性 |
| `src/app/admin/articles/new/page.tsx` | 修改 | FileUploader 补充 purpose="covers" |
| `src/app/admin/articles/[id]/page.tsx` | 修改 | FileUploader 补充 purpose="covers" |
| `src/app/admin/profile/page.tsx` | 修改 | 头像字段集成 FileUploader |
| `src/app/admin/friend-links/page.tsx` | 修改 | 头像字段集成 FileUploader |
| Markdown 编辑器组件 | 修改 | 添加图片粘贴/拖拽上传支持 |

## OSS 核心模块设计 (`src/lib/oss.ts`)

### `getSTSToken()`

调用阿里云 STS AssumeRole 获取临时凭证：

- 使用 `ali-oss` SDK 的 STS 构造函数
- 用主 AK/SK + RoleArn 调用 assumeRole
- 内嵌 Policy 限制仅允许写入 `uploads/*` 前缀
- SessionName 用 `blog-upload-{timestamp}`
- 临时凭证有效期 15 分钟（900 秒）
- 返回：临时 accessKeyId、accessKeySecret、securityToken、expiration

### `generatePostObjectPolicy()`

生成 PostObject 所需的签名 Policy：

输入：
- 临时凭证（accessKeyId、accessKeySecret、securityToken）
- 文件路径前缀（由 purpose + 日期组成）
- 过期时间

Policy 内容限制：
- bucket：限制为当前配置的 bucket
- key：以 `uploads/{purpose}/` 开头
- content-length-range：0 ~ 10MB（10485760）

返回：
- `policy`：Base64 编码的 Policy JSON
- `signature`：用临时 accessKeySecret 签名
- `OSSAccessKeyId`：临时 accessKeyId
- `x-oss-security-token`：临时 securityToken
- `key`：完整文件路径（含随机文件名）
- `url`：最终文件访问 URL

### STS API 路由 (`/api/upload/sts`)

改为：
- 接受 `purpose` query 参数，验证值为 `covers`/`avatars`/`editor` 之一
- 需要认证（NextAuth session check）
- 调用 getSTSToken() → generatePostObjectPolicy()
- 返回完整签名信息

## FileUploader 组件改造

```ts
interface FileUploaderProps {
  onUpload: (url: string) => void
  accept?: string          // 默认 'image/*'
  purpose: 'covers' | 'avatars' | 'editor'
}
```

上传流程：
1. 调用 `/api/upload/sts?purpose={purpose}` 获取签名信息
2. 构造 FormData：key、OSSAccessKeyId、policy、Signature、x-oss-security-token、file
3. POST 到 `https://{bucket}.{region}.aliyuncs.com`
4. 成功后用签名信息中的 url 回调 onUpload
5. 上传失败显示错误提示

## 各场景集成细节

### 文章封面上传

已有 FileUploader 调用，补充 `purpose="covers"` 属性即可。

### 个人头像上传

当前 `src/app/admin/profile/page.tsx` 中头像是纯文本 URL 输入框。改造为：
- 上方显示当前头像预览（如有 URL）
- 下方使用 FileUploader 组件（purpose="avatars"）
- 上传成功后自动填充 avatarUrl 字段

### 友链头像上传

当前 `src/app/admin/friend-links/page.tsx` 中头像也是纯文本输入。改造为：
- 使用 FileUploader 组件（purpose="avatars"）
- 保留手动输入 URL 的能力（作为备选）
- 上传成功后自动填充 avatar 字段

### 编辑器图片上传

在 Markdown 编辑器组件中添加：
- 监听 `paste` 事件：检测粘贴的图片数据（`clipboardData.items` 中的 image 类型）
- 监听 `drop` 事件：检测拖入的图片文件
- 上传流程复用与 FileUploader 相同的逻辑（提取为共享的 `uploadToOss` 工具函数）
- 上传过程中在光标位置显示上传状态占位符 `![上传中...]()`
- 上传完成后替换为 `![图片描述](url)`
- 上传失败显示 `![上传失败]()`

## 安全措施

- 所有上传接口需要 NextAuth 认证
- STS Policy 限制只能写 `uploads/{purpose}/*` 路径
- 文件大小限制 10MB
- 临时凭证 15 分钟过期
- 文件名使用时间戳 + 随机字符串，防止路径猜测

## RAM 配置指南

### Step 1：创建 RAM 子用户

1. 登录阿里云 RAM 控制台 → 身份管理 → 用户 → 创建用户
2. 勾选"OpenAPI 调用访问"（生成 AccessKey）
3. 记录 AccessKey ID 和 Secret → 填入 `.env` 的 `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET`

### Step 2：创建 RAM 角色

1. RAM 控制台 → 身份管理 → 角色 → 创建角色
2. 受信类型选"当前阿里云账号"作为信任载体
3. 记录角色 ARN → 填入 `.env` 的 `OSS_ROLE_ARN`

### Step 3：为角色授权

创建自定义权限策略，限制为仅允许写入指定 Bucket：

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["oss:PutObject"],
      "Resource": ["acs:oss:*:*:{bucket-name}/uploads/*"]
    }
  ]
}
```

将此策略授权给 Step 2 创建的角色。

### Step 4：为子用户授权 AssumeRole

为 Step 1 创建的子用户添加内联策略：

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "{role-arn}"
    }
  ]
}
```

### Step 5：修改角色信任策略

确保角色的信任策略中包含对子用户的允许：

```json
{
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Effect": "Allow",
      "Principal": {
        "RAM": ["acs:ram::*:user/{sub-user-name}"]
      }
    }
  ],
  "Version": "1"
}
```

## CORS 配置

在 OSS Bucket 控制台 → 数据安全 → 跨域设置中添加规则：

| 项目 | 值 |
|------|------|
| 来源 | `http://localhost:3000`, `https://your-domain.com` |
| 允许 Methods | POST, PUT |
| 允许 Headers | `*` |
| 暴露 Headers | `ETag, x-oss-request-id` |
| 缓存时间 | 600 |

## 环境变量

`.env` 中需要配置：

```env
OSS_REGION="oss-cn-hangzhou"
OSS_BUCKET="your-bucket-name"
OSS_ACCESS_KEY_ID="your-sub-user-access-key-id"
OSS_ACCESS_KEY_SECRET="your-sub-user-access-key-secret"
OSS_ROLE_ARN="acs:ram::*:role/your-role-name"
```
