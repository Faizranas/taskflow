const tasks = {
  currentProjectId: null,

  async renderList(projectId) {
    this.currentProjectId = projectId
    const app = document.getElementById('app')
    app.innerHTML = `
      <nav>
        <a href="#/projects">&larr; Projects</a>
        <span id="project-title">Loading...</span>
        <button id="logout-btn" class="danger">Logout</button>
      </nav>
      <div class="container">
        <div class="card">
          <h2>Tasks</h2>

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
            <button id="apply-filters" class="secondary">Filter</button>
          </div>

          <div id="tasks-list">Loading...</div>

          <form id="create-task-form" class="inline-form">
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
    `

    // Logout handler
    document.getElementById('logout-btn').addEventListener('click', async () => {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await request('POST', '/auth/logout', { refreshToken })
      }
      clearAccessToken()
      localStorage.removeItem('refreshToken')
      window.location.hash = '#/login'
    })

    // Load project title
    const projectData = await request('GET', `/projects/${projectId}`)
    if (projectData && projectData.project) {
      document.getElementById('project-title').textContent = projectData.project.name
    }

    // Filter handler
    document.getElementById('apply-filters').addEventListener('click', () => {
      this.loadTasks()
    })

    // Create task handler
    document.getElementById('create-task-form').addEventListener('submit', async (e) => {
      e.preventDefault()
      const title = document.getElementById('task-title').value.trim()
      const priority = document.getElementById('task-priority').value
      const dueDateVal = document.getElementById('task-due-date').value

      if (!title) return

      const body = { title, priority }
      if (dueDateVal) body.dueDate = new Date(dueDateVal).toISOString()

      await request('POST', `/projects/${projectId}/tasks`, body)
      document.getElementById('task-title').value = ''
      document.getElementById('task-due-date').value = ''
      this.loadTasks()
    })

    this.loadTasks()
  },

  async loadTasks() {
    const projectId = this.currentProjectId
    const listEl = document.getElementById('tasks-list')

    // Build query from filters
    const status = document.getElementById('filter-status').value
    const priority = document.getElementById('filter-priority').value
    const params = []
    if (status) params.push(`status=${status}`)
    if (priority) params.push(`priority=${priority}`)
    const query = params.length > 0 ? `?${params.join('&')}` : ''

    const data = await request('GET', `/projects/${projectId}/tasks${query}`)

    if (!data || !data.tasks) {
      listEl.innerHTML = '<p>Failed to load tasks.</p>'
      return
    }

    if (data.tasks.length === 0) {
      listEl.innerHTML = '<p>No tasks yet. Create one below!</p>'
      return
    }

    listEl.innerHTML = data.tasks.map((t) => {
      const dueDateStr = t.dueDate
        ? `<span class="due-date">Due: ${new Date(t.dueDate).toLocaleDateString()}</span>`
        : ''

      const tagsHtml = (t.tags || []).map((tag) => {
        const bg = tag.color || '#6b7280'
        return `<span class="tag" style="background:${bg}">${escapeHtml(tag.name)}</span>`
      }).join('')

      return `
        <div class="task-item">
          <div class="task-info">
            <h3>${escapeHtml(t.title)}</h3>
            <div class="task-meta">
              <span class="badge ${t.status}">${formatStatus(t.status)}</span>
              <span class="badge ${t.priority}">${t.priority}</span>
              ${dueDateStr}
              ${tagsHtml}
            </div>
          </div>
          <div class="actions">
            <button class="secondary cycle-status" data-id="${t.id}" data-status="${t.status}">
              ${nextStatusLabel(t.status)}
            </button>
            <button class="danger delete-task" data-id="${t.id}">Delete</button>
          </div>
        </div>
      `
    }).join('')

    // Status cycle handlers
    listEl.querySelectorAll('.cycle-status').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const newStatus = cycleStatus(btn.dataset.status)
        await request('PATCH', `/projects/${projectId}/tasks/${btn.dataset.id}`, {
          status: newStatus,
        })
        tasks.loadTasks()
      })
    })

    // Delete handlers
    listEl.querySelectorAll('.delete-task').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await request('DELETE', `/projects/${projectId}/tasks/${btn.dataset.id}`)
        tasks.loadTasks()
      })
    })
  }
}

function cycleStatus(current) {
  if (current === 'TODO') return 'IN_PROGRESS'
  if (current === 'IN_PROGRESS') return 'DONE'
  return 'TODO'
}

function nextStatusLabel(current) {
  if (current === 'TODO') return 'Start'
  if (current === 'IN_PROGRESS') return 'Done'
  return 'Reset'
}

function formatStatus(status) {
  if (status === 'IN_PROGRESS') return 'In Progress'
  if (status === 'TODO') return 'Todo'
  return 'Done'
}
