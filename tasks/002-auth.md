# Task 002 — Auth Module Implementation

## Context Files to Read First
1. `CLAUDE.md` — conventions you must follow
2. `specs/auth.md` — full auth spec, source of truth for this task

Do not read any other spec file. This task is scoped to auth only.

---

## Goal

Implement the complete auth module: Mongoose schemas, JWT utilities, middleware, and all 4 endpoints.
Task 001 (project setup) must be complete before starting this task.

---

## What to Build

### 1. Mongoose Schemas — `src/modules/auth/auth.schema.ts`

Implement `UserSchema` and `RefreshTokenSchema` exactly as defined in `specs/auth.md §Mongoose Schemas`.

Export both models:
- `UserModel`
- `RefreshTokenModel`

---

### 2. JWT Utility — `src/utils/jwt.ts`

Implement all 4 functions exactly as defined in `specs/auth.md §JWT Utility`:
- `signAccessToken`
- `signRefreshToken`
- `verifyAccessToken`
- `verifyRefreshToken`

All secrets and expiry values must come from `src/config/env.ts`. Never hardcode.

---

### 3. Auth Service — `src/modules/auth/auth.service.ts`

Implement these 4 functions following the logic steps in `specs/auth.md §Endpoints`:
- `register(email, password)` — create user, return user without password
- `login(email, password)` — verify credentials, issue tokens, store refresh token
- `refresh(refreshToken)` — rotate refresh token, issue new pair
- `logout(refreshToken)` — delete refresh token from DB

Each function must:
- Receive plain data only (no `req`/`res`)
- Return plain data or throw `AppError`
- Use error codes from `specs/auth.md §Error Responses` tables

---

### 4. Auth Controller — `src/modules/auth/auth.controller.ts`

Implement 4 route handlers — one per endpoint.

Each handler must:
- Define its Zod validation schema (from `specs/auth.md §Validation Schemas`)
- Parse and validate `req.body`
- Call the corresponding service function
- Return the exact response shape defined in `specs/auth.md §Success Response`
- Be wrapped with `asyncHandler()`

---

### 5. Auth Routes — `src/modules/auth/auth.routes.ts`

```
POST /register   → authController.register
POST /login      → authController.login
POST /refresh    → authController.refresh
POST /logout     → authenticate middleware → authController.logout
```

Export as `authRouter`.

---

### 6. Authenticate Middleware — `src/middleware/authenticate.ts`

Implement exactly as defined in `specs/auth.md §Middleware: authenticate.ts`.

Include the Express `Request` interface extension for `req.user`.

---

### 7. Mount Auth Routes — `src/app.ts`

Uncomment and add the auth router:
```typescript
import { authRouter } from './modules/auth/auth.routes'
app.use('/api/v1/auth', authRouter)
```

---

### 8. Tests — `src/modules/auth/auth.service.test.ts`

Write all 10 tests listed in `specs/auth.md §Tests to Write`.

Rules:
- Use Vitest
- Mock `UserModel` and `RefreshTokenModel` — never connect to real DB
- Mock `bcrypt` where needed
- Each test must be isolated with `vi.clearAllMocks()` in `beforeEach`

---

## Acceptance Criteria

- [ ] `POST /api/v1/auth/register` creates user and returns 201 with user object (no password)
- [ ] `POST /api/v1/auth/login` returns 200 with `accessToken`, `refreshToken`, and `user`
- [ ] `POST /api/v1/auth/refresh` rotates refresh token and returns new token pair
- [ ] `POST /api/v1/auth/logout` returns 204 and deletes refresh token from DB
- [ ] Duplicate email on register returns 409
- [ ] Wrong credentials on login returns 401 (same message for both cases)
- [ ] Missing or invalid JWT on protected route returns 401
- [ ] Password is never returned in any response
- [ ] All 10 Vitest tests pass

---

## What Claude Must NOT Do

- Do not implement projects, tasks, or tags logic in this task
- Do not return `password` field in any response under any circumstance
- Do not use the same specific error message for "email not found" and "wrong password" — both must return the generic UNAUTHORIZED message
- Do not store plain text passwords or tokens
- Do not access `req` or `res` inside `auth.service.ts`
