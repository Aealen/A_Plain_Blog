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
