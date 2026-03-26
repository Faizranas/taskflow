# Task 003 — Projects Module Implementation

## Context Files to Read First
1. `CLAUDE.md` — conventions you must follow
2. `specs/projects.md` — full projects spec, source of truth for this task

Do not read any other spec file. This task is scoped to projects only.

---

## Goal

Implement the complete projects module: Mongoose schema, service, controller, and all 5 endpoints.
Tasks 001 (project setup) and 002 (auth) must be complete before starting this task.

---

## What to Build

### 1. Mongoose Schema — `src/modules/projects/projects.schema.ts`

Implement `ProjectSchema` exactly as defined in `specs/projects.md §Mongoose Schema`.

Export model as `ProjectModel`.

---

### 2. Projects Service — `src/modules/projects/projects.service.ts`

Implement these 5 functions following the logic steps in `specs/projects.md §Endpoints`:
- `createProject(userId, data)` — create and return project
- `getProjects(userId)` — return all projects for user, sorted by `createdAt` desc
- `getProjectById(userId, projectId)` — return single project or throw NOT_FOUND
- `updateProject(userId, projectId, data)` — partial update, return updated project
- `deleteProject(userId, projectId)` — cascade delete tasks, then delete project

Each function must:
- Receive plain data only (no `req`/`res`)
- Return plain data or throw `AppError`
- Always filter by both `_id` and `userId` as required by `CLAUDE.md §Mongoose Rules`

---

### 3. Projects Controller — `src/modules/projects/projects.controller.ts`

Implement 5 route handlers — one per endpoint.

Each handler must:
- Define its Zod validation schema (from `specs/projects.md §Validation Utility`)
- Validate `req.body` and/or `req.params`
- Call the corresponding service function
- Return the exact response shape defined in `specs/projects.md §Success Response`
- Be wrapped with `asyncHandler()`

---

### 4. Projects Routes — `src/modules/projects/projects.routes.ts`

```
POST   /           → authenticate → projectsController.create
GET    /           → authenticate → projectsController.getAll
GET    /:projectId → authenticate → projectsController.getById
PATCH  /:projectId → authenticate → projectsController.update
DELETE /:projectId → authenticate → projectsController.delete
```

Export as `projectsRouter`.

---

### 5. Mount Projects Routes — `src/app.ts`

Add the projects router:
```typescript
import { projectsRouter } from './modules/projects/projects.routes'
app.use('/api/v1/projects', projectsRouter)
```

---

### 6. Tests — `src/modules/projects/projects.service.test.ts`

Write all 12 tests listed in `specs/projects.md §Tests to Write`.

Rules:
- Use Vitest
- Mock `ProjectModel` and `TaskModel` — never connect to real DB
- Each test must be isolated with `vi.clearAllMocks()` in `beforeEach`

---

## Acceptance Criteria

- [ ] `POST /api/v1/projects` creates project and returns 201
- [ ] `GET /api/v1/projects` returns all projects for authenticated user only
- [ ] `GET /api/v1/projects/:projectId` returns single project or 404
- [ ] `PATCH /api/v1/projects/:projectId` updates only provided fields
- [ ] `DELETE /api/v1/projects/:projectId` deletes project and all its tasks, returns 204
- [ ] A user cannot access another user's project (returns 404, not 403)
- [ ] Empty `PATCH` body returns 400
- [ ] Invalid ObjectId format returns 400
- [ ] All 12 Vitest tests pass

---

## What Claude Must NOT Do

- Do not return tasks inside any project response
- Do not delete tasks without filtering by `projectId`
- Do not implement tasks or tags logic in this task
