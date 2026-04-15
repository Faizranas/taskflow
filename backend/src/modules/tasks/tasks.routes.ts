import { Router } from 'express'
import * as tasksController from './tasks.controller'
import { authenticate } from '../../middleware/authenticate'

export const tasksRouter = Router()

tasksRouter.use(authenticate)

tasksRouter.post('/projects/:projectId/tasks', tasksController.create)
tasksRouter.get('/projects/:projectId/tasks', tasksController.getAll)
tasksRouter.get('/projects/:projectId/tasks/:taskId', tasksController.getById)
tasksRouter.patch('/projects/:projectId/tasks/:taskId', tasksController.update)
tasksRouter.delete('/projects/:projectId/tasks/:taskId', tasksController.remove)
