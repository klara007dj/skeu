import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me'

export interface SessionPayload {
  id?: string
  email: string
  name: string
  role: 'customer' | 'admin' | 'reseller'
}

export function signToken(payload: object, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions)
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function getTokenFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  const cookie = req.cookies.get('auth_token')
  return cookie?.value || null
}

/** Returns the decoded session payload, or null if missing/invalid. */
export function getSession(req: NextRequest): SessionPayload | null {
  const token = getTokenFromRequest(req)
  if (!token) return null
  const decoded = verifyToken(token) as any
  if (!decoded?.email || !decoded?.role) return null
  return {
    id: decoded.id,
    email: decoded.email,
    name: decoded.name,
    role: decoded.role,
  }
}

export function isAdminFromRequest(req: NextRequest): boolean {
  return getSession(req)?.role === 'admin'
}

export function isResellerFromRequest(req: NextRequest): boolean {
  return getSession(req)?.role === 'reseller'
}
