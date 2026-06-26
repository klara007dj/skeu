import mongoose, { Document, Model, Schema } from 'mongoose'

export type UserRole = 'customer' | 'admin' | 'reseller'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  phone?: string
  role: UserRole

  // Reseller profile (only relevant when role === 'reseller')
  referralCode?: string          // unique code clients use at signup / promo
  whatsappNumber?: string        // number clients are redirected to on WhatsApp
  resellerBio?: string           // public description shown to clients
  resellerCity?: string
  resellerActive?: boolean       // admin can suspend a reseller without deleting

  // Referral tracking (only relevant when role === 'customer')
  referredBy?: mongoose.Types.ObjectId | null   // the reseller who referred this client
  referredByCode?: string                       // the code used at signup

  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['customer', 'admin', 'reseller'], default: 'customer' },

    referralCode: { type: String, trim: true, uppercase: true, unique: true, sparse: true },
    whatsappNumber: { type: String, trim: true },
    resellerBio: { type: String, trim: true },
    resellerCity: { type: String, trim: true },
    resellerActive: { type: Boolean, default: true },

    referredBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    referredByCode: { type: String, trim: true, uppercase: true },
  },
  { timestamps: true }
)

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
