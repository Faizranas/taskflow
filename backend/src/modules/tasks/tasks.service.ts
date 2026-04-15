import mongoose from 'mongoose'
import { TaskModel } from './tasks.schema'
import { ProjectModel } from '../projects/projects.schema'
import { TagModel } from '../tags/tags.schema'
import { AppError } from '../../utils/AppError'

interface PopulatedTag {
  id: string
  name: string
  color?: string
}

interface TaskResponse {
  id: string
  projectId: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate: string | null
  tags: PopulatedTag[]
  createdAt: Date
  updatedAt: Date
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toTaskResponse = (doc: Record<string, any>): TaskResponse => ({
  id: String(doc._id),
  projectId: String(doc.projectId),
  title: doc.title,
  description: doc.description,
  status: doc.status,
  priority: doc.priority,
  dueDate: doc.dueDate ? doc.dueDate : null,
  tags: (doc.tags || []).map((tag: Record<string, unknown>) => ({
    id: String(tag._id),
    name: tag.name as string,
    color: tag.color as string | undefined,
  })),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
})

const validateObjectId = (id: string, label: string): void => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label} format`, 400, 'VALIDATION_ERROR')
  }
}

const verifyProjectOwnership = async (userId: string, projectId: string): Promise<void> => {
  validateObjectId(projectId, 'projectId')
  const project = await ProjectModel.findOne({ _id: projectId, userId }).lean()
  if (!project) {
    throw new AppError('Project not found', 404, 'NOT_FOUND')
  }
}

const verifyTagOwnership = async (userId: string, tagIds: string[]): Promise<void> => {
  for (const tagId of tagIds) {
    validateObjectId(tagId, 'tagId')
  }
  const tags = await TagModel.find({
    _id: { $in: tagIds },
    userId,
  }).lean()
  if (tags.length !== tagIds.length) {
    throw new AppError('One or more tags not found', 404, 'NOT_FOUND')
  }
}

export interface TaskFilters {
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  tag?: string
  dueBefore?: string
  dueAfter?: string
  sort?: 'createdAt' | 'dueDate' | 'priority'
  order?: 'asc' | 'desc'
}

export const createTask = async (
  userId: string,
  projectId: string,
  data: {
    title: string
    description?: string
    status?: string
    priority?: string
    dueDate?: string | null
    tags?: string[]
  }
): Promise<{ task: TaskResponse }> => {
  await verifyProjectOwnership(userId, projectId)

  if (data.tags && data.tags.length > 0) {
    await verifyTagOwnership(userId, data.tags)
  }

  const task = await TaskModel.create({
    userId,
    projectId,
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    tags: data.tags || [],
  })

  const populated = await TaskModel.findOne({ _id: task._id, userId })
    .populate('tags', '_id name color')
    .lean()

  return { task: toTaskResponse(populated!) }
}

export const getTasks = async (
  userId: string,
  projectId: string,
  filters: TaskFilters
): Promise<{ tasks: TaskResponse[]; total: number }> => {
  await verifyProjectOwnership(userId, projectId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = { projectId, userId }

  if (filters.status) query.status = filters.status
  if (filters.priority) query.priority = filters.priority
  if (filters.tag) query.tags = filters.tag
  if (filters.dueBefore || filters.dueAfter) {
    query.dueDate = {}
    if (filters.dueBefore) query.dueDate.$lte = new Date(filters.dueBefore)
    if (filters.dueAfter) query.dueDate.$gte = new Date(filters.dueAfter)
  }

  const sortField = filters.sort || 'createdAt'
  const sortOrder = filters.order === 'asc' ? 1 : -1

  const tasks = await TaskModel.find(query)
    .sort({ [sortField]: sortOrder })
    .populate('tags', '_id name color')
    .lean()

  return {
    tasks: tasks.map(toTaskResponse),
    total: tasks.length,
  }
}

export const getTaskById = async (
  userId: string,
  projectId: string,
  taskId: string
): Promise<{ task: TaskResponse }> => {
  validateObjectId(projectId, 'projectId')
  validateObjectId(taskId, 'taskId')

  const task = await TaskModel.findOne({ _id: taskId, projectId, userId })
    .populate('tags', '_id name color')
    .lean()

  if (!task) {
    throw new AppError('Task not found', 404, 'NOT_FOUND')
  }

  return { task: toTaskResponse(task) }
}

export const updateTask = async (
  userId: string,
  projectId: string,
  taskId: string,
  data: {
    title?: string
    description?: string
    status?: string
    priority?: string
    dueDate?: string | null
    tags?: string[]
  }
): Promise<{ task: TaskResponse }> => {
  validateObjectId(projectId, 'projectId')
  validateObjectId(taskId, 'taskId')

  if (data.tags && data.tags.length > 0) {
    await verifyTagOwnership(userId, data.tags)
  }

  // Build update object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {}
  if (data.title !== undefined) update.title = data.title
  if (data.description !== undefined) update.description = data.description
  if (data.status !== undefined) update.status = data.status
  if (data.priority !== undefined) update.priority = data.priority
  if (data.dueDate !== undefined) update.dueDate = data.dueDate === null ? null : new Date(data.dueDate)
  if (data.tags !== undefined) update.tags = data.tags

  const task = await TaskModel.findOneAndUpdate(
    { _id: taskId, projectId, userId },
    { $set: update },
    { new: true, runValidators: true }
  )
    .populate('tags', '_id name color')
    .lean()

  if (!task) {
    throw new AppError('Task not found', 404, 'NOT_FOUND')
  }

  return { task: toTaskResponse(task) }
}

export const deleteTask = async (
  userId: string,
  projectId: string,
  taskId: string
): Promise<void> => {
  validateObjectId(projectId, 'projectId')
  validateObjectId(taskId, 'taskId')

  const task = await TaskModel.findOne({ _id: taskId, projectId, userId }).lean()
  if (!task) {
    throw new AppError('Task not found', 404, 'NOT_FOUND')
  }

  await TaskModel.deleteOne({ _id: taskId, projectId, userId })
}
