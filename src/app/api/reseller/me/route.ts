import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { getSession } from '@/lib/auth'
import { isDbUnavailable, normalizePhone } from '@/lib/helpers'
import { getResellerDetail } from '@/lib/resellerStats'

// GET /api/reseller/me -> the logged-in reseller's own profile, stats, orders and ratings
export async function GET(req: NextRequest) {
  const session = getSession(req)
  if (!session || session.role !== 'reseller') {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }
  try {
    await connectDB()
    const me = await User.findOne({ email: session.email, role: 'reseller' }).lean()
    if (!me) return NextResponse.json({ error: 'Compte revendeur introuvable' }, { status: 404 })
    const detail = await getResellerDetail(String(me._id))
    return NextResponse.json(detail)
  } catch (error: any) {
    if (isDbUnavailable(error)) {
      return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/reseller/me -> reseller updates their own contact info (not the referral code)
export async function PATCH(req: NextRequest) {
  const session = getSession(req)
  if (!session || session.role !== 'reseller') {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }
  try {
    await connectDB()
    const body = await req.json()
    const update: Record<string, any> = {}
    if (typeof body.whatsappNumber === 'string') update.whatsappNumber = normalizePhone(body.whatsappNumber)
    if (typeof body.resellerCity === 'string') update.resellerCity = body.resellerCity.trim()
    if (typeof body.resellerBio === 'string') update.resellerBio = body.resellerBio.trim().slice(0, 1000)
    if (typeof body.phone === 'string') update.phone = body.phone.trim()

    await User.updateOne({ email: session.email, role: 'reseller' }, update)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (isDbUnavailable(error)) {
      return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
