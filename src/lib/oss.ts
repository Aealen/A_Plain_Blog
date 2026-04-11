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
