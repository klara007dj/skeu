import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { isAdminFromRequest } from '@/lib/auth'
import { isDbUnavailable, generateReferralCode } from '@/lib/helpers'
import { getAllResellerStats } from '@/lib/resellerStats'

// GET /api/admin/resellers  -> all resellers with aggregated stats
export async function GET(req: NextRequest) {
  if (!isAdminFromRequest(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  try {
    await connectDB()
    const resellers = await getAllResellerStats()
    return NextResponse.json({ resellers })
  } catch (error: any) {
    if (isDbUnavailable(error)) {
      return NextResponse.json({ resellers: [], warning: 'Base de donnees indisponible' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/admin/resellers  -> promote an existing user (by email) to reseller
export async function POST(req: NextRequest) {
  if (!isAdminFromRequest(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  try {
    await connectDB()
    const { email, whatsappNumber, resellerCity, resellerBio } = await req.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email du compte requis' }, { status: 400 })
    }

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return NextResponse.json(
        { error: "Aucun compte avec cet email. La personne doit d'abord creer un compte client." },
        { status: 404 }
      )
    }
    if (user.role === 'admin') {
      return NextResponse.json({ error: "Impossible de transformer l'administrateur en revendeur" }, { status: 400 })
    }
    if (user.role === 'reseller') {
      return NextResponse.json({ error: 'Ce compte est deja revendeur' }, { status: 409 })
    }

    // Generate a unique referral code
    let code = generateReferralCode(user.name)
    for (let i = 0; i < 5; i++) {
      const exists = await User.findOne({ referralCode: code }).lean()
      if (!exists) break
      code = generateReferralCode(user.name)
    }

    user.role = 'reseller'
    user.referralCode = code
    user.resellerActive = true
    user.whatsappNumber = String(whatsappNumber || user.phone || '').trim()
    user.resellerCity = String(resellerCity || '').trim()
    user.resellerBio = String(resellerBio || '').trim()
    // A reseller cannot be referred by another reseller
    user.referredBy = null
    user.referredByCode = undefined
    await user.save()

    return NextResponse.json({
      success: true,
      reseller: { id: String(user._id), name: user.name, email: user.email, referralCode: code },
    })
  } catch (error: any) {
    if (isDbUnavailable(error)) {
      return NextResponse.json({ error: 'Base de donnees indisponible. Reessayez plus tard.' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
