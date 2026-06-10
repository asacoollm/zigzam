import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

const MODULES = [
  { emoji: '💬', label: 'Discuter' },
  { emoji: '📰', label: 'Actualités' },
  { emoji: '🌋', label: 'Floor is Lava' },
  { emoji: '🎨', label: 'Avatar' },
  { emoji: '🍩', label: 'Donuts & Gemmes' },
  { emoji: '🛡️', label: 'Contrôle parental' },
  { emoji: '📖', label: 'Agenda' },
  { emoji: '⚙️', label: 'Paramètres' },
]

export default function Dashboard() {
  const { user, signOut } = useAuth()

  return (
    <div className="dash">
      <header className="dash__top">
        <div className="dash__hello">
          <span className="dash__avatar">🦓</span>
          <div>
            <p className="dash__name">{user.pseudo}</p>
            <p className="dash__num">📞 {user.numero}</p>
          </div>
        </div>

        <div className="dash__counters">
          <span className="counter">🍩 {user.donuts}</span>
          <span className="counter">💎 {user.gemmes}</span>
          <button className="dash__logout" onClick={signOut}>
            Déconnexion
          </button>
        </div>
      </header>

      <main className="dash__grid">
        {MODULES.map((m) => (
          <button key={m.label} className="tile">
            <span className="tile__emoji">{m.emoji}</span>
            <span className="tile__label">{m.label}</span>
          </button>
        ))}
      </main>
    </div>
  )
}
