import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IShippingZone extends Document {
  name:     string    // e.g. "Douala", "Yaoundé", "Autres villes"
  fee:      number    // delivery + shipping fee in FCFA
  active:   boolean
  isDefault: boolean  // applied when client city matches no zone
  createdAt: Date
  updatedAt: Date
}

const ShippingZoneSchema = new Schema<IShippingZone>(
  {
    name:      { type: String, required: true, trim: true },
    fee:       { type: Number, required: true, min: 0, default: 0 },
    active:    { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const ShippingZone: Model<IShippingZone> =
  mongoose.models.ShippingZone || mongoose.model<IShippingZone>('ShippingZone', ShippingZoneSchema)

export default ShippingZone
