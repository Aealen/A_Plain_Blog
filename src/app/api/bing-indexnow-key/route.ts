import { NextRequest, NextResponse } from 'next/server'
import { getSiteConfig } from '@/actions/admin/site'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')
  const configuredKey = await getSiteConfig('bingApiKey')

  if (!configuredKey || key !== configuredKey) {
    return new NextResponse('Not Found', { status: 404 })
  }

  return new NextResponse(configuredKey, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
