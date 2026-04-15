import { useNavigate } from 'react-router-dom'
import { request, clearAccessToken } from '../api'

export default function Navbar({ title, backTo }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      await request('POST', '/auth/logout', { refreshToken })
    }
    clearAccessToken()
    localStorage.removeItem('refreshToken')
    navigate('/login')
  }

  return (
    <nav>
      {backTo ? (
        <a href="#" onClick={(e) => { e.preventDefault(); navigate(backTo) }}>
          &larr; Back
        </a>
      ) : (
        <span>TaskFlow</span>
      )}
      <span>{title || 'TaskFlow'}</span>
      <button className="danger" onClick={handleLogout}>Logout</button>
    </nav>
  )
}
