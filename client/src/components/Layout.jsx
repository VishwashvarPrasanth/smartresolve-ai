import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import WakingBanner from './WakingBanner'

const LINKS = {
  reporter: [
    ['/report', 'Report an Issue'],
    ['/my-issues', 'My Issues'],
    ['/summary', 'My Summary'],
  ],
  staff: [
    ['/queue', 'Work Queue'],
    ['/summary', 'Department Summary'],
  ],
  admin: [
    ['/admin/routing', 'Routing Queue'],
    ['/admin/issues', 'All Issues'],
    ['/admin/analytics', 'Analytics'],
    ['/admin/staff', 'Staff Accounts'],
    ['/report', 'Report (test)'],
  ],
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <WakingBanner />
      <header className="bg-blue-900 text-white px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-bold">SmartResolve AI</span>
          <nav className="flex flex-wrap gap-3 text-sm">
            {LINKS[user.role].map(([to, label]) => (
              <Link key={to} to={to} className="underline">{label}</Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span>{user.name} ({user.role})</span>
            <button onClick={handleLogout} className="bg-white text-blue-900 px-3 py-1 rounded">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}