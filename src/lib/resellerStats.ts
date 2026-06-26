import mongoose from 'mongoose'
import User from '@/models/User'
import Order from '@/models/Order'
import Rating from '@/models/Rating'

export interface ResellerStat {
  _id: string
  name: string
  email: string
  phone: string
  referralCode: string
  whatsappNumber: string
  resellerCity: string
  resellerActive: boolean
  createdAt: string
  customers: number
  totalOrders: number
  paidOrders: number
  revenue: number          // total of SUCCESSFUL orders (incl. delivery)
  pendingRevenue: number   // total of PENDING orders
  avgRating: number
  ratingCount: number
}

/** Computes aggregated activity stats for every reseller. */
export async function getAllResellerStats(): Promise<ResellerStat[]> {
  const resellers = await User.find({ role: 'reseller' }).sort({ createdAt: -1 }).lean()

  const [ordersAgg, customersAgg, ratingsAgg] = await Promise.all([
    Order.aggregate([
      { $match: { resellerId: { $ne: null } } },
      {
        $group: {
          _id: '$resellerId',
          totalOrders: { $sum: 1 },
          paidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'SUCCESSFUL'] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'SUCCESSFUL'] }, '$total', 0] } },
          pendingRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PENDING'] }, '$total', 0] } },
        },
      },
    ]),
    User.aggregate([
      { $match: { role: 'customer', referredBy: { $ne: null } } },
      { $group: { _id: '$referredBy', customers: { $sum: 1 } } },
    ]),
    Rating.aggregate([
      { $group: { _id: '$resellerId', avgRating: { $avg: '$rating' }, ratingCount: { $sum: 1 } } },
    ]),
  ])

  const ordersMap = new Map(ordersAgg.map((o: any) => [String(o._id), o]))
  const customersMap = new Map(customersAgg.map((c: any) => [String(c._id), c.customers]))
  const ratingsMap = new Map(ratingsAgg.map((r: any) => [String(r._id), r]))

  return resellers.map((r: any) => {
    const id = String(r._id)
    const o = ordersMap.get(id)
    const rt = ratingsMap.get(id)
    return {
      _id: id,
      name: r.name,
      email: r.email,
      phone: r.phone || '',
      referralCode: r.referralCode || '',
      whatsappNumber: r.whatsappNumber || '',
      resellerCity: r.resellerCity || '',
      resellerActive: r.resellerActive !== false,
      createdAt: r.createdAt,
      customers: customersMap.get(id) || 0,
      totalOrders: o?.totalOrders || 0,
      paidOrders: o?.paidOrders || 0,
      revenue: o?.revenue || 0,
      pendingRevenue: o?.pendingRevenue || 0,
      avgRating: rt ? Math.round(rt.avgRating * 10) / 10 : 0,
      ratingCount: rt?.ratingCount || 0,
    }
  })
}

/** Detailed activity for a single reseller (profile, stats, orders, ratings). */
export async function getResellerDetail(resellerId: string) {
  if (!mongoose.Types.ObjectId.isValid(resellerId)) return null
  const reseller = await User.findOne({ _id: resellerId, role: 'reseller' }).lean()
  if (!reseller) return null

  const oid = new mongoose.Types.ObjectId(resellerId)

  const [orders, ratings, customers, agg] = await Promise.all([
    Order.find({ resellerId: oid }).sort({ createdAt: -1 }).lean(),
    Rating.find({ resellerId: oid }).sort({ createdAt: -1 }).lean(),
    User.find({ referredBy: oid, role: 'customer' }, 'name email phone createdAt').sort({ createdAt: -1 }).lean(),
    Order.aggregate([
      { $match: { resellerId: oid } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          paidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'SUCCESSFUL'] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'SUCCESSFUL'] }, '$total', 0] } },
          pendingRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PENDING'] }, '$total', 0] } },
        },
      },
    ]),
  ])

  const a = agg[0] || {}
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length) * 10) / 10
    : 0

  return {
    reseller: {
      _id: String(reseller._id),
      name: reseller.name,
      email: reseller.email,
      phone: reseller.phone || '',
      referralCode: reseller.referralCode || '',
      whatsappNumber: reseller.whatsappNumber || '',
      resellerCity: reseller.resellerCity || '',
      resellerBio: reseller.resellerBio || '',
      resellerActive: reseller.resellerActive !== false,
      createdAt: reseller.createdAt,
    },
    stats: {
      customers: customers.length,
      totalOrders: a.totalOrders || 0,
      paidOrders: a.paidOrders || 0,
      revenue: a.revenue || 0,
      pendingRevenue: a.pendingRevenue || 0,
      avgRating,
      ratingCount: ratings.length,
    },
    orders,
    ratings,
    customers,
  }
}
