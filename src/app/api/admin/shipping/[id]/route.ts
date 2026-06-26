import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import ShippingZone from '@/models/ShippingZone'
import { isAdminFromRequest } from '@/lib/auth'
import { isDbUnavailable } from '@/lib/helpers'

// PATCH /api/admin/shipping/:id -> update a zone fee / status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminFromRequest(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  try {
    await connectDB()
    const body = await req.json()
    const update: Record<string, any> = {}
    if (typeof body.name === 'string') update.name = body.name.trim()
    if (body.fee !== undefined) {
      const fee = Number(body.fee)
      if (!Number.isFinite(fee) || fee < 0) return NextResponse.json({ error: 'Frais invalides' }, { status: 400 })
      update.fee = Math.round(fee)
    }
    if (typeof body.active === 'boolean') update.active = body.active
    if (typeof body.isDefault === 'boolean') {
      if (body.isDefault) await ShippingZone.updateMany({}, { isDefault: false })
      update.isDefault = body.isDefault
    }

    const zone = await ShippingZone.findByIdAndUpdate(params.id, update, { new: true }).lean()
    if (!zone) return NextResponse.json({ error: 'Zone introuvable' }, { status: 404 })
    return NextResponse.json({ zone })
  } catch (error: any) {
    if (isDbUnavailable(error)) return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 503 })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

// DELETE /api/admin/shipping/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminFromRequest(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  try {
    await connectDB()
    await ShippingZone.findByIdAndDelete(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (isDbUnavailable(error)) return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 503 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
