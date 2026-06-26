import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IOrderItem {
  productId:  string
  name:       string
  price:      number
  quantity:   number
  image?:     string
}

export interface IOrder extends Document {
  orderNumber:     string
  clientName:      string
  clientPhone:     string
  clientEmail?:    string
  clientCity?:     string
  clientAddress?:  string

  userId?:         mongoose.Types.ObjectId | null   // the customer account, if logged in

  items:           IOrderItem[]
  subtotal:        number
  deliveryFee:     number
  shippingZone?:   string
  total:           number

  // Reseller attribution
  resellerId?:     mongoose.Types.ObjectId | null
  resellerCode?:   string

  paymentStatus:   'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED'
  fapshiTransId?:  string
  fapshiLink?:     string
  whatsappSent:    boolean
  notes?:          string
  createdAt:       Date
  updatedAt:       Date
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true, min: 1 },
  image:     { type: String },
})

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber:   { type: String, required: true, unique: true },
    clientName:    { type: String, required: true, trim: true },
    clientPhone:   { type: String, required: true, trim: true },
    clientEmail:   { type: String, trim: true },
    clientCity:    { type: String, trim: true },
    clientAddress: { type: String, trim: true },

    userId:        { type: Schema.Types.ObjectId, ref: 'User', default: null },

    items:         { type: [OrderItemSchema], required: true },
    subtotal:      { type: Number, required: true },
    deliveryFee:   { type: Number, required: true, default: 0 },
    shippingZone:  { type: String, trim: true },
    total:         { type: Number, required: true },

    resellerId:    { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resellerCode:  { type: String, trim: true, uppercase: true },

    paymentStatus: {
      type:    String,
      enum:    ['PENDING', 'SUCCESSFUL', 'FAILED', 'EXPIRED'],
      default: 'PENDING',
    },
    fapshiTransId: { type: String },
    fapshiLink:    { type: String },
    whatsappSent:  { type: Boolean, default: false },
    notes:         { type: String },
  },
  { timestamps: true }
)

// Générer un numéro de commande unique
OrderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `SK-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  }
  next()
})

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)

export default Order
