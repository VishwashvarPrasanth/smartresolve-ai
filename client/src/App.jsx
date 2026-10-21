import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, homePath } from './AuthContext'
import Layout from './components/Layout'
import AccessDenied from './components/AccessDenied'
import Login from './pages/Login'
import Register from './pages/register'

function Protected({ roles, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <AccessDenied />
  return children
}

function Home() {
  const { user } = useAuth()
  return <Navigate to={user ? homePath(user) : '/login'} replace />
}

function Temp() {
  const { user } = useAuth()
  return <p>Signed in as {user.name} ({user.role}). Pages come next.</p>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
          <Route element={<Protected><Layout /></Protected>}>
            <Route path="/my-issues" element={<Temp />} />
            <Route path="/queue" element={<Temp />} />
            <Route path="/admin/routing" element={<Temp />} />
          </Route>
          <Route path="*" element={<AccessDenied />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}