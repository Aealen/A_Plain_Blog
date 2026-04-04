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
