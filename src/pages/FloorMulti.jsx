import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  ROCK, ZONE, TICK_MS, LAVA_DELAY_MS, buildBoard, lavaAtTick, isLavaCell, emptyLavaGrid, botStep,
  flavaJoin, flavaState, flavaMove, flavaActivate, flavaBurn, flavaLeave,
  flavaStart, flavaAddBot, flavaRemoveBot, flavaSetBots,
  subscribeFlava, broadcastFlava,
} from '../lib/flavaMulti'
import { normalizeAvatar } from '../lib/avatar'
import { animalWide } from '../components/avatarParts'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'

const AIRBORNE_MS = 1000      // durée du saut (immunité à la lave) = 1 s pile
const JUMP_CD = 1000          // recharge du saut APRÈS l'atterrissage = 1 s
const MOVE_THROTTLE_MS = 200  // délai mini entre deux déplacements tactiles (vitesse fixe)
const BURN_MS = 5000          // durée « brûlé » avant résurrection
const REVIVE_GRACE_MS = 1500  // immunité brève après la résurrection

// Un avatar est-il « large » (animal terrestre) → recentrage spécifique.
function isWide(avatar) {
  const a = avatar ? normalizeAvatar(avatar) : null
  return !!(a?.animal && animalWide(a.animal))
}

export default function FloorMulti({ onBack }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState(null)     // { session, players }
  const [pos, setPos] = useState(null)       // ma position { r, c } (locale, réactive)
  const [airborne, setAirborne] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [activeAt, setActiveAt] = useState(null) // instant LOCAL de démarrage (chrono lave)
  const [burnedUntil, setBurnedUntil] = useState(0) // brûlé jusqu'à (ms) — résurrection
  const [jumpReadyAt, setJumpReadyAt] = useState(0) // saut prêt à (ms) — barre/recharge
  const [error, setError] = useState('')

  const channelRef = useRef(null)
  const airborneRef = useRef(false)
  const jumpReadyRef = useRef(0)
  const landTimer = useRef(null)
  const posRef = useRef(null)
  const sessionRef = useRef(null)
  const startedRef = useRef(false)
  const activeAtRef = useRef(null) // instant LOCAL où ce client voit la partie active
  const burnedUntilRef = useRef(0)
  const reviveImmuneRef = useRef(0)

  const session = data?.session || null
  const players = data?.players || []
  const bots = session?.bots || []
  const hostId = players[0]?.user_id || null // 1er humain = hôte (pilote les bots)
  const me = players.find((p) => p.user_id === user.id) || null
  const myAlive = me ? me.alive : true
  const finished = session?.statut === 'finished'

  // Plateau déterministe dérivé du seed + taille.
  const board = useMemo(() => {
    if (!session) return null
    return buildBoard(session.taille, session.seed)
  }, [session?.taille, session?.seed]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lave courante (déterministe). Le temps écoulé est mesuré LOCALEMENT (depuis
  // que CE client voit la partie active) → robuste aux décalages d'horloge entre
  // le navigateur et le serveur (sinon : lave instantanée → élimination immédiate).
  const lava = useMemo(() => {
    if (!session || !board) return null
    if (session.statut !== 'active' || !activeAt) return emptyLavaGrid(session.taille)
    const elapsed = now - activeAt
    if (elapsed < LAVA_DELAY_MS) return emptyLavaGrid(session.taille) // répit ~5 s
    const T = Math.floor((elapsed - LAVA_DELAY_MS) / TICK_MS)
    return lavaAtTick(session.taille, session.seed, board.terrain, T)
  }, [session?.statut, session?.taille, session?.seed, board, now, activeAt]) // eslint-disable-line react-hooks/exhaustive-deps

  // Niveau de lave (#1 — submersion des boutons proportionnelle).
  const submerge = useMemo(() => {
    if (!lava || finished) return 0
    let n = 0
    for (const row of lava) for (const cell of row) if (cell) n++
    const size = session.taille
    return Math.min(1, (n / (size * size)) * 2.6)
  }, [lava, finished, session?.taille])

  const applyState = useCallback((st) => {
    if (!st || st.error) { setError('Connexion à la partie impossible. Réessaie !'); return }
    setData(st)
    sessionRef.current = st.session
    // Repère LOCAL de démarrage de la partie (pour le chrono de la lave) :
    // robuste aux décalages d'horloge navigateur/serveur.
    if (st.session.statut === 'active') {
      if (!activeAtRef.current) {
        const t = Date.now()
        activeAtRef.current = t
        setActiveAt(t)
      }
    } else if (activeAtRef.current) {
      activeAtRef.current = null
      setActiveAt(null)
    }
    const mine = st.players.find((p) => p.user_id === user.id)
    if (mine) {
      // Pendant l'attente, on suit le centre ; au démarrage (waiting → active),
      // on adopte la position serveur (plateau recentré). Ensuite, position locale.
      if (!posRef.current || st.session.statut === 'waiting') {
        posRef.current = { r: mine.r, c: mine.c }
        setPos({ r: mine.r, c: mine.c })
      } else if (st.session.statut === 'active' && !startedRef.current) {
        startedRef.current = true
        posRef.current = { r: mine.r, c: mine.c }
        setPos({ r: mine.r, c: mine.c })
      }
    }
  }, [user.id])

  // Rejoint la partie commune au montage.
  useEffect(() => {
    let alive = true
    flavaJoin(user.id).then((st) => {
      if (!alive) return
      applyState(st)
      if (st?.session) {
        const ch = subscribeFlava(st.session.id, () => {
          flavaState(st.session.id, user.id).then((s) => alive && applyState(s))
        })
        channelRef.current = ch
      }
    })
    return () => {
      alive = false
      const sid = sessionRef.current?.id
      if (sid) flavaLeave(sid, user.id)
      if (channelRef.current) channelRef.current.unsubscribe()
      clearTimeout(landTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  // Horloge de la lave + heartbeat de rafraîchissement.
  useEffect(() => {
    if (!session) return
    const lavaTimer = setInterval(() => setNow(Date.now()), 250)
    const beat = setInterval(() => {
      const sid = sessionRef.current?.id
      if (sid) flavaState(sid, user.id).then((s) => applyState(s))
    }, 3000)
    return () => { clearInterval(lavaTimer); clearInterval(beat) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id])

  // Brûlure (résurrection) : toucher la lave (pas en l'air) → brûlé 5 s, pas mort.
  useEffect(() => {
    if (!lava || !pos || finished || session?.statut !== 'active') return
    const nowMs = Date.now()
    if (burnedUntilRef.current > nowMs || reviveImmuneRef.current > nowMs) return
    if (isLavaCell(lava, pos.r, pos.c) && !airborneRef.current) {
      const until = nowMs + BURN_MS
      burnedUntilRef.current = until
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBurnedUntil(until)
      const sid = sessionRef.current?.id
      if (sid) flavaBurn(sid, user.id).then(() => {
        if (channelRef.current) broadcastFlava(channelRef.current)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lava, pos, finished, session?.statut])

  // Résurrection : quand la brûlure se termine, on revit au centre (case de départ)
  // avec une courte immunité.
  useEffect(() => {
    if (burnedUntil <= 0 || now < burnedUntil) return
    const sess = sessionRef.current
    const center = sess ? sess.taille >> 1 : 0
    const safe = { r: center, c: center }
    posRef.current = safe
    burnedUntilRef.current = 0
    reviveImmuneRef.current = Date.now() + REVIVE_GRACE_MS
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPos(safe)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBurnedUntil(0)
    if (sess?.id) {
      flavaMove(sess.id, user.id, safe.r, safe.c)
      if (channelRef.current) broadcastFlava(channelRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, burnedUntil])

  // Pilote des bots : seul l'hôte (1er humain) déplace les bots (évitent la
  // lave, foncent sur les zones) et active les zones qu'ils atteignent.
  useEffect(() => {
    if (!board || session?.statut !== 'active' || hostId !== user.id) return
    const id = setInterval(() => {
      const sess = sessionRef.current
      if (!sess || sess.statut !== 'active') return
      const list = sess.bots || []
      if (list.length === 0) return
      const elapsed = activeAtRef.current ? Date.now() - activeAtRef.current : 0
      const lavaNow = elapsed < LAVA_DELAY_MS
        ? emptyLavaGrid(sess.taille)
        : lavaAtTick(sess.taille, sess.seed, board.terrain, Math.floor((elapsed - LAVA_DELAY_MS) / TICK_MS))
      const zonesActive = sess.zones_active || []
      const newBots = list.map((b) => botStep(board, lavaNow, b, zonesActive, sess.taille))
      newBots.forEach((b) => {
        if (!b.alive) return
        const idx = board.zones.findIndex((z) => z.r === b.r && z.c === b.c)
        if (idx >= 0 && !zonesActive.includes(idx)) {
          flavaActivate(sess.id, user.id, idx, board.zones.length).then((s) => applyState(s))
        }
      })
      flavaSetBots(sess.id, newBots)
      setData((d) => (d ? { ...d, session: { ...d.session, bots: newBots } } : d))
      if (channelRef.current) broadcastFlava(channelRef.current)
    }, 500)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, session?.id, session?.statut, hostId, user.id])

  const move = useCallback((dr, dc) => {
    if (finished || burnedUntilRef.current > Date.now() || sessionRef.current?.statut !== 'active') return
    const cur = posRef.current
    if (!cur || !board) return
    const nr = cur.r + dr
    const nc = cur.c + dc
    const size = sessionRef.current.taille
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) return
    const next = { r: nr, c: nc }
    posRef.current = next
    setPos(next)
    const sid = sessionRef.current.id
    flavaMove(sid, user.id, nr, nc)
    if (channelRef.current) broadcastFlava(channelRef.current)
    // Zone atteinte → on l'active pour tout le monde.
    if (board.terrain[nr][nc] === ZONE) {
      const idx = board.zones.findIndex((z) => z.r === nr && z.c === nc)
      if (idx >= 0 && !(session?.zones_active || []).includes(idx)) {
        flavaActivate(sid, user.id, idx, board.zones.length).then((s) => {
          applyState(s)
          if (channelRef.current) broadcastFlava(channelRef.current)
        })
      }
    }
  }, [board, finished, session, user.id, applyState])

  const jump = useCallback(() => {
    if (finished || burnedUntilRef.current > Date.now()) return
    // Anti-triche : pas de re-saut tant qu'on est en l'air ou en recharge.
    if (airborneRef.current) return
    const t = Date.now()
    if (t < jumpReadyRef.current) return // en recharge
    // Prêt de nouveau après l'immunité (saut) + la recharge.
    jumpReadyRef.current = t + AIRBORNE_MS + JUMP_CD
    setJumpReadyAt(jumpReadyRef.current)
    airborneRef.current = true
    setAirborne(true)
    clearTimeout(landTimer.current)
    landTimer.current = setTimeout(() => {
      airborneRef.current = false
      setAirborne(false)
      setNow(Date.now())
    }, AIRBORNE_MS)
  }, [finished])

  // Clavier.
  useEffect(() => {
    const onKey = (e) => {
      switch (e.key) {
        case 'ArrowUp': case 'z': move(-1, 0); e.preventDefault(); break
        case 'ArrowDown': case 's': move(1, 0); e.preventDefault(); break
        case 'ArrowLeft': case 'q': move(0, -1); e.preventDefault(); break
        case 'ArrowRight': case 'd': move(0, 1); e.preventDefault(); break
        case ' ': case 'Spacebar': jump(); e.preventDefault(); break
        default: break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [move, jump])

  // Contrôles tactiles (mobile) : glisser-déplacer sur le plateau + bouton saut.
  const isTouch = useMemo(
    () => typeof window !== 'undefined' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0),
    [],
  )
  const stageRef = useRef(null)
  const dragRef = useRef({ x: 0, y: 0, ax: 0, ay: 0, cell: 48, last: 0 })

  const onBoardTouchStart = useCallback((e) => {
    const t = e.touches[0]
    if (!t) return
    const rect = stageRef.current?.getBoundingClientRect()
    const size = sessionRef.current?.taille || 8
    const cell = rect ? rect.width / size : 48
    dragRef.current = { x: t.clientX, y: t.clientY, ax: 0, ay: 0, cell, last: 0 }
  }, [])

  // Le perso avance UNE case dans la direction du glissement, à vitesse fixe
  // (max une case toutes les 200 ms) — on ignore la vitesse réelle du doigt.
  const onBoardTouchMove = useCallback((e) => {
    const t = e.touches[0]
    if (!t) return
    e.preventDefault()
    const d = dragRef.current
    d.ax += t.clientX - d.x
    d.ay += t.clientY - d.y
    d.x = t.clientX
    d.y = t.clientY
    const th = Math.max(18, d.cell * 0.7)
    if (Math.abs(d.ax) < th && Math.abs(d.ay) < th) return
    const tm = Date.now()
    if (tm - d.last < MOVE_THROTTLE_MS) return // vitesse fixe : 1 case / 200 ms
    if (Math.abs(d.ax) >= Math.abs(d.ay)) {
      move(0, d.ax > 0 ? 1 : -1)
    } else {
      move(d.ay > 0 ? 1 : -1, 0)
    }
    d.last = tm
    d.ax = 0
    d.ay = 0 // une seule case par pas
  }, [move])

  useEffect(() => {
    if (!isTouch) return
    const el = stageRef.current
    if (!el) return
    el.addEventListener('touchstart', onBoardTouchStart, { passive: false })
    el.addEventListener('touchmove', onBoardTouchMove, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onBoardTouchStart)
      el.removeEventListener('touchmove', onBoardTouchMove)
    }
  }, [isTouch, onBoardTouchStart, onBoardTouchMove])

  const leave = () => {
    const sid = sessionRef.current?.id
    if (sid) flavaLeave(sid, user.id)
    onBack()
  }

  const afterLobby = (s) => {
    applyState(s)
    if (channelRef.current) broadcastFlava(channelRef.current)
  }
  const startGame = () => {
    const sid = sessionRef.current?.id
    if (sid) flavaStart(sid, user.id).then(afterLobby)
  }
  const addBot = () => {
    const sid = sessionRef.current?.id
    if (sid) flavaAddBot(sid).then(afterLobby)
  }
  const removeBot = () => {
    const sid = sessionRef.current?.id
    if (sid) flavaRemoveBot(sid).then(afterLobby)
  }

  if (error) {
    return (
      <div className="flava">
        <Backdrop />
        <div className="flava__overlay">
          <div className="flava__panel">
            <h2 className="flava__panel-title">😕 Oups</h2>
            <p className="flava__panel-text">{error}</p>
            <div className="flava__panel-actions">
              <button className="flava__btn" onClick={onBack}>Retour</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session || !board) {
    return (
      <div className="flava">
        <Backdrop />
        <div className="flava__overlay">
          <div className="flava__panel">
            <h2 className="flava__panel-title">🌋 Connexion…</h2>
            <p className="flava__panel-text">On rejoint la partie commune…</p>
          </div>
        </div>
      </div>
    )
  }

  const size = session.taille
  const zonesActive = session.zones_active || []
  const zonesOn = zonesActive.length
  const zonesTotal = board.zones.length
  const others = players.filter((p) => p.user_id !== user.id)
  const burned = burnedUntil > now // moi, en train de brûler
  const burnSecs = burned ? Math.ceil((burnedUntil - now) / 1000) : 0
  const isBurned = (p) => p.burned_until && p.burned_until > now // autres joueurs
  const jumpCooling = !airborne && now < jumpReadyAt
  const jumpRemain = jumpCooling ? Math.ceil((jumpReadyAt - now) / 1000) : 0
  const jumpProgress = jumpCooling
    ? Math.min(1, Math.max(0, 1 - (jumpReadyAt - now) / JUMP_CD))
    : 1

  // ----- Salle d'attente multijoueur -----
  if (session.statut === 'waiting') {
    const total = players.length + bots.length
    return (
      <div className="flava">
        <Backdrop />
        <header className="flava__top">
          <button className="flava__back" onClick={leave}>⬅️ Quitter</button>
          <span className="flava__level-hud">👥 Multijoueur</span>
        </header>
        <h1 className="flava__title">Floor is Lava 👥</h1>
        <p className="flava__hint">Salle d'attente — minimum 2 joueurs (humains + bots).</p>
        <div className="flava__lobby">
          {players.map((p) => (
            <div key={p.user_id} className="flava__lobby-player">
              <FallGuy avatar={p.avatar} role={p.role} className="flava__lobby-av" anim="idle" />
              <span className="flava__lobby-name">{p.pseudo}{p.user_id === user.id ? ' (toi)' : ''}</span>
            </div>
          ))}
          {bots.map((b) => (
            <div key={b.id} className="flava__lobby-player flava__lobby-player--bot">
              <FallGuy avatar={b.avatar} className="flava__lobby-av" anim="idle" />
              <span className="flava__lobby-name">{b.pseudo}</span>
            </div>
          ))}
        </div>
        <p className="flava__count">{total} joueur(s) · plateau {size}×{size}</p>
        <div className="flava__lobby-btns">
          <button className="flava__btn flava__btn--ghost" disabled={total >= 6} onClick={addBot}>🤖 Ajouter un bot</button>
          {bots.length > 0 && (
            <button className="flava__btn flava__btn--ghost" onClick={removeBot}>❌ Retirer un bot</button>
          )}
        </div>
        <button className="flava__btn flava__lobby-start" disabled={total < 2} onClick={startGame}>
          {total < 2 ? 'En attente de joueurs…' : 'Démarrer la partie 🚀'}
        </button>
      </div>
    )
  }

  return (
    <div className={`flava ${finished ? 'flava--victory' : ''}`} style={{ '--lava-level': submerge }}>
      <Backdrop />
      <header className="flava__top">
        <button className="flava__back flava-submerge" onClick={leave}>⬅️ Quitter</button>
        <div className="flava__hud">
          <span className="flava__level-hud">👥 {players.length} joueur{players.length > 1 ? 's' : ''}</span>
          <span className="flava__zones-hud">Zones : {zonesOn}/{zonesTotal}</span>
        </div>
      </header>

      <h1 className="flava__title">Floor is Lava 👥</h1>
      <p className="flava__hint">
        Partie commune ! Activez ensemble les <strong>{zonesTotal} zones</strong>.
        {' '}Touché par la lave&nbsp;? Tu brûles 5&nbsp;s puis tu revis 🔥
      </p>

      <div
        ref={stageRef}
        className={`flava__stage ${isTouch ? 'flava__stage--touch' : ''}`}
        style={{ '--size': size }}
      >
        <div className="flava__board">
          {board.terrain.map((row, r) =>
            row.map((cell, c) => {
              const onLava = isLavaCell(lava, r, c)
              const isZone = cell === ZONE
              const zoneIdx = isZone ? board.zones.findIndex((z) => z.r === r && z.c === c) : -1
              const zoneActive = zoneIdx >= 0 && zonesActive.includes(zoneIdx)
              let cls = 'flava__tile'
              if (onLava) cls += ' flava__tile--lava'
              else if (cell === ROCK) cls += ' flava__tile--rock'
              else if (isZone) cls += zoneActive ? ' flava__tile--zone-on' : ' flava__tile--zone'
              return (
                <div key={`${r}-${c}`} className={cls}>
                  {cell === ROCK && !onLava && <span className="flava__rock">🪨</span>}
                  {isZone && zoneActive && <span className="flava__check">✅</span>}
                  {onLava && <span className="flava__bubble" />}
                </div>
              )
            }),
          )}
        </div>

        {/* Avatars de tous les joueurs (le mien + les autres + les bots, temps réel) */}
        <div className="flava__grid-overlay">
          {others.map((p) => (
            <div
              key={p.user_id}
              className={`flava__player flava__player--other ${isWide(p.avatar) ? 'flava__player--wide' : ''} ${isBurned(p) ? 'flava__player--burned' : ''}`}
              style={{ gridColumn: p.c + 1, gridRow: p.r + 1 }}
            >
              <span className="flava__player-shadow flava__player-shadow--other" />
              <div className="flava__avatar">
                <FallGuy avatar={p.avatar} role={p.role} anim={p.alive ? 'idle' : null} />
              </div>
              {isBurned(p) && <span className="flava__flames">🔥</span>}
              <span className="flava__player-name">{p.pseudo}</span>
            </div>
          ))}

          {bots.map((b) => (
            <div
              key={b.id}
              className={`flava__player flava__player--other flava__player--bot ${b.alive ? '' : 'flava__player--dead'}`}
              style={{ gridColumn: b.c + 1, gridRow: b.r + 1 }}
            >
              <span className="flava__player-shadow flava__player-shadow--other" />
              <div className="flava__avatar">
                <FallGuy avatar={b.avatar} anim={b.alive ? 'idle' : null} />
              </div>
              <span className="flava__player-name">{b.pseudo}</span>
            </div>
          ))}

          {pos && (
            <div
              className={`flava__player ${airborne ? 'flava__player--air' : ''} ${isWide(user.avatar) ? 'flava__player--wide' : ''} ${burned ? 'flava__player--burned' : ''}`}
              style={{ gridColumn: pos.c + 1, gridRow: pos.r + 1 }}
            >
              <span className="flava__player-shadow" />
              <span className="flava__player-aura" />
              {!burned && <span className="flava__player-arrow" />}
              {/* Barre d'immunité du saut (se vide pendant le saut) */}
              {airborne && (
                <span className="flava__jumpbar">
                  <span className="flava__jumpbar-fill" style={{ animationDuration: `${AIRBORNE_MS}ms` }} />
                </span>
              )}
              <div className="flava__avatar">
                <FallGuy avatar={user?.avatar} role={user?.role} anim={airborne ? 'jump' : 'idle'} />
              </div>
              {burned && <span className="flava__flames">🔥</span>}
            </div>
          )}
        </div>
      </div>

      {/* Commande tactile (mobile) : gros bouton de saut fixé à droite.
          Le déplacement se fait en glissant le doigt sur le plateau. */}
      {isTouch && !finished && (
        <button
          className={`flava__jump-fab flava-submerge ${jumpCooling ? 'flava__jump-fab--cd' : ''}`}
          onClick={jump}
          disabled={airborne || jumpCooling || burned}
          aria-label="Sauter"
        >
          {jumpCooling ? (
            <>
              <span className="flava__jump-fab-num">{jumpRemain}s</span>
              <span className="flava__jump-fab-prog">
                <span className="flava__jump-fab-prog-fill" style={{ width: `${jumpProgress * 100}%` }} />
              </span>
            </>
          ) : (
            <>
              <span className="flava__jump-fab-arrow">⬆</span>
              SAUT
            </>
          )}
        </button>
      )}

      {/* Fin de partie commune */}
      {finished && session.resultat === 'win' && (
        <div className="flava__overlay">
          <div className="flava__panel flava__panel--win">
            <h2 className="flava__panel-title">🎉 Victoire commune !</h2>
            <FallGuy className="flava__win-buddy" avatar={user?.avatar} role={user?.role} anim="jump" />
            <p className="flava__panel-text">
              Toutes les zones sont activées&nbsp;!{' '}
              {myAlive
                ? 'Bravo, vous avez réussi&nbsp;!'
                : 'Dommage, tu avais été éliminé — mais l\'équipe a réussi&nbsp;!'}
            </p>
            <div className="flava__panel-actions">
              <button className="flava__btn" onClick={onBack}>Choisir un mode</button>
              <button className="flava__btn flava__btn--ghost" onClick={() => navigate('/dashboard')}>Retour</button>
            </div>
          </div>
        </div>
      )}

      {finished && session.resultat === 'lose' && (
        <div className="flava__overlay">
          <div className="flava__panel">
            <h2 className="flava__panel-title">🌋 Tous éliminés…</h2>
            <p className="flava__panel-text">
              Toute l'équipe est tombée dans la lave ! Réessayez ensemble, vous allez y arriver 💪
            </p>
            <div className="flava__panel-actions">
              <button className="flava__btn" onClick={onBack}>Rejouer</button>
              <button className="flava__btn flava__btn--ghost" onClick={() => navigate('/dashboard')}>Retour</button>
            </div>
          </div>
        </div>
      )}

      {/* Brûlé : on ne meurt pas, on revit dans quelques secondes */}
      {!finished && burned && (
        <div className="flava__spectate flava__spectate--burn">🔥 Brûlé ! Tu revis dans {burnSecs}s…</div>
      )}
    </div>
  )
}
