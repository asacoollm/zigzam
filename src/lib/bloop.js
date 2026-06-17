// ============================================================
//  Petit son « bloop » mignon pour la Série Zigzam.
//  100 % Web Audio API — aucun fichier audio externe.
//  Un oscillateur sine très court (~80 ms) avec une légère
//  montée de fréquence pour un effet « pop » tout doux.
// ============================================================

let ctx = null

function getCtx() {
  if (typeof window === 'undefined') return null
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  if (!ctx) ctx = new AudioCtx()
  return ctx
}

// Joue le « bloop ». À appeler à chaque apparition de bulle.
// Sans danger si l'audio n'est pas dispo (renvoie simplement sans rien faire).
export function playBloop() {
  const audio = getCtx()
  if (!audio) return
  // Certains navigateurs suspendent le contexte tant qu'il n'y a pas eu
  // d'interaction utilisateur : on tente de le réveiller.
  if (audio.state === 'suspended') audio.resume().catch(() => {})

  const t = audio.currentTime
  const osc = audio.createOscillator()
  const gain = audio.createGain()

  osc.type = 'sine'
  // Petite montée 700 Hz → 900 Hz pour un « pop » rond et mignon.
  osc.frequency.setValueAtTime(700, t)
  osc.frequency.exponentialRampToValueAtTime(900, t + 0.07)

  // Enveloppe de volume : attaque rapide puis extinction douce (~80 ms).
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.22, t + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)

  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(t)
  osc.stop(t + 0.09)
}
