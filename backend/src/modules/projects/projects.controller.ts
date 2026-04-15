import { Request, Response } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../utils/asyncHandler'
import { AppError } from '../../utils/AppError'
import * as projectsService from './projects.service'

// ─── Zod Validation Schemas ─────────────────────────
const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
})

const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: 'At least one field must be provided',
  })

// ─── Helper ─────────────────────────────────────────
const parseBody = <T>(schema: z.ZodSchema<T>, body: unknown): T => {
  const result = schema.safeParse(body)
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(', ')
    throw new AppError(message, 400, 'VALIDATION_ERROR')
  }
  return result.data
}

// ─── Controllers ────────────────────────────────────
export const create = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = parseBody(createProjectSchema, req.body)
    const result = await projectsService.createProject(req.user!.userId, data)
    res.status(201).json(result)
  }
)

export const getAll = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await projectsService.getProjects(req.user!.userId)
    res.status(200).json(result)
  }
)

export const getById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await projectsService.getProjectById(
      req.user!.userId,
      req.params.projectId
    )
    res.status(200).json(result)
  }
)

export const update = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = parseBody(updateProjectSchema, req.body)
    const result = await projectsService.updateProject(
      req.user!.userId,
      req.params.projectId,
      data
    )
    res.status(200).json(result)
  }
)

export const remove = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await projectsService.deleteProject(req.user!.userId, req.params.projectId)
    res.status(204).send()
  }
)
