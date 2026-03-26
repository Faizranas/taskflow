# CLAUDE.md — TaskFlow AI Conventions

> This file is sent with every task. Keep it respected at all times.

---

## Stack
- Backend: Node.js + Express + TypeScript + MongoDB + Mongoose
- Frontend: Vanilla JS + Fetch API + plain CSS
- Auth: JWT (access 15min, refresh 7days)
- Tests: Vitest
- API Base: `/api/v1/{resource}`

---

## Folder Rules
- All backend code lives in `backend/src/`
- Each module has exactly 4 files: `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.schema.ts`
- Middleware lives in `backend/src/middleware/`
- Shared utilities live in `backend/src/utils/`
- Frontend JS files live in `frontend/js/`

---

## Naming Conventions
- Files: `kebab-case.ts` — e.g. `auth.service.ts`
- Variables/functions: `camelCase`
- Types/Interfaces: `PascalCase`
- Mongoose models: `PascalCase` — e.g. `User`, `Task`
- Constants: `UPPER_SNAKE_CASE`
- API routes: lowercase plural — e.g. `/api/v1/tasks`

---

## TypeScript Rules
- Never use `any` — use `unknown` or define a proper type
- All function parameters and return types must be explicitly typed
- Use `interface` for object shapes, `type` for unions/aliases
- Enable strict mode in `tsconfig.json`

---

## Architecture Rules
- Controllers extract from `req`, call service, return `res` — nothing else
- Services contain all business logic — never access `req` or `res`
- Never write raw `process.env` — always use `src/config/env.ts`
- Never put DB queries in controllers
- All async route handlers must be wrapped with `asyncHandler()`

---

## Error Handling
- Always throw `AppError` from services — never generic `Error`
- All errors return RFC 7807 format (see TECHNICAL_SPEC.md §6)
- Global error handler in `middleware/errorHandler.ts` catches all errors
- Never swallow errors silently with empty catch blocks

---

## Mongoose Rules
- Define all schemas in `*.schema.ts` — export both schema and model
- Always use `{ timestamps: true }` on every schema
- Never use `.save()` — prefer `Model.create()`, `findByIdAndUpdate()`
- Always use `lean()` on read queries for performance
- Always query owned resources with both `_id` and `userId` — never by `_id` alone
  ```typescript
  // Correct
  Model.findOne({ _id: id, userId })
  // Wrong — never do this
  Model.findById(id)
  ```

---

## Testing Rules
- Every service function must have a corresponding Vitest unit test
- Test files live alongside source: `auth.service.test.ts`
- Mock Mongoose models in unit tests — never hit real DB
- Test file naming: `*.test.ts`

---

## Never Do
- Never hardcode secrets, tokens, or connection strings
- Never use `console.log` in production code — use a logger
- Never return passwords in API responses
- Never access `req`/`res` inside a service
- Never edit generated files — fix the spec instead
