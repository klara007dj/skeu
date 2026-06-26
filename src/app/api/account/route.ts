import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { getTokenFromRequest, signToken, verifyToken, SessionPayload } from '@/lib/auth'
import { isDbUnavailable } from '@/lib/helpers'

function buildAuthResponse(payload: SessionPayload) {
  const token = signToken(payload, '7d')
  const response = NextResponse.json({ success: true, user: payload })
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return response
}

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ user: null })

    const decoded = verifyToken(token) as any
    if (!decoded?.email) return NextResponse.json({ user: null })

    if (decoded.role === 'admin') {
      return NextResponse.json({
        user: {
          name: decoded.name || 'Administrateur',
          email: decoded.email,
          role: 'admin',
        },
      })
    }

    await connectDB()
    const user = await User.findOne({ email: decoded.email })
      .populate('referredBy', 'name whatsappNumber referralCode resellerActive')
      .lean()
    if (!user) return NextResponse.json({ user: null })

    const reseller = (user as any).referredBy
    return NextResponse.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        referralCode: user.referralCode || '',
        whatsappNumber: user.whatsappNumber || '',
        resellerBio: user.resellerBio || '',
        resellerCity: user.resellerCity || '',
        referredBy: reseller
          ? {
              id: String(reseller._id),
              name: reseller.name,
              whatsappNumber: reseller.whatsappNumber || '',
              referralCode: reseller.referralCode || '',
              active: reseller.resellerActive !== false,
            }
          : null,
      },
    })
  } catch {
    return NextResponse.json({ user: null, warning: 'Session indisponible temporairement' })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, name, email, password, phone, referralCode } = await req.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const trimmedName = String(name || '').trim()
    const rawPassword = String(password || '')
    const refCode = String(referralCode || '').trim().toUpperCase()

    if (!normalizedEmail || !rawPassword) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
    }

    const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
    const adminPassword = String(process.env.ADMIN_PASSWORD || '')

    if (
      adminEmail &&
      adminPassword &&
      normalizedEmail === adminEmail &&
      rawPassword === adminPassword
    ) {
      return buildAuthResponse({ email: normalizedEmail, role: 'admin', name: trimmedName || 'Administrateur' })
    }
    await connectDB()

    if (action === 'register') {
      if (!trimmedName) {
        return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
      }
      if (rawPassword.length < 6) {
        return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caracteres' }, { status: 400 })
      }

      const existingUser = await User.findOne({ email: normalizedEmail })
      if (existingUser) {
        return NextResponse.json({ error: 'Un compte existe deja avec cet email' }, { status: 409 })
      }

      // Resolve referral code (a customer can sign up via a reseller link/code)
      let referredBy: any = null
      let referredByCode: string | undefined
      if (refCode) {
        const reseller = await User.findOne({ referralCode: refCode, role: 'reseller' }).lean()
        if (reseller) {
          referredBy = reseller._id
          referredByCode = refCode
        }
      }

      const hashedPassword = await bcrypt.hash(rawPassword, 12)
      const createdUser = await User.create({
        name: trimmedName,
        email: normalizedEmail,
        phone: String(phone || '').trim(),
        password: hashedPassword,
        role: 'customer',
        referredBy,
        referredByCode,
      })

      return buildAuthResponse({
        id: String(createdUser._id),
        email: createdUser.email,
        role: 'customer',
        name: createdUser.name,
      })
    }

    if (action === 'login') {
      const user = await User.findOne({ email: normalizedEmail })
      if (!user) {
        return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
      }

      const validPassword = await bcrypt.compare(rawPassword, user.password)
      if (!validPassword) {
        return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
      }

      // A linked customer can use a reseller code later by passing it on login.
      if (refCode && user.role === 'customer' && !user.referredBy) {
        const reseller = await User.findOne({ referralCode: refCode, role: 'reseller' }).lean()
        if (reseller) {
          user.referredBy = reseller._id as any
          user.referredByCode = refCode
          await user.save()
        }
      }

      return buildAuthResponse({
        id: String(user._id),
        email: user.email,
        role: user.role,
        name: user.name,
      })
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
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
