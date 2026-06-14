import { useEffect, useLayoutEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import FallGuy from './FallGuy'
import './Tutorial.css'

// Tutoriel « tooltip » : overlay sombre + zone pointée en surbrillance + bulle.
// `steps` : [{ text, selector?, center?: bool }]. `onFinish()` à la fin / au skip.
const PAD = 8 // marge autour de l'élément pointé

export default function Tutorial({ steps, onFinish }) {
  const { user } = useAuth()
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState(null)
  const step = steps[index]
  const total = steps.length
  const isLast = index === total - 1

  // Mesure l'élément pointé à chaque étape (et au resize).
  useLayoutEffect(() => {
    let raf = 0
    const measure = () => {
      if (step.center || !step.selector) { setRect(null); return }
      const el = document.querySelector(step.selector)
      if (!el) { setRect(null); return }
      setRect(el.getBoundingClientRect())
    }
    const el = !step.center && step.selector ? document.querySelector(step.selector) : null
    if (el) el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
    measure()
    const t = setTimeout(measure, 360) // re-mesure après le défilement
    const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure) }
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      clearTimeout(t)
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [index, step])

  // Échap = passer le tutoriel.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onFinish() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onFinish])

  const next = () => (isLast ? onFinish() : setIndex((i) => i + 1))

  // Position de la surbrillance + de la bulle.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 360
  const vh = typeof window !== 'undefined' ? window.innerHeight : 640
  const hole = rect && {
    top: rect.top - PAD, left: rect.left - PAD,
    width: rect.width + PAD * 2, height: rect.height + PAD * 2,
  }

  let bubbleStyle
  let placement = 'center'
  if (hole) {
    const below = rect.bottom + 220 < vh
    placement = below ? 'below' : 'above'
    const cx = Math.min(Math.max(rect.left + rect.width / 2, 168), vw - 168)
    bubbleStyle = below
      ? { top: hole.top + hole.height + 14, left: cx, transform: 'translateX(-50%)' }
      : { top: hole.top - 14, left: cx, transform: 'translate(-50%, -100%)' }
  } else {
    bubbleStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }

  return (
    <div className="tut" role="dialog" aria-modal="true">
      {/* Couche qui bloque les clics sur l'appli (sombre si aucune zone pointée) */}
      <div className={`tut__catch ${hole ? '' : 'tut__catch--dim'}`} />

      {/* Surbrillance de l'élément pointé (effet projecteur) */}
      {hole && (
        <div
          className="tut__hole"
          style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }}
        />
      )}

      {/* Bulle d'explication */}
      <div className={`tut__bubble tut__bubble--${placement}`} style={bubbleStyle}>
        <div className="tut__progress">
          <span className="tut__progress-label">Étape {index + 1} / {total}</span>
          <span className="tut__progress-bar">
            <span className="tut__progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
          </span>
        </div>

        {step.center && (
          <FallGuy className="tut__buddy" avatar={user?.avatar} role={user?.role} anim="jump" />
        )}

        <p className="tut__text">{step.text}</p>

        <div className="tut__actions">
          {!isLast && (
            <button className="tut__skip" onClick={onFinish}>Passer le tutoriel</button>
          )}
          <button className="tut__next" onClick={next}>
            {isLast ? "C'est parti ! 🎉" : 'Suivant →'}
          </button>
        </div>
      </div>
    </div>
  )
}
