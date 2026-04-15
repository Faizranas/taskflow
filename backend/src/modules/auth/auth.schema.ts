import mongoose, { Schema, Document } from 'mongoose'

// ─── User ───────────────────────────────────────────
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  password: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
)

export const UserModel = mongoose.model<IUser>('User', userSchema)

// ─── Refresh Token ──────────────────────────────────
export interface IRefreshToken extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  token: string
  expiresAt: Date
  createdAt: Date
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
)

export const RefreshTokenModel = mongoose.model<IRefreshToken>(
  'RefreshToken',
  refreshTokenSchema
)
