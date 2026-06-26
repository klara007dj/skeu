import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import ShippingZone from '@/models/ShippingZone'
import { isAdminFromRequest } from '@/lib/auth'
import { isDbUnavailable } from '@/lib/helpers'

// GET /api/admin/shipping -> all zones
export async function GET(req: NextRequest) {
  if (!isAdminFromRequest(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  try {
    await connectDB()
    const zones = await ShippingZone.find().sort({ createdAt: 1 }).lean()
    return NextResponse.json({ zones })
  } catch (error: any) {
    if (isDbUnavailable(error)) return NextResponse.json({ zones: [], warning: 'Base de donnees indisponible' })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/admin/shipping -> create a delivery zone with its fee
export async function POST(req: NextRequest) {
  if (!isAdminFromRequest(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  try {
    await connectDB()
    const { name, fee, active, isDefault } = await req.json()
    if (!String(name || '').trim()) return NextResponse.json({ error: 'Nom de la zone requis' }, { status: 400 })
    const numericFee = Number(fee)
    if (!Number.isFinite(numericFee) || numericFee < 0) {
      return NextResponse.json({ error: 'Frais invalides' }, { status: 400 })
    }

    if (isDefault) await ShippingZone.updateMany({}, { isDefault: false })

    const zone = await ShippingZone.create({
      name: String(name).trim(),
      fee: Math.round(numericFee),
      active: active !== false,
      isDefault: !!isDefault,
    })
    return NextResponse.json({ zone }, { status: 201 })
  } catch (error: any) {
    if (isDbUnavailable(error)) {
      return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
