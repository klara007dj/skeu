import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import Rating from '@/models/Rating'
import User from '@/models/User'
import { getSession } from '@/lib/auth'
import { isDbUnavailable } from '@/lib/helpers'

// GET /api/ratings?resellerId=xxx -> public list of a reseller's ratings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const resellerId = searchParams.get('resellerId')
    if (!resellerId || !mongoose.Types.ObjectId.isValid(resellerId)) {
      return NextResponse.json({ error: 'resellerId invalide' }, { status: 400 })
    }
    await connectDB()
    const ratings = await Rating.find({ resellerId }, 'customerName rating comment createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
    const avg = ratings.length
      ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
      : 0
    return NextResponse.json({ ratings, average: avg, count: ratings.length })
  } catch (error: any) {
    if (isDbUnavailable(error)) return NextResponse.json({ ratings: [], average: 0, count: 0 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/ratings -> a logged-in customer rates the reseller who referred them
export async function POST(req: NextRequest) {
  const session = getSession(req)
  if (!session || session.role !== 'customer') {
    return NextResponse.json({ error: 'Connectez-vous en tant que client pour noter votre revendeur.' }, { status: 401 })
  }
  try {
    await connectDB()
    const { rating, comment } = await req.json()
    const numericRating = Number(rating)
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: 'La note doit etre comprise entre 1 et 5' }, { status: 400 })
    }

    const customer = await User.findOne({ email: session.email }).lean()
    if (!customer) return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 })
    if (!customer.referredBy) {
      return NextResponse.json({ error: "Vous n'etes rattache a aucun revendeur." }, { status: 400 })
    }

    // One rating per customer/reseller pair: update if it already exists
    await Rating.findOneAndUpdate(
      { resellerId: customer.referredBy, customerId: customer._id },
      {
        resellerId: customer.referredBy,
        customerId: customer._id,
        customerName: customer.name,
        rating: numericRating,
        comment: String(comment || '').trim().slice(0, 1000),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (isDbUnavailable(error)) {
      return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
