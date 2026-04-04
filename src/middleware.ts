import { NextResponse } from 'next/server'

export default function middleware(req: any) {
  const pathname = req.nextUrl.pathname
  
  // Redirect old admin/login to new login
  if (pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/login'],
}
