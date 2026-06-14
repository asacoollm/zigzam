import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Avatar from './pages/Avatar'
import Discuter from './pages/Discuter'
import Actualites from './pages/Actualites'
import Contacts from './pages/Contacts'
import Economie from './pages/Economie'
import Parametres from './pages/Parametres'
import Admin from './pages/Admin'
import ParentalGuard from './components/ParentalGuard'
import OnlineWidget from './components/OnlineWidget'

export default function App() {
  const { user } = useAuth()

  // Destination par défaut selon l'état de l'utilisateur
  const home = !user
    ? '/login'
    : user.premiere_connexion
      ? '/onboarding'
      : '/dashboard'

  return (
    <>
    {user && !user.premiere_connexion && <ParentalGuard />}
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
      <Route
        path="/avatar"
        element={
          !user || user.premiere_connexion ? (
            <Navigate to={home} replace />
          ) : (
            <Avatar />
          )
        }
      />
      <Route
        path="/discuter"
        element={
          !user || user.premiere_connexion ? <Navigate to={home} replace /> : <Discuter />
        }
      />
      <Route
        path="/actualites"
        element={
          !user || user.premiere_connexion ? <Navigate to={home} replace /> : <Actualites />
        }
      />
      <Route
        path="/contacts"
        element={
          !user || user.premiere_connexion ? <Navigate to={home} replace /> : <Contacts />
        }
      />
      <Route
        path="/economie"
        element={
          !user || user.premiere_connexion ? <Navigate to={home} replace /> : <Economie />
        }
      />
      <Route
        path="/parametres"
        element={
          !user || user.premiere_connexion ? <Navigate to={home} replace /> : <Parametres />
        }
      />
      <Route
        path="/admin"
        element={
          !user || user.premiere_connexion ? (
            <Navigate to={home} replace />
          ) : user.role !== 'admin' && user.role !== 'superadmin' ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Admin />
          )
        }
      />
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
    <OnlineWidget />
    </>
  )
}
