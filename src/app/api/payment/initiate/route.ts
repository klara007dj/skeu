import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Order from '@/models/Order'
import Product from '@/models/Product'
import User from '@/models/User'
import ShippingZone from '@/models/ShippingZone'
import { createPaymentLink, generateWhatsAppMessage } from '@/lib/fapshi'
import { getSession } from '@/lib/auth'
import { isDbUnavailable } from '@/lib/helpers'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { name, phone, email, notes, items, city, address, shippingZoneId, resellerCode } = body

    if (!name || !phone || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Donnees manquantes' }, { status: 400 })
    }

    // SECURITY: never trust client-side prices. Recompute everything from the DB.
    const ids = items.map((i: any) => String(i.id)).filter(Boolean)
    const products = await Product.find({ _id: { $in: ids }, active: true }).lean()
    const productMap = new Map(products.map((p: any) => [String(p._id), p]))

    const orderItems: any[] = []
    let subtotal = 0
    for (const i of items) {
      const p = productMap.get(String(i.id))
      if (!p) continue
      const qty = Math.max(1, Math.min(99, parseInt(String(i.quantity)) || 1))
      const unitPrice = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price
      subtotal += unitPrice * qty
      orderItems.push({
        productId: String(p._id),
        name: p.name,
        price: unitPrice,
        quantity: qty,
        image: p.images?.[0],
      })
    }

    if (orderItems.length === 0) {
      return NextResponse.json({ error: 'Aucun produit valide dans le panier' }, { status: 400 })
    }

    // SECURITY: delivery fee is resolved from the configured zone, not from the client.
    let deliveryFee = 0
    let shippingZoneName: string | undefined
    if (shippingZoneId) {
      const zone = await ShippingZone.findOne({ _id: shippingZoneId, active: true }).lean()
      if (zone) {
        deliveryFee = zone.fee
        shippingZoneName = zone.name
      }
    }
    if (!shippingZoneName) {
      const def = await ShippingZone.findOne({ isDefault: true, active: true }).lean()
      if (def) {
        deliveryFee = def.fee
        shippingZoneName = def.name
      }
    }

    const total = subtotal + deliveryFee

    // Reseller attribution: logged-in customer's reseller first, then a passed code.
    const session = getSession(req)
    let resellerId: any = null
    let attributedCode: string | undefined
    let resellerWhatsapp: string | undefined

    if (session?.role === 'customer') {
      const customer = await User.findOne({ email: session.email }, 'referredBy').lean()
      if (customer?.referredBy) resellerId = customer.referredBy
    }
    if (!resellerId && resellerCode) {
      const reseller = await User.findOne(
        { referralCode: String(resellerCode).trim().toUpperCase(), role: 'reseller', resellerActive: { $ne: false } },
        '_id referralCode whatsappNumber'
      ).lean()
      if (reseller) {
        resellerId = reseller._id
        attributedCode = reseller.referralCode
        resellerWhatsapp = reseller.whatsappNumber
      }
    }
    if (resellerId && !resellerWhatsapp) {
      const reseller = await User.findById(resellerId, 'referralCode whatsappNumber').lean()
      attributedCode = reseller?.referralCode
      resellerWhatsapp = reseller?.whatsappNumber
    }

    const orderNumber = `SK-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const order = await Order.create({
      orderNumber,
      clientName: name,
      clientPhone: phone,
      clientEmail: email || undefined,
      clientCity: city || undefined,
      clientAddress: address || undefined,
      userId: session?.id || undefined,
      items: orderItems,
      subtotal,
      deliveryFee,
      shippingZone: shippingZoneName,
      total,
      resellerId: resellerId || undefined,
      resellerCode: attributedCode,
      paymentStatus: 'PENDING',
      notes: notes || undefined,
    })

    let paymentLink: string | undefined
    let transId: string | undefined

    try {
      const fapshiRes = await createPaymentLink({
        amount: total,
        externalId: orderNumber,
        userId: phone,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?order=${orderNumber}`,
        message: `skeucosmetique - Commande ${orderNumber}`,
      })
      paymentLink = fapshiRes.link
      transId = fapshiRes.transId
      await Order.findByIdAndUpdate(order._id, { fapshiTransId: transId, fapshiLink: paymentLink })
    } catch (fapshiErr: any) {
      console.error('Fapshi error:', fapshiErr.message)
    }

    const waLink = generateWhatsAppMessage({
      clientName: name,
      phone,
      products: orderItems.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      total,
      deliveryFee,
      transId: transId || orderNumber,
      whatsappNumber: resellerWhatsapp,
    })

    return NextResponse.json({
      success: true,
      orderNumber,
      subtotal,
      deliveryFee,
      total,
      paymentLink,
      transId,
      waLink,
      hasReseller: !!resellerId,
    })
  } catch (error: any) {
    if (isDbUnavailable(error)) {
      return NextResponse.json({ error: 'Base de donnees indisponible. Reessayez plus tard.' }, { status: 503 })
    }
    console.error('Payment initiate error:', error)
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}
