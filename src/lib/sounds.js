// ============================================================
//  Sons de la Série Zigzam — 100 % Web Audio API, aucun fichier externe.
//  Petit son de « parole » mignon (style Animal Crossing / Les Sims) :
//  un bip sine très court par lettre, dont la hauteur dépend du personnage.
// ============================================================

let ctx = null

function getCtx() {
  if (typeof window === 'undefined') return null
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  if (!ctx) ctx = new AudioCtx()
  return ctx
}

// Hauteur de voix par personnage (Hz).
export const VOICES = {
  hero: 400, // voix medium
  rose: 600, // voix aiguë
  bleu: 250, // voix grave
  default: 350,
}

// Joue un petit son de parole à la fréquence donnée (une lettre).
// Sine wave courte (~40 ms) avec une légère modulation descendante.
export function playSpeech(freq = VOICES.default) {
  const audio = getCtx()
  if (!audio) return
  if (audio.state === 'suspended') audio.resume().catch(() => {})

  const t = audio.currentTime
  const osc = audio.createOscillator()
  const gain = audio.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, t)
  // Petite descente pour un effet « babillage » tout doux.
  osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.9), t + 0.038)

  // Enveloppe très courte et douce.
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.13, t + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.042)

  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(t)
  osc.stop(t + 0.05)
}
