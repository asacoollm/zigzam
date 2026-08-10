import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  ROCK, TICK_MS, LAVA_DELAY_MS, buildVsBoard, cellIndex, lavaAtTick, isLavaCell, emptyLavaGrid,
  vsBotConfig, vsBotStep,
  flavaVsJoinOrCreate, flavaVsCreateBot, flavaVsState, flavaVsMove, flavaVsBotMove,
  flavaVsActivate, flavaVsBotActivate, flavaVsLeave,
  subscribeFlavaVs, broadcastFlavaVs,
} from '../lib/flavaVs'
import { normalizeAvatar } from '../lib/avatar'
import { animalWide } from '../components/avatarParts'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'

const AIRBORNE_MS = 1000
const JUMP_CD = 1000
const MOVE_THROTTLE_MS = 200
const NIVEAUX = [1, 2, 3, 4, 5, 6, 7, 8, 9]

function isWide(avatar) {
  const a = avatar ? normalizeAvatar(avatar) : null
  return !!(a?.animal && animalWide(a.animal))
}

export default function FloorVs({ onBack }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('choix') // 'choix' | 'attente' | 'jeu'
  const [botNiveau, setBotNiveau] = useState(5)
  const [busy, setBusy] = useState(false)

  const [data, setData] = useState(null) // { session, players }
  const [pos, setPos] = useState(null)
  const [airborne, setAirborne] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [activeAt, setActiveAt] = useState(null)
  const [jumpReadyAt, setJumpReadyAt] = useState(0)
  const [error, setError] = useState('')

  const channelRef = useRef(null)
  const airborneRef = useRef(false)
  const jumpReadyRef = useRef(0)
  const landTimer = useRef(null)
  const posRef = useRef(null)
  const sessionRef = useRef(null)
  const activeAtRef = useRef(null)
  const dataRef = useRef(null)
  const activatedRef = useRef(new Set())

  const session = data?.session || null
  const players = data?.players || []
  const me = players.find((p) => p.user_id === user.id) || null
  const opponent = players.find((p) => p !== me) || null
  const myEquipe = me?.equipe || 'bleu'
  const finished = session?.statut === 'termine'

  const board = useMemo(() => {
    if (!session) return null
    return buildVsBoard(session.taille, session.seed)
  }, [session?.taille, session?.seed]) // eslint-disable-line react-hooks/exhaustive-deps

  const activated = useMemo(() => new Set(session?.cases_activees || []), [session?.cases_activees])
  useEffect(() => { dataRef.current = data }, [data])
  useEffect(() => { activatedRef.current = activated }, [activated])

  const lava = useMemo(() => {
    if (!session || !board) return null
    if (session.statut !== 'active' || !activeAt) return emptyLavaGrid(session.taille)
    const elapsed = now - activeAt
    if (elapsed < LAVA_DELAY_MS) return emptyLavaGrid(session.taille)
    const T = Math.floor((elapsed - LAVA_DELAY_MS) / TICK_MS)
    return lavaAtTick(session.taille, session.seed, board.terrain, T)
  }, [session?.statut, session?.taille, session?.seed, board, now, activeAt]) // eslint-disable-line react-hooks/exhaustive-deps

  const secondesRestantes = useMemo(() => {
    if (!session?.started_at || session.statut !== 'active') return session?.duree_s ?? 60
    const elapsed = (now - session.started_at) / 1000
    return Math.max(0, Math.ceil(session.duree_s - elapsed))
  }, [session, now])

  const applyState = useCallback((st) => {
    if (!st || st.error) { setError('Connexion à la partie impossible. Réessaie !'); return }
    setData(st)
    sessionRef.current = st.session
    if (st.session.statut === 'active') {
      if (!activeAtRef.current) {
        const t = Date.now()
        activeAtRef.current = t
        setActiveAt(t)
      }
      setPhase('jeu')
    } else if (st.session.statut === 'attente') {
      setPhase('attente')
    } else {
      setPhase('jeu') // 'termine' → on reste sur l'écran de jeu pour afficher le résultat
    }
    const mine = st.players.find((p) => p.user_id === user.id)
    if (mine && !posRef.current) {
      posRef.current = { r: mine.r, c: mine.c }
      setPos({ r: mine.r, c: mine.c })
    }
  }, [user.id])

  const startVsHuman = () => {
    setBusy(true)
    setError('')
    flavaVsJoinOrCreate(user.id).then((st) => {
      setBusy(false)
      applyState(st)
      if (st?.session) {
        const ch = subscribeFlavaVs(st.session.id, () => {
          flavaVsState(st.session.id, user.id).then((s) => applyState(s))
        })
        channelRef.current = ch
      }
    })
  }

  const startVsBot = () => {
    setBusy(true)
    setError('')
    flavaVsCreateBot(user.id, botNiveau).then((st) => {
      setBusy(false)
      applyState(st)
      if (st?.session) {
        const ch = subscribeFlavaVs(st.session.id, () => {
          flavaVsState(st.session.id, user.id).then((s) => applyState(s))
        })
        channelRef.current = ch
      }
    })
  }

  // Heartbeat + horloge de la lave, une fois la partie créée.
  useEffect(() => {
    if (phase === 'choix') return
    const lavaTimer = setInterval(() => setNow(Date.now()), 250)
    const beat = setInterval(() => {
      const sid = sessionRef.current?.id
      if (sid) flavaVsState(sid, user.id).then((s) => applyState(s))
    }, 3000)
    return () => { clearInterval(lavaTimer); clearInterval(beat) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // À la fin du chrono local, on interroge le serveur tout de suite (au lieu
  // d'attendre le prochain battement) pour afficher le résultat sans délai.
  const finishPolledRef = useRef(false)
  useEffect(() => {
    if (session?.statut === 'active' && secondesRestantes === 0 && !finishPolledRef.current) {
      finishPolledRef.current = true
      const sid = sessionRef.current?.id
      if (sid) flavaVsState(sid, user.id).then((s) => applyState(s))
    }
    if (session?.statut !== 'active') finishPolledRef.current = false
  }, [secondesRestantes, session?.statut, user.id, applyState])

  // Pilote le bot (toujours ce client, puisqu'il n'y a qu'un humain en VS-bot).
  useEffect(() => {
    if (!board || !session?.contre_bot || session.statut !== 'active') return
    const botPlayer = players.find((p) => p.is_bot)
    if (!botPlayer) return
    const { stepMs, jitter } = vsBotConfig(session.bot_niveau)
    const id = setInterval(() => {
      const sess = sessionRef.current
      if (!sess || sess.statut !== 'active') return
      const elapsed = activeAtRef.current ? Date.now() - activeAtRef.current : 0
      const lavaNow = elapsed < LAVA_DELAY_MS
        ? emptyLavaGrid(sess.taille)
        : lavaAtTick(sess.taille, sess.seed, board.terrain, Math.floor((elapsed - LAVA_DELAY_MS) / TICK_MS))
      const bot = (dataRef.current?.players || []).find((p) => p.is_bot)
      if (!bot) return
      // Lave sous les pieds → retour au coin de départ (comme le joueur).
      const next = isLavaCell(lavaNow, bot.r, bot.c)
        ? board.startRose
        : vsBotStep(board, lavaNow, bot, activatedRef.current, sess.taille, jitter)
      if (next.r !== bot.r || next.c !== bot.c) {
        // Optimiste en local (flava_vs_bot_move ne renvoie pas l'état complet).
        setData((d) => (d
          ? { ...d, players: d.players.map((p) => (p.is_bot ? { ...p, r: next.r, c: next.c } : p)) }
          : d))
        flavaVsBotMove(sess.id, next.r, next.c)
        if (board.teams[next.r][next.c] === 'rose') {
          const idx = cellIndex(sess.taille, next.r, next.c)
          if (!activatedRef.current.has(idx)) {
            flavaVsBotActivate(sess.id, idx).then((s) => applyState(s))
          }
        }
        if (channelRef.current) broadcastFlavaVs(channelRef.current)
      }
    }, stepMs)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, session?.contre_bot, session?.statut, session?.bot_niveau, session?.id, players.length])

  const move = useCallback((dr, dc) => {
    const sess = sessionRef.current
    if (finished || !sess || sess.statut !== 'active') return
    const cur = posRef.current
    if (!cur || !board) return
    const nr = cur.r + dr
    const nc = cur.c + dc
    const size = sess.taille
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) return
    if (board.terrain[nr][nc] === ROCK) return
    const next = { r: nr, c: nc }
    posRef.current = next
    setPos(next)
    flavaVsMove(sess.id, user.id, nr, nc)
    if (channelRef.current) broadcastFlavaVs(channelRef.current)

    // Sur de la lave (pas en l'air) → retour au coin de départ.
    if (isLavaCell(lava, nr, nc) && !airborneRef.current) {
      const home = myEquipe === 'bleu' ? board.startBleu : board.startRose
      posRef.current = home
      setPos(home)
      flavaVsMove(sess.id, user.id, home.r, home.c)
      return
    }

    // Case de sa propre couleur, pas encore activée.
    if (board.teams[nr][nc] === myEquipe) {
      const idx = cellIndex(size, nr, nc)
      if (!activated.has(idx)) {
        flavaVsActivate(sess.id, user.id, idx).then((s) => {
          applyState(s)
          if (channelRef.current) broadcastFlavaVs(channelRef.current)
        })
      }
    }
  }, [board, finished, lava, myEquipe, activated, user.id, applyState])

  const jump = useCallback(() => {
    if (finished || airborneRef.current) return
    const t = Date.now()
    if (t < jumpReadyRef.current) return
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
    if (tm - d.last < MOVE_THROTTLE_MS) return
    if (Math.abs(d.ax) >= Math.abs(d.ay)) move(0, d.ax > 0 ? 1 : -1)
    else move(d.ay > 0 ? 1 : -1, 0)
    d.last = tm
    d.ax = 0
    d.ay = 0
  }, [move])
  useEffect(() => {
    if (!isTouch || phase !== 'jeu') return
    const el = stageRef.current
    if (!el) return
    el.addEventListener('touchstart', onBoardTouchStart, { passive: false })
    el.addEventListener('touchmove', onBoardTouchMove, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onBoardTouchStart)
      el.removeEventListener('touchmove', onBoardTouchMove)
    }
  }, [isTouch, phase, onBoardTouchStart, onBoardTouchMove])

  const leave = () => {
    const sid = sessionRef.current?.id
    if (sid) flavaVsLeave(sid, user.id)
    if (channelRef.current) channelRef.current.unsubscribe()
    onBack()
  }

  useEffect(() => () => {
    clearTimeout(landTimer.current)
    if (channelRef.current) channelRef.current.unsubscribe()
  }, [])

  const jumpCooling = !airborne && now < jumpReadyAt
  const jumpRemain = jumpCooling ? Math.ceil((jumpReadyAt - now) / 1000) : 0
  const jumpProgress = jumpCooling ? Math.min(1, Math.max(0, 1 - (jumpReadyAt - now) / JUMP_CD)) : 1

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

  // ----- Écran de choix : contre un bot (niveau) ou contre un humain -----
  if (phase === 'choix') {
    return (
      <div className="flava">
        <Backdrop />
        <header className="flava__top">
          <button className="flava__back" onClick={onBack}>⬅️ Retour</button>
          <span className="flava__level-hud">⚔️ VS</span>
        </header>
        <h1 className="flava__title">Floor is Lava ⚔️</h1>
        <p className="flava__hint">
          Plateau divisé en cases 🔵 bleues et 🩷 roses. Active toutes les tiennes en 60 secondes !
        </p>

        <div className="flava__vs-choice">
          <div className="flava__vs-card">
            <h3 className="flava__vs-card-title">🤖 Contre un bot</h3>
            <p className="flava__vs-card-desc">Choisis son niveau, de 1 (débutant) à 9 (imbattable).</p>
            <div className="flava__vs-levels">
              {NIVEAUX.map((n) => (
                <button
                  key={n}
                  className={`flava__vs-level ${botNiveau === n ? 'flava__vs-level--on' : ''}`}
                  onClick={() => setBotNiveau(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <button className="flava__btn" disabled={busy} onClick={startVsBot}>
              {busy ? 'Préparation…' : `Jouer contre le niveau ${botNiveau} 🚀`}
            </button>
          </div>

          <div className="flava__vs-card">
            <h3 className="flava__vs-card-title">👤 Contre un joueur</h3>
            <p className="flava__vs-card-desc">On te trouve un adversaire, ou on t'ajoute à la file d'attente.</p>
            <button className="flava__btn flava__btn--ghost" disabled={busy} onClick={startVsHuman}>
              {busy ? 'Recherche…' : 'Chercher un adversaire 🔎'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ----- Salle d'attente (VS humain, personne d'autre encore) -----
  if (phase === 'attente' || !session || !board) {
    return (
      <div className="flava">
        <Backdrop />
        <header className="flava__top">
          <button className="flava__back" onClick={leave}>⬅️ Quitter</button>
          <span className="flava__level-hud">⚔️ VS</span>
        </header>
        <div className="flava__overlay">
          <div className="flava__panel">
            <h2 className="flava__panel-title">⏳ En attente d'un adversaire…</h2>
            <FallGuy className="flava__win-buddy" avatar={user?.avatar} role={user?.role} anim="idle" />
            <p className="flava__panel-text">La partie démarre dès qu'un autre joueur te rejoint !</p>
            <div className="flava__panel-actions">
              <button className="flava__btn flava__btn--ghost" onClick={leave}>Annuler</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const size = session.taille
  const scoreBleu = players.find((p) => p.equipe === 'bleu')?.score ?? 0
  const scoreRose = players.find((p) => p.equipe === 'rose')?.score ?? 0
  const gagnant = session.resultat?.gagnant

  return (
    <div className="flava">
      <Backdrop />
      <header className="flava__top">
        <button className="flava__back" onClick={leave}>⬅️ Quitter</button>
        <div className="flava__hud">
          <span className="flava__vs-timer">⏱️ {secondesRestantes}s</span>
        </div>
      </header>

      <h1 className="flava__title">Floor is Lava ⚔️</h1>
      <div className="flava__vs-score">
        <span className="flava__vs-score-chip flava__vs-score-chip--bleu">🔵 Bleu : {scoreBleu}</span>
        <span className="flava__vs-score-chip flava__vs-score-chip--rose">🩷 Rose : {scoreRose}</span>
      </div>

      <div
        ref={stageRef}
        className={`flava__stage ${isTouch ? 'flava__stage--touch' : ''}`}
        style={{ '--size': size }}
      >
        <div className="flava__board">
          {board.terrain.map((row, r) =>
            row.map((cell, c) => {
              const onLava = isLavaCell(lava, r, c)
              const idx = cellIndex(size, r, c)
              const team = cell === ROCK ? null : board.teams[r][c]
              const isOn = activated.has(idx)
              let cls = 'flava__tile'
              if (onLava) cls += ' flava__tile--lava'
              else if (cell === ROCK) cls += ' flava__tile--rock'
              else if (team === 'bleu') cls += isOn ? ' flava__tile--bleu-on' : ' flava__tile--bleu'
              else if (team === 'rose') cls += isOn ? ' flava__tile--rose-on' : ' flava__tile--rose'
              return (
                <div key={`${r}-${c}`} className={cls}>
                  {cell === ROCK && !onLava && <span className="flava__rock">🪨</span>}
                  {isOn && <span className="flava__check">✅</span>}
                  {onLava && <span className="flava__bubble" />}
                </div>
              )
            }),
          )}
        </div>

        <div className="flava__grid-overlay">
          {opponent && (
            <div
              className={`flava__player flava__player--other ${isWide(opponent.avatar) ? 'flava__player--wide' : ''}`}
              style={{ gridColumn: opponent.c + 1, gridRow: opponent.r + 1 }}
            >
              <span className={`flava__player-shadow flava__player-shadow--other flava__player-shadow--${opponent.equipe}`} />
              <div className="flava__avatar">
                <FallGuy avatar={opponent.avatar} role={opponent.role} anim="idle" />
              </div>
              <span className="flava__player-name">{opponent.pseudo}</span>
            </div>
          )}

          {pos && (
            <div
              className={`flava__player ${airborne ? 'flava__player--air' : ''} ${isWide(user.avatar) ? 'flava__player--wide' : ''}`}
              style={{ gridColumn: pos.c + 1, gridRow: pos.r + 1 }}
            >
              <span className={`flava__player-shadow flava__player-shadow--${myEquipe}`} />
              <span className="flava__player-aura" />
              <span className="flava__player-arrow" />
              {airborne && (
                <span className="flava__jumpbar">
                  <span className="flava__jumpbar-fill" style={{ animationDuration: `${AIRBORNE_MS}ms` }} />
                </span>
              )}
              <div className="flava__avatar">
                <FallGuy avatar={user?.avatar} role={user?.role} anim={airborne ? 'jump' : 'idle'} />
              </div>
            </div>
          )}
        </div>
      </div>

      {isTouch && !finished && (
        <button
          className={`flava__jump-fab ${jumpCooling ? 'flava__jump-fab--cd' : ''}`}
          onClick={jump}
          disabled={airborne || jumpCooling}
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

      {finished && (
        <div className="flava__overlay">
          <div className={`flava__panel ${gagnant === myEquipe ? 'flava__panel--win' : ''}`}>
            <h2 className="flava__panel-title">
              {gagnant === 'egalite' ? '🤝 Égalité !' : gagnant === myEquipe ? '🎉 Victoire !' : '😅 Défaite'}
            </h2>
            {gagnant === myEquipe && (
              <FallGuy className="flava__win-buddy" avatar={user?.avatar} role={user?.role} anim="jump" />
            )}
            <p className="flava__panel-text">
              🔵 Bleu : {scoreBleu} — 🩷 Rose : {scoreRose}
              <br />
              {gagnant === 'egalite'
                ? 'Vous avez fait match nul — 1 🍩 chacun !'
                : gagnant === myEquipe
                  ? 'Tu as activé le plus de cases — bravo, +2 🍩 !'
                  : 'Ton adversaire a activé plus de cases. Retente ta chance !'}
            </p>
            <div className="flava__panel-actions">
              <button className="flava__btn" onClick={() => { setData(null); posRef.current = null; setPos(null); activeAtRef.current = null; setActiveAt(null); setPhase('choix') }}>
                Rejouer
              </button>
              <button className="flava__btn flava__btn--ghost" onClick={() => navigate('/dashboard')}>Retour</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
