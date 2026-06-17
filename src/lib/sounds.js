// ============================================================
//  Sons de la Série Zigzam — 100 % Web Audio API, aucun fichier externe.
//  Voix « chantonnée » mignonne style Animal Crossing : une petite note
//  vocale (« mmh » / « mwah ») par syllabe, douce, vivante et variée pour
//  ne jamais sonner comme une boucle mécanique.
// ============================================================

let ctx = null

function getCtx() {
  if (typeof window === 'undefined') return null
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  if (!ctx) ctx = new AudioCtx()
  return ctx
}

// Hauteur de voix de base par personnage (Hz).
export const VOICES = {
  hero: 380, // voix medium
  rose: 520, // voix aiguë
  bleu: 220, // voix grave
  default: 320,
}

// Courbe d'intonation d'une phrase selon la position (0 = début, 1 = fin) :
// début légèrement montant, milieu stable, fin descendante (comme une vraie
// phrase déclarative).
function intonation(p) {
  if (p < 0.2) return 1 + (p / 0.2) * 0.06            // 1.00 → 1.06 (montée)
  if (p < 0.7) return 1.06 - ((p - 0.2) / 0.5) * 0.06 // 1.06 → 1.00 (stable)
  return 1.0 - ((p - 0.7) / 0.3) * 0.14               // 1.00 → 0.86 (descente)
}

// Joue une petite note vocale chantonnée à la fréquence de base donnée.
// `progress` (0→1) = position dans la bulle → applique la courbe d'intonation.
// Chaque note est unique : hauteur, durée et timbre légèrement aléatoires.
export function playSpeech(baseFreq = VOICES.default, progress = 0.5) {
  const audio = getCtx()
  if (!audio) return
  if (audio.state === 'suspended') audio.resume().catch(() => {})

  const t = audio.currentTime

  // 1) Variation aléatoire ±15 % + 4) intonation de phrase.
  const jitter = 1 + (Math.random() * 0.3 - 0.15)
  const freq = Math.max(60, baseFreq * jitter * intonation(progress))

  // 3) Durée variable 90–150 ms (jamais exactement la même).
  const dur = 0.09 + Math.random() * 0.06

  // --- Oscillateur principal (la « voix »)
  const osc = audio.createOscillator()
  osc.type = 'sine'
  // Petit glissando intra-note pour un rendu « mwah » chantonné.
  osc.frequency.setValueAtTime(freq * 0.97, t)
  osc.frequency.linearRampToValueAtTime(freq, t + dur * 0.5)

  // --- LFO de vibrato (~5 Hz) → rendu vocal vivant
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

  // 6) Enveloppe douce : attack 15 ms, decay 40 ms, sustain 0.2, release 80 ms.
  const gain = audio.createGain()
  const peak = 0.16
  const sustain = peak * 0.2
  const A = 0.015
  const D = 0.04
  const R = 0.08
  const holdEnd = t + Math.max(A + D, dur) // fin du maintien (sustain)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.linearRampToValueAtTime(peak, t + A)        // attack
  gain.gain.linearRampToValueAtTime(sustain, t + A + D) // decay → sustain
  gain.gain.setValueAtTime(sustain, holdEnd)            // maintien
  gain.gain.linearRampToValueAtTime(0.0001, holdEnd + R) // release (fond proprement)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(audio.destination)

  const end = holdEnd + R + 0.02
  osc.start(t)
  lfo.start(t)
  osc.stop(end)
  lfo.stop(end)
}
