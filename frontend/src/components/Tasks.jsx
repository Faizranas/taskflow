import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { request } from '../api'
import Navbar from './Navbar'

const cycleStatus = (current) => {
  if (current === 'TODO') return 'IN_PROGRESS'
  if (current === 'IN_PROGRESS') return 'DONE'
  return 'TODO'
}

const nextStatusLabel = (current) => {
  if (current === 'TODO') return 'Start'
  if (current === 'IN_PROGRESS') return 'Done'
  return 'Reset'
}

const formatStatus = (status) => {
  if (status === 'IN_PROGRESS') return 'In Progress'
  if (status === 'TODO') return 'Todo'
  return 'Done'
}

export default function Tasks() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [projectName, setProjectName] = useState('Loading...')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const loadProject = async () => {
    const data = await request('GET', `/projects/${projectId}`)
    if (data && data._unauthorized) {
      navigate('/login')
      return
    }
    if (data && data.project) {
      setProjectName(data.project.name)
    }
  }

  const loadTasks = async () => {
    const params = []
    if (filterStatus) params.push(`status=${filterStatus}`)
    if (filterPriority) params.push(`priority=${filterPriority}`)
    const query = params.length > 0 ? `?${params.join('&')}` : ''

    const data = await request('GET', `/projects/${projectId}/tasks${query}`)
    if (data && data._unauthorized) {
      navigate('/login')
      return
    }
    if (data && data.tasks) {
      setTasks(data.tasks)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadProject()
    loadTasks()
  }, [projectId])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    const body = { title: title.trim(), priority }
    if (dueDate) body.dueDate = new Date(dueDate).toISOString()

    await request('POST', `/projects/${projectId}/tasks`, body)
    setTitle('')
    setDueDate('')
    loadTasks()
  }

  const handleStatusCycle = async (taskId, currentStatus) => {
    const newStatus = cycleStatus(currentStatus)
    await request('PATCH', `/projects/${projectId}/tasks/${taskId}`, {
      status: newStatus,
    })
    loadTasks()
  }

  const handleDelete = async (taskId) => {
    await request('DELETE', `/projects/${projectId}/tasks/${taskId}`)
    loadTasks()
  }

  const handleFilter = () => {
    loadTasks()
  }

  return (
    <>
      <Navbar title={projectName} backTo="/projects" />
      <div className="container">
        <div className="card">
          <h2>Tasks</h2>

          {/* Filters */}
          <div id="filters">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <button className="secondary" onClick={handleFilter}>
              Filter
            </button>
          </div>

          {/* Task List */}
          {loading ? (
            <p>Loading...</p>
          ) : tasks.length === 0 ? (
            <p>No tasks yet. Create one below!</p>
          ) : (
            tasks.map((t) => (
              <div className="task-item" key={t.id}>
                <div className="task-info">
                  <h3>{t.title}</h3>
                  <div className="task-meta">
                    <span className={`badge ${t.status}`}>
                      {formatStatus(t.status)}
                    </span>
                    <span className={`badge ${t.priority}`}>{t.priority}</span>
                    {t.dueDate && (
                      <span className="due-date">
                        Due: {new Date(t.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {(t.tags || []).map((tag) => (
                      <span
                        key={tag.id}
                        className="tag"
                        style={{ background: tag.color || '#6b7280' }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="actions">
                  <button
                    className="secondary"
                    onClick={() => handleStatusCycle(t.id, t.status)}
                  >
                    {nextStatusLabel(t.status)}
                  </button>
                  <button
                    className="danger"
                    onClick={() => handleDelete(t.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Create Task Form */}
          <form className="inline-form" onSubmit={handleCreate}>
            <input
              type="text"
              placeholder="New task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="HIGH">High</option>
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <button type="submit">Add Task</button>
          </form>
        </div>
      </div>
    </>
  )
}
