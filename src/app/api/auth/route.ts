import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { isDbUnavailable } from '@/lib/helpers'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
    }


    const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
    const adminPassword = String(process.env.ADMIN_PASSWORD || '')

    if (
      adminEmail &&
      adminPassword &&
      normalizedEmail === adminEmail &&
      String(password) === adminPassword
    ) {
      const token = signToken({ role: 'admin', email: normalizedEmail, name: 'Administrateur' }, '7d')
      const response = NextResponse.json({ success: true, message: 'Connexion reussie' })
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
      return response
    }

    await connectDB()
    const user = await User.findOne({ email: normalizedEmail })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }

    const valid = await bcrypt.compare(String(password), user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }

    const token = signToken({ id: String(user._id), role: 'admin', email: user.email, name: user.name }, '7d')

    const response = NextResponse.json({ success: true, message: 'Connexion reussie' })
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error: any) {
    if (isDbUnavailable(error)) {
      return NextResponse.json({ error: 'Base de donnees indisponible. Reessayez plus tard.' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('auth_token')
  return response
}
