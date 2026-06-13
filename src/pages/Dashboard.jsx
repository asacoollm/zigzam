import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getBadges } from '../lib/modules'
import Backdrop from '../components/Backdrop'
import Buddy from '../components/Buddy'
import ZigzamLogo from '../components/ZigzamLogo'
import './Dashboard.css'

const MODULES = [
  { emoji: '💬', label: 'Discuter', color: 'var(--rose)', to: '/discuter', badge: 'discuter' },
  { emoji: '📰', label: 'Actualités', color: 'var(--orange)', to: '/actualites', badge: 'actus' },
  { emoji: '👥', label: 'Contacts', color: 'var(--violet)', to: '/contacts' },
  { emoji: '🎨', label: 'Avatar', color: 'var(--bleu)', to: '/avatar' },
  { emoji: '🍩', label: 'Donuts & Gemmes', color: 'var(--vert)', to: '/economie' },
  { emoji: '⚙️', label: 'Paramètres', color: 'var(--rose)', to: '/parametres' },
  { emoji: '🌋', label: 'Floor is Lava', color: 'var(--orange)' },
]

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [badges, setBadges] = useState({ discuter: 0, actus: 0 })

  useEffect(() => {
    let on = true
    getBadges(user.id).then((b) => on && setBadges(b))
    return () => { on = false }
  }, [user.id])

  const modules = [...MODULES]
  if (user.role === 'admin') {
    modules.push({ emoji: '🛡️', label: 'Admin', color: 'var(--violet)', to: '/admin' })
  }

  return (
    <div className="dash">
      <Backdrop />

      <div className="dash__brand">
        <ZigzamLogo size="sm" />
      </div>

      <header className="dash__top">
        <div className="dash__hello">
          <Buddy className="dash__avatar" />
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
        {modules.map((m) => {
          const count = m.badge ? badges[m.badge] : 0
          return (
            <button
              key={m.label}
              className="tile"
              style={{ '--tile-color': m.color }}
              onClick={() => m.to && navigate(m.to)}
            >
              {count > 0 && <span className="tile__badge">{count}</span>}
              <span className="tile__emoji">{m.emoji}</span>
              <span className="tile__label">{m.label}</span>
            </button>
          )
        })}
      </main>
    </div>
  )
}
