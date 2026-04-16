import { NextResponse } from 'next/server'

export function proxy() {
  // Não fazer redirect no proxy - deixar as páginas validarem via requireAdmin()
  // Isso evita loops de redirect em produção
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/cadastro', '/devedor/:path*', '/acesso/:path*'],
}
