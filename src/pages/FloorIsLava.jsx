import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getFlavaLevel, flavaWin } from '../lib/modules'
import {
  SIZE, ROCK, ZONE, makeLevel, stepLava, isLava, inBoard,
} from '../lib/floorislava'
import { normalizeAvatar } from '../lib/avatar'
import { animalWide } from '../components/avatarParts'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'
import ZigzamLogo from '../components/ZigzamLogo'
import FloorMulti from './FloorMulti'
import './FloorIsLava.css'

const AIRBORNE_MS = 1500  // durée du saut (immunité à la lave en l'air) ~1,5 s
const JUMP_CD = 800       // temps de recharge du saut

// Confettis de victoire (positions/couleurs déterministes).
const CONFETTI_COLORS = ['#ff4d8d', '#ff8c42', '#fbbf24', '#3dd68c', '#00bfff', '#7c3aff']
const CONFETTI = Array.from({ length: 20 }, (_, i) => ({
  left: (5 + i * 4.8) % 96,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: (i % 7) * 0.12,
  dur: 1.7 + (i % 4) * 0.35,
  size: 7 + (i % 3) * 3,
}))

// Mort si le joueur est sur de la lave et pas en l'air.
function resolve(state, airborne) {
  if (isLava(state.lava, state.player.r, state.player.c) && !airborne) {
    return { ...state, status: 'lost' }
  }
  return state
}

function reducer(state, action) {
  if (action.type === 'NEW_GAME') return makeLevel(action.level)
  if (state.status !== 'playing') return state

  switch (action.type) {
    case 'MOVE': {
      const nr = state.player.r + action.dr
      const nc = state.player.c + action.dc
      if (!inBoard(nr, nc)) return state
      const player = { r: nr, c: nc }
      const zones = state.zones.map((z) => (z.r === nr && z.c === nc ? { ...z, active: true } : z))
      let next = { ...state, player, zones }
      next = resolve(next, action.airborne)
      if (next.status === 'playing' && zones.every((z) => z.active)) next.status = 'won'
      return next
    }
    case 'TICK': {
      const { lava, waves, cooldown } = stepLava(state)
      return resolve({ ...state, lava, waves, cooldown, ticks: state.ticks + 1 }, action.airborne)
    }
    case 'LAND':
      return resolve(state, false)
    default:
      return state
  }
}

export default function FloorIsLava() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState(null)          // null (choix) | 'solo' | 'multi'
  const [state, dispatch] = useReducer(reducer, 1, makeLevel)
  const [airborne, setAirborne] = useState(false)
  const [started, setStarted] = useState(false)   // écran d'intro tant que false
  const [loadedLevel, setLoadedLevel] = useState(1) // niveau sauvegardé (Supabase)

  // Refs pour les handlers (évite les closures périmées).
  const airborneRef = useRef(false)
  const jumpReadyRef = useRef(0)
  const playingRef = useRef(false)
  const landTimer = useRef(null)
  const awardedRef = useRef(0) // niveau déjà sauvegardé (anti-double appel)
  useEffect(() => { playingRef.current = started && state.status === 'playing' }, [started, state.status])

  // Charge le niveau sauvegardé au montage (le joueur reprend où il en était).
  useEffect(() => {
    let on = true
    getFlavaLevel(user.id).then((lv) => { if (on) setLoadedLevel(lv) })
    return () => { on = false }
  }, [user.id])

  // Sauvegarde le niveau atteint à chaque victoire, une seule fois par niveau.
  useEffect(() => {
    if (!started || state.status !== 'won' || awardedRef.current === state.level) return
    awardedRef.current = state.level
    flavaWin(user.id, state.level).then((res) => {
      if (res.ok) setLoadedLevel((lv) => Math.max(lv, res.niveau))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, state.status, state.level])

  const move = useCallback((dr, dc) => {
    if (!playingRef.current) return
    dispatch({ type: 'MOVE', dr, dc, airborne: airborneRef.current })
  }, [])

  const jump = useCallback(() => {
    if (!playingRef.current) return
    const now = Date.now()
    if (now < jumpReadyRef.current) return
    jumpReadyRef.current = now + JUMP_CD
    airborneRef.current = true
    setAirborne(true)
    clearTimeout(landTimer.current)
    landTimer.current = setTimeout(() => {
      airborneRef.current = false
      setAirborne(false)
      dispatch({ type: 'LAND' })
    }, AIRBORNE_MS)
  }, [])

  // Détection d'un appareil tactile → contrôles au doigt (glisser + bouton saut).
  const isTouch = useMemo(
    () => typeof window !== 'undefined' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0),
    [],
  )
  const stageRef = useRef(null)
  const dragRef = useRef({ x: 0, y: 0, ax: 0, ay: 0, cell: 48 })

  // Glisser-déplacer sur le plateau : on déplace le perso case par case
  // dans la direction du glissement, autant de cases que le doigt parcourt.
  const onBoardTouchStart = useCallback((e) => {
    const t = e.touches[0]
    if (!t) return
    const rect = stageRef.current?.getBoundingClientRect()
    const cell = rect ? rect.width / SIZE : 48
    dragRef.current = { x: t.clientX, y: t.clientY, ax: 0, ay: 0, cell }
  }, [])

  const onBoardTouchMove = useCallback((e) => {
    const t = e.touches[0]
    if (!t) return
    e.preventDefault() // empêche le scroll pendant le glissement
    const d = dragRef.current
    d.ax += t.clientX - d.x
    d.ay += t.clientY - d.y
    d.x = t.clientX
    d.y = t.clientY
    const th = Math.max(18, d.cell * 0.7) // seuil ≈ 0,7 case → réactif
    let guard = 0
    while ((Math.abs(d.ax) >= th || Math.abs(d.ay) >= th) && guard++ < SIZE + 1) {
      if (Math.abs(d.ax) >= Math.abs(d.ay)) {
        const dir = d.ax > 0 ? 1 : -1
        move(0, dir)
        d.ax -= dir * th
      } else {
        const dir = d.ay > 0 ? 1 : -1
        move(dir, 0)
        d.ay -= dir * th
      }
    }
  }, [move])

  // Listeners natifs non-passifs (preventDefault fiable, glissement fluide).
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

  const resetTransient = () => {
    clearTimeout(landTimer.current)
    airborneRef.current = false
    setAirborne(false)
    jumpReadyRef.current = 0
  }
  const startGame = () => { resetTransient(); dispatch({ type: 'NEW_GAME', level: loadedLevel }); setStarted(true) }
  const nextLevel = () => { resetTransient(); dispatch({ type: 'NEW_GAME', level: state.level + 1 }) }
  const retry = () => { resetTransient(); dispatch({ type: 'NEW_GAME', level: state.level }) }

  // Boucle de la lave (cadence selon le niveau).
  useEffect(() => {
    if (!started || state.status !== 'playing') return
    const id = setInterval(() => dispatch({ type: 'TICK', airborne: airborneRef.current }), state.config.tickMs)
    return () => clearInterval(id)
  }, [started, state.status, state.config.tickMs])

  // Clavier : flèches = déplacement, espace = saut.
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

  useEffect(() => () => clearTimeout(landTimer.current), [])

  const zonesOn = state.zones.filter((z) => z.active).length
  const zonesTotal = state.zones.length

  // #1 — niveau de lave (0..1) pour la submersion des boutons.
  const submerge = useMemo(() => {
    if (state.status === 'won' || !started) return 0
    let n = 0
    for (const row of state.lava) for (const cell of row) if (cell) n++
    return Math.min(1, (n / (SIZE * SIZE)) * 2.6)
  }, [state.lava, state.status, started])

  // #7 — recentrage de l'avatar « large » (animal terrestre).
  const playerWide = useMemo(() => {
    const a = user?.avatar ? normalizeAvatar(user.avatar) : null
    return !!(a?.animal && animalWide(a.animal))
  }, [user?.avatar])

  // Choix du mode (solo / multijoueur) avant de jouer.
  if (mode === 'multi') {
    return <FloorMulti onBack={() => setMode(null)} />
  }

  if (mode === null) {
    return (
      <div className="flava">
        <Backdrop />
        <header className="flava__top">
          <button className="flava__back" onClick={() => navigate('/dashboard')}>⬅️ Retour</button>
          <ZigzamLogo size="sm" />
          <span />
        </header>
        <h1 className="flava__title">Floor is Lava 🌋</h1>
        <p className="flava__hint">Choisis ton mode de jeu&nbsp;!</p>
        <div className="flava__modes">
          <button className="flava__mode flava__mode--solo" onClick={() => setMode('solo')}>
            <span className="flava__mode-emoji">🎮</span>
            <span className="flava__mode-title">Solo</span>
            <span className="flava__mode-desc">Niveaux progressifs, difficulté croissante</span>
          </button>
          <button className="flava__mode flava__mode--multi" onClick={() => setMode('multi')}>
            <span className="flava__mode-emoji">👥</span>
            <span className="flava__mode-title">Multijoueur</span>
            <span className="flava__mode-desc">Rejoins la partie commune en temps réel</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flava ${state.status === 'won' ? 'flava--victory' : ''}`} style={{ '--lava-level': submerge }}>
      <Backdrop />

      <header className="flava__top">
        <button className="flava__back flava-submerge" onClick={() => navigate('/dashboard')}>⬅️ Retour</button>
        <ZigzamLogo size="sm" />
        <div className="flava__hud">
          <span className="flava__level-hud">Niveau {state.level}</span>
          <span className="flava__zones-hud">Zones : {zonesOn}/{zonesTotal}</span>
        </div>
      </header>

      <h1 className="flava__title">Floor is Lava 🌋</h1>
      <p className="flava__hint">
        {isTouch
          ? 'Glisse ton doigt sur le plateau pour bouger • Bouton ⬆ SAUT pour sauter • Active toutes les zones jaunes !'
          : 'Flèches = bouger • Espace = sauter par-dessus la lave • Active toutes les zones jaunes !'}
      </p>

      <div
        ref={stageRef}
        className={`flava__stage ${isTouch ? 'flava__stage--touch' : ''}`}
        style={{ '--size': SIZE }}
      >
        <div className="flava__board">
          {state.terrain.map((row, r) =>
            row.map((cell, c) => {
              const lava = isLava(state.lava, r, c)
              const isZone = cell === ZONE
              const zone = isZone ? state.zones.find((z) => z.r === r && z.c === c) : null
              let cls = 'flava__tile'
              if (lava) cls += ' flava__tile--lava'
              else if (cell === ROCK) cls += ' flava__tile--rock'
              else if (zone) cls += zone.active ? ' flava__tile--zone-on' : ' flava__tile--zone'
              return (
                <div key={`${r}-${c}`} className={cls}>
                  {cell === ROCK && !lava && <span className="flava__rock">🪨</span>}
                  {zone && zone.active && <span className="flava__check">✅</span>}
                  {lava && <span className="flava__bubble" />}
                </div>
              )
            }),
          )}
        </div>

        {/* Grille superposée identique : ne contient QUE le joueur → aucune case n'est déformée ni décalée */}
        <div className="flava__grid-overlay">
          <div
            key={`${state.player.r}-${state.player.c}`}
            className={`flava__player ${airborne ? 'flava__player--air' : ''} ${playerWide ? 'flava__player--wide' : ''}`}
            style={{ gridColumn: state.player.c + 1, gridRow: state.player.r + 1 }}
          >
            <span className="flava__player-shadow" />
            <span className="flava__player-aura" />
            <span className="flava__player-arrow" />
            <div className="flava__avatar">
              <FallGuy avatar={user?.avatar} role={user?.role} anim={airborne ? 'jump' : 'idle'} />
            </div>
          </div>
        </div>
      </div>

      {/* Commande tactile (mobile) : gros bouton de saut fixé à droite.
          Le déplacement se fait en glissant le doigt sur le plateau. */}
      {isTouch && started && state.status === 'playing' && (
        <button className="flava__jump-fab flava-submerge" onClick={jump} aria-label="Sauter">
          <span className="flava__jump-fab-arrow">⬆</span>
          SAUT
        </button>
      )}

      {/* Écran d'intro / instructions */}
      {!started && (
        <div className="flava__overlay">
          <div className="flava__panel flava__panel--intro">
            <h2 className="flava__panel-title">🌋 Floor is Lava !</h2>
            <p className="flava__panel-text">
              Utilise les flèches <strong>⬆️ ⬇️ ⬅️ ➡️</strong> pour te déplacer,{' '}
              <strong>ESPACE</strong> pour sauter par-dessus la lave.<br />
              Active toutes les <strong>zones jaunes</strong> pour gagner&nbsp;!<br />
              Les rochers <strong>🪨</strong> sont des abris sûrs.
            </p>
            {loadedLevel > 1 && (
              <p className="flava__resume">Tu reprends au <strong>niveau {loadedLevel}</strong> 🚀</p>
            )}
            <div className="flava__panel-actions">
              <button className="flava__btn" onClick={startGame}>C'est parti&nbsp;! 🚀</button>
            </div>
          </div>
        </div>
      )}

      {/* Victoire — célébration + niveau suivant */}
      {started && state.status === 'won' && (
        <div className="flava__overlay">
          <div className="flava__confetti-layer" aria-hidden="true">
            {CONFETTI.map((p, i) => (
              <span
                key={i}
                className="flava__confetti"
                style={{
                  left: `${p.left}%`, background: p.color,
                  width: p.size, height: p.size,
                  animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
                }}
              />
            ))}
          </div>
          <div className="flava__panel flava__panel--win">
            <h2 className="flava__panel-title">🎉 Niveau {state.level} terminé&nbsp;!</h2>
            <FallGuy className="flava__win-buddy" avatar={user?.avatar} role={user?.role} anim="jump" />
            <p className="flava__panel-text">Bravo, niveau réussi&nbsp;!</p>
            <div className="flava__panel-actions">
              <button className="flava__btn" onClick={nextLevel}>Niveau suivant →</button>
              <button className="flava__btn flava__btn--ghost" onClick={() => navigate('/dashboard')}>
                Retour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Défaite */}
      {started && state.status === 'lost' && (
        <div className="flava__overlay">
          <div className="flava__panel">
            <h2 className="flava__panel-title">🌋 Aïe, la lave&nbsp;!</h2>
            <p className="flava__panel-text">
              Niveau {state.level} — tu as activé {zonesOn}/{zonesTotal} zones.
              Réessaie, tu vas y arriver&nbsp;! 💪
            </p>
            <div className="flava__panel-actions">
              <button className="flava__btn" onClick={retry}>Rejouer 🔁</button>
              <button className="flava__btn flava__btn--ghost" onClick={() => navigate('/dashboard')}>
                Retour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
