import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { request } from '../api'
import Navbar from './Navbar'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadProjects = async () => {
    const data = await request('GET', '/projects')
    if (data && data._unauthorized) {
      navigate('/login')
      return
    }
    if (data && data.projects) {
      setProjects(data.projects)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    await request('POST', '/projects', { name: newName.trim() })
    setNewName('')
    loadProjects()
  }

  const handleDelete = async (id) => {
    await request('DELETE', `/projects/${id}`)
    loadProjects()
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="card">
          <h2>Projects</h2>
          <form className="inline-form" onSubmit={handleCreate}>
            <input
              type="text"
              placeholder="New project name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <button type="submit">Add Project</button>
          </form>

          {loading ? (
            <p>Loading...</p>
          ) : projects.length === 0 ? (
            <p>No projects yet. Create one above!</p>
          ) : (
            projects.map((p) => (
              <div className="project-item" key={p.id}>
                <div
                  className="project-info"
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <h3>{p.name}</h3>
                  {p.description && <p>{p.description}</p>}
                </div>
                <div className="actions">
                  <button
                    className="secondary"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    Open
                  </button>
                  <button
                    className="danger"
                    onClick={() => handleDelete(p.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
