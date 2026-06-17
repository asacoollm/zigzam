import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  pingActivity, getOnlineUsers, subscribeToPresence, broadcastPresence,
} from '../lib/modules'
import FallGuy from './FallGuy'
import './OnlineWidget.css'

// Widget « Qui est en ligne ? » — coin inférieur gauche, glassmorphism Zigzam.
// Affiche les utilisateurs actifs (< 5 min). Heartbeat toutes les 2 min +
// canal Realtime partagé pour rafraîchir la liste en direct.
// Sur mobile (< 768px) et sur le dashboard : un simple bouton rond + modale.
export default function OnlineWidget() {
  const { user } = useAuth()
  const location = useLocation()
  const [online, setOnline] = useState([])
  const [open, setOpen] = useState(true)        // panneau desktop (replié/déplié)
  const [modalOpen, setModalOpen] = useState(false) // modale mobile
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches)

  // Suit la largeur d'écran pour basculer entre widget desktop et bouton mobile.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!user) return
    let alive = true

    const refresh = async () => {
      const list = await getOnlineUsers()
      if (alive) setOnline(list)
    }

    // Canal Realtime : un ping reçu d'un autre client → on rafraîchit la liste.
    const channel = subscribeToPresence(() => { if (alive) refresh() })

    const beat = async () => {
      await pingActivity(user.id)   // heartbeat serveur
      broadcastPresence(channel)    // prévient les autres clients
      if (alive) refresh()
    }

    beat()                                       // immédiat à l'arrivée
    const hb = setInterval(beat, 120000)         // heartbeat toutes les 2 min
    const prune = setInterval(refresh, 45000)    // purge les déconnectés

    return () => {
      alive = false
      clearInterval(hb)
      clearInterval(prune)
      channel.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  if (!user) return null

  const others = online.filter((u) => u.id !== user.id)
  const total = others.length + 1 // + moi
  const isDashboard = location.pathname === '/dashboard'

  // Liste partagée (desktop + modale mobile).
  const listEls = (
    <>
      <li className="online__item online__item--me">
        <FallGuy className="online__av" avatar={user.avatar} role={user.role} anim="idle" />
        <span className="online__pseudo">{user.pseudo}</span>
        <span className="online__moi">Toi</span>
      </li>
      {others.length === 0 ? (
        <li className="online__empty">Personne d'autre en ligne pour l'instant 😴</li>
      ) : (
        others.map((u) => (
          <li key={u.id} className="online__item">
            <FallGuy className="online__av" avatar={u.avatar} role={u.role} anim="idle" />
            <span className="online__pseudo">{u.pseudo}</span>
          </li>
        ))
      )}
    </>
  )

  // --- Mobile + dashboard : bouton rond en bas à gauche + modale ---
  if (isMobile && isDashboard) {
    return (
      <>
        <button
          className="online-fab"
          onClick={() => setModalOpen(true)}
          aria-label="Qui est en ligne ?"
          data-tut="online"
        >
          🟢
          <span className="online-fab__badge">{total}</span>
        </button>

        {modalOpen && (
          <div className="online-modal" onMouseDown={() => setModalOpen(false)}>
            <div
              className="online-modal__panel"
              role="dialog"
              aria-label="Qui est en ligne ?"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <header className="online-modal__head">
                <span className="online__title">Qui est en ligne&nbsp;? 🟢</span>
                <span className="online__count">{total}</span>
                <button className="online-modal__close" onClick={() => setModalOpen(false)} aria-label="Fermer">✕</button>
              </header>
              <ul className="online__list online__list--modal">{listEls}</ul>
            </div>
          </div>
        )}
      </>
    )
  }

  // --- Desktop (et mobile hors dashboard) : widget inchangé ---
  return (
    <div className={`online ${open ? 'online--open' : 'online--closed'}`} data-tut="online">
      <button
        className="online__head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="online__title">Qui est en ligne&nbsp;? 🟢</span>
        <span className="online__count">{total}</span>
        <span className="online__chevron">{open ? '▾' : '▸'}</span>
      </button>

      {open && <ul className="online__list">{listEls}</ul>}
    </div>
  )
}
