import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { makeChemLevel } from '../lib/floorChemins'
import { normalizeAvatar } from '../lib/avatar'
import { animalWide } from '../components/avatarParts'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'

const MOVE_THROTTLE_MS = 220

function pathIndexAt(path, r, c) {
  return path.findIndex((p) => p.r === r && p.c === c)
}

export default function FloorChemins({ onBack }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [level, setLevel] = useState(() => makeChemLevel(1))
  const [started, setStarted] = useState(false)
  const [pos, setPos] = useState({ r: 0, c: 0 })
  const [index, setIndex] = useState(0)
  const [lives, setLives] = useState(3)
  const [phase, setPhase] = useState('intro') // 'intro' | 'showing' | 'playing' | 'won' | 'lost'
  const [wrongFlash, setWrongFlash] = useState(false)

  const showTimer = useRef(null)
  const phaseRef = useRef('intro')
  const indexRef = useRef(0)
  const posRef = useRef({ r: 0, c: 0 })
  const livesRef = useRef(3)
  useEffect(() => { phaseRef.current = phase }, [phase])

  const playerWide = useMemo(() => {
    const a = user?.avatar ? normalizeAvatar(user.avatar) : null
    return !!(a?.animal && animalWide(a.animal))
  }, [user])

  // Lance le niveau courant : affiche le chemin, puis le masque après hideMs.
  const revealPath = useCallback((lvl) => {
    clearTimeout(showTimer.current)
    setPos(lvl.path[0])
    posRef.current = lvl.path[0]
    setIndex(0)
    indexRef.current = 0
    setPhase('showing')
    phaseRef.current = 'showing'
    showTimer.current = setTimeout(() => {
      setPhase('playing')
      phaseRef.current = 'playing'
    }, lvl.hideMs)
  }, [])

  const startGame = () => {
    setStarted(true)
    setLives(3)
    livesRef.current = 3
    revealPath(level)
  }

  const nextLevel = () => {
    const lvl = makeChemLevel(level.level + 1)
    setLevel(lvl)
    setLives(3)
    livesRef.current = 3
    revealPath(lvl)
  }

  const retrySameLevel = () => {
    const lvl = makeChemLevel(level.level)
    setLevel(lvl)
    setLives(3)
    livesRef.current = 3
    revealPath(lvl)
  }

  const move = useCallback((dr, dc) => {
    if (phaseRef.current !== 'playing') return
    const cur = posRef.current
    const nr = cur.r + dr
    const nc = cur.c + dc
    if (nr < 0 || nr >= level.size || nc < 0 || nc >= level.size) return

    const expected = level.path[indexRef.current + 1]
    if (expected && expected.r === nr && expected.c === nc) {
      const next = { r: nr, c: nc }
      posRef.current = next
      setPos(next)
      indexRef.current += 1
      setIndex(indexRef.current)
      if (indexRef.current === level.path.length - 1) {
        setPhase('won')
        phaseRef.current = 'won'
      }
      return
    }

    // Mauvaise case : on perd une vie et on recommence depuis le début.
    setWrongFlash(true)
    setTimeout(() => setWrongFlash(false), 400)
    livesRef.current -= 1
    setLives(livesRef.current)
    if (livesRef.current <= 0) {
      setPhase('lost')
      phaseRef.current = 'lost'
      return
    }
    posRef.current = level.path[0]
    setPos(level.path[0])
    indexRef.current = 0
    setIndex(0)
  }, [level])

  useEffect(() => {
    const onKey = (e) => {
      switch (e.key) {
        case 'ArrowUp': case 'z': move(-1, 0); e.preventDefault(); break
        case 'ArrowDown': case 's': move(1, 0); e.preventDefault(); break
        case 'ArrowLeft': case 'q': move(0, -1); e.preventDefault(); break
        case 'ArrowRight': case 'd': move(0, 1); e.preventDefault(); break
        default: break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [move])

  // Contrôles tactiles : glisser sur le plateau, une case à la fois.
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
    const cell = rect ? rect.width / level.size : 48
    dragRef.current = { x: t.clientX, y: t.clientY, ax: 0, ay: 0, cell, last: 0 }
  }, [level.size])
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

  useEffect(() => () => clearTimeout(showTimer.current), [])

  return (
    <div className="flava">
      <Backdrop />
      <header className="flava__top">
        <button className="flava__back" onClick={onBack}>⬅️ Quitter</button>
        <div className="flava__hud">
          <span className="flava__level-hud">Niveau {level.level}</span>
          <span className="flava__zones-hud">
            {'❤️'.repeat(Math.max(0, lives))}{'🖤'.repeat(Math.max(0, 3 - lives))}
          </span>
        </div>
      </header>

      <h1 className="flava__title">Floor is Lava 🧠</h1>
      <p className="flava__hint">
        {phase === 'showing'
          ? 'Regarde bien le chemin lumineux…'
          : phase === 'playing'
            ? 'À toi de le reproduire, de mémoire !'
            : 'Mémorise le chemin puis reproduis-le, une case à la fois.'}
      </p>

      <div
        ref={stageRef}
        className={`flava__stage ${isTouch ? 'flava__stage--touch' : ''}`}
        style={{ '--size': level.size }}
      >
        <div className="flava__board">
          {Array.from({ length: level.size }, (_, r) =>
            Array.from({ length: level.size }, (_, c) => {
              const pIdx = pathIndexAt(level.path, r, c)
              const onPath = pIdx >= 0
              const shown = phase === 'showing' && onPath
              const walked = phase === 'playing' && onPath && pIdx <= index
              let cls = 'flava__tile'
              if (shown) cls += pIdx === 0 ? ' flava__tile--path flava__tile--path-start' : ' flava__tile--path'
              else if (walked) cls += ' flava__tile--path-walked'
              return <div key={`${r}-${c}`} className={cls} />
            }),
          )}
        </div>

        <div className="flava__grid-overlay">
          {started && (
            <div
              className={`flava__player ${playerWide ? 'flava__player--wide' : ''} ${wrongFlash ? 'flava__player--wrong' : ''}`}
              style={{ gridColumn: pos.c + 1, gridRow: pos.r + 1 }}
            >
              <span className="flava__player-shadow" />
              <span className="flava__player-aura" />
              <span className="flava__player-arrow" />
              <div className="flava__avatar">
                <FallGuy avatar={user?.avatar} role={user?.role} anim="idle" />
              </div>
            </div>
          )}
        </div>
      </div>

      {!started && (
        <div className="flava__overlay">
          <div className="flava__panel flava__panel--intro">
            <h2 className="flava__panel-title">🧠 Chemins !</h2>
            <p className="flava__panel-text">
              Un chemin lumineux va s'afficher — <strong>mémorise-le bien</strong> !<br />
              Il disparaît vite, puis tu dois le reproduire avec les flèches{' '}
              <strong>⬆️ ⬇️ ⬅️ ➡️</strong>, une case à la fois.<br />
              Tu as <strong>3&nbsp;❤️</strong>. Une erreur = retour au départ.
            </p>
            <div className="flava__panel-actions">
              <button className="flava__btn" onClick={startGame}>C'est parti&nbsp;! 🚀</button>
            </div>
          </div>
        </div>
      )}

      {started && phase === 'won' && (
        <div className="flava__overlay">
          <div className="flava__panel flava__panel--win">
            <h2 className="flava__panel-title">🎉 Chemin réussi&nbsp;!</h2>
            <FallGuy className="flava__win-buddy" avatar={user?.avatar} role={user?.role} anim="jump" />
            <p className="flava__panel-text">
              Bravo, {level.path.length} cases mémorisées parfaitement&nbsp;!
            </p>
            <div className="flava__panel-actions">
              <button className="flava__btn" onClick={nextLevel}>Niveau suivant →</button>
              <button className="flava__btn flava__btn--ghost" onClick={() => navigate('/dashboard')}>
                Retour
              </button>
            </div>
          </div>
        </div>
      )}

      {started && phase === 'lost' && (
        <div className="flava__overlay">
          <div className="flava__panel">
            <h2 className="flava__panel-title">😵 Essaie encore&nbsp;!</h2>
            <p className="flava__panel-text">
              Plus de vies — le chemin du niveau {level.level} avait {level.path.length} cases.
              Tu vas y arriver&nbsp;! 💪
            </p>
            <div className="flava__panel-actions">
              <button className="flava__btn" onClick={retrySameLevel}>Rejouer 🔁</button>
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
