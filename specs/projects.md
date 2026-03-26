# Spec — Projects Module

> Read CLAUDE.md before implementing anything in this file.
> Auth module must be complete before implementing this module.
> All routes in this module are protected — require valid JWT via authenticate middleware.

---

## Overview

The projects module allows an authenticated user to create and manage projects.
Every task in TaskFlow belongs to a project. A user can only see and manage their own projects.

---

## Files to Create

```
backend/src/modules/projects/
  projects.routes.ts
  projects.controller.ts
  projects.service.ts
  projects.schema.ts
```

---

## Mongoose Schema (`projects.schema.ts`)

```
_id         ObjectId   auto
userId      ObjectId   ref: User, required, indexed
name        String     required, trim, maxLength: 100
description String     optional, trim, maxLength: 500
createdAt   Date       auto (timestamps: true)
updatedAt   Date       auto (timestamps: true)
```

Export model as `ProjectModel`.

Index: `{ userId: 1 }` for fast per-user queries.

---

## Endpoints

### POST /api/v1/projects

**Purpose:** Create a new project for the authenticated user.

**Auth:** Required

**Request Body:**
```json
{
  "name": "My Project",
  "description": "Optional description"
}
```

**Validation Rules:**
- `name` — required, string, min 1 char, max 100 chars after trim
- `description` — optional, string, max 500 chars after trim

**Logic:**
1. Validate request body
2. Create Project document with `userId` from `req.user.userId`
3. Return created project

**Success Response — 201:**
```json
{
  "project": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "My Project",
    "description": "Optional description",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Code             | When                        |
|--------|------------------|-----------------------------|
| 400    | VALIDATION_ERROR | name missing or invalid     |
| 401    | UNAUTHORIZED     | missing or invalid JWT      |
| 500    | INTERNAL_ERROR   | unexpected server error     |

---

### GET /api/v1/projects

**Purpose:** Get all projects belonging to the authenticated user.

**Auth:** Required

**Query Parameters:** None in v1

**Logic:**
1. Find all Project documents where `userId` matches `req.user.userId`
2. Sort by `createdAt` descending (newest first)
3. Use `.lean()` for performance
4. Return array of projects

**Success Response — 200:**
```json
{
  "projects": [
    {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "My Project",
      "description": "Optional description",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Error Responses:**
| Status | Code         | When                   |
|--------|--------------|------------------------|
| 401    | UNAUTHORIZED | missing or invalid JWT |
| 500    | INTERNAL_ERROR | unexpected server error |

---

### GET /api/v1/projects/:projectId

**Purpose:** Get a single project by ID.

**Auth:** Required

**URL Params:**
- `projectId` — MongoDB ObjectId string

**Logic:**
1. Validate `projectId` is a valid MongoDB ObjectId format → throw VALIDATION_ERROR if not
2. Find Project by `_id` and `userId` (both must match) → throw NOT_FOUND if not found
3. Return project

**Success Response — 200:**
```json
{
  "project": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "My Project",
    "description": "Optional description",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Code             | When                             |
|--------|------------------|----------------------------------|
| 400    | VALIDATION_ERROR | projectId is not valid ObjectId  |
| 401    | UNAUTHORIZED     | missing or invalid JWT           |
| 404    | NOT_FOUND        | project not found or not owned   |
| 500    | INTERNAL_ERROR   | unexpected server error          |

---

### PATCH /api/v1/projects/:projectId

**Purpose:** Update name and/or description of a project.

**Auth:** Required

**URL Params:**
- `projectId` — MongoDB ObjectId string

**Request Body** (all fields optional, at least one required):
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Validation Rules:**
- `name` — optional, string, min 1 char, max 100 chars after trim
- `description` — optional, string, max 500 chars after trim
- At least one of `name` or `description` must be present

**Logic:**
1. Validate `projectId` is a valid ObjectId
2. Validate request body
3. Find Project by `_id` and `userId` → throw NOT_FOUND if not found
4. Update only the fields provided (partial update)
5. Use `findByIdAndUpdate` with `{ new: true, runValidators: true }`
6. Return updated project

**Success Response — 200:**
```json
{
  "project": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Updated Name",
    "description": "Updated description",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Code             | When                              |
|--------|------------------|-----------------------------------|
| 400    | VALIDATION_ERROR | invalid projectId or empty body   |
| 401    | UNAUTHORIZED     | missing or invalid JWT            |
| 404    | NOT_FOUND        | project not found or not owned    |
| 500    | INTERNAL_ERROR   | unexpected server error           |

---

### DELETE /api/v1/projects/:projectId

**Purpose:** Delete a project and all its tasks (cascade delete).

**Auth:** Required

**URL Params:**
- `projectId` — MongoDB ObjectId string

**Logic:**
1. Validate `projectId` is a valid ObjectId
2. Find Project by `_id` and `userId` → throw NOT_FOUND if not found
3. Delete all Task documents where `projectId` matches (cascade)
4. Delete the Project document
5. Return 204

**Success Response — 204:** (no body)

**Error Responses:**
| Status | Code             | When                             |
|--------|------------------|----------------------------------|
| 400    | VALIDATION_ERROR | invalid projectId format         |
| 401    | UNAUTHORIZED     | missing or invalid JWT           |
| 404    | NOT_FOUND        | project not found or not owned   |
| 500    | INTERNAL_ERROR   | unexpected server error          |

**Important:** The cascade delete of tasks must happen in `projects.service.ts` by importing and calling `TaskModel.deleteMany({ projectId })`. Do not use Mongoose middleware hooks for this in v1.

---

## Validation Utility

Define Zod schemas in `projects.controller.ts`:

```typescript
const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional()
})

const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional()
}).refine(data => data.name !== undefined || data.description !== undefined, {
  message: 'At least one field must be provided'
})
```

---

## Tests to Write

File: `backend/src/modules/projects/projects.service.test.ts`

| Test | Description |
|------|-------------|
| createProject - success | returns created project with correct userId |
| createProject - missing name | throws VALIDATION_ERROR |
| getProjects - success | returns only projects belonging to user |
| getProjects - empty | returns empty array, not error |
| getProjectById - success | returns correct project |
| getProjectById - wrong user | throws NOT_FOUND |
| getProjectById - not found | throws NOT_FOUND |
| updateProject - success | returns updated fields |
| updateProject - wrong user | throws NOT_FOUND |
| updateProject - empty body | throws VALIDATION_ERROR |
| deleteProject - success | deletes project and cascades to tasks |
| deleteProject - wrong user | throws NOT_FOUND |

---

## What Claude Must NOT Do

- Never return tasks inside a project response in v1
- Never cascade delete tasks without filtering by `projectId`
