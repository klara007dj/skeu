import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Order from '@/models/Order'
import { isAdminFromRequest } from '@/lib/auth'
import { isDbUnavailable } from '@/lib/helpers'

export async function GET(req: NextRequest) {
  if (!isAdminFromRequest(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  try {
    await connectDB()
    const orders = await Order.find()
      .populate('resellerId', 'name referralCode')
      .sort({ createdAt: -1 })
      .lean()
    return NextResponse.json({ orders })
  } catch (error: any) {
    if (isDbUnavailable(error)) {
      return NextResponse.json({ orders: [], warning: 'Base de donnees indisponible' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
