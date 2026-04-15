const auth = {
  renderLogin() {
    const app = document.getElementById('app')
    app.innerHTML = `
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
    `

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault()
      const email = document.getElementById('login-email').value
      const password = document.getElementById('login-password').value
      const errorEl = document.getElementById('login-error')
      errorEl.textContent = ''

      const data = await request('POST', '/auth/login', { email, password })

      if (data && data.accessToken) {
        setAccessToken(data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        window.location.hash = '#/projects'
      } else if (data && data.title) {
        errorEl.textContent = data.title
      } else {
        errorEl.textContent = 'Login failed'
      }
    })
  },

  renderRegister() {
    const app = document.getElementById('app')
    app.innerHTML = `
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
    `

    document.getElementById('register-form').addEventListener('submit', async (e) => {
      e.preventDefault()
      const email = document.getElementById('register-email').value
      const password = document.getElementById('register-password').value
      const errorEl = document.getElementById('register-error')
      errorEl.textContent = ''

      const data = await request('POST', '/auth/register', { email, password })

      if (data && data.user) {
        window.location.hash = '#/login'
      } else if (data && data.title) {
        errorEl.textContent = data.title
      } else {
        errorEl.textContent = 'Registration failed'
      }
    })
  }
}
