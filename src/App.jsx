import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'

export default function App() {
  const { user } = useAuth()

  // Destination par défaut selon l'état de l'utilisateur
  const home = !user
    ? '/login'
    : user.premiere_connexion
      ? '/onboarding'
      : '/dashboard'

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={home} replace /> : <Login />}
      />
      <Route
        path="/onboarding"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : user.premiere_connexion ? (
            <Onboarding />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          !user || user.premiere_connexion ? (
            <Navigate to={home} replace />
          ) : (
            <Dashboard />
          )
        }
      />
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  )
}
