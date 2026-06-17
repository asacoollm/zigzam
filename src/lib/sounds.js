// ============================================================
//  Sons de la Série Zigzam — 100 % Web Audio API, aucun fichier externe.
//  Voix « chantonnée » mignonne style Animal Crossing : une petite note
//  vocale (« mmh » / « mwah ») par syllabe, douce et vivante.
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
  hero: 380, // voix medium
  rose: 520, // voix aiguë
  bleu: 220, // voix grave
  default: 320,
}

// Joue une petite note vocale chantonnée (~120 ms) à la fréquence donnée.
// Sine + filtre passe-bas (adoucit) + LFO de vibrato (rend la voix vivante)
// + enveloppe ADSR (le son « chante » au lieu de « claquer »).
export function playSpeech(freq = VOICES.default) {
  const audio = getCtx()
  if (!audio) return
  if (audio.state === 'suspended') audio.resume().catch(() => {})

  const t = audio.currentTime

  // --- Oscillateur principal (la « voix »)
  const osc = audio.createOscillator()
  osc.type = 'sine'
  // Petite courbe de hauteur montante puis retour → effet « mwah » chantonné.
  osc.frequency.setValueAtTime(freq * 0.95, t)
  osc.frequency.linearRampToValueAtTime(freq * 1.04, t + 0.05)
  osc.frequency.linearRampToValueAtTime(freq, t + 0.12)

  // --- LFO de vibrato (~5 Hz) modulant la fréquence pour un rendu vocal
  const lfo = audio.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.setValueAtTime(5, t)
  const lfoDepth = audio.createGain()
  lfoDepth.gain.setValueAtTime(freq * 0.02, t) // ±2 % de vibrato
  lfo.connect(lfoDepth)
  lfoDepth.connect(osc.frequency)

  // --- Filtre passe-bas pour adoucir (enlève la dureté de l'attaque)
  const filter = audio.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1100, t)
  filter.Q.setValueAtTime(0.7, t)

  // --- Enveloppe ADSR : attack 20 ms, decay 30 ms, sustain 0.3, release 50 ms
  const gain = audio.createGain()
  const peak = 0.18
  const sustain = peak * 0.3
  const A = 0.02
  const D = 0.03
  const HOLD = 0.12 // fin du sustain → début du release
  const R = 0.05
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.linearRampToValueAtTime(peak, t + A) // attack
  gain.gain.linearRampToValueAtTime(sustain, t + A + D) // decay → niveau sustain
  gain.gain.setValueAtTime(sustain, t + HOLD) // maintien du sustain
  gain.gain.linearRampToValueAtTime(0.0001, t + HOLD + R) // release

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(audio.destination)

  const end = t + HOLD + R + 0.02
  osc.start(t)
  lfo.start(t)
  osc.stop(end)
  lfo.stop(end)
}
