import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { isAdminFromRequest } from '@/lib/auth'
import { isDbUnavailable } from '@/lib/helpers'
import { getAllResellerStats, getResellerDetail } from '@/lib/resellerStats'

// GET /api/admin/reports            -> general report (all resellers + totals)
// GET /api/admin/reports?resellerId -> personal report for one reseller
export async function GET(req: NextRequest) {
  if (!isAdminFromRequest(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const resellerId = searchParams.get('resellerId')

    if (resellerId) {
      const detail = await getResellerDetail(resellerId)
      if (!detail) return NextResponse.json({ error: 'Revendeur introuvable' }, { status: 404 })
      return NextResponse.json({ type: 'personal', generatedAt: new Date().toISOString(), ...detail })
    }

    const resellers = await getAllResellerStats()
    const totals = resellers.reduce(
      (acc, r) => {
        acc.revenue += r.revenue
        acc.pendingRevenue += r.pendingRevenue
        acc.paidOrders += r.paidOrders
        acc.totalOrders += r.totalOrders
        acc.customers += r.customers
        return acc
      },
      { revenue: 0, pendingRevenue: 0, paidOrders: 0, totalOrders: 0, customers: 0 }
    )

    return NextResponse.json({
      type: 'general',
      generatedAt: new Date().toISOString(),
      resellerCount: resellers.length,
      totals,
      resellers,
    })
  } catch (error: any) {
    if (isDbUnavailable(error)) {
      return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
