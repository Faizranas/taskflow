# PRD — TaskFlow: Personal Task Manager

## 1. Overview

TaskFlow is a personal task management application for individual users who want to organise their work into projects, track task progress, and prioritise their day. It is not a team tool in v1 — it is designed for a single authenticated user managing their own workspace.

---

## 2. Goals

- Give a single user a clean way to manage tasks across multiple projects
- Keep the data model simple and fast to interact with via API and UI
- Serve as a reference implementation for Spec AI-Driven Development (SDD)

---

## 3. Out of Scope (v1)

- Multi-user / team collaboration
- Real-time updates (websockets)
- File attachments
- Email or push notifications
- Sub-tasks (tasks are flat in v1)
- Custom statuses per project

---

## 4. Users

**Primary User:** A single authenticated individual.

There is one user role in v1: `owner`. The authenticated user owns all their own data. No sharing or delegation exists.

---

## 5. Features

### 5.1 Authentication

- User can register with email + password
- User can log in and receive a JWT access token (15 min expiry) + refresh token (7 days)
- User can refresh their access token using the refresh token
- User can log out (invalidates refresh token)
- Passwords are hashed with bcrypt
- All non-auth routes are protected by JWT middleware

### 5.2 Projects

- User can create a project with a name and optional description
- User can view all their projects
- User can update a project name or description
- User can delete a project (cascades to delete all tasks inside it)
- A task must always belong to a project

### 5.3 Tasks

- User can create a task inside a project with:
  - Title (required)
  - Description (optional)
  - Due date (optional)
  - Priority: `LOW`, `MEDIUM`, `HIGH` (default: `MEDIUM`)
  - Status: `TODO`, `IN_PROGRESS`, `DONE` (default: `TODO`)
- User can view all tasks within a project
- User can filter tasks by status, priority, due date, or tag
- User can update any field on a task
- User can delete a task
- Tasks do not have sub-tasks in v1

### 5.4 Tags

- User can create tags (name + optional colour hex code)
- User can assign one or more tags to a task
- User can remove a tag from a task
- User can delete a tag (removes it from all tasks, does not delete tasks)
- User can filter tasks by tag

---

## 6. UI Scope (v1 — Minimal)

A minimal React UI is in scope for v1. It is not a full-featured dashboard. It covers:

- Login and Register screens
- Project list screen
- Task list screen per project (with status/priority filters)
- Create / edit task modal
- Tag management screen

The UI consumes the API exclusively via TanStack Query. No direct DB access from the frontend.

---

## 7. Task Status Flow

```
TODO → IN_PROGRESS → DONE
```

Status transitions are not enforced server-side in v1. The client sets whatever status it wants.

---

## 8. Priority Levels

| Value    | Meaning                        |
|----------|--------------------------------|
| LOW      | Nice to do, no urgency         |
| MEDIUM   | Default, normal priority       |
| HIGH     | Important, needs attention     |

---

## 9. API Design Principles

- Base path: `/api/v1/{resource}`
- All responses are JSON
- Errors follow RFC 7807 Problem Details format
- Authentication via Bearer JWT in Authorization header
- Pagination on list endpoints (cursor-based or offset, TBD in TECHNICAL_SPEC)

---

## 10. Non-Functional Requirements

- API response time under 200ms for all CRUD operations
- Passwords never stored in plain text
- Refresh tokens stored in DB, invalidated on logout
- All inputs validated and sanitised server-side
- Environment variables for all secrets (never hardcoded)
