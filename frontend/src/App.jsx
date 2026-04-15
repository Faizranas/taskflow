import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import Projects from './components/Projects'
import Tasks from './components/Tasks'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<Tasks />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
