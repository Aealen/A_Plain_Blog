import { NextRequest, NextResponse } from 'next/server'
import { submitToBaiduBatch } from '@/actions/admin/search-submit'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await submitToBaiduBatch()
  return NextResponse.json(result)
}
