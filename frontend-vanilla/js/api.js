const BASE_URL = 'http://localhost:3000/api/v1'
let accessToken = null

const setAccessToken = (token) => { accessToken = token }
const getAccessToken = () => accessToken
const clearAccessToken = () => { accessToken = null }

const request = async (method, path, body = null) => {
  const headers = { 'Content-Type': 'application/json' }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const options = { method, headers }
  if (body) options.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, options)

  if (res.status === 401) {
    // Attempt token refresh
    const refreshed = await tryRefresh()
    if (refreshed) return request(method, path, body)
    clearAccessToken()
    window.location.hash = '#/login'
    return
  }

  if (res.status === 204) return null
  return res.json()
}

const tryRefresh = async () => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return false

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })

  if (!res.ok) {
    localStorage.removeItem('refreshToken')
    return false
  }

  const data = await res.json()
  setAccessToken(data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  return true
}
