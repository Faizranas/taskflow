import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt'
import { AppError } from '../utils/AppError'

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string }
    }
  }
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Missing or invalid authorization header', 401, 'UNAUTHORIZED')
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyAccessToken(token)
    req.user = { userId: payload.userId, email: payload.email }
    next()
  } catch {
    throw new AppError('Invalid or expired access token', 401, 'UNAUTHORIZED')
  }
}
