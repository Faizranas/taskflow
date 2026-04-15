import mongoose, { Schema, Document } from 'mongoose'

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

const projectSchema = new Schema<IProject>(
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
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
)

export const ProjectModel = mongoose.model<IProject>('Project', projectSchema)
