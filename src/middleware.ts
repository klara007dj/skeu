import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_change_me')

async function getRole(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return (payload.role as string) || null
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('auth_token')?.value
  const role = token ? await getRole(token) : null

  // Admin area
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  // Reseller area
  if (pathname.startsWith('/reseller')) {
    if (role !== 'reseller') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/reseller/:path*'],
}
