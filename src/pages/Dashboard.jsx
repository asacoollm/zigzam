import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'
import ZigzamLogo from '../components/ZigzamLogo'
import './Dashboard.css'

const MODULES = [
  { emoji: '💬', label: 'Discuter', color: 'var(--rose)' },
  { emoji: '📰', label: 'Actualités', color: 'var(--orange)' },
  { emoji: '🌋', label: 'Floor is Lava', color: 'var(--violet)' },
  { emoji: '🎨', label: 'Avatar', color: 'var(--bleu)', to: '/avatar' },
  { emoji: '🍩', label: 'Donuts & Gemmes', color: 'var(--vert)' },
  { emoji: '🛡️', label: 'Contrôle parental', color: 'var(--rose)' },
  { emoji: '📖', label: 'Agenda', color: 'var(--orange)' },
  { emoji: '⚙️', label: 'Paramètres', color: 'var(--bleu)' },
]

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="dash">
      <Backdrop />

      <div className="dash__brand">
        <ZigzamLogo size="sm" />
      </div>

      <header className="dash__top">
        <div className="dash__hello">
          <FallGuy className="dash__avatar" avatar={user.avatar} />
          <div>
            <p className="dash__name">{user.pseudo}</p>
            <p className="dash__num">📞 {user.numero}</p>
          </div>
        </div>

        <div className="dash__counters">
          <span className="counter counter--donut">🍩 {user.donuts}</span>
          <span className="counter counter--gem">💎 {user.gemmes}</span>
          <button className="dash__logout" onClick={signOut}>
            Déconnexion
          </button>
        </div>
      </header>

      <main className="dash__grid">
        {MODULES.map((m) => (
          <button
            key={m.label}
            className="tile"
            style={{ '--tile-color': m.color }}
            onClick={() => m.to && navigate(m.to)}
          >
            <span className="tile__emoji">{m.emoji}</span>
            <span className="tile__label">{m.label}</span>
          </button>
        ))}
      </main>
    </div>
  )
}
