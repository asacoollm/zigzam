import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getMyFarcesNonVues, markFarceVue, subscribeToFarce,
} from '../lib/farces'
import './FarceOverlay.css'

// ============================================================
//  FarceOverlay — monté une seule fois dans App.jsx.
//  Détecte une farce reçue (temps réel via le canal « zigzam:farce », avec
//  un filet de sécurité : vérification au chargement + toutes les 30s),
//  joue l'animation correspondante en plein écran, puis la marque comme vue.
//  Mignon, jamais effrayant : 4 animations possibles, toujours avec le nom
//  de l'expéditeur affiché. Se ferme seule après 6s, ou avec le bouton ✕.
// ============================================================

const DUREE_MS = 6000
const POLL_MS = 30000

// ---- Scènes, en SVG/CSS pur ------------------------------------------

function SceneAraignee() {
  return (
    <div className="farce__scene farce__scene--araignee">
      <div className="farce__web-fil">
        <div className="farce__spider">
          <svg viewBox="0 0 40 36" fill="none" aria-hidden="true">
            <g stroke="#2a2040" strokeWidth="2" strokeLinecap="round" fill="none">
              <path d="M14 18 Q4 14 2 8" /><path d="M14 20 Q3 20 1 20" /><path d="M14 22 Q4 26 3 32" />
              <path d="M26 18 Q36 14 38 8" /><path d="M26 20 Q37 20 39 20" /><path d="M26 22 Q36 26 37 32" />
            </g>
            <circle cx="20" cy="20" r="9" fill="#3a2d5c" />
            <circle cx="20" cy="11" r="5.5" fill="#3a2d5c" />
            <circle cx="17.5" cy="10" r="2.1" fill="#fff" />
            <circle cx="22.5" cy="10" r="2.1" fill="#fff" />
            <circle cx="17.8" cy="10.3" r="1.1" fill="#1a1430" />
            <circle cx="22.8" cy="10.3" r="1.1" fill="#1a1430" />
          </svg>
        </div>
      </div>
      <div className="farce__runner">
        <svg viewBox="0 0 40 36" fill="none" aria-hidden="true">
          <g className="farce__legs" stroke="#2a2040" strokeWidth="2" strokeLinecap="round" fill="none">
            <path d="M14 18 Q4 14 2 8" /><path d="M14 20 Q3 20 1 20" /><path d="M14 22 Q4 26 3 32" />
            <path d="M26 18 Q36 14 38 8" /><path d="M26 20 Q37 20 39 20" /><path d="M26 22 Q36 26 37 32" />
          </g>
          <circle cx="20" cy="20" r="9" fill="#3a2d5c" />
          <circle cx="20" cy="11" r="5.5" fill="#3a2d5c" />
          <circle cx="17.5" cy="10" r="2.1" fill="#fff" />
          <circle cx="22.5" cy="10" r="2.1" fill="#fff" />
          <circle cx="17.8" cy="10.3" r="1.1" fill="#1a1430" />
          <circle cx="22.8" cy="10.3" r="1.1" fill="#1a1430" />
        </svg>
      </div>
    </div>
  )
}

function SceneFantome() {
  return (
    <div className="farce__scene farce__scene--fantome">
      <div className="farce__ghost-cross">
        <svg viewBox="0 0 60 64" fill="none" aria-hidden="true">
          <path
            d="M30 2 C14 2 4 14 4 30 L4 56 Q9 50 14 56 Q19 50 24 56 Q27 52 30 56 Q33 52 36 56 Q41 50 46 56 Q51 50 56 56 L56 30 C56 14 46 2 30 2 Z"
            fill="#fff4e0"
          />
          <circle cx="21" cy="28" r="3.4" fill="#2b1750" />
          <circle cx="39" cy="28" r="3.4" fill="#2b1750" />
          <path d="M24 38 Q30 44 36 38" stroke="#2b1750" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="14" cy="34" r="3" fill="#ff9fb0" opacity="0.5" />
          <circle cx="46" cy="34" r="3" fill="#ff9fb0" opacity="0.5" />
        </svg>
        <div className="farce__bulle">Bouh !</div>
      </div>
    </div>
  )
}

const CHAUVES = [
  [10, 0, -6], [24, 0.15, 4], [38, 0.05, -10], [52, 0.2, 8], [66, 0.1, -4], [80, 0.18, 10],
]
function SceneChauvesSouris() {
  return (
    <div className="farce__scene farce__scene--chauves">
      {CHAUVES.map(([top, delay, offset], i) => (
        <div
          key={i}
          className="farce__bat"
          style={{ top: `${top}%`, animationDelay: `${delay}s`, '--bat-y': `${offset}vh` }}
        >
          <svg viewBox="0 0 80 50" fill="none" aria-hidden="true">
            <g className="farce__wing farce__wing--l">
              <path d="M38 24 Q18 6 2 10 Q14 16 18 24 Q10 26 0 24 Q12 34 32 28 Z" fill="#3a2d5c" />
            </g>
            <g className="farce__wing farce__wing--r">
              <path d="M42 24 Q62 6 78 10 Q66 16 62 24 Q70 26 80 24 Q68 34 48 28 Z" fill="#3a2d5c" />
            </g>
            <circle cx="40" cy="26" r="9" fill="#4a3a74" />
            <path d="M33 19 l2 -6 4 4Z" fill="#4a3a74" />
            <path d="M47 19 l-2 -6 -4 4Z" fill="#4a3a74" />
            <circle cx="36.5" cy="25" r="2" fill="#fff" /><circle cx="43.5" cy="25" r="2" fill="#fff" />
            <circle cx="36.8" cy="25.3" r="1" fill="#1a1430" /><circle cx="43.2" cy="25.3" r="1" fill="#1a1430" />
            <path d="M37 30 Q40 32 43 30" stroke="#1a1430" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      ))}
    </div>
  )
}

function SceneCitrouille() {
  return (
    <div className="farce__scene farce__scene--citrouille">
      <div className="farce__pumpkin-jump">
        <svg viewBox="0 0 70 60" fill="none" aria-hidden="true">
          <path d="M35 10 Q38 2 42 6 Q39 8 38 12" stroke="#4a7a2a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <ellipse cx="35" cy="36" rx="32" ry="22" fill="#ff7a18" />
          <g stroke="#e8650a" strokeWidth="2" opacity="0.65">
            <path d="M17 16 Q13 36 17 56" fill="none" /><path d="M26 13 Q22 36 26 58" fill="none" />
            <path d="M44 13 Q48 36 44 58" fill="none" /><path d="M53 16 Q57 36 53 56" fill="none" />
          </g>
          <g fill="#fff4e0">
            <path d="M18 32 L26 32 L22 40 Z" /><path d="M44 32 L52 32 L48 40 Z" />
            <path d="M14 44 Q35 58 56 44 Q35 52 14 44 Z" />
          </g>
        </svg>
      </div>
    </div>
  )
}

const SCENES = {
  araignee: SceneAraignee,
  fantome: SceneFantome,
  chauves_souris: SceneChauvesSouris,
  citrouille: SceneCitrouille,
}

export default function FarceOverlay() {
  const { user } = useAuth()
  const [queue, setQueue] = useState([])
  // La farce affichée est toujours la tête de file (pas d'état séparé à
  // synchroniser) : fermer() avance juste la file d'un cran.
  const current = queue[0] ?? null
  const closeTimer = useRef(null)
  const seenIds = useRef(new Set())

  const enqueue = useCallback((list) => {
    if (!list?.length) return
    setQueue((prev) => {
      const ids = new Set(prev.map((f) => f.id))
      const nouvelles = list.filter((f) => !ids.has(f.id) && !seenIds.current.has(f.id))
      return nouvelles.length ? [...prev, ...nouvelles] : prev
    })
  }, [])

  // Chargement initial + polling toutes les 30s (filet de sécurité).
  useEffect(() => {
    if (!user?.id) return
    let alive = true
    const check = () => {
      getMyFarcesNonVues(user.id).then((list) => { if (alive) enqueue(list) })
    }
    check()
    const poll = setInterval(check, POLL_MS)
    return () => { alive = false; clearInterval(poll) }
  }, [user?.id, enqueue])

  // Temps réel : une farce diffusée juste pour moi.
  useEffect(() => {
    if (!user?.id) return
    const unsub = subscribeToFarce((payload) => {
      if (payload?.destinataire_id !== user.id) return
      enqueue([payload])
    })
    return unsub
  }, [user?.id, enqueue])

  const fermer = useCallback(() => {
    if (!current) return
    clearTimeout(closeTimer.current)
    seenIds.current.add(current.id)
    markFarceVue(user.id, current.id)
    setQueue((prev) => prev.slice(1))
  }, [current, user])

  // Ferme automatiquement après 6s ; relance le minuteur à chaque nouvelle
  // farce affichée (current?.id en dépendance, pas l'objet lui-même).
  useEffect(() => {
    if (!current) return
    closeTimer.current = setTimeout(fermer, DUREE_MS)
    return () => clearTimeout(closeTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id])

  if (!current) return null

  const Scene = SCENES[current.type] || SceneCitrouille

  return (
    <div className="farce-overlay" role="status" aria-live="polite">
      <div className="farce-overlay__banner">🎃 Une farce de {current.expediteur_pseudo} ! 🎃</div>
      <Scene />
      <button className="farce-overlay__close" onClick={fermer} aria-label="Fermer">✕</button>
    </div>
  )
}
