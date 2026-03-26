# Task 004 — Tags Module Implementation

## Context Files to Read First
1. `CLAUDE.md` — conventions you must follow
2. `specs/tags.md` — full tags spec, source of truth for this task

Do not read any other spec file. This task is scoped to tags only.

---

## Goal

Implement the complete tags module: Mongoose schema, service, controller, and all 4 endpoints.
Tasks 001 (project setup) and 002 (auth) must be complete before starting this task.

---

## What to Build

### 1. Mongoose Schema — `src/modules/tags/tags.schema.ts`

Implement `TagSchema` exactly as defined in `specs/tags.md §Mongoose Schema`.

Export model as `TagModel`.

---

### 2. Tags Service — `src/modules/tags/tags.service.ts`

Implement these 4 functions following the logic steps in `specs/tags.md §Endpoints`:
- `createTag(userId, data)` — check duplicate name, create and return tag
- `getTags(userId)` — return all tags for user sorted by name ascending
- `updateTag(userId, tagId, data)` — check duplicate name if updating, return updated tag
- `deleteTag(userId, tagId)` — remove tag from all tasks using `$pull`, then delete tag

Each function must:
- Receive plain data only (no `req`/`res`)
- Return plain data or throw `AppError`
- Always filter by both `_id` and `userId` as required by `CLAUDE.md §Mongoose Rules`

---

### 3. Tags Controller — `src/modules/tags/tags.controller.ts`

Implement 4 route handlers — one per endpoint.

Each handler must:
- Define its Zod validation schema (from `specs/tags.md §Validation Schemas`)
- Validate `req.body` and/or `req.params`
- Call the corresponding service function
- Return the exact response shape defined in `specs/tags.md §Success Response`
- Be wrapped with `asyncHandler()`

---

### 4. Tags Routes — `src/modules/tags/tags.routes.ts`

```
POST   /        → authenticate → tagsController.create
GET    /        → authenticate → tagsController.getAll
PATCH  /:tagId  → authenticate → tagsController.update
DELETE /:tagId  → authenticate → tagsController.delete
```

Export as `tagsRouter`.

---

### 5. Mount Tags Routes — `src/app.ts`

Add the tags router:
```typescript
import { tagsRouter } from './modules/tags/tags.routes'
app.use('/api/v1/tags', tagsRouter)
```

---

### 6. Tests — `src/modules/tags/tags.service.test.ts`

Write all 12 tests listed in `specs/tags.md §Tests to Write`.

Rules:
- Use Vitest
- Mock `TagModel` and `TaskModel` — never connect to real DB
- Each test must be isolated with `vi.clearAllMocks()` in `beforeEach`

---

## Acceptance Criteria

- [ ] `POST /api/v1/tags` creates tag and returns 201
- [ ] `GET /api/v1/tags` returns all tags for authenticated user sorted alphabetically
- [ ] `PATCH /api/v1/tags/:tagId` updates only provided fields and returns 200
- [ ] `DELETE /api/v1/tags/:tagId` removes tag from all tasks and returns 204
- [ ] Duplicate tag name for same user returns 409
- [ ] Deleting a tag does not delete any tasks
- [ ] Invalid hex color returns 400
- [ ] Invalid ObjectId format returns 400
- [ ] All 12 Vitest tests pass

---

## What Claude Must NOT Do

- Do not delete tasks when a tag is deleted — only pull the tag reference from tasks
- Do not use `$unset` to remove tags from tasks — always use `$pull`
- Do not implement projects or tasks logic in this task
