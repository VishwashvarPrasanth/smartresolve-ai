const BASE = import.meta.env.VITE_API_URL

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const setWaking = (value) =>
  window.dispatchEvent(new CustomEvent('api-waking', { detail: value }))

export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token')
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(BASE + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
      if ([502, 503, 504].includes(res.status)) throw new Error('waking')

      setWaking(false)
      const data = await res.json().catch(() => ({}))

      if (res.status === 401 && token && path !== '/auth/login') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      if (!res.ok) {
        const err = new Error(data.message || 'Request failed')
        err.status = res.status
        err.details = data.errors
        throw err
      }
      return data
    } catch (error) {
      if (error.status) throw error // a real answer from the API, so do not retry
      setWaking(true)
      await sleep(6000)
    }
  }
  setWaking(false)
  throw new Error('Cannot reach the server. Please check your internet and try again.')
}