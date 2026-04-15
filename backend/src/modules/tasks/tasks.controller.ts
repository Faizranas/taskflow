import { Request, Response } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../utils/asyncHandler'
import { AppError } from '../../utils/AppError'
import * as tasksService from './tasks.service'

// ─── Zod Validation Schemas ─────────────────────────
const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  tags: z.array(z.string().regex(/^[a-f\d]{24}$/i)).optional(),
})

const updateTaskSchema = createTaskSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

const taskFilterSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  tag: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  sort: z.enum(['createdAt', 'dueDate', 'priority']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
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
    const data = parseBody(createTaskSchema, req.body)
    const result = await tasksService.createTask(
      req.user!.userId,
      req.params.projectId,
      data
    )
    res.status(201).json(result)
  }
)

export const getAll = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const filters = parseBody(taskFilterSchema, req.query)
    const result = await tasksService.getTasks(
      req.user!.userId,
      req.params.projectId,
      filters
    )
    res.status(200).json(result)
  }
)

export const getById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await tasksService.getTaskById(
      req.user!.userId,
      req.params.projectId,
      req.params.taskId
    )
    res.status(200).json(result)
  }
)

export const update = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = parseBody(updateTaskSchema, req.body)
    const result = await tasksService.updateTask(
      req.user!.userId,
      req.params.projectId,
      req.params.taskId,
      data
    )
    res.status(200).json(result)
  }
)

export const remove = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await tasksService.deleteTask(
      req.user!.userId,
      req.params.projectId,
      req.params.taskId
    )
    res.status(204).send()
  }
)
