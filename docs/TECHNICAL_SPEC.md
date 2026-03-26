# TECHNICAL SPEC — TaskFlow

## 1. Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Backend     | Node.js + Express + TypeScript    |
| Database    | MongoDB + Mongoose                |
| Auth        | JWT (access 15min, refresh 7days) |
| Frontend    | Vanilla JS + Fetch API + CSS      |
| Tests       | Vitest                            |
| API Base    | `/api/v1/{resource}`              |

---

## 2. Folder Structure

```
taskflow/
├── docs/
│   ├── PRD.md
│   └── TECHNICAL_SPEC.md
├── specs/
│   ├── auth.md
│   ├── tasks.md
│   └── projects.md
├── tasks/
│   └── 001-project-setup.md
├── CLAUDE.md
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts               ← MongoDB connection
│   │   │   └── env.ts              ← Typed env variables
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.schema.ts  ← Mongoose schema
│   │   │   ├── projects/
│   │   │   │   ├── projects.routes.ts
│   │   │   │   ├── projects.controller.ts
│   │   │   │   ├── projects.service.ts
│   │   │   │   └── projects.schema.ts
│   │   │   ├── tasks/
│   │   │   │   ├── tasks.routes.ts
│   │   │   │   ├── tasks.controller.ts
│   │   │   │   ├── tasks.service.ts
│   │   │   │   └── tasks.schema.ts
│   │   │   └── tags/
│   │   │       ├── tags.routes.ts
│   │   │       ├── tags.controller.ts
│   │   │       ├── tags.service.ts
│   │   │       └── tags.schema.ts
│   │   ├── middleware/
│   │   │   ├── authenticate.ts     ← JWT verification middleware
│   │   │   ├── errorHandler.ts     ← Global error handler (RFC 7807)
│   │   │   └── validate.ts         ← Request validation middleware
│   │   ├── utils/
│   │   │   ├── AppError.ts         ← Custom error class
│   │   │   ├── asyncHandler.ts     ← Async route wrapper
│   │   │   └── jwt.ts              ← Token sign/verify helpers
│   │   └── app.ts                  ← Express app setup
│   ├── server.ts                   ← Entry point
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── index.html                  ← Entry point
    ├── css/
    │   └── styles.css
    └── js/
        ├── api.js                  ← All Fetch API calls
        ├── auth.js                 ← Login / Register logic
        ├── projects.js             ← Projects screen logic
        ├── tasks.js                ← Tasks screen logic
        └── app.js                  ← Router / App init
```

---

## 3. Database Schema (Mongoose Models)

### User
```
_id         ObjectId  (auto)
email       String    required, unique, lowercase
password    String    required (bcrypt hashed)
createdAt   Date      auto
updatedAt   Date      auto
```

### RefreshToken
```
_id         ObjectId  (auto)
userId      ObjectId  ref: User, required
token       String    required, unique
expiresAt   Date      required
createdAt   Date      auto
```

### Project
```
_id         ObjectId  (auto)
userId      ObjectId  ref: User, required
name        String    required, trim, maxLength: 100
description String    optional, maxLength: 500
createdAt   Date      auto
updatedAt   Date      auto
```

### Tag
```
_id         ObjectId  (auto)
userId      ObjectId  ref: User, required
name        String    required, trim, maxLength: 50
color       String    optional, hex code e.g. #FF5733
createdAt   Date      auto
```

### Task
```
_id         ObjectId  (auto)
userId      ObjectId  ref: User, required
projectId   ObjectId  ref: Project, required
title       String    required, trim, maxLength: 200
description String    optional, maxLength: 2000
status      String    enum: [TODO, IN_PROGRESS, DONE], default: TODO
priority    String    enum: [LOW, MEDIUM, HIGH], default: MEDIUM
dueDate     Date      optional
tags        ObjectId[]  ref: Tag, default: []
createdAt   Date      auto
updatedAt   Date      auto
```

---

## 4. API Architecture

### Pattern: Routes → Controller → Service → Mongoose Model

- **Routes** — define HTTP method + path, attach middleware, call controller
- **Controller** — extract req data, call service, send HTTP response
- **Service** — business logic, DB queries via Mongoose, throws AppError on failure
- **Mongoose Schema** — defines document shape and indexes

### Controller Rule
Controllers never contain business logic. They only:
1. Extract data from `req.body`, `req.params`, `req.query`
2. Call the service
3. Return `res.status(xxx).json({...})`

### Service Rule
Services never access `req` or `res`. They receive plain data and return plain data or throw `AppError`.

---

## 5. Auth Flow

### Register
1. Validate email + password
2. Check email not already in use
3. Hash password with bcrypt (rounds: 12)
4. Create User document
5. Return `201` with user object (no password)

### Login
1. Validate email + password
2. Find user by email
3. Compare password with bcrypt
4. Sign access token (JWT, 15min, payload: `{ userId, email }`)
5. Sign refresh token (JWT, 7days, payload: `{ userId }`)
6. Store refresh token in `RefreshToken` collection with `expiresAt`
7. Return `200` with `{ accessToken, refreshToken, user }`

### Refresh Token
1. Verify refresh token signature
2. Find token in `RefreshToken` collection
3. Check not expired
4. Delete old refresh token (rotation)
5. Issue new access token + new refresh token
6. Return `200` with `{ accessToken, refreshToken }`

### Logout
1. Find and delete refresh token from `RefreshToken` collection
2. Return `204`

### Protected Routes
All routes except `POST /auth/register` and `POST /auth/login` require:
`Authorization: Bearer <accessToken>`

The `authenticate` middleware verifies the JWT and attaches `req.user = { userId, email }`.

---

## 6. Error Handling (RFC 7807)

All errors return this shape:
```json
{
  "type": "https://taskflow.dev/errors/{error-code}",
  "title": "Human readable title",
  "status": 400,
  "detail": "Specific detail about what went wrong",
  "instance": "/api/v1/auth/login"
}
```

### AppError Class
```typescript
class AppError extends Error {
  status: number
  code: string
  constructor(message: string, status: number, code: string)
}
```

### Common Error Codes
| Code                  | Status | Meaning                        |
|-----------------------|--------|--------------------------------|
| VALIDATION_ERROR      | 400    | Invalid request body/params    |
| UNAUTHORIZED          | 401    | Missing or invalid JWT         |
| FORBIDDEN             | 403    | Action not allowed             |
| NOT_FOUND             | 404    | Resource does not exist        |
| CONFLICT              | 409    | Duplicate resource (e.g email) |
| INTERNAL_ERROR        | 500    | Unexpected server error        |

---

## 7. Request Validation

Use a lightweight validation utility (Zod) in the `validate` middleware.
Each route defines a Zod schema. The middleware validates `req.body` and throws `VALIDATION_ERROR` if it fails.

---

## 8. Environment Variables

```
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/taskflow

# JWT
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

All env vars are loaded via `src/config/env.ts` which validates and exports typed values. No raw `process.env` access outside this file.

---

## 9. Frontend Architecture

The frontend is Vanilla JS — no framework, no build step.

### Page Routing
Handled by `app.js` using `window.location.hash`:
- `#/login` → renders login screen
- `#/register` → renders register screen
- `#/projects` → renders project list
- `#/projects/:id` → renders task list for project

### Token Storage
- `accessToken` stored in memory (JS variable) — never in localStorage
- `refreshToken` stored in `httpOnly` cookie (set by server) OR localStorage for simplicity in v1

### API Layer (`api.js`)
All Fetch calls go through a single `request()` wrapper that:
1. Attaches `Authorization: Bearer <accessToken>` header
2. On `401` response, auto-calls refresh token endpoint
3. Retries original request with new access token
4. On refresh failure, redirects to login

---

## 10. Indexes (MongoDB)

```
User:         email (unique)
RefreshToken: token (unique), userId, expiresAt
Project:      userId
Task:         userId, projectId, status, priority, dueDate, tags
Tag:          userId
```

---

## 11. Module Build Order

Claude Code implements modules in this order to respect dependencies:

```
1. Project setup (Express app, MongoDB connection, middleware)
2. Auth module (User schema, register, login, refresh, logout)
3. Projects module (CRUD)
4. Tags module (CRUD)
5. Tasks module (CRUD + filters)
6. Frontend (auth screens → project list → task list)
```
