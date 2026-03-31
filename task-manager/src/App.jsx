import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import ProjectsPage from './pages/ProjectsPage'
import TasksPage from './pages/TasksPage'
import CalendarPage from './pages/CalendarPage'
import ProgressPage from './pages/ProgressPage'
import UsersPage from './pages/UsersPage'
import ProjectDetailPage from './pages/ProjectDetailPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-spinner" style={{ marginTop: 100 }} />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
