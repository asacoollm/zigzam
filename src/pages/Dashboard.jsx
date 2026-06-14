import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getBadges, markTutorialDone } from '../lib/modules'
import { isModuleBlocked } from '../lib/parental'
import Backdrop from '../components/Backdrop'
import Buddy from '../components/Buddy'
import ZigzamLogo from '../components/ZigzamLogo'
import Tutorial from '../components/Tutorial'
import './Dashboard.css'

const MODULES = [
  { emoji: '💬', label: 'Discuter', color: 'var(--rose)', to: '/discuter', badge: 'discuter', key: 'discuter', tut: 'discuter' },
  { emoji: '📰', label: 'Actualités', color: 'var(--orange)', to: '/actualites', badge: 'actus', key: 'actualites', tut: 'actualites' },
  { emoji: '👥', label: 'Contacts', color: 'var(--violet)', to: '/contacts', key: 'contacts' },
  { emoji: '🎨', label: 'Avatar', color: 'var(--bleu)', to: '/avatar', key: 'avatar', tut: 'avatar' },
  { emoji: '🍩', label: 'Donuts & Gemmes', color: 'var(--vert)', to: '/economie', key: 'economie' },
  { emoji: '⚙️', label: 'Paramètres', color: 'var(--rose)', to: '/parametres' },
  { emoji: '🌋', label: 'Floor is Lava', color: 'var(--orange)', to: '/floor-is-lava', key: 'floor-is-lava', tut: 'floor' },
]

// Étapes du tutoriel de bienvenue (pointent vers les éléments via data-tut).
const TUTORIAL_STEPS = [
  { center: true, text: "Bienvenue sur Zigzam ! 🎉 Je suis ton guide. Je vais t'expliquer comment tout fonctionne en quelques étapes !" },
  { selector: '[data-tut="avatar"]', text: "Voilà ton avatar ! C'est ton bonhomme Fall Guys unique. Tu peux le personnaliser dans le module Avatar 🎨" },
  { selector: '[data-tut="counters"]', text: "Ici tu vois tes 🍩 donuts et 💎 gemmes. Tu en gagnes en participant à l'appli ! 5 donuts = 1 gemme." },
  { selector: '[data-tut="grid"]', text: 'Ces carrés sont les modules de Zigzam. Clique dessus pour y accéder !' },
  { selector: '[data-tut="tile-discuter"]', text: '💬 Discuter : envoie des messages à tes camarades en privé ou en groupe. Utilise leur numéro à 4 chiffres pour les trouver !' },
  { selector: '[data-tut="tile-actualites"]', text: '📰 Actualités : partage des nouvelles avec toute la classe ! Chaque vue rapporte 2 🍩 donuts.' },
  { selector: '[data-tut="tile-floor"]', text: '🌋 Floor is Lava : un mini-jeu où tu dois éviter la lave et activer toutes les zones pour gagner des donuts !' },
  { selector: '[data-tut="tile-avatar"]', text: '🎨 Avatar : personnalise ton bonhomme avec des chapeaux, lunettes, animaux et plein d\'autres accessoires !' },
  { selector: '[data-tut="online"]', text: '🟢 Ici tu vois qui est connecté en ce moment sur Zigzam !' },
  { selector: '[data-tut="rules"]', text: '🤝 N\'oublie pas les règles ! Respecte tes camarades et sois bienveillant.' },
  { center: true, text: "Tu es prêt ! 🚀 Amuse-toi bien sur Zigzam et sois sympa avec tout le monde !" },
]

export default function Dashboard() {
  const { user, signOut, updateUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [badges, setBadges] = useState({ discuter: 0, actus: 0 })
  const [toast, setToast] = useState('')
  const [rulesOpen, setRulesOpen] = useState(true)
  // Le tutoriel se lance auto à la 1re connexion (tutoriel_vu === false).
  const [showTut, setShowTut] = useState(() => user.tutoriel_vu === false)

  useEffect(() => {
    let on = true
    getBadges(user.id).then((b) => on && setBadges(b))
    return () => { on = false }
  }, [user.id])

  // Relance manuelle depuis Paramètres ("Revoir le tutoriel").
  useEffect(() => {
    if (location.state?.revoirTuto) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowTut(true)
      navigate('/dashboard', { replace: true })
    }
  }, [location.state, navigate])

  const finishTutorial = () => {
    setShowTut(false)
    updateUser({ tutoriel_vu: true })
    markTutorialDone(user.id)
  }

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
        <div className="dash__hello" data-tut="avatar">
          <Buddy className="dash__avatar" />
          <div>
            <p className="dash__name">{user.pseudo}</p>
            <p className="dash__num">📞 {user.numero}</p>
          </div>
        </div>

        <div className="dash__counters" data-tut="counters">
          <span className="counter counter--donut">🍩 {user.donuts}</span>
          <span className="counter counter--gem">💎 {user.gemmes}</span>
          <button className="dash__logout" onClick={() => signOut()}>
            Déconnexion
          </button>
        </div>
      </header>

      <main className="dash__grid" data-tut="grid">
        {modules.map((m) => {
          const count = m.badge ? badges[m.badge] : 0
          const blocked = isModuleBlocked(user.parental, m.key)
          return (
            <button
              key={m.label}
              data-tut={m.tut ? `tile-${m.tut}` : undefined}
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

      <section className={`rules ${rulesOpen ? 'rules--open' : 'rules--closed'}`} data-tut="rules">
        <button
          className="rules__head"
          onClick={() => setRulesOpen((v) => !v)}
          aria-expanded={rulesOpen}
        >
          <span className="rules__title">Règles de bonne conduite 🤝</span>
          <span className="rules__chevron">{rulesOpen ? '▾' : '▸'}</span>
        </button>

        {rulesOpen && (
          <ul className="rules__list">
            <li>🤝 Respecte tous tes camarades</li>
            <li>💬 Écris des messages gentils et bienveillants</li>
            <li>🚫 Pas d'insultes, de moqueries ou de méchancetés</li>
            <li>📰 Poste des actus positives et intéressantes</li>
            <li>🔒 Ne partage jamais ton mot de passe</li>
            <li>⭐ Aide les autres et sois sympa !</li>
          </ul>
        )}
      </section>

      {toast && <div className="dash__toast">{toast}</div>}

      {showTut && <Tutorial steps={TUTORIAL_STEPS} onFinish={finishTutorial} />}
    </div>
  )
}
