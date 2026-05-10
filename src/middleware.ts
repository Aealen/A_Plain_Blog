import { NextResponse } from 'next/server'

export default function middleware(req: any) {
  const pathname = req.nextUrl.pathname

  // Redirect old admin/login to new login
  if (pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Bing IndexNow key verification: /{key}.txt -> /api/bing-indexnow-key?key={key}
  if (pathname.endsWith('.txt') && !pathname.startsWith('/api/') && !pathname.startsWith('/admin/')) {
    const key = pathname.slice(1, -4) // remove leading / and trailing .txt
    const url = new URL('/api/bing-indexnow-key', req.url)
    url.searchParams.set('key', key)
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/login', '/:bingKey.txt'],
}
