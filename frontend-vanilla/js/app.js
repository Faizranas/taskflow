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
