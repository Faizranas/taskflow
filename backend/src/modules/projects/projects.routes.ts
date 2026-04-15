import { Router } from 'express'
import * as projectsController from './projects.controller'
import { authenticate } from '../../middleware/authenticate'

export const projectsRouter = Router()

projectsRouter.use(authenticate)

projectsRouter.post('/', projectsController.create)
projectsRouter.get('/', projectsController.getAll)
projectsRouter.get('/:projectId', projectsController.getById)
projectsRouter.patch('/:projectId', projectsController.update)
projectsRouter.delete('/:projectId', projectsController.remove)
