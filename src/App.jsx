import { useEffect } from 'react'
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
import FloorIsLava from './pages/FloorIsLava'
import Serie from './pages/Serie'
import EpisodePlayer from './pages/EpisodePlayer'
import BoiteMystere from './pages/BoiteMystere'
import ParentalGuard from './components/ParentalGuard'
import InactivityGuard from './components/InactivityGuard'
import OnlineWidget from './components/OnlineWidget'
import ReportButton from './components/ReportButton'
import BirthdayModal from './components/BirthdayModal'
import SaisonAnnounce from './components/SaisonAnnounce'

export default function App() {
  const { user } = useAuth()

  // Détecte l'ouverture du clavier mobile (focus d'un champ sur petit écran)
  // → ajoute la classe body.kb-open pour masquer les widgets fixes du bas.
  useEffect(() => {
    const isField = (el) =>
      el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
    const onFocusIn = (e) => {
      if (isField(e.target) && window.innerWidth <= 640) {
        document.body.classList.add('kb-open')
      }
    }
    const onFocusOut = () => document.body.classList.remove('kb-open')
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      document.body.classList.remove('kb-open')
    }
  }, [])

  // Destination par défaut selon l'état de l'utilisateur
  const home = !user
    ? '/login'
    : user.premiere_connexion
      ? '/onboarding'
      : '/dashboard'

  return (
    <>
    {user && !user.premiere_connexion && <ParentalGuard />}
    {user && !user.premiere_connexion && <InactivityGuard />}
    {user && !user.premiere_connexion && !user.date_naissance && <BirthdayModal />}
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
        path="/floor-is-lava"
        element={
          !user || user.premiere_connexion ? <Navigate to={home} replace /> : <FloorIsLava />
        }
      />
      <Route
        path="/serie"
        element={
          !user || user.premiere_connexion ? <Navigate to={home} replace /> : <Serie />
        }
      />
      <Route
        path="/serie/:episodeId"
        element={
          !user || user.premiere_connexion ? <Navigate to={home} replace /> : <EpisodePlayer />
        }
      />
      <Route
        path="/boites"
        element={
          !user || user.premiere_connexion ? <Navigate to={home} replace /> : <BoiteMystere />
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
    <ReportButton />
    <SaisonAnnounce />
    </>
  )
}
