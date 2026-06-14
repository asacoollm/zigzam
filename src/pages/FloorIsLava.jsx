import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  SIZE, ROCK, ZONE, makeLevel, spread, isLava, inBoard,
} from '../lib/floorislava'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'
import ZigzamLogo from '../components/ZigzamLogo'
import './FloorIsLava.css'

const TICK_MS = 1300      // cadence de propagation de la lave
const AIRBORNE_MS = 850   // durée du saut (immunité à la lave en l'air)
const JUMP_CD = 1200      // temps de recharge du saut

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
      const lava = spread(state.lava, state.terrain)
      return resolve({ ...state, lava, ticks: state.ticks + 1 }, action.airborne)
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

  // Refs pour les handlers (évite les closures périmées).
  const airborneRef = useRef(false)
  const jumpReadyRef = useRef(0)
  const statusRef = useRef(state.status)
  const landTimer = useRef(null)
  useEffect(() => { statusRef.current = state.status }, [state.status])

  const move = useCallback((dr, dc) => {
    if (statusRef.current !== 'playing') return
    dispatch({ type: 'MOVE', dr, dc, airborne: airborneRef.current })
  }, [])

  const jump = useCallback(() => {
    if (statusRef.current !== 'playing') return
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

  // Boucle de propagation de la lave.
  useEffect(() => {
    if (state.status !== 'playing') return
    const id = setInterval(() => dispatch({ type: 'TICK', airborne: airborneRef.current }), TICK_MS)
    return () => clearInterval(id)
  }, [state.status])

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
        <span className="flava__zones-hud">🎨 {zonesOn}/{zonesTotal}</span>
      </header>

      <h1 className="flava__title">Floor is Lava 🌋</h1>
      <p className="flava__hint">
        Flèches = bouger • Espace = sauter par-dessus la lave • Active toutes les zones colorées !
      </p>

      <div className="flava__stage">
        <div className="flava__board" style={{ '--size': SIZE }}>
          {state.terrain.map((row, r) =>
            row.map((cell, c) => {
              const lava = isLava(state.lava, r, c)
              const zone = cell === ZONE ? state.zones.find((z) => z.r === r && z.c === c) : null
              let cls = 'flava__tile'
              if (lava) cls += ' flava__tile--lava'
              else if (cell === ROCK) cls += ' flava__tile--rock'
              else if (zone) cls += zone.active ? ' flava__tile--zone-on' : ' flava__tile--zone'
              return (
                <div
                  key={`${r}-${c}`}
                  className={cls}
                  style={zone ? { '--zone-color': zone.color } : undefined}
                >
                  {cell === ROCK && !lava && <span className="flava__rock">🪨</span>}
                  {zone && zone.active && <span className="flava__check">✓</span>}
                  {lava && <span className="flava__bubble" />}
                </div>
              )
            }),
          )}

          {/* Joueur (avatar Fall Guys) — placé sur sa case, remonté en l'air pendant le saut */}
          <div
            key={`${state.player.r}-${state.player.c}`}
            className={`flava__player ${airborne ? 'flava__player--air' : ''}`}
            style={{ gridColumn: state.player.c + 1, gridRow: state.player.r + 1 }}
          >
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

      {state.status !== 'playing' && (
        <div className="flava__overlay">
          <div className="flava__panel">
            {state.status === 'won' ? (
              <>
                <h2 className="flava__panel-title">🎉 Bravo, gagné&nbsp;!</h2>
                <p className="flava__panel-text">
                  Tu as activé les {zonesTotal} zones avant la lave. Quel champion&nbsp;! 🏆
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
