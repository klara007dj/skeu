import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IRating extends Document {
  resellerId:   mongoose.Types.ObjectId
  customerId?:  mongoose.Types.ObjectId | null
  customerName: string
  orderNumber?: string
  rating:       number   // 1..5
  comment?:     string
  createdAt:    Date
  updatedAt:    Date
}

const RatingSchema = new Schema<IRating>(
  {
    resellerId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerId:   { type: Schema.Types.ObjectId, ref: 'User', default: null },
    customerName: { type: String, required: true, trim: true },
    orderNumber:  { type: String, trim: true },
    rating:       { type: Number, required: true, min: 1, max: 5 },
    comment:      { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
)

const Rating: Model<IRating> =
  mongoose.models.Rating || mongoose.model<IRating>('Rating', RatingSchema)

export default Rating
