import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { normalizeAvatar } from '../lib/avatar'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'
import ZigzamLogo from '../components/ZigzamLogo'
import './Accueil.css'

// Écran d'accueil « façon Brawl Stars » : affiché juste après la connexion,
// avant le Dashboard. Le bonhomme de l'élève en grand + un gros bouton
// « Entrer » qui mène au Dashboard normal. Le bouton « Retour » des autres
// pages continue de pointer directement vers /dashboard (pas de détour ici).
export default function Accueil() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const avatar = normalizeAvatar(user?.avatar)

  return (
    <div className="home">
      <Backdrop />

      <div className="home__brand">
        <ZigzamLogo size="lg" />
      </div>

      <main className="home__stage">
        <div className="home__podium" aria-hidden="true" />
        <FallGuy className="home__hero" avatar={avatar} anim="idle" />
        <p className="home__name">{user?.pseudo}</p>
      </main>

      <button
        className="home__enter"
        onClick={() => navigate('/dashboard')}
        autoFocus
      >
        Entrer 🚀
      </button>
    </div>
  )
}
