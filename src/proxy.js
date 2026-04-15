import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export const proxy = auth(function proxyHandler(request) {
  const session = request.auth
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
