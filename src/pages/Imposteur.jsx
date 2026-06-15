import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  imposteurJoin, imposteurState, imposteurMove, imposteurChat,
  imposteurSetVoting, imposteurVote, imposteurResolve, imposteurLeave,
  subscribeImposteur, broadcastImposteur, GAME_DURATION_MS,
} from '../lib/imposteur'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import FallGuy from '../components/FallGuy'
import './Imposteur.css'

const STEP = 6 // pas de déplacement (% de la map)

export default function Imposteur() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [chatInput, setChatInput] = useState('')
  const [myVote, setMyVote] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  const channelRef = useRef(null)
  const sessionRef = useRef(null)
  const posRef = useRef({ x: 50, y: 50 })
  const lastSent = useRef(0)
  const votingTriggered = useRef(false)
  const rewardedRef = useRef(false)

  const session = data?.session || null
  const players = data?.players || []
  const positions = data?.positions || {}
  const messages = data?.messages || []
  const meInfo = data?.me || {}
  const reveal = data?.reveal || null

  const sync = useCallback((st) => {
    if (!st || st.error) return
    setData(st)
    sessionRef.current = st.session
  }, [])

  // Rejoint la salle au montage.
  useEffect(() => {
    let on = true
    imposteurJoin(user.id).then((st) => {
      if (!on) return
      sync(st)
      if (st?.session) {
        channelRef.current = subscribeImposteur(st.session.id, () => {
          imposteurState(st.session.id, user.id).then((s) => on && sync(s))
        })
      }
    })
    return () => {
      on = false
      const sid = sessionRef.current?.id
      if (sid) imposteurLeave(sid, user.id)
      if (channelRef.current) channelRef.current.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  // Horloge + heartbeat.
  useEffect(() => {
    if (!session) return
    const tick = setInterval(() => setNow(Date.now()), 500)
    const beat = setInterval(() => {
      const sid = sessionRef.current?.id
      if (sid) imposteurState(sid, user.id).then((s) => sync(s))
    }, 2500)
    return () => { clearInterval(tick); clearInterval(beat) }
  }, [session?.id, sync, user.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fin du chrono (2 min) → passage au vote (déclenché une fois).
  const startedAt = session?.started_at || null
  const remaining = startedAt && session?.statut === 'playing'
    ? Math.max(0, GAME_DURATION_MS - (now - startedAt)) : null
  useEffect(() => {
    if (session?.statut === 'playing' && remaining === 0 && !votingTriggered.current) {
      votingTriggered.current = true
      const sid = sessionRef.current?.id
      imposteurSetVoting(sid).then(() => channelRef.current && broadcastImposteur(channelRef.current))
    }
  }, [remaining, session?.statut])

  // Crédit local des donuts à la révélation (le serveur a déjà crédité).
  useEffect(() => {
    if (session?.statut === 'finished' && reveal && !rewardedRef.current) {
      rewardedRef.current = true
      const amIImposter = reveal.imposteur_id === user.id
      const found = reveal.found
      let delta
      if (found) delta = amIImposter ? -3 : 5
      else delta = amIImposter ? 5 : -2
      updateUser({ donuts: Math.max(0, user.donuts + delta) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.statut, reveal])

  const sendMove = useCallback((np) => {
    posRef.current = np
    setPos(np)
    const t = Date.now()
    if (t - lastSent.current > 280) {
      lastSent.current = t
      const sid = sessionRef.current?.id
      if (sid) {
        imposteurMove(sid, user.id, Math.round(np.x), Math.round(np.y))
        if (channelRef.current) broadcastImposteur(channelRef.current)
      }
    }
  }, [user.id])

  const move = useCallback((dx, dy) => {
    const cur = posRef.current
    sendMove({
      x: Math.max(4, Math.min(96, cur.x + dx)),
      y: Math.max(8, Math.min(94, cur.y + dy)),
    })
  }, [sendMove])

  // Clavier (déplacement) pendant le jeu.
  useEffect(() => {
    if (session?.statut !== 'playing') return
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      switch (e.key) {
        case 'ArrowUp': case 'z': move(0, -STEP); e.preventDefault(); break
        case 'ArrowDown': case 's': move(0, STEP); e.preventDefault(); break
        case 'ArrowLeft': case 'q': move(-STEP, 0); e.preventDefault(); break
        case 'ArrowRight': case 'd': move(STEP, 0); e.preventDefault(); break
        default: break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [move, session?.statut])

  const sendChat = (e) => {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text) return
    setChatInput('')
    const sid = sessionRef.current?.id
    imposteurChat(sid, user.id, text).then((s) => {
      sync(s)
      if (channelRef.current) broadcastImposteur(channelRef.current)
    })
  }

  const vote = (targetId) => {
    setMyVote(targetId)
    const sid = sessionRef.current?.id
    imposteurVote(sid, user.id, targetId).then((s) => {
      sync(s)
      if (channelRef.current) broadcastImposteur(channelRef.current)
    })
  }

  const forceResolve = () => {
    const sid = sessionRef.current?.id
    imposteurResolve(sid).then((s) => {
      sync(s)
      if (channelRef.current) broadcastImposteur(channelRef.current)
    })
  }

  const leave = () => {
    const sid = sessionRef.current?.id
    if (sid) imposteurLeave(sid, user.id)
    navigate('/dashboard')
  }

  if (!session) {
    return <div className="imp"><Backdrop /><div className="imp__loading">🕵️ Connexion…</div></div>
  }

  // ----- Salle d'attente -----
  if (session.statut === 'waiting') {
    return (
      <div className="imp">
        <Backdrop />
        <header className="imp__top">
          <button className="imp__back" onClick={leave}>⬅️ Quitter</button>
          <ZigzamLogo size="sm" />
          <span />
        </header>
        <h1 className="imp__title">L'Imposteur 🕵️</h1>
        <p className="imp__hint">Salle d'attente — il faut exactement 5 joueurs.</p>
        <div className="imp__lobby">
          {players.map((p) => (
            <div key={p.user_id} className="imp__lobby-player">
              <FallGuy avatar={p.avatar} role={p.role} className="imp__lobby-av" anim="idle" />
              <span className="imp__lobby-name">{p.label}{p.user_id === user.id ? ' (toi)' : ''}</span>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 5 - players.length) }).map((_, i) => (
            <div key={`e-${i}`} className="imp__lobby-player imp__lobby-player--empty">
              <span className="imp__lobby-q">?</span>
              <span className="imp__lobby-name">En attente…</span>
            </div>
          ))}
        </div>
        <p className="imp__count">{players.length}/5 joueurs</p>
      </div>
    )
  }

  // ----- Révélation finale -----
  if (session.statut === 'finished' && reveal) {
    const imp = players.find((p) => p.user_id === reveal.imposteur_id)
    const found = reveal.found
    const amIImposter = reveal.imposteur_id === user.id
    let delta
    if (found) delta = amIImposter ? -3 : 5
    else delta = amIImposter ? 5 : -2
    return (
      <div className="imp">
        <Backdrop />
        <div className="imp__overlay">
          <div className={`imp__panel ${found ? 'imp__panel--found' : 'imp__panel--escaped'}`}>
            <h2 className="imp__panel-title">{found ? '🎯 Imposteur démasqué !' : '😈 L\'imposteur s\'échappe !'}</h2>
            <FallGuy avatar={imp?.avatar} role={imp?.role} className="imp__panel-av" anim="jump" />
            <p className="imp__panel-text">
              L'imposteur était <strong>{imp?.real}</strong>,<br />
              qui se faisait passer pour <strong>{reveal.pseudo_usurpe}</strong>&nbsp;!
            </p>
            <p className={`imp__delta ${delta >= 0 ? 'imp__delta--up' : 'imp__delta--down'}`}>
              {delta >= 0 ? `+${delta}` : delta} 🍩
            </p>
            <button className="imp__btn" onClick={() => navigate('/dashboard')}>Retour</button>
          </div>
        </div>
      </div>
    )
  }

  // ----- Vote -----
  if (session.statut === 'voting') {
    return (
      <div className="imp">
        <Backdrop />
        <header className="imp__top">
          <button className="imp__back" onClick={leave}>⬅️ Quitter</button>
          <ZigzamLogo size="sm" />
          <span className="imp__phase">🗳️ Vote</span>
        </header>
        <h1 className="imp__title">Qui est l'imposteur&nbsp;?</h1>
        <p className="imp__hint">Vote pour la personne que tu soupçonnes.</p>
        <div className="imp__vote-grid">
          {players.filter((p) => p.user_id !== user.id).map((p) => (
            <button
              key={p.user_id}
              className={`imp__vote-card ${myVote === p.user_id ? 'imp__vote-card--on' : ''}`}
              onClick={() => vote(p.user_id)}
              disabled={myVote != null}
            >
              <FallGuy avatar={p.avatar} role={p.role} className="imp__vote-av" anim="idle" />
              <span className="imp__vote-name">{p.label}</span>
              {myVote === p.user_id && <span className="imp__vote-check">✓ Mon vote</span>}
            </button>
          ))}
        </div>
        {myVote != null && (
          <>
            <p className="imp__waiting">Vote enregistré — en attente des autres… ({Object.keys(data.votes || {}).length}/{players.length})</p>
            <button className="imp__btn imp__btn--ghost" onClick={forceResolve}>Révéler les résultats</button>
          </>
        )}
      </div>
    )
  }

  // ----- Jeu (map + chat) -----
  const secs = remaining != null ? Math.ceil(remaining / 1000) : 0
  const mm = String(Math.floor(secs / 60)).padStart(1, '0')
  const ss = String(secs % 60).padStart(2, '0')

  return (
    <div className="imp imp--playing">
      <Backdrop />
      <header className="imp__top">
        <button className="imp__back" onClick={leave}>⬅️ Quitter</button>
        <span className="imp__timer">⏱️ {mm}:{ss}</span>
        <span className="imp__phase">🕵️ En jeu</span>
      </header>

      {meInfo.is_imposter ? (
        <div className="imp__role imp__role--imposter">
          😈 Tu es l'<strong>IMPOSTEUR</strong> ! Fais croire que tu es <strong>{meInfo.usurpe}</strong>.
        </div>
      ) : (
        <div className="imp__role imp__role--crew">
          🔍 Trouve l'imposteur parmi vous ! Discute et observe…
        </div>
      )}

      <div className="imp__game">
        <div
          className="imp__map"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            sendMove({
              x: Math.max(4, Math.min(96, ((e.clientX - r.left) / r.width) * 100)),
              y: Math.max(8, Math.min(94, ((e.clientY - r.top) / r.height) * 100)),
            })
          }}
        >
          {players.map((p) => {
            const isMe = p.user_id === user.id
            const pp = isMe ? pos : (positions[p.user_id] || { x: 50, y: 50 })
            return (
              <div
                key={p.user_id}
                className={`imp__avatar ${isMe ? 'imp__avatar--me' : ''}`}
                style={{ left: `${pp.x}%`, top: `${pp.y}%` }}
              >
                <span className="imp__avatar-label">{p.label}</span>
                <FallGuy avatar={p.avatar} role={p.role} className="imp__avatar-fg" anim="idle" />
              </div>
            )
          })}
          <div className="imp__map-hint">Clique ou flèches pour te déplacer</div>
        </div>

        <div className="imp__chat">
          <div className="imp__chat-msgs">
            {messages.length === 0 && <p className="imp__chat-empty">Lance la discussion 💬</p>}
            {messages.map((m, i) => (
              <div key={i} className={`imp__msg ${m.user_id === user.id ? 'imp__msg--mine' : ''}`}>
                <span className="imp__msg-author">{m.author}</span>
                <span className="imp__msg-text">{m.text}</span>
              </div>
            ))}
          </div>
          <form className="imp__chat-form" onSubmit={sendChat}>
            <input
              className="imp__chat-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Écris un message…"
              maxLength={300}
            />
            <button className="imp__chat-send" type="submit">🚀</button>
          </form>
        </div>
      </div>

      {/* D-pad mobile */}
      <div className="imp__dpad" aria-hidden="true">
        <button className="imp__key imp__key--up" onClick={() => move(0, -STEP)}>▲</button>
        <button className="imp__key imp__key--left" onClick={() => move(-STEP, 0)}>◀</button>
        <button className="imp__key imp__key--right" onClick={() => move(STEP, 0)}>▶</button>
        <button className="imp__key imp__key--down" onClick={() => move(0, STEP)}>▼</button>
      </div>
    </div>
  )
}
