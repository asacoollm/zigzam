import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  ROCK, ZONE, buildBoard, lavaAtTick, multiTick, isLavaCell,
  flavaJoin, flavaState, flavaMove, flavaActivate, flavaEliminate, flavaLeave,
  subscribeFlava, broadcastFlava,
} from '../lib/flavaMulti'
import { normalizeAvatar } from '../lib/avatar'
import { animalWide } from '../components/avatarParts'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'

const AIRBORNE_MS = 1500
const JUMP_CD = 800

// Un avatar est-il « large » (animal terrestre) → recentrage spécifique.
function isWide(avatar) {
  const a = avatar ? normalizeAvatar(avatar) : null
  return !!(a?.animal && animalWide(a.animal))
}

export default function FloorMulti({ onBack }) {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState(null)     // { session, players }
  const [pos, setPos] = useState(null)       // ma position { r, c } (locale, réactive)
  const [airborne, setAirborne] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [error, setError] = useState('')

  const channelRef = useRef(null)
  const airborneRef = useRef(false)
  const jumpReadyRef = useRef(0)
  const landTimer = useRef(null)
  const posRef = useRef(null)
  const eliminatedRef = useRef(false)
  const sessionRef = useRef(null)

  const session = data?.session || null
  const players = data?.players || []
  const me = players.find((p) => p.user_id === user.id) || null
  const myAlive = me ? me.alive : true
  const finished = session?.statut === 'finished'

  // Plateau déterministe dérivé du seed + taille.
  const board = useMemo(() => {
    if (!session) return null
    return buildBoard(session.taille, session.seed)
  }, [session?.taille, session?.seed]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lave courante (déterministe, synchronisée par started_at).
  const lava = useMemo(() => {
    if (!session || !board) return null
    const T = multiTick(session.started_at, now)
    return lavaAtTick(session.taille, session.seed, board.terrain, T)
  }, [session?.taille, session?.seed, session?.started_at, board, now]) // eslint-disable-line react-hooks/exhaustive-deps

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
    const mine = st.players.find((p) => p.user_id === user.id)
    // On adopte la position serveur seulement si on n'en a pas encore localement.
    if (mine && !posRef.current) {
      posRef.current = { r: mine.r, c: mine.c }
      setPos({ r: mine.r, c: mine.c })
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

  // Détection d'élimination : sur la lave, pas en l'air, encore vivant.
  useEffect(() => {
    if (!lava || !pos || finished || eliminatedRef.current || !myAlive) return
    if (isLavaCell(lava, pos.r, pos.c) && !airborneRef.current) {
      eliminatedRef.current = true
      const sid = sessionRef.current?.id
      if (sid) flavaEliminate(sid, user.id).then((s) => {
        applyState(s)
        if (channelRef.current) broadcastFlava(channelRef.current)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lava, pos, finished, myAlive])

  // Crédite les donuts gagnés (victoire commune) une seule fois.
  const wonRef = useRef(false)
  useEffect(() => {
    if (finished && session?.resultat === 'win' && myAlive && !wonRef.current) {
      wonRef.current = true
      updateUser({ donuts: user.donuts + 6 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, session?.resultat])

  const move = useCallback((dr, dc) => {
    if (finished || eliminatedRef.current) return
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
    if (finished || eliminatedRef.current) return
    const now = Date.now()
    if (now < jumpReadyRef.current) return
    jumpReadyRef.current = now + JUMP_CD
    airborneRef.current = true
    setAirborne(true)
    clearTimeout(landTimer.current)
    landTimer.current = setTimeout(() => {
      airborneRef.current = false
      setAirborne(false)
      setNow(Date.now()) // force une réévaluation d'élimination à l'atterrissage
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

  const leave = () => {
    const sid = sessionRef.current?.id
    if (sid) flavaLeave(sid, user.id)
    onBack()
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
  const aliveCount = players.filter((p) => p.alive).length
  const others = players.filter((p) => p.user_id !== user.id)

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
        {!myAlive && ' Tu es éliminé — encourage les survivants ! 👀'}
      </p>

      <div className="flava__stage" style={{ '--size': size }}>
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

        {/* Avatars de tous les joueurs (le mien + les autres, temps réel) */}
        <div className="flava__grid-overlay">
          {others.map((p) => (
            <div
              key={p.user_id}
              className={`flava__player flava__player--other ${isWide(p.avatar) ? 'flava__player--wide' : ''} ${p.alive ? '' : 'flava__player--dead'}`}
              style={{ gridColumn: p.c + 1, gridRow: p.r + 1 }}
            >
              <span className="flava__player-shadow flava__player-shadow--other" />
              <FallGuy avatar={p.avatar} role={p.role} anim={p.alive ? 'idle' : null} />
              <span className="flava__player-name">{p.pseudo}</span>
            </div>
          ))}

          {pos && (
            <div
              className={`flava__player ${airborne ? 'flava__player--air' : ''} ${isWide(user.avatar) ? 'flava__player--wide' : ''} ${myAlive ? '' : 'flava__player--dead'}`}
              style={{ gridColumn: pos.c + 1, gridRow: pos.r + 1 }}
            >
              <span className="flava__player-shadow" />
              <span className="flava__player-aura" />
              <span className="flava__player-arrow" />
              <FallGuy avatar={user?.avatar} role={user?.role} anim={airborne ? 'jump' : 'idle'} />
            </div>
          )}
        </div>
      </div>

      {/* Commandes tactiles */}
      <div className="flava__pad" aria-hidden="true">
        <div className="flava__dpad">
          <button className="flava__key flava-submerge flava__key--up" onClick={() => move(-1, 0)}>▲</button>
          <button className="flava__key flava-submerge flava__key--left" onClick={() => move(0, -1)}>◀</button>
          <button className="flava__key flava-submerge flava__key--right" onClick={() => move(0, 1)}>▶</button>
          <button className="flava__key flava-submerge flava__key--down" onClick={() => move(1, 0)}>▼</button>
        </div>
        <button className="flava__jump flava-submerge" onClick={jump}>SAUT<br />⤴</button>
      </div>

      {/* Fin de partie commune */}
      {finished && session.resultat === 'win' && (
        <div className="flava__overlay">
          <div className="flava__panel flava__panel--win">
            <h2 className="flava__panel-title">🎉 Victoire commune !</h2>
            <FallGuy className="flava__win-buddy" avatar={user?.avatar} role={user?.role} anim="jump" />
            <p className="flava__panel-text">
              Toutes les zones sont activées&nbsp;!{' '}
              {myAlive
                ? <>Tu gagnes <strong>6 🍩</strong> donuts&nbsp;!</>
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

      {/* Éliminé mais la partie continue : mode spectateur */}
      {!finished && !myAlive && (
        <div className="flava__spectate">👀 Mode spectateur — survivants : {aliveCount}</div>
      )}
    </div>
  )
}
