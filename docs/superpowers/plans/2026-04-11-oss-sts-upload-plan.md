# OSS STS 临时凭证直传 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Alibaba Cloud OSS file upload using STS temporary credentials with PostObject Policy signatures, covering article covers, user avatars, friend link avatars, and editor image uploads.

**Architecture:** Server-side uses `ali-oss` SDK's STS module to call `AssumeRole`, then generates a PostObject Policy signature. Client-side uploads files directly to OSS using `fetch` + `FormData` with the signed policy. Zero frontend dependencies added.

**Tech Stack:** ali-oss SDK (STS module), Next.js API routes, React components, crypto (Node built-in for policy signature)

**Spec:** `docs/superpowers/specs/2026-04-11-oss-sts-upload-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/oss.ts` | Rewrite | STS AssumeRole + PostObject Policy signature generation |
| `src/app/api/upload/sts/route.ts` | Rewrite | Accept `purpose` query param, return signed upload credentials |
| `src/lib/upload-client.ts` | Create | Shared client-side upload-to-OSS logic (used by FileUploader and MarkdownEditor) |
| `src/components/admin/FileUploader.tsx` | Rewrite | Use policy-signed upload, add `purpose` prop |
| `src/app/admin/articles/new/page.tsx` | Modify line 280 | Add `purpose="covers"` to FileUploader |
| `src/app/admin/articles/[id]/page.tsx` | Modify line 384 | Add `purpose="covers"` to FileUploader |
| `src/app/admin/profile/page.tsx` | Modify | Replace avatar URL input with FileUploader |
| `src/app/admin/friend-links/page.tsx` | Modify | Add FileUploader alongside avatar input |
| `src/components/admin/MarkdownEditor.tsx` | Modify | Add paste/drop image upload support |

---

### Task 1: Rewrite `src/lib/oss.ts` — STS AssumeRole + Policy Signature

**Files:**
- Rewrite: `src/lib/oss.ts`

- [ ] **Step 1: Write the complete `src/lib/oss.ts`**

```typescript
import crypto from 'crypto'
import STS from 'ali-oss/lib/sts'

const VALID_PURPOSES = ['covers', 'avatars', 'editor'] as const
export type UploadPurpose = (typeof VALID_PURPOSES)[number]

interface STSCredentials {
  accessKeyId: string
  accessKeySecret: string
  securityToken: string
  expiration: string
}

interface SignedUploadResult {
  url: string
  key: string
  host: string
  policy: string
  signature: string
  ossAccessKeyId: string
  securityToken: string
}

function getConfig() {
  const region = process.env.OSS_REGION
  const bucket = process.env.OSS_BUCKET
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
  const roleArn = process.env.OSS_ROLE_ARN

  if (!region || !bucket || !accessKeyId || !accessKeySecret || !roleArn) {
    throw new Error('Missing OSS configuration. Check OSS_REGION, OSS_BUCKET, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_ROLE_ARN environment variables.')
  }

  return { region, bucket, accessKeyId, accessKeySecret, roleArn }
}

function generateFilePath(purpose: UploadPurpose, ext: string): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const ts = Date.now()
  const rand = Math.random().toString(36).substring(2, 8)
  return `uploads/${purpose}/${y}/${m}/${d}/${ts}-${rand}.${ext}`
}

export async function getSTSUploadCredentials(
  purpose: string,
  fileExt: string,
): Promise<SignedUploadResult> {
  if (!VALID_PURPOSES.includes(purpose as UploadPurpose)) {
    throw new Error(`Invalid purpose: ${purpose}. Must be one of: ${VALID_PURPOSES.join(', ')}`)
  }

  const cfg = getConfig()
  const sts = new STS({
    accessKeyId: cfg.accessKeyId,
    accessKeySecret: cfg.accessKeySecret,
  })

  // STS Policy: restrict to uploads/{purpose}/* only
  const stsPolicy = {
    Version: '1',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['oss:PutObject'],
        Resource: [`acs:oss:*:*:${cfg.bucket}/uploads/${purpose}/*`],
      },
    ],
  }

  const result = await sts.assumeRole(
    cfg.roleArn,
    stsPolicy,
    900, // 15 minutes
    `blog-upload-${Date.now()}`,
  )

  const creds: STSCredentials = {
    accessKeyId: result.credentials.AccessKeyId,
    accessKeySecret: result.credentials.AccessKeySecret,
    securityToken: result.credentials.SecurityToken,
    expiration: result.credentials.Expiration,
  }

  // Generate PostObject policy
  const key = generateFilePath(purpose as UploadPurpose, fileExt)
  const host = `https://${cfg.bucket}.${cfg.region}.aliyuncs.com`
  const expireTime = new Date(Date.now() + 15 * 60 * 1000)
  const expireStr = expireTime.toISOString()

  const policyDoc = {
    expiration: expireStr,
    conditions: [
      { bucket: cfg.bucket },
      ['starts-with', '$key', `uploads/${purpose}/`],
      ['content-length-range', 0, 10485760], // 10MB max
    ],
  }

  const policyBase64 = Buffer.from(JSON.stringify(policyDoc), 'utf-8').toString('base64')
  const signature = crypto.createHmac('sha1', creds.accessKeySecret).update(policyBase64).digest('base64')

  return {
    url: `${host}/${key}`,
    key,
    host,
    policy: policyBase64,
    signature,
    ossAccessKeyId: creds.accessKeyId,
    securityToken: creds.securityToken,
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit src/lib/oss.ts`
Expected: No errors (may show unrelated project errors — check only for oss.ts errors)

- [ ] **Step 3: Commit**

```bash
git add src/lib/oss.ts
git commit -m "feat: rewrite oss.ts with STS AssumeRole and PostObject policy signature"
```

---

### Task 2: Rewrite `/api/upload/sts` route

**Files:**
- Rewrite: `src/app/api/upload/sts/route.ts`

- [ ] **Step 1: Write the complete route file**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSTSUploadCredentials } from '@/lib/oss'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const purpose = searchParams.get('purpose') || 'editor'
  const fileExt = searchParams.get('fileExt') || 'jpg'

  try {
    const result = await getSTSUploadCredentials(purpose, fileExt)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get STS credentials error:', error)
    const message = error instanceof Error ? error.message : 'Failed to get upload credentials'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit src/app/api/upload/sts/route.ts`
Expected: No errors for this file

- [ ] **Step 3: Commit**

```bash
git add src/app/api/upload/sts/route.ts
git commit -m "feat: rewrite STS route to accept purpose and fileExt params"
```

---

### Task 3: Create shared client upload utility `src/lib/upload-client.ts`

**Files:**
- Create: `src/lib/upload-client.ts`

This extracts the common upload logic so both `FileUploader` and `MarkdownEditor` can reuse it.

- [ ] **Step 1: Write the upload client utility**

```typescript
export type UploadPurpose = 'covers' | 'avatars' | 'editor'

interface UploadResult {
  url: string
}

export async function uploadToOss(file: File, purpose: UploadPurpose): Promise<UploadResult> {
  const ext = file.name.split('.').pop() || 'jpg'
  const res = await fetch(`/api/upload/sts?purpose=${purpose}&fileExt=${ext}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || '获取上传凭证失败')
  }

  const sts = await res.json()

  const formData = new FormData()
  formData.append('key', sts.key)
  formData.append('OSSAccessKeyId', sts.ossAccessKeyId)
  formData.append('policy', sts.policy)
  formData.append('Signature', sts.signature)
  formData.append('x-oss-security-token', sts.securityToken)
  formData.append('file', file)

  const uploadRes = await fetch(sts.host, { method: 'POST', body: formData })
  if (!uploadRes.ok) {
    throw new Error('上传失败')
  }

  return { url: sts.url }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/upload-client.ts
git commit -m "feat: add shared upload-to-OSS client utility"
```

---

### Task 4: Rewrite `FileUploader` component

**Files:**
- Rewrite: `src/components/admin/FileUploader.tsx`

- [ ] **Step 1: Write the complete FileUploader component**

```tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { uploadToOss, type UploadPurpose } from '@/lib/upload-client'

interface FileUploaderProps {
  onUpload: (url: string) => void
  accept?: string
  purpose: UploadPurpose
}

export default function FileUploader({ onUpload, accept, purpose }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const result = await uploadToOss(file, purpose)
      onUpload(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }, [onUpload, purpose])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  return (
    <div>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-[var(--radius-lg)] p-8 text-center cursor-pointer transition-all duration-200 ${
          dragOver ? 'border-primary bg-accent' : 'border-border hover:border-primary/40 bg-muted/30'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input ref={fileInputRef} type="file" onChange={handleFileChange} accept={accept} className="hidden" />
        {uploading ? (
          <div className="text-muted-foreground">
            <svg className="animate-spin h-8 w-8 mx-auto mb-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="font-mono text-sm">上传中...</p>
          </div>
        ) : (
          <div className="text-muted-foreground">
            <svg className="h-10 w-10 mx-auto mb-2 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16V4m0 0L8 8m4-4l4 4M4 20h16" />
            </svg>
            <p className="font-mono text-sm">点击或拖拽文件到此处上传</p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/FileUploader.tsx
git commit -m "feat: rewrite FileUploader with purpose prop and shared upload utility"
```

---

### Task 5: Update article pages — add `purpose="covers"` to FileUploader

**Files:**
- Modify: `src/app/admin/articles/new/page.tsx` (line 280)
- Modify: `src/app/admin/articles/[id]/page.tsx` (line 384)

- [ ] **Step 1: Update `src/app/admin/articles/new/page.tsx`**

On line 280, change:
```tsx
<FileUploader onUpload={handleCoverUpload} accept="image/*" />
```
to:
```tsx
<FileUploader onUpload={handleCoverUpload} accept="image/*" purpose="covers" />
```

- [ ] **Step 2: Update `src/app/admin/articles/[id]/page.tsx`**

On line 384, change:
```tsx
<FileUploader onUpload={handleCoverUpload} accept="image/*" />
```
to:
```tsx
<FileUploader onUpload={handleCoverUpload} accept="image/*" purpose="covers" />
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/articles/new/page.tsx src/app/admin/articles/\[id\]/page.tsx
git commit -m "feat: add purpose=covers to article page FileUploader"
```

---

### Task 6: Update profile page — integrate FileUploader for avatar

**Files:**
- Modify: `src/app/admin/profile/page.tsx`

- [ ] **Step 1: Add FileUploader import and avatar upload to profile page**

Add import at top (after line 3):
```tsx
import FileUploader from '@/components/admin/FileUploader'
```

Replace the avatar URL input section (lines 101-104):
```tsx
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">头像 URL</label>
              <input type="url" value={profileForm.avatarUrl} onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })} placeholder="https://example.com/avatar.jpg" className={inputClass} />
            </div>
```

With:
```tsx
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">头像</label>
              {profileForm.avatarUrl && (
                <div className="mb-2">
                  <img src={profileForm.avatarUrl} alt="头像预览" className="w-16 h-16 rounded-full object-cover border border-border" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
              <div className="mb-2">
                <input type="url" value={profileForm.avatarUrl} onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })} placeholder="或手动输入头像 URL" className={inputClass} />
              </div>
              <FileUploader onUpload={(url) => setProfileForm({ ...profileForm, avatarUrl: url })} accept="image/*" purpose="avatars" />
            </div>
```

- [ ] **Step 2: Verify the page renders**

Run: `npm run build`
Expected: Successful build

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/profile/page.tsx
git commit -m "feat: add avatar upload with FileUploader to profile page"
```

---

### Task 7: Update friend links page — integrate FileUploader for avatar

**Files:**
- Modify: `src/app/admin/friend-links/page.tsx`

- [ ] **Step 1: Add FileUploader import and avatar upload to friend links page**

Add import at top (after line 9):
```tsx
import FileUploader from '@/components/admin/FileUploader'
```

Add state for showAvatarUploader after line 35:
```tsx
  const [showAvatarUploader, setShowAvatarUploader] = useState(false)
```

Add avatar upload handler after handleCancel function (after line 97):
```tsx
  function handleAvatarUpload(url: string) {
    setFormData({ ...formData, avatar: url })
    setShowAvatarUploader(false)
  }
```

Replace the avatar input section (lines 118-121):
```tsx
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">头像</label>
              <input type="text" value={formData.avatar} onChange={e => setFormData({ ...formData, avatar: e.target.value })} placeholder="头像图片 URL" className={inputClass} />
            </div>
```

With:
```tsx
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">头像</label>
              {formData.avatar && (
                <div className="mb-2">
                  <img src={formData.avatar} alt="头像预览" className="w-10 h-10 rounded-full object-cover border border-border" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
              <div className="mb-2 flex gap-2">
                <input type="text" value={formData.avatar} onChange={e => setFormData({ ...formData, avatar: e.target.value })} placeholder="头像图片 URL" className={inputClass} />
                <button
                  type="button"
                  onClick={() => setShowAvatarUploader(!showAvatarUploader)}
                  className="shrink-0 px-3 py-2 border border-border rounded-[var(--radius-sm)] bg-muted text-foreground hover:bg-border transition-colors text-sm"
                >
                  上传
                </button>
              </div>
              {showAvatarUploader && (
                <div className="mb-2 border border-border rounded-[var(--radius-sm)] p-3 bg-muted/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-foreground">上传头像</span>
                    <button type="button" onClick={() => setShowAvatarUploader(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">关闭</button>
                  </div>
                  <FileUploader onUpload={handleAvatarUpload} accept="image/*" purpose="avatars" />
                </div>
              )}
            </div>
```

Also reset showAvatarUploader in handleCancel — change:
```tsx
  function handleCancel() {
    setEditingId(null)
    setFormData(emptyForm)
    setError('')
  }
```
to:
```tsx
  function handleCancel() {
    setEditingId(null)
    setFormData(emptyForm)
    setShowAvatarUploader(false)
    setError('')
  }
```

And in handleSubmit success block, after `setEditingId(null)` (line 53), add:
```tsx
      setShowAvatarUploader(false)
```

- [ ] **Step 2: Verify the page renders**

Run: `npm run build`
Expected: Successful build

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/friend-links/page.tsx
git commit -m "feat: add avatar upload with FileUploader to friend links page"
```

---

### Task 8: Add image paste/drop upload to MarkdownEditor

**Files:**
- Modify: `src/components/admin/MarkdownEditor.tsx`

- [ ] **Step 1: Add upload import and handlers to MarkdownEditor**

Add import after line 3:
```tsx
import { uploadToOss } from '@/lib/upload-client'
```

Add state and handlers after the `insertMarkdown` useCallback (after line 55), before `const toc = extractTOC(value)`:

```tsx
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleImageUpload = useCallback(async (file: File) => {
    const placeholder = `![上传中...]()`
    const cursorPos = value.length
    const newValue = value + (value && !value.endsWith('\n') ? '\n' : '') + placeholder + '\n'
    onChange(newValue)

    try {
      const result = await uploadToOss(file, 'editor')
      const finalMarkdown = newValue.replace(placeholder, `![图片](${result.url})`)
      onChange(finalMarkdown)
    } catch {
      const finalMarkdown = newValue.replace(placeholder, `![上传失败]()`)
      onChange(finalMarkdown)
    }
  }, [value, onChange])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) handleImageUpload(file)
        return
      }
    }
  }, [handleImageUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    const files = e.dataTransfer?.files
    if (!files) return
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        e.preventDefault()
        handleImageUpload(file)
        return
      }
    }
  }, [handleImageUpload])
```

- [ ] **Step 2: Add ref and event handlers to the textarea element**

Replace the textarea element (around line 149-155):
```tsx
            <textarea
              data-editor="markdown"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="在这里编写 Markdown 内容..."
              className="w-full p-4 min-h-[500px] font-mono text-sm resize-none focus:outline-none bg-card text-foreground"
            />
```

With:
```tsx
            <textarea
              ref={textareaRef}
              data-editor="markdown"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              onDrop={handleDrop}
              placeholder="在这里编写 Markdown 内容...&#10;支持粘贴或拖拽图片上传"
              className="w-full p-4 min-h-[500px] font-mono text-sm resize-none focus:outline-none bg-card text-foreground"
            />
```

- [ ] **Step 3: Also add onDrop to the outer editor div to catch drops on the entire editor area**

Add `onDrop={showEditor ? handleDrop : undefined}` to the `<div className="flex">` element (around line 145):
```tsx
      <div className="flex" onDrop={showEditor ? handleDrop : undefined} onDragOver={showEditor ? (e) => e.preventDefault() : undefined}>
```

- [ ] **Step 4: Verify TypeScript compiles and build succeeds**

Run: `npm run build`
Expected: Successful build

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/MarkdownEditor.tsx
git commit -m "feat: add image paste/drop upload to Markdown editor"
```

---

### Task 9: Build verification and integration test

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: Build completes with no errors

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No new lint errors

- [ ] **Step 3: Verify all modified files are committed**

Run: `git status`
Expected: Clean working tree

- [ ] **Step 4: Review the diff against the spec**

Run: `git log --oneline -10`
Expected: 8 commits corresponding to Tasks 1-8 above

---

## Self-Review Checklist

### Spec Coverage

| Spec Requirement | Task |
|-----------------|------|
| `src/lib/oss.ts` — STS AssumeRole | Task 1 |
| `src/lib/oss.ts` — PostObject Policy signature | Task 1 |
| `/api/upload/sts` — purpose param, auth, returns signed info | Task 2 |
| FileUploader — purpose prop, Policy-signed upload | Task 4 |
| Article covers — purpose="covers" | Task 5 |
| Profile avatar — FileUploader integration | Task 6 |
| Friend link avatar — FileUploader integration | Task 7 |
| Editor image upload — paste/drop support | Task 8 |
| Shared upload utility | Task 3 |
| Security — auth check, STS policy, 15min expiry, 10MB limit | Tasks 1, 2 |
| File path — `uploads/{purpose}/{y}/{m}/{d}/{ts}-{rand}.{ext}` | Task 1 |

### Placeholder Scan

No TODO/TBD/placeholder patterns found.

### Type Consistency

- `UploadPurpose` = `'covers' | 'avatars' | 'editor'` — defined in both `src/lib/oss.ts` (exported) and `src/lib/upload-client.ts` (imported by components)
- `uploadToOss(file: File, purpose: UploadPurpose)` returns `{ url: string }` — used consistently in FileUploader and MarkdownEditor
- `getSTSUploadCredentials(purpose: string, fileExt: string)` returns `SignedUploadResult` — called only from the STS route
- FileUploader props: `onUpload: (url: string) => void`, `accept?: string`, `purpose: UploadPurpose` — consistent across all usage sites
