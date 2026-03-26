# Task 001 — Project Setup

## Context Files to Read First
1. `CLAUDE.md` — conventions you must follow throughout
2. `docs/TECHNICAL_SPEC.md` — full folder structure and architecture

Do not read any spec file. This task has no business logic.

---

## Goal

Scaffold the complete TaskFlow project skeleton — backend and frontend.
No module implementation. No routes. No business logic.
Only structure, configuration, and shared infrastructure.

---

## What to Build

### 1. Backend — Folder Structure

Create the following empty folders and placeholder files:

```
backend/
  src/
    config/
      db.ts
      env.ts
    modules/
      auth/
      projects/
      tasks/
      tags/
    middleware/
      authenticate.ts
      errorHandler.ts
      validate.ts
    utils/
      AppError.ts
      asyncHandler.ts
      jwt.ts
    app.ts
  server.ts
  tsconfig.json
  package.json
  .env.example
  .gitignore
```

---

### 2. Backend — `package.json`

```json
{
  "name": "taskflow-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.4.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.5",
    "vitest": "^1.6.0"
  }
}
```

---

### 3. Backend — `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

---

### 4. Backend — `.env.example`

```
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/taskflow

# JWT
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

### 5. Backend — `src/config/env.ts`

Validate and export all environment variables. No other file should ever use `process.env` directly.

```typescript
import dotenv from 'dotenv'
dotenv.config()

const required = (key: string): string => {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required env var: ${key}`)
  return value
}

export const env = {
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  MONGODB_URI: required('MONGODB_URI'),
  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
}
```

---

### 6. Backend — `src/config/db.ts`

MongoDB connection using Mongoose:

```typescript
import mongoose from 'mongoose'
import { env } from './env'

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI)
    console.info(`MongoDB connected: ${env.MONGODB_URI}`)
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    process.exit(1)
  }
}
```

---

### 7. Backend — `src/utils/AppError.ts`

```typescript
export class AppError extends Error {
  status: number
  code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.status = status
    this.code = code
    Object.setPrototypeOf(this, AppError.prototype)
  }
}
```

---

### 8. Backend — `src/utils/asyncHandler.ts`

```typescript
import { Request, Response, NextFunction, RequestHandler } from 'express'

export const asyncHandler = (fn: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
```

---

### 9. Backend — `src/middleware/errorHandler.ts`

Global error handler implementing RFC 7807 format:

```typescript
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
```

---

### 10. Backend — `src/app.ts`

Express app setup with middleware. No routes yet — routes will be added in later tasks.

```typescript
import express from 'express'
import { errorHandler } from './middleware/errorHandler'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

// Routes will be mounted here in later tasks
// app.use('/api/v1/auth', authRouter)
// app.use('/api/v1/projects', projectsRouter)
// app.use('/api/v1/tags', tagsRouter)

app.use(errorHandler)

export default app
```

---

### 11. Backend — `server.ts`

```typescript
import { connectDB } from './src/config/db'
import { env } from './src/config/env'
import app from './src/app'

const start = async (): Promise<void> => {
  await connectDB()
  app.listen(env.PORT, () => {
    console.info(`Server running on port ${env.PORT}`)
  })
}

start()
```

---

### 12. Backend — `.gitignore`

```
node_modules/
dist/
.env
*.log
```

---

### 13. Frontend — Folder Structure

```
frontend/
  index.html
  css/
    styles.css
  js/
    app.js
    api.js
    auth.js
    projects.js
    tasks.js
```

---

### 14. Frontend — `index.html`

Single page application entry point with hash-based routing:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TaskFlow</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <div id="app"></div>
  <script src="js/api.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/projects.js"></script>
  <script src="js/tasks.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

---

### 15. Frontend — `js/api.js`

Central Fetch wrapper. All API calls go through this file:

```javascript
const BASE_URL = 'http://localhost:3000/api/v1'
let accessToken = null

const setAccessToken = (token) => { accessToken = token }
const getAccessToken = () => accessToken
const clearAccessToken = () => { accessToken = null }

const request = async (method, path, body = null) => {
  const headers = { 'Content-Type': 'application/json' }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const options = { method, headers }
  if (body) options.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, options)

  if (res.status === 401) {
    // Attempt token refresh
    const refreshed = await tryRefresh()
    if (refreshed) return request(method, path, body)
    clearAccessToken()
    window.location.hash = '#/login'
    return
  }

  if (res.status === 204) return null
  return res.json()
}

const tryRefresh = async () => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return false

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })

  if (!res.ok) {
    localStorage.removeItem('refreshToken')
    return false
  }

  const data = await res.json()
  setAccessToken(data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  return true
}
```

---

### 16. Frontend — `js/app.js`

Hash-based router skeleton:

```javascript
const routes = {
  '#/login': () => auth.renderLogin(),
  '#/register': () => auth.renderRegister(),
  '#/projects': () => projects.renderList(),
}

const router = () => {
  const hash = window.location.hash || '#/login'
  const render = routes[hash]
  if (render) render()
  else window.location.hash = '#/login'
}

window.addEventListener('hashchange', router)
window.addEventListener('load', router)
```

---

## Acceptance Criteria

- [ ] Running `npm install` in `backend/` completes without errors
- [ ] Running `npm run dev` starts the Express server on port 3000
- [ ] `GET /health` returns `{ "status": "ok" }`
- [ ] MongoDB connects successfully when `MONGODB_URI` is set in `.env`
- [ ] Opening `frontend/index.html` in a browser loads without JS errors
- [ ] All folders and files exist as specified in this task

---

## What Claude Must NOT Do

- Do not implement any auth, projects, tasks, or tags logic in this task
- Do not add any routes beyond `/health`
- Do not install any packages not listed in `package.json` above
- Do not create a `.env` file — only `.env.example`
