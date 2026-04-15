import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { request, setAccessToken } from '../api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const data = await request('POST', '/auth/login', { email, password })

    if (data && data.accessToken) {
      setAccessToken(data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      navigate('/projects')
    } else if (data && data.title) {
      setError(data.title)
    } else {
      setError('Login failed')
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1>TaskFlow</h1>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit">Login</button>
        </form>
        <p>No account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  )
}
