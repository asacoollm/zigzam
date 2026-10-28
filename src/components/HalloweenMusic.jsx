import { useEffect, useState } from 'react'
import { useSaison } from '../context/SaisonContext'
import {
  ensureHalloweenMusicStarted, stopHalloweenMusic,
  pauseHalloweenAudio, resumeHalloweenAudio,
  isHalloweenAudioMuted, setHalloweenAudioMuted,
} from '../lib/halloweenAudio'
import './HalloweenMusic.css'

// ============================================================
//  HalloweenMusic — monté une seule fois dans App.jsx.
//  Démarre/arrête la musique d'ambiance générée par Web Audio selon
//  l'état de la saison, et affiche le petit bouton 🔊 / 🔇 (coin haut
//  gauche, hors du chemin de la navigation) pendant qu'elle est active.
//  Ne démarre jamais de son avant un geste utilisateur (clic/toucher).
// ============================================================
export default function HalloweenMusic() {
  const { active, slug } = useSaison()
  const halloweenActif = active && slug === 'halloween'
  const [muted, setMuted] = useState(() => isHalloweenAudioMuted())

  // Démarre au premier clic/toucher, seulement pendant la saison.
  useEffect(() => {
    if (!halloweenActif) return
    const onGesture = () => ensureHalloweenMusicStarted()
    document.addEventListener('pointerdown', onGesture)
    return () => document.removeEventListener('pointerdown', onGesture)
  }, [halloweenActif])

  // Coupe tout proprement dès que la saison n'est plus active.
  useEffect(() => {
    if (!halloweenActif) {
      stopHalloweenMusic()
    }
  }, [halloweenActif])

  // Pause pendant que l'onglet est caché, reprise au retour.
  useEffect(() => {
    if (!halloweenActif) return
    const onVisibility = () => {
      if (document.hidden) pauseHalloweenAudio()
      else resumeHalloweenAudio()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [halloweenActif])

  // Coupe aussi au démontage (changement de page complet de l'app).
  useEffect(() => () => stopHalloweenMusic(), [])

  if (!halloweenActif) return null

  const toggle = () => {
    const next = !muted
    setMuted(next)
    setHalloweenAudioMuted(next)
    if (!next) ensureHalloweenMusicStarted()
  }

  return (
    <button
      className="halloween-audio-btn"
      onClick={toggle}
      aria-label={muted ? 'Activer la musique d\'Halloween' : 'Couper la musique d\'Halloween'}
      aria-pressed={!muted}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
