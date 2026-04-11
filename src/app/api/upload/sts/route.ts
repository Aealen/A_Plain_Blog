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