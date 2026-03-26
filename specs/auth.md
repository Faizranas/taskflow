# Spec — Auth Module

> Read CLAUDE.md before implementing anything in this file.
> Read docs/TECHNICAL_SPEC.md §3 for Mongoose schema definitions.

---

## Overview

The auth module handles user registration, login, token refresh, and logout.
It is the first module to be implemented. All other modules depend on it.

---

## Files to Create

```
backend/src/modules/auth/
  auth.routes.ts
  auth.controller.ts
  auth.service.ts
  auth.schema.ts
backend/src/utils/
  jwt.ts
  AppError.ts
  asyncHandler.ts
backend/src/middleware/
  authenticate.ts
backend/src/config/
  env.ts
  db.ts
```

---

## Mongoose Schemas

### User Schema (`auth.schema.ts`)
```
_id         ObjectId   auto
email       String     required, unique, lowercase, trim
password    String     required (bcrypt hashed, never returned in responses)
createdAt   Date       auto (timestamps: true)
updatedAt   Date       auto (timestamps: true)
```

### RefreshToken Schema (`auth.schema.ts`)
```
_id         ObjectId   auto
userId      ObjectId   ref: User, required
token       String     required, unique
expiresAt   Date       required
createdAt   Date       auto (timestamps: true)
```

Export both models: `UserModel` and `RefreshTokenModel`.

---

## Endpoints

### POST /api/v1/auth/register

**Purpose:** Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `email` — required, valid email format, max 255 chars
- `password` — required, min 8 chars, max 72 chars

**Logic:**
1. Validate request body
2. Lowercase and trim email
3. Check if email already exists in User collection → throw CONFLICT if found
4. Hash password using bcrypt with 12 rounds
5. Create User document
6. Return created user (without password field)

**Success Response — 201:**
```json
{
  "user": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Code             | When                        |
|--------|------------------|-----------------------------|
| 400    | VALIDATION_ERROR | email or password invalid   |
| 409    | CONFLICT         | email already registered    |
| 500    | INTERNAL_ERROR   | unexpected server error     |

---

### POST /api/v1/auth/login

**Purpose:** Authenticate user and issue tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `email` — required, valid email format
- `password` — required, non-empty string

**Logic:**
1. Validate request body
2. Find user by email (case insensitive) → throw UNAUTHORIZED if not found
3. Compare plain password with stored hash using bcrypt → throw UNAUTHORIZED if mismatch
4. Sign access token: payload `{ userId, email }`, secret `JWT_ACCESS_SECRET`, expires `15m`
5. Sign refresh token: payload `{ userId }`, secret `JWT_REFRESH_SECRET`, expires `7d`
6. Store refresh token in RefreshToken collection with `expiresAt = now + 7 days`
7. Return tokens and user object

**Success Response — 200:**
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "user": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Code             | When                           |
|--------|------------------|--------------------------------|
| 400    | VALIDATION_ERROR | missing or invalid fields      |
| 401    | UNAUTHORIZED     | email not found or wrong password |
| 500    | INTERNAL_ERROR   | unexpected server error        |

**Security Note:** Return the same UNAUTHORIZED error for both "email not found" and "wrong password". Never reveal which one failed.

---

### POST /api/v1/auth/refresh

**Purpose:** Issue a new access token + new refresh token using a valid refresh token.

**Request Body:**
```json
{
  "refreshToken": "<jwt>"
}
```

**Validation Rules:**
- `refreshToken` — required, non-empty string

**Logic:**
1. Validate request body
2. Verify refresh token signature using `JWT_REFRESH_SECRET` → throw UNAUTHORIZED if invalid
3. Find token in RefreshToken collection → throw UNAUTHORIZED if not found
4. Check `expiresAt > now` → throw UNAUTHORIZED if expired
5. Delete old refresh token from collection (token rotation)
6. Find user by `userId` from token payload → throw UNAUTHORIZED if user not found
7. Sign new access token
8. Sign new refresh token
9. Store new refresh token in RefreshToken collection
10. Return new tokens

**Success Response — 200:**
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

**Error Responses:**
| Status | Code         | When                                         |
|--------|--------------|----------------------------------------------|
| 400    | VALIDATION_ERROR | refreshToken missing                     |
| 401    | UNAUTHORIZED | invalid signature, token not in DB, expired  |
| 500    | INTERNAL_ERROR | unexpected server error                    |

---

### POST /api/v1/auth/logout

**Purpose:** Invalidate the user's refresh token.

**Auth:** Required (Bearer access token)

**Request Body:**
```json
{
  "refreshToken": "<jwt>"
}
```

**Validation Rules:**
- `refreshToken` — required, non-empty string

**Logic:**
1. Validate request body
2. Delete matching refresh token from RefreshToken collection
3. If token not found, still return 204 (idempotent)

**Success Response — 204:** (no body)

**Error Responses:**
| Status | Code             | When                        |
|--------|------------------|-----------------------------|
| 400    | VALIDATION_ERROR | refreshToken missing        |
| 401    | UNAUTHORIZED     | missing or invalid JWT      |
| 500    | INTERNAL_ERROR   | unexpected server error     |

---

## Middleware: authenticate.ts

This middleware protects all non-auth routes.

**Logic:**
1. Read `Authorization` header
2. Check format is `Bearer <token>` → throw UNAUTHORIZED if missing or malformed
3. Verify token using `JWT_ACCESS_SECRET` → throw UNAUTHORIZED if invalid or expired
4. Attach `req.user = { userId: string, email: string }` to request
5. Call `next()`

**TypeScript:** Extend Express `Request` interface to include `user`:
```typescript
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string }
    }
  }
}
```

---

## JWT Utility (`utils/jwt.ts`)

Export these functions:
```typescript
signAccessToken(payload: { userId: string; email: string }): string
signRefreshToken(payload: { userId: string }): string
verifyAccessToken(token: string): { userId: string; email: string }
verifyRefreshToken(token: string): { userId: string }
```

All secrets and expiry values come from `config/env.ts`. Never hardcode them.

---

## AppError Utility (`utils/AppError.ts`)

```typescript
class AppError extends Error {
  status: number
  code: string
  constructor(message: string, status: number, code: string)
}
```

---

## asyncHandler Utility (`utils/asyncHandler.ts`)

Wrap all async route handlers to forward errors to Express error middleware:
```typescript
const asyncHandler = (fn: RequestHandler) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)
```

---

## Validation Schemas (Zod)

Define Zod schemas in each controller file for request validation:

```typescript
// register
{ email: z.string().email().max(255), password: z.string().min(8).max(72) }

// login
{ email: z.string().email(), password: z.string().min(1) }

// refresh
{ refreshToken: z.string().min(1) }

// logout
{ refreshToken: z.string().min(1) }
```

---

## Tests to Write

File: `backend/src/modules/auth/auth.service.test.ts`

| Test | Description |
|------|-------------|
| register - success | creates user, returns user without password |
| register - duplicate email | throws CONFLICT AppError |
| login - success | returns accessToken, refreshToken, user |
| login - wrong email | throws UNAUTHORIZED AppError |
| login - wrong password | throws UNAUTHORIZED AppError |
| refresh - success | deletes old token, returns new tokens |
| refresh - invalid token | throws UNAUTHORIZED AppError |
| refresh - expired token | throws UNAUTHORIZED AppError |
| logout - success | deletes token, returns void |
| logout - token not found | does not throw, returns void |

Mock `UserModel` and `RefreshTokenModel` using Vitest mocks. Never connect to real DB.

---

## What Claude Must NOT Do

- Never return the `password` field in any response
- Never use the same error message for different auth failures (except login — keep vague)
- Never skip token rotation on refresh
- Never store plain text tokens or passwords
- Never access `req`/`res` inside `auth.service.ts`
