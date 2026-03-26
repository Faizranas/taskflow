# Spec — Tags Module

> Read CLAUDE.md before implementing anything in this file.
> Auth module must be complete before implementing this module.
> All routes are protected — require valid JWT via authenticate middleware.

---

## Overview

Tags are labels that a user creates and assigns to tasks.
A tag belongs to a user, not to a project. This means the same tag can be used across multiple projects.
Deleting a tag removes it from all tasks but does not delete those tasks.

---

## Files to Create

```
backend/src/modules/tags/
  tags.routes.ts
  tags.controller.ts
  tags.service.ts
  tags.schema.ts
```

---

## Mongoose Schema (`tags.schema.ts`)

```
_id       ObjectId   auto
userId    ObjectId   ref: User, required, indexed
name      String     required, trim, maxLength: 50
color     String     optional, must match hex color format (#RRGGBB)
createdAt Date       auto (timestamps: true)
```

Export model as `TagModel`.

Index: `{ userId: 1 }`
Unique constraint: `{ userId: 1, name: 1 }` — a user cannot have two tags with the same name.

---

## Endpoints

### POST /api/v1/tags

**Purpose:** Create a new tag for the authenticated user.

**Auth:** Required

**Request Body:**
```json
{
  "name": "Bug",
  "color": "#FF5733"
}
```

**Validation Rules:**
- `name` — required, string, min 1 char, max 50 chars after trim
- `color` — optional, must match regex `/^#[0-9A-Fa-f]{6}$/` (valid hex color)

**Logic:**
1. Validate request body
2. Check tag name is not already used by this user → throw CONFLICT if duplicate
3. Create Tag document with `userId` from `req.user.userId`
4. Return created tag

**Success Response — 201:**
```json
{
  "tag": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d3",
    "name": "Bug",
    "color": "#FF5733",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Code             | When                              |
|--------|------------------|-----------------------------------|
| 400    | VALIDATION_ERROR | name missing or color invalid     |
| 401    | UNAUTHORIZED     | missing or invalid JWT            |
| 409    | CONFLICT         | tag name already exists for user  |
| 500    | INTERNAL_ERROR   | unexpected server error           |

---

### GET /api/v1/tags

**Purpose:** Get all tags belonging to the authenticated user.

**Auth:** Required

**Logic:**
1. Find all Tag documents where `userId` matches `req.user.userId`
2. Sort by `name` ascending (alphabetical)
3. Use `.lean()` for performance
4. Return tags array

**Success Response — 200:**
```json
{
  "tags": [
    {
      "id": "64f1a2b3c4d5e6f7a8b9c0d3",
      "name": "Bug",
      "color": "#FF5733",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Error Responses:**
| Status | Code           | When                    |
|--------|----------------|-------------------------|
| 401    | UNAUTHORIZED   | missing or invalid JWT  |
| 500    | INTERNAL_ERROR | unexpected server error |

---

### PATCH /api/v1/tags/:tagId

**Purpose:** Update a tag's name and/or color.

**Auth:** Required

**URL Params:**
- `tagId` — MongoDB ObjectId string

**Request Body** (all optional, at least one required):
```json
{
  "name": "Critical Bug",
  "color": "#CC0000"
}
```

**Validation Rules:**
- `name` — optional, string, min 1 char, max 50 chars after trim
- `color` — optional, must match `/^#[0-9A-Fa-f]{6}$/`
- At least one of `name` or `color` must be present

**Logic:**
1. Validate `tagId` is a valid ObjectId
2. Validate request body
3. Find Tag by `{ _id: tagId, userId }` → throw NOT_FOUND if not found
4. If `name` is being updated, check no other tag of this user has the same name → throw CONFLICT if duplicate
5. Update only provided fields
6. Return updated tag

**Success Response — 200:**
```json
{
  "tag": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d3",
    "name": "Critical Bug",
    "color": "#CC0000",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Code             | When                              |
|--------|------------------|-----------------------------------|
| 400    | VALIDATION_ERROR | invalid tagId, empty body, bad color |
| 401    | UNAUTHORIZED     | missing or invalid JWT            |
| 404    | NOT_FOUND        | tag not found or not owned        |
| 409    | CONFLICT         | new name already in use           |
| 500    | INTERNAL_ERROR   | unexpected server error           |

---

### DELETE /api/v1/tags/:tagId

**Purpose:** Delete a tag and remove it from all tasks that reference it.

**Auth:** Required

**URL Params:**
- `tagId` — MongoDB ObjectId string

**Logic:**
1. Validate `tagId` is a valid ObjectId
2. Find Tag by `{ _id: tagId, userId }` → throw NOT_FOUND if not found
3. Remove the tag ObjectId from all Task documents using `TaskModel.updateMany({ userId, tags: tagId }, { $pull: { tags: tagId } })`
4. Delete the Tag document
5. Return 204

**Success Response — 204:** (no body)

**Error Responses:**
| Status | Code             | When                        |
|--------|------------------|-----------------------------|
| 400    | VALIDATION_ERROR | invalid tagId format        |
| 401    | UNAUTHORIZED     | missing or invalid JWT      |
| 404    | NOT_FOUND        | tag not found or not owned  |
| 500    | INTERNAL_ERROR   | unexpected server error     |

---

## Validation Schemas (Zod)

Define in `tags.controller.ts`:

```typescript
const createTagSchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
})

const updateTagSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
}).refine(data => data.name !== undefined || data.color !== undefined, {
  message: 'At least one field must be provided'
})
```

---

## Tests to Write

File: `backend/src/modules/tags/tags.service.test.ts`

| Test | Description |
|------|-------------|
| createTag - success | returns created tag |
| createTag - duplicate name | throws CONFLICT |
| createTag - invalid color | throws VALIDATION_ERROR |
| getTags - success | returns only tags belonging to user |
| getTags - empty | returns empty array, not error |
| updateTag - success | returns updated tag |
| updateTag - duplicate name | throws CONFLICT |
| updateTag - tag not found | throws NOT_FOUND |
| updateTag - wrong user | throws NOT_FOUND |
| deleteTag - success | deletes tag and removes from tasks |
| deleteTag - tag not found | throws NOT_FOUND |
| deleteTag - wrong user | throws NOT_FOUND |

---

## What Claude Must NOT Do

- Never delete tasks when a tag is deleted — only remove the tag reference from tasks
- Never allow duplicate tag names for the same user
- Never use `$unset` to remove tags from tasks — use `$pull`
