import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getBadges, markTutorialDone, getMyBoites } from '../lib/modules'
import { isModuleBlocked } from '../lib/parental'
import { FLAVA_UNLOCK_TS, flavaCountdown } from '../lib/flavaCountdown'
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
  { emoji: '🃏', label: 'Poker Donuts', color: 'var(--rose)', to: '/poker-donuts', key: 'poker', flava: true },
  { emoji: '🕵️', label: "L'Imposteur", color: 'var(--violet)', to: '/imposteur', key: 'imposteur', flava: true },
  { emoji: '🎬', label: 'Série Zigzam', color: 'var(--bleu)', to: '/serie', key: 'serie' },
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
  const [boiteCount, setBoiteCount] = useState(0)
  const [toast, setToast] = useState('')
  const [rulesOpen, setRulesOpen] = useState(true)
  // Le tutoriel se lance auto à la 1re connexion (tutoriel_vu === false).
  const [showTut, setShowTut] = useState(() => user.tutoriel_vu === false)
  // Décompte Floor is Lava (#5) — tic chaque seconde tant que verrouillé.
  const [now, setNow] = useState(() => Date.now())
  const [flavaParty, setFlavaParty] = useState(false)
  const flavaUnlocked = now >= FLAVA_UNLOCK_TS
  const cd = flavaCountdown(now)

  const toastTimer = useRef(null)
  const flash = useCallback((m) => {
    setToast(m)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }, [])

  useEffect(() => {
    let on = true
    getBadges(user.id).then((b) => on && setBadges(b))
    getMyBoites(user.id).then((b) => on && setBoiteCount(Array.isArray(b) ? b.length : 0))
    return () => { on = false }
  }, [user.id])

  // Tic du décompte (1 s). S'arrête dès que le module est déverrouillé.
  useEffect(() => {
    if (Date.now() >= FLAVA_UNLOCK_TS) return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= FLAVA_UNLOCK_TS) {
        // Transition en direct : déverrouillage + célébration.
        setFlavaParty(true)
        flash('🎉 Les nouveaux jeux sont disponibles !')
        clearInterval(id)
      }
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Récompense « vraie pause » (#3) : message de bienvenue à la connexion.
  useEffect(() => {
    if (user.pause_recompense) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      flash('Bon retour ! 🌟 Tu as gagné 2 🍩 donuts pour ta pause !')
      updateUser({ pause_recompense: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const isAdmin = user.role === 'admin' || user.role === 'superadmin'
  // Seuls les SUPERADMIN ont l'aperçu anticipé des jeux verrouillés par le décompte.
  const isSuperadmin = user.role === 'superadmin'

  const handleTile = (m, blocked) => {
    // Décompte : verrouillé pour tout le monde sauf les superadmin (aperçu).
    if (m.flava && !flavaUnlocked && !isSuperadmin) {
      flash(`🔒 ${m.label} ouvre dans ${cd.d}j ${cd.h}h ${cd.m}min ${cd.s}s !`)
      return
    }
    if (m.soon) {
      flash('🌋 Bientôt disponible ! Ce module est en cours de développement.')
      return
    }
    if (!blocked && m.to) navigate(m.to)
  }

  const modules = [...MODULES]
  if (isAdmin) {
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

      {boiteCount > 0 && (
        <button className="dash__boite-notif" onClick={() => navigate('/boites')}>
          <span className="dash__boite-notif-emoji">🎁</span>
          <span>
            Asacool t'a envoyé {boiteCount > 1 ? `${boiteCount} boîtes mystères` : 'une boîte mystère'} !
            <strong> Clique pour {boiteCount > 1 ? 'les' : "l'"} ouvrir ✨</strong>
          </span>
        </button>
      )}

      <main className="dash__grid" data-tut="grid">
        {boiteCount > 0 && (
          <button
            className="tile tile--boite"
            style={{ '--tile-color': 'var(--rose)' }}
            onClick={() => navigate('/boites')}
          >
            {boiteCount > 1 && <span className="tile__badge">{boiteCount}</span>}
            <span className="tile__emoji">🎁</span>
            <span className="tile__label">Tu as une boîte mystère !</span>
          </button>
        )}
        {modules.map((m) => {
          const count = m.badge ? badges[m.badge] : 0
          const blocked = isModuleBlocked(user.parental, m.key)
          // Verrou décompte : grisé + décompte pour tout le monde ; aperçu
          // en couleur normale (cliquable) pour les superadmin uniquement.
          const flavaLocked = m.flava && !flavaUnlocked && !isSuperadmin
          const flavaPreview = m.flava && !flavaUnlocked && isSuperadmin
          const flavaReady = m.flava && flavaUnlocked
          return (
            <button
              key={m.label}
              data-tut={m.tut ? `tile-${m.tut}` : undefined}
              className={[
                'tile',
                blocked ? 'tile--locked' : '',
                m.soon ? 'tile--soon' : '',
                flavaLocked ? 'tile--flava-locked' : '',
                flavaReady ? 'tile--flava-ready' : '',
                flavaReady && flavaParty ? 'tile--flava-party' : '',
              ].filter(Boolean).join(' ')}
              style={{ '--tile-color': m.color }}
              onClick={() => handleTile(m, blocked)}
              disabled={blocked}
            >
              {blocked && <span className="tile__lock">🔒</span>}
              {!blocked && count > 0 && <span className="tile__badge">{count}</span>}
              <span className="tile__emoji">{m.emoji}</span>
              <span className="tile__label">{m.label}</span>

              {/* Élèves & admins : grisé + décompte */}
              {flavaLocked && (
                <div className="tile__countdown" aria-label="Décompte avant ouverture">
                  <span className="tile__countdown-lock">🔒 Ouverture dans</span>
                  <span className="tile__countdown-clock">
                    <b>{cd.d}</b>j <b>{String(cd.h).padStart(2, '0')}</b>h{' '}
                    <b>{String(cd.m).padStart(2, '0')}</b>m <b>{String(cd.s).padStart(2, '0')}</b>s
                  </span>
                </div>
              )}
              {/* Superadmin : couleur normale + mention d'aperçu */}
              {flavaPreview && (
                <span className="tile__preview-note">🔧 Aperçu superadmin — grisé pour les autres</span>
              )}
              {flavaReady && <span className="tile__ready-badge">Disponible ! 🎉</span>}
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

      <div className="dash__pause-bonus">
        <span className="dash__pause-emoji">💤</span>
        <p className="dash__pause-text">
          Faire une <strong>pause de 18h</strong> te rapporte <strong>2 🍩 donuts</strong> !
          Zigzam encourage les vraies pauses 🌟
        </p>
      </div>

      {toast && <div className="dash__toast">{toast}</div>}

      {showTut && <Tutorial steps={TUTORIAL_STEPS} onFinish={finishTutorial} />}
    </div>
  )
}
