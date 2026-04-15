import { Request, Response } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../utils/asyncHandler'
import { AppError } from '../../utils/AppError'
import * as tagsService from './tags.service'

// ─── Zod Validation Schemas ─────────────────────────
const createTagSchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

const updateTagSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  })
  .refine((data) => data.name !== undefined || data.color !== undefined, {
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
    const data = parseBody(createTagSchema, req.body)
    const result = await tagsService.createTag(req.user!.userId, data)
    res.status(201).json(result)
  }
)

export const getAll = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await tagsService.getTags(req.user!.userId)
    res.status(200).json(result)
  }
)

export const update = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = parseBody(updateTagSchema, req.body)
    const result = await tagsService.updateTag(
      req.user!.userId,
      req.params.tagId,
      data
    )
    res.status(200).json(result)
  }
)

export const remove = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await tagsService.deleteTag(req.user!.userId, req.params.tagId)
    res.status(204).send()
  }
)
