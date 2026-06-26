import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { isAdminFromRequest } from '@/lib/auth'
import { isDbUnavailable } from '@/lib/helpers'
import { getResellerDetail } from '@/lib/resellerStats'

// GET /api/admin/resellers/:id -> full detail (profile, stats, orders, ratings, customers)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminFromRequest(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  try {
    await connectDB()
    const detail = await getResellerDetail(params.id)
    if (!detail) return NextResponse.json({ error: 'Revendeur introuvable' }, { status: 404 })
    return NextResponse.json(detail)
  } catch (error: any) {
    if (isDbUnavailable(error)) {
      return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/admin/resellers/:id -> update profile / suspend / reactivate
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminFromRequest(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  try {
    await connectDB()
    const body = await req.json()
    const update: Record<string, any> = {}
    if (typeof body.whatsappNumber === 'string') update.whatsappNumber = body.whatsappNumber.trim()
    if (typeof body.resellerCity === 'string') update.resellerCity = body.resellerCity.trim()
    if (typeof body.resellerBio === 'string') update.resellerBio = body.resellerBio.trim()
    if (typeof body.resellerActive === 'boolean') update.resellerActive = body.resellerActive

    const reseller = await User.findOneAndUpdate(
      { _id: params.id, role: 'reseller' },
      update,
      { new: true }
    ).lean()
    if (!reseller) return NextResponse.json({ error: 'Revendeur introuvable' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (isDbUnavailable(error)) {
      return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

// DELETE /api/admin/resellers/:id -> demote a reseller back to customer
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminFromRequest(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  try {
    await connectDB()
    const reseller = await User.findOne({ _id: params.id, role: 'reseller' })
    if (!reseller) return NextResponse.json({ error: 'Revendeur introuvable' }, { status: 404 })
    reseller.role = 'customer'
    reseller.referralCode = undefined
    reseller.resellerActive = false
    await reseller.save()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (isDbUnavailable(error)) {
      return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
