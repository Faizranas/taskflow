import mongoose, { Schema, Document } from 'mongoose'

export interface ITag extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  name: string
  color?: string
  createdAt: Date
}

const tagSchema = new Schema<ITag>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    color: {
      type: String,
      match: /^#[0-9A-Fa-f]{6}$/,
    },
  },
  { timestamps: true }
)

tagSchema.index({ userId: 1, name: 1 }, { unique: true })

export const TagModel = mongoose.model<ITag>('Tag', tagSchema)
