import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSTSConfig } from '@/lib/oss'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stsConfig = getSTSConfig()
    return NextResponse.json(stsConfig)
  } catch (error) {
    console.error('Get STS config error:', error)
    return NextResponse.json({ error: 'Failed to get STS config' }, { status: 500 })
  }
}
