import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getBadges } from '../lib/modules'
import { isModuleBlocked } from '../lib/parental'
import Backdrop from '../components/Backdrop'
import Buddy from '../components/Buddy'
import ZigzamLogo from '../components/ZigzamLogo'
import './Dashboard.css'

const MODULES = [
  { emoji: '💬', label: 'Discuter', color: 'var(--rose)', to: '/discuter', badge: 'discuter', key: 'discuter' },
  { emoji: '📰', label: 'Actualités', color: 'var(--orange)', to: '/actualites', badge: 'actus', key: 'actualites' },
  { emoji: '👥', label: 'Contacts', color: 'var(--violet)', to: '/contacts', key: 'contacts' },
  { emoji: '🎨', label: 'Avatar', color: 'var(--bleu)', to: '/avatar', key: 'avatar' },
  { emoji: '🍩', label: 'Donuts & Gemmes', color: 'var(--vert)', to: '/economie', key: 'economie' },
  { emoji: '⚙️', label: 'Paramètres', color: 'var(--rose)', to: '/parametres' },
  { emoji: '🌋', label: 'Floor is Lava', color: 'var(--orange)', to: '/floor-is-lava', key: 'floor-is-lava' },
]

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [badges, setBadges] = useState({ discuter: 0, actus: 0 })
  const [toast, setToast] = useState('')

  useEffect(() => {
    let on = true
    getBadges(user.id).then((b) => on && setBadges(b))
    return () => { on = false }
  }, [user.id])

  const flash = (m) => {
    setToast(m)
    window.clearTimeout(flash._t)
    flash._t = window.setTimeout(() => setToast(''), 2600)
  }

  const handleTile = (m, blocked) => {
    if (m.soon) {
      flash('🌋 Bientôt disponible ! Ce module est en cours de développement.')
      return
    }
    if (!blocked && m.to) navigate(m.to)
  }

  const modules = [...MODULES]
  if (user.role === 'admin' || user.role === 'superadmin') {
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
          <button className="dash__logout" onClick={() => signOut()}>
            Déconnexion
          </button>
        </div>
      </header>

      <main className="dash__grid">
        {modules.map((m) => {
          const count = m.badge ? badges[m.badge] : 0
          const blocked = isModuleBlocked(user.parental, m.key)
          return (
            <button
              key={m.label}
              className={`tile ${blocked ? 'tile--locked' : ''} ${m.soon ? 'tile--soon' : ''}`}
              style={{ '--tile-color': m.color }}
              onClick={() => handleTile(m, blocked)}
              disabled={blocked}
            >
              {blocked && <span className="tile__lock">🔒</span>}
              {!blocked && count > 0 && <span className="tile__badge">{count}</span>}
              <span className="tile__emoji">{m.emoji}</span>
              <span className="tile__label">{m.label}</span>
            </button>
          )
        })}
      </main>

      {toast && <div className="dash__toast">{toast}</div>}
    </div>
  )
}
