import { NextRequest, NextResponse } from 'next/server'
import { recordVisit } from '@/lib/visitor'
import { cookies } from 'next/headers'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, referrer } = body

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    let visitorId = cookieStore.get('visitor_id')?.value
    let sessionId = cookieStore.get('session_id')?.value

    const isNewVisitor = !visitorId
    const isNewSession = !sessionId

    if (!visitorId) visitorId = generateId()
    if (!sessionId) sessionId = generateId()

    await recordVisit({
      visitorId,
      sessionId,
      path,
      referrer,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
    })

    const response = NextResponse.json({ success: true })

    if (isNewVisitor) {
      response.cookies.set('visitor_id', visitorId, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60,
        path: '/',
      })
    }

    if (isNewSession) {
      response.cookies.set('session_id', sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 30 * 60,
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Visit tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
