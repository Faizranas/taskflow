const projects = {
  async renderList() {
    const app = document.getElementById('app')
    app.innerHTML = `
      <nav>
        <span>TaskFlow</span>
        <button id="logout-btn" class="danger">Logout</button>
      </nav>
      <div class="container">
        <div class="card">
          <h2>Projects</h2>
          <form id="create-project-form" class="inline-form">
            <input type="text" id="project-name" placeholder="New project name" required />
            <button type="submit">Add Project</button>
          </form>
          <div id="projects-list">Loading...</div>
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

    // Create project handler
    document.getElementById('create-project-form').addEventListener('submit', async (e) => {
      e.preventDefault()
      const nameInput = document.getElementById('project-name')
      const name = nameInput.value.trim()
      if (!name) return

      await request('POST', '/projects', { name })
      nameInput.value = ''
      projects.loadProjects()
    })

    this.loadProjects()
  },

  async loadProjects() {
    const listEl = document.getElementById('projects-list')
    const data = await request('GET', '/projects')

    if (!data || !data.projects) {
      listEl.innerHTML = '<p>Failed to load projects.</p>'
      return
    }

    if (data.projects.length === 0) {
      listEl.innerHTML = '<p>No projects yet. Create one above!</p>'
      return
    }

    listEl.innerHTML = data.projects.map((p) => `
      <div class="project-item">
        <div class="project-info" data-id="${p.id}">
          <h3>${escapeHtml(p.name)}</h3>
          ${p.description ? `<p>${escapeHtml(p.description)}</p>` : ''}
        </div>
        <div class="actions">
          <button class="secondary open-project" data-id="${p.id}">Open</button>
          <button class="danger delete-project" data-id="${p.id}">Delete</button>
        </div>
      </div>
    `).join('')

    // Open project handlers
    listEl.querySelectorAll('.open-project').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.location.hash = `#/projects/${btn.dataset.id}`
      })
    })

    listEl.querySelectorAll('.project-info').forEach((el) => {
      el.addEventListener('click', () => {
        window.location.hash = `#/projects/${el.dataset.id}`
      })
    })

    // Delete project handlers
    listEl.querySelectorAll('.delete-project').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await request('DELETE', `/projects/${btn.dataset.id}`)
        projects.loadProjects()
      })
    })
  }
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
