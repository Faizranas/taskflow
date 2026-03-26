# Task 005 — Tasks Module Implementation

## Context Files to Read First
1. `CLAUDE.md` — conventions you must follow
2. `specs/tasks.md` — full tasks spec, source of truth for this task

Do not read any other spec file. This task is scoped to tasks only.

---

## Goal

Implement the complete tasks module: Mongoose schema, service, controller, and all 5 endpoints.
Tasks 001 (project setup), 002 (auth), 003 (projects), and 004 (tags) must be complete before starting this task.

---

## What to Build

### 1. Mongoose Schema — `src/modules/tasks/tasks.schema.ts`

Implement `TaskSchema` exactly as defined in `specs/tasks.md §Mongoose Schema`.

Export model as `TaskModel`.

---

### 2. Tasks Service — `src/modules/tasks/tasks.service.ts`

Implement these 5 functions following the logic steps in `specs/tasks.md §Endpoints`:
- `createTask(userId, projectId, data)` — verify project ownership, verify tag ownership, create task, return with populated tags
- `getTasks(userId, projectId, filters)` — verify project ownership, build filter object, return tasks with populated tags
- `getTaskById(userId, projectId, taskId)` — return single task with populated tags or throw NOT_FOUND
- `updateTask(userId, projectId, taskId, data)` — verify tag ownership if tags provided, partial update, return updated task with populated tags
- `deleteTask(userId, projectId, taskId)` — delete single task, return void

Each function must:
- Receive plain data only (no `req`/`res`)
- Return plain data or throw `AppError`
- Always filter by `_id`, `projectId`, and `userId` together as required by `CLAUDE.md §Mongoose Rules`
- Always populate `tags` field as `{ id, name, color }` — never return raw ObjectIds

---

### 3. Tasks Controller — `src/modules/tasks/tasks.controller.ts`

Implement 5 route handlers — one per endpoint.

Each handler must:
- Define its Zod validation schema (from `specs/tasks.md §Validation Schemas`)
- Validate `req.body`, `req.params`, and `req.query` as appropriate
- Call the corresponding service function
- Return the exact response shape defined in `specs/tasks.md §Success Response`
- Be wrapped with `asyncHandler()`

---

### 4. Tasks Routes — `src/modules/tasks/tasks.routes.ts`

```
POST   /projects/:projectId/tasks              → authenticate → tasksController.create
GET    /projects/:projectId/tasks              → authenticate → tasksController.getAll
GET    /projects/:projectId/tasks/:taskId      → authenticate → tasksController.getById
PATCH  /projects/:projectId/tasks/:taskId      → authenticate → tasksController.update
DELETE /projects/:projectId/tasks/:taskId      → authenticate → tasksController.delete
```

Export as `tasksRouter`.

---

### 5. Mount Tasks Routes — `src/app.ts`

Tasks routes are nested under projects. Mount at root level:
```typescript
import { tasksRouter } from './modules/tasks/tasks.routes'
app.use('/api/v1', tasksRouter)
```

---

### 6. Tests — `src/modules/tasks/tasks.service.test.ts`

Write all 18 tests listed in `specs/tasks.md §Tests to Write`.

Rules:
- Use Vitest
- Mock `TaskModel`, `ProjectModel`, and `TagModel` — never connect to real DB
- Each test must be isolated with `vi.clearAllMocks()` in `beforeEach`
- Test tag population by asserting populated shape `{ id, name, color }` not raw ObjectId

---

## Acceptance Criteria

- [ ] `POST /api/v1/projects/:projectId/tasks` creates task and returns 201 with populated tags
- [ ] `GET /api/v1/projects/:projectId/tasks` returns all tasks with correct filters applied
- [ ] `GET /api/v1/projects/:projectId/tasks` with `status=TODO` returns only TODO tasks
- [ ] `GET /api/v1/projects/:projectId/tasks` with `priority=HIGH` returns only HIGH tasks
- [ ] `GET /api/v1/projects/:projectId/tasks` with `tag=:tagId` returns only tasks with that tag
- [ ] `GET /api/v1/projects/:projectId/tasks/:taskId` returns single task with populated tags
- [ ] `PATCH /api/v1/projects/:projectId/tasks/:taskId` updates only provided fields
- [ ] `PATCH` with `dueDate: null` clears the due date
- [ ] `PATCH` with new `tags` array fully replaces existing tags
- [ ] `DELETE /api/v1/projects/:projectId/tasks/:taskId` deletes task and returns 204
- [ ] Task from a different project returns 404
- [ ] Tag belonging to a different user returns 404 on create/update
- [ ] All 18 Vitest tests pass

---

## What Claude Must NOT Do

- Do not return tasks across projects — always include `projectId` in every query
- Do not return raw tag ObjectIds — always populate `tags` as `{ id, name, color }`
- Do not allow a task to reference a tag owned by a different user
- Do not skip project ownership verification before creating or listing tasks
- Do not implement frontend logic in this task
