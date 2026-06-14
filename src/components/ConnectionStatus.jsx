import { useAuth } from '../context/AuthContext'
import './ConnectionStatus.css'

// Petit indicateur discret (glassmorphism) affiché sur toutes les pages :
// point vert animé + pseudo si connecté, point rouge sinon.
export default function ConnectionStatus() {
  const { user } = useAuth()
  const connecte = Boolean(user)

  return (
    <div className={`conn ${connecte ? 'conn--on' : 'conn--off'}`} aria-live="polite">
      <span className="conn__dot" />
      <span className="conn__text">
        {connecte ? `Connecté en tant que ${user.pseudo}` : 'Non connecté'}
      </span>
    </div>
  )
}
