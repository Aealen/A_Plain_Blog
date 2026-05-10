'use server'
import prisma from '@/lib/prisma'
import { getSiteConfig, setSiteConfig } from '@/actions/admin/site'
import { DEFAULT_BASE_URL } from '@/lib/constants'

export async function getSubmitUrls() {
  const baseUrl = (await getSiteConfig('baseUrl')) || process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE_URL

  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true },
    orderBy: { createdAt: 'desc' },
  })

  const urls = [
    baseUrl,
    `${baseUrl}/categories`,
    `${baseUrl}/tags`,
    `${baseUrl}/archives`,
    `${baseUrl}/about`,
    `${baseUrl}/links`,
    ...articles.map(a => `${baseUrl}/articles/${a.slug}`),
  ]

  return urls
}

export async function getUrlSubmitStatus() {
  const urls = await getSubmitUrls()
  const records = await prisma.searchSubmitRecord.findMany({
    where: { url: { in: urls } },
    select: { url: true, engine: true, status: true },
  })

  const statusMap = new Map<string, Record<string, string>>()
  for (const r of records) {
    let entry = statusMap.get(r.url)
    if (!entry) {
      entry = {}
      statusMap.set(r.url, entry)
    }
    entry[r.engine] = r.status
  }

  return urls.map(url => ({
    url,
    baidu: statusMap.get(url)?.baidu || 'pending',
    bing: statusMap.get(url)?.bing || 'pending',
    google: statusMap.get(url)?.google || 'pending',
  }))
}

export async function syncSubmitQueue() {
  const urls = await getSubmitUrls()
  const engines = ['baidu', 'bing', 'google']
  let added = 0
  for (const url of urls) {
    for (const engine of engines) {
      const existing = await prisma.searchSubmitRecord.findUnique({
        where: { url_engine: { url, engine } },
      })
      if (!existing) {
        await prisma.searchSubmitRecord.create({
          data: { url, engine, status: 'pending' },
        })
        added++
      }
    }
  }
  return { added, total: urls.length }
}

export async function getSubmitStats() {
  const quota = parseInt((await getSiteConfig('baiduDailyQuota')) || '100', 10)

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [pending, submitted, todayCount, failed] = await Promise.all([
    prisma.searchSubmitRecord.count({ where: { engine: 'baidu', status: 'pending' } }),
    prisma.searchSubmitRecord.count({ where: { engine: 'baidu', status: 'submitted' } }),
    prisma.searchSubmitRecord.count({
      where: { engine: 'baidu', status: 'submitted', submittedAt: { gte: todayStart } },
    }),
    prisma.searchSubmitRecord.count({ where: { engine: 'baidu', status: 'failed' } }),
  ])

  return { pending, submitted, todayCount, failed, quota, remaining: Math.max(0, quota - todayCount) }
}

export async function getSearchEngineConfigs() {
  const [baiduEnabled, baiduToken, baiduSite, baiduDailyQuota, bingEnabled, bingApiKey, bingSite, googleEnabled, googleClientEmail, googlePrivateKey] = await Promise.all([
    getSiteConfig('baiduEnabled'),
    getSiteConfig('baiduToken'),
    getSiteConfig('baiduSite'),
    getSiteConfig('baiduDailyQuota'),
    getSiteConfig('bingEnabled'),
    getSiteConfig('bingApiKey'),
    getSiteConfig('bingSite'),
    getSiteConfig('googleEnabled'),
    getSiteConfig('googleClientEmail'),
    getSiteConfig('googlePrivateKey'),
  ])

  return {
    baiduEnabled: baiduEnabled === 'true',
    baiduToken: baiduToken || '',
    baiduSite: baiduSite || '',
    baiduDailyQuota: baiduDailyQuota || '100',
    bingEnabled: bingEnabled === 'true',
    bingApiKey: bingApiKey || '',
    bingSite: bingSite || '',
    googleEnabled: googleEnabled === 'true',
    googleClientEmail: googleClientEmail || '',
    googlePrivateKey: googlePrivateKey || '',
  }
}

export async function saveSearchEngineConfigs(configs: {
  baiduEnabled: boolean
  baiduToken: string
  baiduSite: string
  baiduDailyQuota: string
  bingEnabled: boolean
  bingApiKey: string
  bingSite: string
  googleEnabled: boolean
  googleClientEmail: string
  googlePrivateKey: string
}) {
  await Promise.all([
    setSiteConfig('baiduEnabled', String(configs.baiduEnabled)),
    setSiteConfig('baiduToken', configs.baiduToken),
    setSiteConfig('baiduSite', configs.baiduSite),
    setSiteConfig('baiduDailyQuota', configs.baiduDailyQuota),
    setSiteConfig('bingEnabled', String(configs.bingEnabled)),
    setSiteConfig('bingApiKey', configs.bingApiKey),
    setSiteConfig('bingSite', configs.bingSite),
    setSiteConfig('googleEnabled', String(configs.googleEnabled)),
    setSiteConfig('googleClientEmail', configs.googleClientEmail),
    setSiteConfig('googlePrivateKey', configs.googlePrivateKey),
  ])
  return { success: true }
}

export async function submitToBaiduBatch() {
  const configs = await getSearchEngineConfigs()
  if (!configs.baiduEnabled) {
    return { success: false, message: '百度推送未启用' }
  }
  if (!configs.baiduToken || !configs.baiduSite) {
    return { success: false, message: '请先配置百度推送 Token 和站点域名' }
  }

  const quota = parseInt(configs.baiduDailyQuota, 10) || 100
  const stats = await getSubmitStats()
  const limit = Math.min(stats.remaining, stats.pending)
  if (limit <= 0) {
    return { success: false, message: stats.remaining <= 0 ? '今日配额已用完' : '没有待提交的 URL' }
  }

  const records = await prisma.searchSubmitRecord.findMany({
    where: { engine: 'baidu', status: 'pending' },
    take: limit,
    orderBy: { createdAt: 'asc' },
  })

  const urls = records.map(r => r.url)

  try {
    const res = await fetch(
      `http://data.zz.baidu.com/urls?site=${configs.baiduSite}&token=${configs.baiduToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain', 'User-Agent': 'curl/7.12.1' },
        body: urls.join('\n'),
      }
    )

    const data = await res.json()
    const successCount = data.success ?? 0

    const now = new Date()
    if (successCount > 0) {
      await prisma.searchSubmitRecord.updateMany({
        where: { id: { in: records.slice(0, successCount).map(r => r.id) } },
        data: { status: 'submitted', submittedAt: now },
      })
    }

    const failedCount = urls.length - successCount
    if (failedCount > 0) {
      await prisma.searchSubmitRecord.updateMany({
        where: { id: { in: records.slice(successCount).map(r => r.id) } },
        data: { status: 'failed', error: data.message || `部分失败`, submittedAt: now },
      })
    }

    return {
      success: successCount > 0,
      message: `成功推送 ${successCount} 条${failedCount > 0 ? `，失败 ${failedCount} 条` : ''}，今日剩余配额 ${quota - stats.todayCount - successCount}`,
    }
  } catch (err) {
    return { success: false, message: `请求失败: ${err instanceof Error ? err.message : '未知错误'}` }
  }
}

export async function resetFailedRecords() {
  const count = await prisma.searchSubmitRecord.updateMany({
    where: { engine: 'baidu', status: 'failed' },
    data: { status: 'pending', error: null },
  })
  return { reset: count.count }
}

export async function submitToBaidu(urls: string[]) {
  const configs = await getSearchEngineConfigs()
  if (!configs.baiduEnabled) {
    return { success: false, message: '百度推送未启用，请先开启开关并配置' }
  }
  if (!configs.baiduToken || !configs.baiduSite) {
    return { success: false, message: '请先配置百度推送 Token 和站点域名' }
  }

  const res = await fetch(
    `http://data.zz.baidu.com/urls?site=${configs.baiduSite}&token=${configs.baiduToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'curl/7.12.1',
      },
      body: urls.join('\n'),
    }
  )

  const data = await res.json()
  if (data.success !== undefined) {
    return { success: true, successCount: data.success, remain: data.remain, message: `成功推送 ${data.success} 条，剩余可推送 ${data.remain} 条` }
  }
  return { success: false, message: data.message || `百度返回错误码 ${data.error}` }
}

export async function submitToBing(urls: string[]) {
  const configs = await getSearchEngineConfigs()
  if (!configs.bingEnabled) {
    return { success: false, message: 'Bing 提交未启用，请先开启开关并配置' }
  }
  if (!configs.bingApiKey) {
    return { success: false, message: '请先配置 Bing API Key' }
  }

  const siteUrl = configs.bingSite || (await getSiteConfig('baseUrl')) || process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE_URL

  const res = await fetch('https://www.bing.com/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: new URL(siteUrl).host,
      key: configs.bingApiKey,
      urlList: urls,
    }),
  })

  if (res.ok) {
    await prisma.searchSubmitRecord.updateMany({
      where: { url: { in: urls }, engine: 'bing' },
      data: { status: 'submitted', submittedAt: new Date() },
    })
    return { success: true, message: `成功提交 ${urls.length} 条 URL 到 Bing` }
  }
  const text = await res.text()
  return { success: false, message: `Bing 返回 ${res.status}: ${text}` }
}

export async function submitToGoogle(urls: string[]) {
  const configs = await getSearchEngineConfigs()
  if (!configs.googleEnabled) {
    return { success: false, message: 'Google 提交未启用，请先开启开关并配置' }
  }
  if (!configs.googleClientEmail || !configs.googlePrivateKey) {
    return { success: false, message: '请先配置 Google 服务账号邮箱和私钥' }
  }

  const token = await getGoogleAccessToken(configs.googleClientEmail, configs.googlePrivateKey)
  if (!token) {
    return { success: false, message: '获取 Google Access Token 失败，请检查服务账号凭证' }
  }

  let successCount = 0
  const errors: string[] = []

  for (const url of urls) {
    try {
      const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url, type: 'URL_UPDATED' }),
      })
      if (res.ok) {
        successCount++
      } else {
        const err = await res.json()
        errors.push(`${url}: ${err.error?.message || res.status}`)
      }
    } catch {
      errors.push(`${url}: 请求失败`)
    }
  }

  if (errors.length === 0) {
    await prisma.searchSubmitRecord.updateMany({
      where: { url: { in: urls }, engine: 'google' },
      data: { status: 'submitted', submittedAt: new Date() },
    })
    return { success: true, message: `成功提交 ${successCount} 条 URL 到 Google` }
  }
  if (successCount > 0) {
    await prisma.searchSubmitRecord.updateMany({
      where: { url: { in: urls.slice(0, successCount) }, engine: 'google' },
      data: { status: 'submitted', submittedAt: new Date() },
    })
  }
  return { success: successCount > 0, message: `成功 ${successCount} 条，失败 ${errors.length} 条：${errors.slice(0, 3).join('; ')}` }
}

async function getGoogleAccessToken(clientEmail: string, privateKey: string): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const signInput = `${header}.${payload}`

  const key = privateKey.replace(/\\n/g, '\n')
  const keyData = pemToArrayBuffer(key)

  const cryptoKey = await crypto.subtle.importKey('pkcs8', keyData, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signInput))
  const jwt = `${signInput}.${base64url(new Uint8Array(signature))}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })

  const data = await res.json()
  return data.access_token || null
}

function base64url(input: string | Uint8Array): string {
  const str = typeof input === 'string' ? input : String.fromCharCode(...input)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN.*?-----/g, '').replace(/-----END.*?-----/g, '').replace(/\s/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}
