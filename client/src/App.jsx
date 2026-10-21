import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, homePath } from './AuthContext'
import Layout from './components/Layout'
import AccessDenied from './components/AccessDenied'
import IssueTable from './components/IssueTable'
import Login from './pages/Login'
import Register from './pages/register'
import Report from './pages/Report'
import IssueDetail from './pages/IssueDetail'
import Summary from './pages/Summary'
import AdminAnalytics from './pages/AdminAnalytics'

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

const guard = (roles, el) => <Protected roles={roles}>{el}</Protected>

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
          <Route element={<Protected><Layout /></Protected>}>
            <Route path="/report" element={guard(['reporter', 'admin'], <Report />)} />
            <Route path="/my-issues" element={guard(['reporter'],
              <IssueTable title="My Issues" filters={['status']} emptyText="You have not reported any issues yet." />)} />
            <Route path="/summary" element={guard(['reporter', 'staff'], <Summary />)} />
            <Route path="/queue" element={guard(['staff'],
              <IssueTable title="Staff Work Queue" filters={['status', 'priority', 'overdue']} emptyText="No tickets for your department." />)} />
            <Route path="/issues/:id" element={<IssueDetail />} />
            <Route path="/admin/routing" element={guard(['admin'],
              <IssueTable title="Admin Routing Queue (Needs Review and unassigned)" base="queue=routing" emptyText="The routing queue is empty." />)} />
            <Route path="/admin/issues" element={guard(['admin'],
              <IssueTable title="All Issues" filters={['status', 'priority', 'department', 'overdue']} />)} />
            <Route path="/admin/analytics" element={guard(['admin'], <AdminAnalytics />)} />
          </Route>
          <Route path="*" element={<AccessDenied />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}