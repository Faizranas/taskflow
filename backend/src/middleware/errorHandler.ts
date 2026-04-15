import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      type: `https://taskflow.dev/errors/${err.code.toLowerCase()}`,
      title: err.message,
      status: err.status,
      detail: err.message,
      instance: req.path
    })
    return
  }

  res.status(500).json({
    type: 'https://taskflow.dev/errors/internal-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred',
    instance: req.path
  })
}
