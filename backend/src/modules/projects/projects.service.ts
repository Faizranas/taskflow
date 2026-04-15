import mongoose from 'mongoose'
import { ProjectModel } from './projects.schema'
import { TaskModel } from '../tasks/tasks.schema'
import { AppError } from '../../utils/AppError'

interface ProjectResponse {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toProjectResponse = (doc: Record<string, any>): ProjectResponse => ({
  id: String(doc._id),
  name: doc.name as string,
  description: doc.description as string | undefined,
  createdAt: doc.createdAt as Date,
  updatedAt: doc.updatedAt as Date,
})

const validateObjectId = (id: string, label: string): void => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label} format`, 400, 'VALIDATION_ERROR')
  }
}

export const createProject = async (
  userId: string,
  data: { name: string; description?: string }
): Promise<{ project: ProjectResponse }> => {
  const project = await ProjectModel.create({
    userId,
    name: data.name,
    description: data.description,
  })

  return { project: toProjectResponse(project.toObject()) }
}

export const getProjects = async (
  userId: string
): Promise<{ projects: ProjectResponse[]; total: number }> => {
  const projects = await ProjectModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean()

  return {
    projects: projects.map(toProjectResponse),
    total: projects.length,
  }
}

export const getProjectById = async (
  userId: string,
  projectId: string
): Promise<{ project: ProjectResponse }> => {
  validateObjectId(projectId, 'projectId')

  const project = await ProjectModel.findOne({
    _id: projectId,
    userId,
  }).lean()

  if (!project) {
    throw new AppError('Project not found', 404, 'NOT_FOUND')
  }

  return { project: toProjectResponse(project) }
}

export const updateProject = async (
  userId: string,
  projectId: string,
  data: { name?: string; description?: string }
): Promise<{ project: ProjectResponse }> => {
  validateObjectId(projectId, 'projectId')

  const project = await ProjectModel.findOneAndUpdate(
    { _id: projectId, userId },
    { $set: data },
    { new: true, runValidators: true }
  ).lean()

  if (!project) {
    throw new AppError('Project not found', 404, 'NOT_FOUND')
  }

  return { project: toProjectResponse(project) }
}

export const deleteProject = async (
  userId: string,
  projectId: string
): Promise<void> => {
  validateObjectId(projectId, 'projectId')

  const project = await ProjectModel.findOne({
    _id: projectId,
    userId,
  }).lean()

  if (!project) {
    throw new AppError('Project not found', 404, 'NOT_FOUND')
  }

  // Cascade delete: remove all tasks belonging to this project
  await TaskModel.deleteMany({ projectId })
  await ProjectModel.deleteOne({ _id: projectId, userId })
}
