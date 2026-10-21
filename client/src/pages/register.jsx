import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, homePath } from '../AuthContext'
import WakingBanner from '../components/WakingBanner'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const user = await register(name, email, password)
      navigate(homePath(user))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <WakingBanner />
      <div className="max-w-md mx-auto mt-10 p-6 bg-white border rounded">
        <h1 className="text-2xl font-bold mb-4">Create a reporter account</h1>
        <p className="mb-3 text-sm text-gray-600">Please use a made-up name and email for this demo.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Name</label>
            <input id="name" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input id="email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">Password (8 or more characters)</label>
            <input id="password" type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          {error && <p role="alert" className="text-red-700 text-sm">Error: {error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-800 text-white py-2 rounded disabled:opacity-60">
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-sm">
          Already have an account? <Link to="/login" className="underline text-blue-700">Sign in</Link>
        </p>
      </div>
    </div>
  )
}