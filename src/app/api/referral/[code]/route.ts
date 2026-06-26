import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { isDbUnavailable } from '@/lib/helpers'

// GET /api/referral/:code -> public reseller info for a referral code
export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const code = String(params.code || '').trim().toUpperCase()
    if (!code) return NextResponse.json({ reseller: null }, { status: 400 })

    await connectDB()
    const reseller = await User.findOne(
      { referralCode: code, role: 'reseller' },
      'name referralCode whatsappNumber resellerBio resellerCity resellerActive'
    ).lean()

    if (!reseller || reseller.resellerActive === false) {
      return NextResponse.json({ reseller: null }, { status: 404 })
    }

    return NextResponse.json({
      reseller: {
        id: String(reseller._id),
        name: reseller.name,
        referralCode: reseller.referralCode,
        whatsappNumber: reseller.whatsappNumber || '',
        resellerBio: reseller.resellerBio || '',
        resellerCity: reseller.resellerCity || '',
      },
    })
  } catch (error: any) {
    if (isDbUnavailable(error)) return NextResponse.json({ reseller: null, warning: 'Base de donnees indisponible' })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
