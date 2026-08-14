import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getBadges, markTutorialDone, getMyBoites, checkAndApplyTaxes,
  checkPouperRecords, getPouperNotifications,
} from '../lib/modules'
import { getPendingCardNotifications } from '../lib/cartes'
import { isModuleBlocked } from '../lib/parental'
import { isVipActive, formatVipTimeLeft, useVipCountdown } from '../lib/vip'
import { pouperRecordLabel } from '../lib/poupers'
import Backdrop from '../components/Backdrop'
import Buddy from '../components/Buddy'
import ZigzamLogo from '../components/ZigzamLogo'
import Tutorial from '../components/Tutorial'
import {
  IconDiscuter, IconActualites, IconContacts, IconAvatar, IconDonutsGemmes,
  IconShop, IconParametres, IconFloorIsLava, IconSerie, IconAdmin, IconPoupers, IconMap,
  IconRoulette,
} from '../components/icons'
import './Dashboard.css'

const MODULES = [
  { Icon: IconDiscuter, label: 'Discuter', color: 'var(--rose)', to: '/discuter', badge: 'discuter', key: 'discuter', tut: 'discuter' },
  { Icon: IconActualites, label: 'Actualités', color: 'var(--orange)', to: '/actualites', badge: 'actus', key: 'actualites', tut: 'actualites' },
  { Icon: IconContacts, label: 'Contacts', color: 'var(--violet)', to: '/contacts', key: 'contacts' },
  { Icon: IconAvatar, label: 'Avatar', color: 'var(--bleu)', to: '/avatar', key: 'avatar', tut: 'avatar' },
  { Icon: IconDonutsGemmes, label: 'Donuts & Gemmes', color: 'var(--vert)', to: '/economie', key: 'economie' },
  { Icon: IconRoulette, label: 'Roulette Zigzam', color: 'var(--violet)', to: '/roulette', key: 'roulette' },
  { Icon: IconShop, label: 'Shop', color: 'var(--orange)', to: '/shop', key: 'shop' },
  { Icon: IconPoupers, label: 'Poupers', color: 'var(--violet)', to: '/poupers', key: 'poupers' },
  { Icon: IconMap, label: 'Map Zigzam', color: 'var(--bleu)', to: '/map', key: 'map' },
  { Icon: IconParametres, label: 'Paramètres', color: 'var(--rose)', to: '/parametres' },
  { Icon: IconFloorIsLava, label: 'Floor is Lava', color: 'var(--orange)', to: '/floor-is-lava', key: 'floor-is-lava', tut: 'floor' },
  { Icon: IconSerie, label: 'Série Zigzam', color: 'var(--bleu)', to: '/serie', key: 'serie' },
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
  // Animation « zoom in » au clic sur une tuile, avant la navigation.
  const [clickedTile, setClickedTile] = useState(null)
  const [zooming, setZooming] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState({ x: '50%', y: '50%' })

  const toastTimer = useRef(null)
  const zoomTimers = useRef([])
  useEffect(() => () => zoomTimers.current.forEach(clearTimeout), [])
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

  // Impôts 💸 : vérifiés à chaque ouverture du dashboard, no-op côté serveur
  // si moins de 14 jours se sont écoulés depuis le dernier prélèvement.
  useEffect(() => {
    let on = true
    checkAndApplyTaxes(user.id).then((res) => {
      if (!on || !res.applied) return
      updateUser({ donuts: res.donuts, gemmes: res.gemmes })
      flash(`💸 Les impôts sont passés ! Tu as perdu ${res.donuts_perdus} 🍩 et ${res.gemmes_perdus} 💎.`)
    })
    return () => { on = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  // 🪆 Poupers Collectore : recalcule les 9 records à la connexion, puis
  // affiche en cascade les notifications de gain/perte en attente (même
  // celles générées pendant que ce joueur n'était pas connecté).
  useEffect(() => {
    let on = true
    checkPouperRecords().then(() => {
      if (!on) return
      getPouperNotifications(user.id).then((notifs) => {
        if (!on || !notifs.length) return
        notifs.forEach((n, i) => {
          const label = pouperRecordLabel(n.record_type)
          const msg = n.type === 'gain'
            ? `🪆 Tu as gagné la poupée ${n.pouper_nom} ! Tu détiens maintenant le record de ${label} !`
            : `🪆 ${n.autre_pseudo || 'Quelqu’un'} t'a pris la poupée ${n.pouper_nom} ! Il/elle a battu ton record de ${label}.`
          setTimeout(() => on && flash(msg), i * 3200)
        })
      })
    })
    return () => { on = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  // 🃏 Carte IMPOSSIBLE : notifie si elle vient d'être gagnée ou perdue
  // (transfert géré côté serveur, remis au prochain passage sur le dashboard).
  useEffect(() => {
    let on = true
    getPendingCardNotifications(user.id).then((notifs) => {
      if (!on || !notifs.length) return
      notifs.forEach((n, i) => {
        const msg = n.type === 'gagnee'
          ? `🃏 Tu as gagné la carte ${n.card_nom} ! Elle t'a été transférée par ${n.autre_pseudo}.`
          : `🃏 ${n.autre_pseudo} a gagné la carte ${n.card_nom} ! Elle ne t'appartient plus.`
        setTimeout(() => on && flash(msg), i * 3200)
      })
    })
    return () => { on = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  const vipActif = isVipActive(user.vip_expire_at)
  useVipCountdown(vipActif)

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

  const handleTile = (m, blocked, e) => {
    if (m.soon) {
      flash('🌋 Bientôt disponible ! Ce module est en cours de développement.')
      return
    }
    if (blocked || !m.to || clickedTile) return

    const rect = e.currentTarget.getBoundingClientRect()
    setZoomOrigin({
      x: `${((rect.left + rect.width / 2) / window.innerWidth) * 100}%`,
      y: `${((rect.top + rect.height / 2) / window.innerHeight) * 100}%`,
    })
    setClickedTile(m.label)
    zoomTimers.current.push(setTimeout(() => setZooming(true), 150))
    zoomTimers.current.push(setTimeout(() => navigate(m.to), 400))
  }

  const modules = [...MODULES]
  if (isAdmin) {
    modules.push({ Icon: IconAdmin, label: 'Admin', color: 'var(--violet)', to: '/admin' })
  }

  return (
    <div
      className={`dash ${zooming ? 'dash--zoom-in' : ''}`}
      style={{ '--zoom-origin-x': zoomOrigin.x, '--zoom-origin-y': zoomOrigin.y }}
    >
      <Backdrop />

      <div className="dash__brand">
        <ZigzamLogo size="sm" />
      </div>

      <header className="dash__top">
        <div className="dash__hello" data-tut="avatar">
          <span className="dash__avatar-ring">
            <Buddy className="dash__avatar" />
          </span>
          <div>
            <p className="dash__name">
              {user.pseudo}
              {vipActif && <span className="dash__vip-crown" title="Pass VIP actif">👑</span>}
            </p>
            <p className="dash__num">📞 {user.numero}</p>
            {vipActif && (
              <p className="dash__vip-countdown">👑 VIP · {formatVipTimeLeft(user.vip_expire_at)}</p>
            )}
          </div>
        </div>

        <div className="dash__counters" data-tut="counters">
          <span className="counter counter--donut">🍩 {user.donuts}</span>
          <span className="counter counter--gem">💎 {user.gemmes}</span>
          <span className="counter counter--burger">🍔 {user.burgers ?? 0}</span>
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
          return (
            <button
              key={m.label}
              data-tut={m.tut ? `tile-${m.tut}` : undefined}
              className={[
                'tile',
                blocked ? 'tile--locked' : '',
                m.soon ? 'tile--soon' : '',
                clickedTile === m.label ? 'tile--clicked' : '',
              ].filter(Boolean).join(' ')}
              style={{ '--tile-color': m.color }}
              onClick={(e) => handleTile(m, blocked, e)}
              disabled={blocked}
            >
              {blocked && <span className="tile__lock">🔒</span>}
              {!blocked && count > 0 && <span className="tile__badge">{count}</span>}
              <span className="tile__emoji"><m.Icon /></span>
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
          <span className="rules__title stroke-title">Règles de bonne conduite 🤝</span>
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

      {clickedTile && (
        <div className={`dash__zoom-overlay ${zooming ? 'dash__zoom-overlay--active' : ''}`} />
      )}
    </div>
  )
}
