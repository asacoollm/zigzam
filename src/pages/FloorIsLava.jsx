import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  SIZE, ROCK, ZONE, makeLevel, stepLava, isLava, inBoard,
} from '../lib/floorislava'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'
import ZigzamLogo from '../components/ZigzamLogo'
import './FloorIsLava.css'

const TICK_MS = 900       // cadence de déplacement de la vague de lave (lent = plus facile)
const AIRBORNE_MS = 1500  // durée du saut (immunité à la lave en l'air) ~1,5 s
const JUMP_CD = 800       // temps de recharge du saut (court = plus facile)

// Mort si le joueur est sur de la lave et pas en l'air.
function resolve(state, airborne) {
  if (isLava(state.lava, state.player.r, state.player.c) && !airborne) {
    return { ...state, status: 'lost' }
  }
  return state
}

function reducer(state, action) {
  if (action.type === 'RESTART') return makeLevel()
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
      const { lava, wave, cooldown } = stepLava(state)
      return resolve({ ...state, lava, wave, cooldown, ticks: state.ticks + 1 }, action.airborne)
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
  const [state, dispatch] = useReducer(reducer, undefined, makeLevel)
  const [airborne, setAirborne] = useState(false)
  const [started, setStarted] = useState(false) // écran d'intro tant que false

  // Refs pour les handlers (évite les closures périmées).
  const airborneRef = useRef(false)
  const jumpReadyRef = useRef(0)
  const playingRef = useRef(false)
  const landTimer = useRef(null)
  useEffect(() => { playingRef.current = started && state.status === 'playing' }, [started, state.status])

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

  const restart = useCallback(() => {
    clearTimeout(landTimer.current)
    airborneRef.current = false
    setAirborne(false)
    jumpReadyRef.current = 0
    dispatch({ type: 'RESTART' })
  }, [])

  // Boucle de la vague de lave (ne tourne qu'une fois le jeu lancé).
  useEffect(() => {
    if (!started || state.status !== 'playing') return
    const id = setInterval(() => dispatch({ type: 'TICK', airborne: airborneRef.current }), TICK_MS)
    return () => clearInterval(id)
  }, [started, state.status])

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

  return (
    <div className="flava">
      <Backdrop />

      <header className="flava__top">
        <button className="flava__back" onClick={() => navigate('/dashboard')}>⬅️ Retour</button>
        <ZigzamLogo size="sm" />
        <span className="flava__zones-hud">Zones activées : {zonesOn}/{zonesTotal}</span>
      </header>

      <h1 className="flava__title">Floor is Lava 🌋</h1>
      <p className="flava__hint">
        Flèches = bouger • Espace = sauter par-dessus la lave • Active toutes les zones jaunes !
      </p>

      <div className="flava__stage" style={{ '--size': SIZE }}>
        {/* Grille du plateau (cases) */}
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
            className={`flava__player ${airborne ? 'flava__player--air' : ''}`}
            style={{ gridColumn: state.player.c + 1, gridRow: state.player.r + 1 }}
          >
            {/* repère de case (cercle coloré au sol) + aura + flèche au-dessus de la tête */}
            <span className="flava__player-shadow" />
            <span className="flava__player-aura" />
            <span className="flava__player-arrow" />
            <FallGuy avatar={user?.avatar} role={user?.role} anim={airborne ? 'jump' : 'idle'} />
          </div>
        </div>
      </div>

      {/* Commandes tactiles (mobile) */}
      <div className="flava__pad" aria-hidden="true">
        <div className="flava__dpad">
          <button className="flava__key flava__key--up" onClick={() => move(-1, 0)}>▲</button>
          <button className="flava__key flava__key--left" onClick={() => move(0, -1)}>◀</button>
          <button className="flava__key flava__key--right" onClick={() => move(0, 1)}>▶</button>
          <button className="flava__key flava__key--down" onClick={() => move(1, 0)}>▼</button>
        </div>
        <button className="flava__jump" onClick={jump}>SAUT<br />⤴</button>
      </div>

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
            <div className="flava__panel-actions">
              <button className="flava__btn" onClick={() => setStarted(true)}>C'est parti&nbsp;! 🚀</button>
            </div>
          </div>
        </div>
      )}

      {/* Fin de partie */}
      {started && state.status !== 'playing' && (
        <div className="flava__overlay">
          <div className="flava__panel">
            {state.status === 'won' ? (
              <>
                <h2 className="flava__panel-title">🎉 Bravo, gagné&nbsp;!</h2>
                <p className="flava__panel-text">
                  Tu as activé les {zonesTotal} zones malgré la lave. Quel champion&nbsp;! 🏆
                </p>
              </>
            ) : (
              <>
                <h2 className="flava__panel-title">🌋 Aïe, la lave&nbsp;!</h2>
                <p className="flava__panel-text">
                  Tu as activé {zonesOn}/{zonesTotal} zones. Réessaie, tu vas y arriver&nbsp;! 💪
                </p>
              </>
            )}
            <div className="flava__panel-actions">
              <button className="flava__btn" onClick={restart}>Rejouer 🔁</button>
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
