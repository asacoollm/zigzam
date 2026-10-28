import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getMyFarcesNonVues, markFarceVue, subscribeToFarce,
} from '../lib/farces'
import { playFarceSound } from '../lib/halloweenAudio'
import './FarceOverlay.css'

// ============================================================
//  FarceOverlay — monté une seule fois dans App.jsx.
//  Détecte une farce reçue (temps réel via le canal « zigzam:farce », avec
//  un filet de sécurité : vérification au chargement + toutes les 30s),
//  joue un jump scare façon dessin animé (écran noir → apparition
//  brutale géante, secousse + zoom, « BOUH ! », puis bandeau avec le nom
//  de l'expéditeur), avant de rassurer (« Ce n'était qu'une farce ! »).
//  Jamais de sang, de gore ni de visage réaliste. Jamais de clignotement
//  rapide (une seule transition noir → révélé, pas de stroboscope).
//  Bouton fermer cliquable dès l'affichage. Version calme (sans secousse
//  ni zoom, image qui apparaît directement) sous prefers-reduced-motion.
//  Un son (1s max, synthétisé par Web Audio, voir lib/halloweenAudio.js)
//  accompagne la révélation — coupé par le bouton 🔇 de la musique.
// ============================================================

const DUREE_MS = 6000     // durée totale max d'affichage (dont le noir initial)
const NOIR_MS = 400       // écran noir avant l'apparition brutale
const RASSURE_MS = 2000   // message « Ce n'était qu'une farce ! » après fermeture
const POLL_MS = 30000

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => (
    typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ))
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

// ---- Créatures, en SVG/CSS pur — géantes, dessin animé, jamais réalistes --

function SceneAraignee() {
  return (
    <div className="farce__creature farce__creature--araignee">
      <svg viewBox="0 0 220 210" fill="none" aria-hidden="true">
        <g className="farce__legs" stroke="#1a1424" strokeWidth="9" strokeLinecap="round" fill="none">
          <path d="M80 110 Q30 90 6 50" /><path d="M85 130 Q25 130 2 118" /><path d="M90 150 Q32 172 14 198" />
          <path d="M140 110 Q190 90 214 50" /><path d="M135 130 Q195 130 218 118" /><path d="M130 150 Q188 172 206 198" />
        </g>
        <circle cx="110" cy="118" r="58" fill="#1a1424" />
        <circle cx="110" cy="62" r="36" fill="#1a1424" />
        {/* yeux rouges luisants, façon dessin animé */}
        <g className="farce__eye-glow">
          <circle cx="92" cy="54" r="9" fill="#ff1a1a" />
          <circle cx="128" cy="54" r="9" fill="#ff1a1a" />
          <circle cx="78" cy="68" r="5" fill="#ff1a1a" />
          <circle cx="142" cy="68" r="5" fill="#ff1a1a" />
        </g>
        {/* petits crocs blancs, cartoon */}
        <path d="M98 88 L92 102 L104 94 Z" fill="#fff" />
        <path d="M122 88 L128 102 L116 94 Z" fill="#fff" />
      </svg>
    </div>
  )
}

function SceneFantome() {
  return (
    <div className="farce__creature farce__creature--fantome">
      <svg viewBox="0 0 220 230" fill="none" aria-hidden="true">
        <path
          d="M110 6 C50 6 14 46 14 104 L14 206 Q28 188 42 206 Q56 188 70 206 Q82 194 94 206 Q98 198 110 206 Q122 198 126 206 Q138 194 150 206 Q164 188 178 206 Q192 188 206 206 L206 104 C206 46 170 6 110 6 Z"
          fill="#fdf6e8" opacity="0.96"
        />
        {/* orbites noires, bouche grande ouverte — stylisé cartoon, pas réaliste */}
        <ellipse cx="74" cy="100" rx="16" ry="22" fill="#15101f" />
        <ellipse cx="146" cy="100" rx="16" ry="22" fill="#15101f" />
        <ellipse cx="110" cy="152" rx="30" ry="34" fill="#15101f" />
        <ellipse cx="110" cy="146" rx="18" ry="10" fill="#fdf6e8" opacity="0.5" />
      </svg>
    </div>
  )
}

const CHAUVES = Array.from({ length: 11 }, (_, i) => {
  const a = (i / 11) * Math.PI * 2
  return {
    left: 50 + Math.cos(a) * 36,
    top: 50 + Math.sin(a) * 32,
    delay: (i % 5) * 0.07,
    scale: 0.7 + (i % 4) * 0.12,
  }
})
function SceneChauvesSouris() {
  return (
    <div className="farce__creature farce__creature--chauves">
      {CHAUVES.map((b, i) => (
        <div
          key={i}
          className="farce__bat-geant"
          style={{
            left: `${b.left}%`, top: `${b.top}%`,
            animationDelay: `${b.delay}s`, '--bat-scale': b.scale,
          }}
        >
          <svg viewBox="0 0 90 56" fill="none" aria-hidden="true">
            <g className="farce__wing farce__wing--l">
              <path d="M43 28 Q18 4 2 10 Q16 18 20 28 Q10 30 0 28 Q14 40 36 32 Z" fill="#0d0612" />
            </g>
            <g className="farce__wing farce__wing--r">
              <path d="M47 28 Q72 4 88 10 Q74 18 70 28 Q80 30 90 28 Q76 40 54 32 Z" fill="#0d0612" />
            </g>
            <circle cx="45" cy="30" r="10" fill="#171022" />
            <path d="M37 21 l3 -7 4 5Z" fill="#171022" /><path d="M53 21 l-3 -7 -4 5Z" fill="#171022" />
            <circle className="farce__eye-glow" cx="41" cy="29" r="2.4" fill="#ff1a1a" />
            <circle className="farce__eye-glow" cx="49" cy="29" r="2.4" fill="#ff1a1a" />
          </svg>
        </div>
      ))}
    </div>
  )
}

function SceneCitrouille() {
  return (
    <div className="farce__creature farce__creature--citrouille">
      <svg viewBox="0 0 220 190" fill="none" aria-hidden="true">
        <path d="M110 28 Q116 10 126 18 Q120 22 118 30" stroke="#3f6a22" strokeWidth="9" fill="none" strokeLinecap="round" />
        <ellipse cx="110" cy="112" rx="98" ry="68" fill="#ff7a18" />
        <g stroke="#d4570a" strokeWidth="5" opacity="0.6">
          <path d="M56 50 Q44 112 56 174" fill="none" /><path d="M82 42 Q70 112 82 180" fill="none" />
          <path d="M138 42 Q150 112 138 180" fill="none" /><path d="M164 50 Q176 112 164 174" fill="none" />
        </g>
        {/* yeux jaunes qui s'allument dans le noir */}
        <g className="farce__eye-glow-jaune">
          <path d="M58 92 L86 92 L72 116 Z" fill="#ffe14d" />
          <path d="M134 92 L162 92 L148 116 Z" fill="#ffe14d" />
        </g>
        {/* grand sourire à dents, façon citrouille sculptée */}
        <path
          d="M48 138 Q60 156 76 140 Q88 160 104 140 Q116 160 132 140 Q148 160 160 140 Q172 156 184 138
             Q172 176 110 178 Q48 176 48 138 Z"
          fill="#fff4e0"
        />
      </svg>
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
  const [revealed, setRevealed] = useState(false)
  const [rassure, setRassure] = useState(false)
  // La farce affichée est toujours la tête de file (pas d'état séparé à
  // synchroniser) : fermer() avance juste la file d'un cran.
  const current = queue[0] ?? null
  const closeTimer = useRef(null)
  const rassureTimer = useRef(null)
  const seenIds = useRef(new Set())
  const reducedMotion = usePrefersReducedMotion()

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

  // Fermeture : marque vue côté serveur, puis 2s de message rassurant avant
  // de passer à la farce suivante de la file (s'il y en a une).
  const fermer = useCallback(() => {
    if (!current || rassure) return
    clearTimeout(closeTimer.current)
    seenIds.current.add(current.id)
    markFarceVue(user.id, current.id)
    setRassure(true)
    rassureTimer.current = setTimeout(() => {
      setQueue((prev) => prev.slice(1))
      setRassure(false)
      setRevealed(false)
    }, RASSURE_MS)
  }, [current, rassure, user])

  // Séquence de chaque nouvelle farce : écran noir 0,4s puis apparition
  // brutale (sautée si prefers-reduced-motion : l'image apparaît direct).
  // Fermeture automatique après DUREE_MS au total.
  useEffect(() => {
    if (!current || rassure) return
    let noirTimer = null
    // Bascule synchrone nécessaire : la révélation (ou son absence, en
    // reduced-motion) doit être décidée dès ce tick, avant tout timer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRevealed(reducedMotion)
    if (reducedMotion) {
      playFarceSound(current.type)
    } else {
      noirTimer = setTimeout(() => {
        setRevealed(true)
        playFarceSound(current.type)
      }, NOIR_MS)
    }
    closeTimer.current = setTimeout(fermer, DUREE_MS)
    return () => { clearTimeout(noirTimer); clearTimeout(closeTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, reducedMotion])

  useEffect(() => () => clearTimeout(rassureTimer.current), [])

  if (!current) return null

  if (rassure) {
    return (
      <div className="farce-overlay farce-overlay--rassure" role="status" aria-live="polite">
        <div className="farce-overlay__rassure-msg">😄 Ce n'était qu'une farce !</div>
      </div>
    )
  }

  const Scene = SCENES[current.type] || SceneCitrouille

  return (
    <div
      className={`farce-overlay ${revealed ? 'farce-overlay--jump' : 'farce-overlay--noir'}`}
      role="status" aria-live="polite"
    >
      {revealed && <div className="farce-overlay__vignette" />}
      <div className="farce-overlay__banner">Une farce de {current.expediteur_pseudo} !</div>
      {revealed && (
        <div className="farce-overlay__stage">
          <Scene />
          <div className="farce-overlay__bouh">BOUH !</div>
        </div>
      )}
      <button className="farce-overlay__close" onClick={fermer} aria-label="Fermer">✕</button>
    </div>
  )
}
