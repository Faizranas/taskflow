# Spec — Tasks Module

> Read CLAUDE.md before implementing anything in this file.
> Auth and Projects modules must be complete before implementing this module.
> All routes are protected — require valid JWT via authenticate middleware.

---

## Overview

The tasks module is the core of TaskFlow. A task always belongs to a project and a user.
Tasks support filtering by status, priority, due date, and tags.

---

## Files to Create

```
backend/src/modules/tasks/
  tasks.routes.ts
  tasks.controller.ts
  tasks.service.ts
  tasks.schema.ts
```

---

## Mongoose Schema (`tasks.schema.ts`)

```
_id           ObjectId    auto
userId        ObjectId    ref: User, required, indexed
projectId     ObjectId    ref: Project, required, indexed
title         String      required, trim, maxLength: 200
description   String      optional, trim, maxLength: 2000
status        String      enum: [TODO, IN_PROGRESS, DONE], default: TODO
priority      String      enum: [LOW, MEDIUM, HIGH], default: MEDIUM
dueDate       Date        optional
tags          ObjectId[]  ref: Tag, default: []
createdAt     Date        auto (timestamps: true)
updatedAt     Date        auto (timestamps: true)
```

Export model as `TaskModel`.

Indexes:
- `{ userId: 1 }`
- `{ projectId: 1 }`
- `{ userId: 1, status: 1 }`
- `{ userId: 1, priority: 1 }`
- `{ userId: 1, dueDate: 1 }`

---

## Endpoints

### POST /api/v1/projects/:projectId/tasks

**Purpose:** Create a new task inside a project.

**Auth:** Required

**URL Params:**
- `projectId` — MongoDB ObjectId string

**Request Body:**
```json
{
  "title": "Fix login bug",
  "description": "Optional description",
  "priority": "HIGH",
  "dueDate": "2024-12-31T00:00:00.000Z",
  "tags": ["64f1a2b3c4d5e6f7a8b9c0d1"]
}
```

**Validation Rules:**
- `projectId` — valid MongoDB ObjectId
- `title` — required, string, min 1 char, max 200 chars after trim
- `description` — optional, string, max 2000 chars after trim
- `status` — optional, must be one of: `TODO`, `IN_PROGRESS`, `DONE` (default: `TODO`)
- `priority` — optional, must be one of: `LOW`, `MEDIUM`, `HIGH` (default: `MEDIUM`)
- `dueDate` — optional, valid ISO 8601 date string, must not be in the past
- `tags` — optional, array of valid MongoDB ObjectId strings

**Logic:**
1. Validate `projectId` is a valid ObjectId
2. Verify project exists and belongs to `req.user.userId` → throw NOT_FOUND if not
3. Validate request body
4. If `tags` provided, verify all tag IDs exist and belong to `req.user.userId` → throw NOT_FOUND if any invalid
5. Create Task document with `userId` and `projectId`
6. Return created task with tags populated

**Success Response — 201:**
```json
{
  "task": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d2",
    "projectId": "64f1a2b3c4d5e6f7a8b9c0d1",
    "title": "Fix login bug",
    "description": "Optional description",
    "status": "TODO",
    "priority": "HIGH",
    "dueDate": "2024-12-31T00:00:00.000Z",
    "tags": [
      { "id": "64f1a2b3c4d5e6f7a8b9c0d3", "name": "Bug", "color": "#FF5733" }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Code             | When                                      |
|--------|------------------|-------------------------------------------|
| 400    | VALIDATION_ERROR | invalid fields or dueDate in the past     |
| 401    | UNAUTHORIZED     | missing or invalid JWT                    |
| 404    | NOT_FOUND        | project not found or tag ID invalid       |
| 500    | INTERNAL_ERROR   | unexpected server error                   |

---

### GET /api/v1/projects/:projectId/tasks

**Purpose:** Get all tasks inside a project with optional filters.

**Auth:** Required

**URL Params:**
- `projectId` — MongoDB ObjectId string

**Query Parameters (all optional):**
| Param      | Type    | Description                              |
|------------|---------|------------------------------------------|
| `status`   | string  | Filter by: `TODO`, `IN_PROGRESS`, `DONE` |
| `priority` | string  | Filter by: `LOW`, `MEDIUM`, `HIGH`       |
| `tag`      | string  | Filter by Tag ObjectId                   |
| `dueBefore`| string  | ISO date — tasks due before this date    |
| `dueAfter` | string  | ISO date — tasks due after this date     |
| `sort`     | string  | `createdAt`, `dueDate`, `priority` (default: `createdAt`) |
| `order`    | string  | `asc` or `desc` (default: `desc`)        |

**Logic:**
1. Validate `projectId` is a valid ObjectId
2. Verify project exists and belongs to `req.user.userId` → throw NOT_FOUND if not
3. Build Mongoose filter object:
   - Always include `{ projectId, userId }`
   - Add `status` filter if provided
   - Add `priority` filter if provided
   - Add `{ tags: tagId }` filter if `tag` provided
   - Add `{ dueDate: { $lte: dueBefore } }` if `dueBefore` provided
   - Add `{ dueDate: { $gte: dueAfter } }` if `dueAfter` provided
4. Apply sort and order
5. Populate `tags` field (id, name, color only)
6. Use `.lean()` for performance
7. Return tasks array and total count

**Success Response — 200:**
```json
{
  "tasks": [
    {
      "id": "64f1a2b3c4d5e6f7a8b9c0d2",
      "projectId": "64f1a2b3c4d5e6f7a8b9c0d1",
      "title": "Fix login bug",
      "description": "Optional description",
      "status": "TODO",
      "priority": "HIGH",
      "dueDate": "2024-12-31T00:00:00.000Z",
      "tags": [
        { "id": "64f1a2b3c4d5e6f7a8b9c0d3", "name": "Bug", "color": "#FF5733" }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Error Responses:**
| Status | Code             | When                             |
|--------|------------------|----------------------------------|
| 400    | VALIDATION_ERROR | invalid projectId or query param |
| 401    | UNAUTHORIZED     | missing or invalid JWT           |
| 404    | NOT_FOUND        | project not found or not owned   |
| 500    | INTERNAL_ERROR   | unexpected server error          |

---

### GET /api/v1/projects/:projectId/tasks/:taskId

**Purpose:** Get a single task by ID.

**Auth:** Required

**URL Params:**
- `projectId` — MongoDB ObjectId string
- `taskId` — MongoDB ObjectId string

**Logic:**
1. Validate both `projectId` and `taskId` are valid ObjectIds
2. Find Task by `{ _id: taskId, projectId, userId }` → throw NOT_FOUND if not found
3. Populate `tags` (id, name, color only)
4. Return task

**Success Response — 200:**
```json
{
  "task": { ... }
}
```

**Error Responses:**
| Status | Code             | When                             |
|--------|------------------|----------------------------------|
| 400    | VALIDATION_ERROR | invalid projectId or taskId      |
| 401    | UNAUTHORIZED     | missing or invalid JWT           |
| 404    | NOT_FOUND        | task not found or not owned      |
| 500    | INTERNAL_ERROR   | unexpected server error          |

---

### PATCH /api/v1/projects/:projectId/tasks/:taskId

**Purpose:** Update one or more fields on a task.

**Auth:** Required

**URL Params:**
- `projectId` — MongoDB ObjectId string
- `taskId` — MongoDB ObjectId string

**Request Body** (all fields optional, at least one required):
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "IN_PROGRESS",
  "priority": "LOW",
  "dueDate": "2024-12-31T00:00:00.000Z",
  "tags": ["64f1a2b3c4d5e6f7a8b9c0d3"]
}
```

**Validation Rules:**
- Same as create, all fields optional
- At least one field must be present
- If `tags` provided, all tag IDs must exist and belong to the user
- `dueDate` can be set to `null` to clear it

**Logic:**
1. Validate both IDs
2. Validate request body
3. Find Task by `{ _id: taskId, projectId, userId }` → throw NOT_FOUND if not found
4. If `tags` provided, verify all tag IDs belong to `req.user.userId`
5. Update only provided fields using `findByIdAndUpdate` with `{ new: true, runValidators: true }`
6. Populate `tags` on updated document
7. Return updated task

**Success Response — 200:**
```json
{
  "task": { ... }
}
```

**Error Responses:**
| Status | Code             | When                              |
|--------|------------------|-----------------------------------|
| 400    | VALIDATION_ERROR | invalid IDs, empty body, bad data |
| 401    | UNAUTHORIZED     | missing or invalid JWT            |
| 404    | NOT_FOUND        | task not found or tag invalid     |
| 500    | INTERNAL_ERROR   | unexpected server error           |

---

### DELETE /api/v1/projects/:projectId/tasks/:taskId

**Purpose:** Delete a single task.

**Auth:** Required

**URL Params:**
- `projectId` — MongoDB ObjectId string
- `taskId` — MongoDB ObjectId string

**Logic:**
1. Validate both IDs
2. Find Task by `{ _id: taskId, projectId, userId }` → throw NOT_FOUND if not found
3. Delete the task
4. Return 204

**Success Response — 204:** (no body)

**Error Responses:**
| Status | Code             | When                        |
|--------|------------------|-----------------------------|
| 400    | VALIDATION_ERROR | invalid IDs                 |
| 401    | UNAUTHORIZED     | missing or invalid JWT      |
| 404    | NOT_FOUND        | task not found or not owned |
| 500    | INTERNAL_ERROR   | unexpected server error     |

---

## Tag Population Rule

Whenever a task is returned in a response, the `tags` field must be populated with:
```json
{ "id": "...", "name": "...", "color": "..." }
```
Never return raw ObjectId arrays for tags. Always populate.

---

## Validation Schemas (Zod)

Define in `tasks.controller.ts`:

```typescript
const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  tags: z.array(z.string().regex(/^[a-f\d]{24}$/i)).optional()
})

const updateTaskSchema = createTaskSchema
  .partial()
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided'
  })

const taskFilterSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  tag: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  sort: z.enum(['createdAt', 'dueDate', 'priority']).optional(),
  order: z.enum(['asc', 'desc']).optional()
})
```

---

## Tests to Write

File: `backend/src/modules/tasks/tasks.service.test.ts`

| Test | Description |
|------|-------------|
| createTask - success | returns task with populated tags |
| createTask - project not found | throws NOT_FOUND |
| createTask - invalid tag ID | throws NOT_FOUND |
| createTask - dueDate in past | throws VALIDATION_ERROR |
| getTasks - success | returns all tasks for project |
| getTasks - filter by status | returns only matching tasks |
| getTasks - filter by priority | returns only matching tasks |
| getTasks - filter by tag | returns only tasks with that tag |
| getTasks - filter by dueBefore | returns correct tasks |
| getTasks - project not owned | throws NOT_FOUND |
| getTaskById - success | returns task with populated tags |
| getTaskById - wrong project | throws NOT_FOUND |
| updateTask - success | returns updated task |
| updateTask - clear dueDate | dueDate becomes null |
| updateTask - replace tags | tags array fully replaced |
| updateTask - task not found | throws NOT_FOUND |
| deleteTask - success | task removed from DB |
| deleteTask - wrong user | throws NOT_FOUND |

---

## What Claude Must NOT Do

- Never return tasks across projects — always filter by `projectId`
- Never return raw tag ObjectIds — always populate tags
- Never allow a task to reference a tag from a different user
- Never skip project ownership check before creating a task
