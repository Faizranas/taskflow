import { Router } from 'express'
import * as authController from './auth.controller'
import { authenticate } from '../../middleware/authenticate'

export const authRouter = Router()

authRouter.post('/register', authController.register)
authRouter.post('/login', authController.login)
authRouter.post('/refresh', authController.refresh)
authRouter.post('/logout', authenticate, authController.logout)
