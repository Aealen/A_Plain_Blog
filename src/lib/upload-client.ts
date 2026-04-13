export type UploadPurpose = 'covers' | 'avatars' | 'editor' | 'site'

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