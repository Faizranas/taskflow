import mongoose from 'mongoose'
import { TagModel } from './tags.schema'
import { TaskModel } from '../tasks/tasks.schema'
import { AppError } from '../../utils/AppError'

interface TagResponse {
  id: string
  name: string
  color?: string
  createdAt: Date
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toTagResponse = (doc: Record<string, any>): TagResponse => ({
  id: String(doc._id),
  name: doc.name as string,
  color: doc.color as string | undefined,
  createdAt: doc.createdAt as Date,
})

const validateObjectId = (id: string, label: string): void => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label} format`, 400, 'VALIDATION_ERROR')
  }
}

export const createTag = async (
  userId: string,
  data: { name: string; color?: string }
): Promise<{ tag: TagResponse }> => {
  // Check for duplicate name
  const existing = await TagModel.findOne({ userId, name: data.name }).lean()
  if (existing) {
    throw new AppError('Tag name already exists', 409, 'CONFLICT')
  }

  const tag = await TagModel.create({
    userId,
    name: data.name,
    color: data.color,
  })

  return { tag: toTagResponse(tag.toObject()) }
}

export const getTags = async (
  userId: string
): Promise<{ tags: TagResponse[]; total: number }> => {
  const tags = await TagModel.find({ userId })
    .sort({ name: 1 })
    .lean()

  return {
    tags: tags.map(toTagResponse),
    total: tags.length,
  }
}

export const updateTag = async (
  userId: string,
  tagId: string,
  data: { name?: string; color?: string }
): Promise<{ tag: TagResponse }> => {
  validateObjectId(tagId, 'tagId')

  // Check tag exists and belongs to user
  const existing = await TagModel.findOne({ _id: tagId, userId }).lean()
  if (!existing) {
    throw new AppError('Tag not found', 404, 'NOT_FOUND')
  }

  // If updating name, check for duplicates
  if (data.name) {
    const duplicate = await TagModel.findOne({
      userId,
      name: data.name,
      _id: { $ne: tagId },
    }).lean()
    if (duplicate) {
      throw new AppError('Tag name already exists', 409, 'CONFLICT')
    }
  }

  const tag = await TagModel.findOneAndUpdate(
    { _id: tagId, userId },
    { $set: data },
    { new: true, runValidators: true }
  ).lean()

  if (!tag) {
    throw new AppError('Tag not found', 404, 'NOT_FOUND')
  }

  return { tag: toTagResponse(tag) }
}

export const deleteTag = async (
  userId: string,
  tagId: string
): Promise<void> => {
  validateObjectId(tagId, 'tagId')

  const tag = await TagModel.findOne({ _id: tagId, userId }).lean()
  if (!tag) {
    throw new AppError('Tag not found', 404, 'NOT_FOUND')
  }

  // Remove tag reference from all tasks using $pull
  await TaskModel.updateMany(
    { userId, tags: tagId },
    { $pull: { tags: tagId } }
  )

  await TagModel.deleteOne({ _id: tagId, userId })
}
