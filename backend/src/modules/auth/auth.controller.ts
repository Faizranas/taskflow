import { Request, Response } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../utils/asyncHandler'
import { AppError } from '../../utils/AppError'
import * as authService from './auth.service'

// ─── Zod Validation Schemas ─────────────────────────
const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

const logoutSchema = z.object({
  refreshToken: z.string().min(1),
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
export const register = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = parseBody(registerSchema, req.body)
    const result = await authService.register(email, password)
    res.status(201).json(result)
  }
)

export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = parseBody(loginSchema, req.body)
    const result = await authService.login(email, password)
    res.status(200).json(result)
  }
)

export const refresh = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = parseBody(refreshSchema, req.body)
    const result = await authService.refresh(refreshToken)
    res.status(200).json(result)
  }
)

export const logout = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = parseBody(logoutSchema, req.body)
    await authService.logout(refreshToken)
    res.status(204).send()
  }
)
