# Task 006 — Frontend Implementation

## Context Files to Read First
1. `CLAUDE.md` — conventions you must follow
2. `docs/TECHNICAL_SPEC.md §9` — frontend architecture
3. `docs/PRD.md §6` — UI scope for v1

Do not read any spec file. This task has no backend logic.

---

## Goal

Implement the complete Vanilla JS frontend: login, register, project list, and task list screens.
All backend tasks (001–005) must be complete and the API must be running before testing the frontend.

---

## What to Build

### 1. `frontend/css/styles.css`

Minimal clean styles. No framework. Cover:
- CSS reset (box-sizing, margin, padding)
- Body: sans-serif font, light background `#f5f5f5`, dark text `#1a1a1a`
- `.container` — max-width 800px, centered, padding 24px
- `.card` — white background, border-radius 8px, padding 24px, subtle box-shadow
- Forms: full-width inputs, padding 10px, border 1px solid `#ddd`, border-radius 4px
- Buttons: primary `#2563eb` blue, white text, padding 10px 20px, border-radius 4px, cursor pointer
- Buttons: danger `#dc2626` red for delete actions
- `.tag` pill — small badge with background color from tag's hex, white text, border-radius 12px, padding 2px 8px
- Task status badge — `TODO` grey, `IN_PROGRESS` blue, `DONE` green
- Priority badge — `LOW` grey, `MEDIUM` orange, `HIGH` red
- Error message — red text `#dc2626`, small font
- Nav bar — white background, padding 16px 24px, flex space-between, border-bottom

---

### 2. `frontend/js/auth.js`

Handles login and register screens.

#### `auth.renderLogin()`
Render into `#app`:
```html
<div class="container">
  <div class="card">
    <h1>TaskFlow</h1>
    <h2>Login</h2>
    <form id="login-form">
      <input type="email" id="login-email" placeholder="Email" required />
      <input type="password" id="login-password" placeholder="Password" required />
      <p id="login-error" class="error"></p>
      <button type="submit">Login</button>
    </form>
    <p>No account? <a href="#/register">Register</a></p>
  </div>
</div>
```

On form submit:
1. Call `POST /api/v1/auth/login` via `request()`
2. On success: store `accessToken` via `setAccessToken()`, store `refreshToken` in `localStorage`, redirect to `#/projects`
3. On error: display error message in `#login-error`

#### `auth.renderRegister()`
Render into `#app`:
```html
<div class="container">
  <div class="card">
    <h1>TaskFlow</h1>
    <h2>Register</h2>
    <form id="register-form">
      <input type="email" id="register-email" placeholder="Email" required />
      <input type="password" id="register-password" placeholder="Password (min 8 chars)" required />
      <p id="register-error" class="error"></p>
      <button type="submit">Create Account</button>
    </form>
    <p>Have an account? <a href="#/login">Login</a></p>
  </div>
</div>
```

On form submit:
1. Call `POST /api/v1/auth/register` via `request()`
2. On success: redirect to `#/login`
3. On error: display error message in `#register-error`

---

### 3. `frontend/js/projects.js`

Handles the project list screen.

#### `projects.renderList()`
Render into `#app`:
```html
<nav>
  <span>TaskFlow</span>
  <button id="logout-btn">Logout</button>
</nav>
<div class="container">
  <div class="card">
    <h2>Projects</h2>
    <form id="create-project-form">
      <input type="text" id="project-name" placeholder="New project name" required />
      <button type="submit">Add Project</button>
    </form>
    <div id="projects-list"></div>
  </div>
</div>
```

On load:
1. Call `GET /api/v1/projects` via `request()`
2. Render each project as a card with name, description, a "Open" button, and a "Delete" button

On "Open" click:
- Redirect to `#/projects/:id`

On "Delete" click:
1. Call `DELETE /api/v1/projects/:id` via `request()`
2. Re-render the list

On create form submit:
1. Call `POST /api/v1/projects` via `request()`
2. Re-render the list

On logout click:
1. Call `POST /api/v1/auth/logout` with `refreshToken` from `localStorage`
2. Clear `accessToken` via `clearAccessToken()`
3. Remove `refreshToken` from `localStorage`
4. Redirect to `#/login`

---

### 4. `frontend/js/tasks.js`

Handles the task list screen for a single project.

#### `tasks.renderList(projectId)`
Render into `#app`:
```html
<nav>
  <a href="#/projects">← Projects</a>
  <span id="project-title"></span>
  <button id="logout-btn">Logout</button>
</nav>
<div class="container">
  <div class="card">
    <h2>Tasks</h2>

    <!-- Filters -->
    <div id="filters">
      <select id="filter-status">
        <option value="">All Statuses</option>
        <option value="TODO">Todo</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="DONE">Done</option>
      </select>
      <select id="filter-priority">
        <option value="">All Priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </select>
      <button id="apply-filters">Filter</button>
    </div>

    <!-- Task list -->
    <div id="tasks-list"></div>

    <!-- Create task form -->
    <form id="create-task-form">
      <input type="text" id="task-title" placeholder="New task title" required />
      <select id="task-priority">
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
        <option value="HIGH">High</option>
      </select>
      <input type="date" id="task-due-date" />
      <button type="submit">Add Task</button>
    </form>
  </div>
</div>
```

On load:
1. Call `GET /api/v1/projects/:projectId` and display project name in `#project-title`
2. Call `GET /api/v1/projects/:projectId/tasks` via `request()`
3. Render each task with: title, status badge, priority badge, due date (if set), tags as pills, a status cycle button, and a delete button

On status cycle button click:
- Cycle: `TODO` → `IN_PROGRESS` → `DONE` → `TODO`
- Call `PATCH /api/v1/projects/:projectId/tasks/:taskId` with new status
- Re-render task list

On delete button click:
1. Call `DELETE /api/v1/projects/:projectId/tasks/:taskId`
2. Re-render task list

On filter apply:
1. Build query string from selected filters
2. Call `GET /api/v1/projects/:projectId/tasks?status=...&priority=...`
3. Re-render task list

On create task form submit:
1. Call `POST /api/v1/projects/:projectId/tasks` with title, priority, dueDate
2. Re-render task list

---

### 5. `frontend/js/app.js`

Update the router to pass `projectId` from the hash:

```javascript
const router = () => {
  const hash = window.location.hash || '#/login'

  if (hash === '#/login') return auth.renderLogin()
  if (hash === '#/register') return auth.renderRegister()
  if (hash === '#/projects') return projects.renderList()
  if (hash.startsWith('#/projects/')) {
    const projectId = hash.split('/')[2]
    return tasks.renderList(projectId)
  }

  window.location.hash = '#/login'
}

window.addEventListener('hashchange', router)
window.addEventListener('load', router)
```

---

## Acceptance Criteria

- [ ] Register screen creates a user and redirects to login
- [ ] Login screen authenticates and redirects to projects list
- [ ] Projects list loads and displays all user projects
- [ ] Creating a project adds it to the list without page reload
- [ ] Deleting a project removes it from the list
- [ ] Clicking a project navigates to its task list
- [ ] Task list loads with status and priority badges
- [ ] Status filter shows only matching tasks
- [ ] Priority filter shows only matching tasks
- [ ] Clicking status button cycles task through TODO → IN_PROGRESS → DONE
- [ ] Creating a task adds it to the list
- [ ] Deleting a task removes it from the list
- [ ] Logout clears tokens and redirects to login
- [ ] On 401 response the app auto-refreshes token and retries
- [ ] On refresh failure the app redirects to login

---

## What Claude Must NOT Do

- Do not use any JS framework — no React, Vue, or jQuery
- Do not store `accessToken` in `localStorage` — keep it in memory only
- Do not make direct DB calls from the frontend
- Do not implement tag management UI in this task — tags are shown on tasks but not created or managed in v1 UI
