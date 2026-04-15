import { Router } from 'express'
import * as tagsController from './tags.controller'
import { authenticate } from '../../middleware/authenticate'

export const tagsRouter = Router()

tagsRouter.use(authenticate)

tagsRouter.post('/', tagsController.create)
tagsRouter.get('/', tagsController.getAll)
tagsRouter.patch('/:tagId', tagsController.update)
tagsRouter.delete('/:tagId', tagsController.remove)
