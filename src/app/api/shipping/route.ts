import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import ShippingZone from '@/models/ShippingZone'
import { isDbUnavailable } from '@/lib/helpers'

// GET /api/shipping -> active zones (public, used on the checkout page)
export async function GET() {
  try {
    await connectDB()
    const zones = await ShippingZone.find({ active: true }).sort({ fee: 1 }).lean()
    return NextResponse.json({ zones })
  } catch (error: any) {
    if (isDbUnavailable(error)) {
      return NextResponse.json({ zones: [], warning: 'Base de donnees indisponible' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
