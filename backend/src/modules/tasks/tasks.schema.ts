import mongoose, { Schema, Document } from 'mongoose'

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: Date
  tags: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const taskSchema = new Schema<ITask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'DONE'],
      default: 'TODO',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    dueDate: {
      type: Date,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
  },
  { timestamps: true }
)

taskSchema.index({ userId: 1, status: 1 })
taskSchema.index({ userId: 1, priority: 1 })
taskSchema.index({ userId: 1, dueDate: 1 })

export const TaskModel = mongoose.model<ITask>('Task', taskSchema)
