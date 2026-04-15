import express from 'express'
import { errorHandler } from './middleware/errorHandler'
import { authRouter } from './modules/auth/auth.routes'
import { projectsRouter } from './modules/projects/projects.routes'
import { tagsRouter } from './modules/tags/tags.routes'
import { tasksRouter } from './modules/tasks/tasks.routes'

const app = express()

// CORS — allow frontend to call API
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

// Routes
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/projects', projectsRouter)
app.use('/api/v1/tags', tagsRouter)
app.use('/api/v1', tasksRouter)

app.use(errorHandler)

export default app
