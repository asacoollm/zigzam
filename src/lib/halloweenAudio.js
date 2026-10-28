// ============================================================
//  Halloween Audio 🎃 — musique d'ambiance + sons de farces,
//  entièrement fabriqués avec la Web Audio API (aucun fichier audio
//  externe, aucune musique copiée).
//  ------------------------------------------------------------
//  Graphe audio :
//    drone + mélodie + vent  →  musicBus (0.15 par défaut, ducké
//                                 pendant une farce)  ┐
//    son de farce             →  sfxBus                ├→ masterGain
//                                                        │   (0 si muet)
//                                                        → compressor
//                                                        → destination
//  Règles respectées : démarre seulement après un geste utilisateur,
//  volume bas + DynamicsCompressor (jamais de pic fort), coupé pendant
//  la saison inactive ou l'onglet caché, état muet mémorisé
//  (localStorage, try/catch), ducking pendant les farces.
// ============================================================

const STORAGE_KEY = 'zigzam:halloween-audio-muet'
const MUSIC_VOLUME = 0.15
const LOOP_SECONDS = 40

let ctx = null
let masterGain = null
let compressor = null
let musicBus = null
let sfxBus = null
let windNoiseSrc = null
let droneOscs = []
let musicLoopTimer = null
let musicStarted = false
let muted = readMutedPref()
let duckTimer = null

function readMutedPref() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
function writeMutedPref(v) {
  try {
    localStorage.setItem(STORAGE_KEY, v ? '1' : '0')
  } catch {
    /* stockage indisponible : tant pis, l'état reste en mémoire */
  }
}

export function isHalloweenAudioMuted() {
  return muted
}

// ---------------------------------------------------------------
//  Construction du graphe (appelée une seule fois, au premier geste).
// ---------------------------------------------------------------
function buildGraph() {
  if (ctx) return
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return
  ctx = new Ctx()

  compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = -24
  compressor.knee.value = 20
  compressor.ratio.value = 6
  compressor.attack.value = 0.01
  compressor.release.value = 0.25
  compressor.connect(ctx.destination)

  masterGain = ctx.createGain()
  masterGain.gain.value = muted ? 0 : 1
  masterGain.connect(compressor)

  musicBus = ctx.createGain()
  musicBus.gain.value = MUSIC_VOLUME
  musicBus.connect(masterGain)

  sfxBus = ctx.createGain()
  sfxBus.gain.value = 1
  sfxBus.connect(masterGain)
}

// ---- Bruit blanc généré en mémoire (pas de fichier) --------------------
function createNoiseBuffer(seconds) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

// ---- Bourdon grave doux (2 oscillateurs légèrement désaccordés) -------
function startDrone() {
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 340
  filter.Q.value = 0.6
  filter.connect(musicBus)

  const gain = ctx.createGain()
  gain.gain.value = 0.38
  gain.connect(filter)

  const freqs = [55, 55.28]
  droneOscs = freqs.map((f) => {
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = f
    osc.connect(gain)
    osc.start()
    return osc
  })
}

// ---- Souffle de vent (bruit filtré, respiration lente) -----------------
function startWind() {
  const buffer = createNoiseBuffer(2)
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 500
  filter.Q.value = 0.8

  // LFO lent qui fait « respirer » le filtre, sans jamais clignoter
  // (bien en dessous du seuil de clignotement visuel — ici c'est du son,
  // mais on reste sur un cycle de plusieurs secondes, tout en douceur).
  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.07
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 260
  lfo.connect(lfoGain)
  lfoGain.connect(filter.frequency)
  lfo.start()

  const gain = ctx.createGain()
  gain.gain.value = 0.16

  src.connect(filter)
  filter.connect(gain)
  gain.connect(musicBus)
  src.start()
  windNoiseSrc = src
}

// ---- Mélodie « boîte à musique », lente, en mineur, qui se répète -----
// Quelques notes (La mineur) jouées deux fois par boucle de 40s.
const MELODIE = [
  { t: 0.0, f: 440.0, d: 0.9 },   // La4
  { t: 2.4, f: 523.25, d: 0.9 },  // Do5
  { t: 4.8, f: 659.25, d: 1.0 },  // Mi5
  { t: 7.6, f: 587.33, d: 0.9 },  // Ré5
  { t: 10.0, f: 523.25, d: 1.0 }, // Do5
  { t: 12.8, f: 440.0, d: 1.3 },  // La4
]
function playNote(startAt, freq, dur) {
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = freq
  const overtone = ctx.createOscillator()
  overtone.type = 'triangle'
  overtone.frequency.value = freq * 2
  const overtoneGain = ctx.createGain()
  overtoneGain.gain.value = 0.18

  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, startAt)
  env.gain.exponentialRampToValueAtTime(0.55, startAt + 0.015)
  env.gain.exponentialRampToValueAtTime(0.0008, startAt + dur)

  osc.connect(env)
  overtone.connect(overtoneGain)
  overtoneGain.connect(env)
  env.connect(musicBus)

  osc.start(startAt)
  osc.stop(startAt + dur + 0.05)
  overtone.start(startAt)
  overtone.stop(startAt + dur + 0.05)
}
function scheduleMusicLoop(loopStart) {
  if (!ctx) return
  for (const n of MELODIE) playNote(loopStart + n.t, n.f, n.d)
  for (const n of MELODIE) playNote(loopStart + LOOP_SECONDS / 2 + n.t, n.f * (n.f === 440 ? 1 : 0.999), n.d)

  const leadMs = 1500
  const delayMs = Math.max(200, (loopStart + LOOP_SECONDS - ctx.currentTime) * 1000 - leadMs)
  musicLoopTimer = setTimeout(() => scheduleMusicLoop(loopStart + LOOP_SECONDS), delayMs)
}

// ---------------------------------------------------------------
//  API publique
// ---------------------------------------------------------------

// À appeler au premier clic/toucher (geste utilisateur requis par les
// navigateurs). Sans effet si déjà démarré ou si Web Audio est absent.
export function ensureHalloweenMusicStarted() {
  buildGraph()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  if (musicStarted) return
  musicStarted = true
  startDrone()
  startWind()
  scheduleMusicLoop(ctx.currentTime + 0.3)
}

// Coupe tout proprement (saison désactivée). Ne plante jamais : la
// saison peut être désactivée avant même qu'un geste utilisateur n'ait
// démarré la musique.
export function stopHalloweenMusic() {
  try {
    clearTimeout(musicLoopTimer)
    musicLoopTimer = null
    droneOscs.forEach((o) => { try { o.stop() } catch { /* déjà arrêté */ } })
    droneOscs = []
    if (windNoiseSrc) { try { windNoiseSrc.stop() } catch { /* déjà arrêté */ } }
    windNoiseSrc = null
    if (ctx) { ctx.close().catch(() => {}) }
  } catch {
    /* on ne laisse jamais une erreur audio casser l'appli */
  } finally {
    ctx = null
    masterGain = null
    compressor = null
    musicBus = null
    sfxBus = null
    musicStarted = false
  }
}

// Onglet caché / visible à nouveau.
export function pauseHalloweenAudio() {
  if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {})
}
export function resumeHalloweenAudio() {
  if (ctx && ctx.state === 'suspended' && musicStarted) ctx.resume().catch(() => {})
}

// Bouton 🔊 / 🔇 — état mémorisé (localStorage, try/catch).
export function setHalloweenAudioMuted(v) {
  muted = !!v
  writeMutedPref(muted)
  if (masterGain && ctx) {
    const now = ctx.currentTime
    masterGain.gain.cancelScheduledValues(now)
    masterGain.gain.setValueAtTime(masterGain.gain.value, now)
    masterGain.gain.linearRampToValueAtTime(muted ? 0 : 1, now + 0.2)
  }
}

// ---------------------------------------------------------------
//  Sons de farces — 1s max chacun, enveloppe douce, jamais de pic.
//  Baisse (ducking) la musique pendant le son, puis la remonte.
// ---------------------------------------------------------------
function duckMusicDuring(seconds) {
  if (!musicBus || !ctx) return
  clearTimeout(duckTimer)
  const now = ctx.currentTime
  musicBus.gain.cancelScheduledValues(now)
  musicBus.gain.setValueAtTime(musicBus.gain.value, now)
  musicBus.gain.linearRampToValueAtTime(MUSIC_VOLUME * 0.35, now + 0.12)
  duckTimer = setTimeout(() => {
    if (!musicBus || !ctx) return
    const t = ctx.currentTime
    musicBus.gain.cancelScheduledValues(t)
    musicBus.gain.setValueAtTime(musicBus.gain.value, t)
    musicBus.gain.linearRampToValueAtTime(MUSIC_VOLUME, t + 0.4)
  }, seconds * 1000)
}

function noiseBurst(dest, { start, dur, peak = 0.2, type = 'highpass', freq = 2000, q = 1 }) {
  const buffer = createNoiseBuffer(Math.max(dur, 0.05))
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.frequency.value = freq
  filter.Q.value = q
  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, start)
  env.gain.exponentialRampToValueAtTime(peak, start + 0.012)
  env.gain.exponentialRampToValueAtTime(0.0008, start + dur)
  src.connect(filter)
  filter.connect(env)
  env.connect(dest)
  src.start(start)
  src.stop(start + dur + 0.03)
}

function tone(dest, { start, dur, freq, freqEnd, type = 'sine', peak = 0.22 }) {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (freqEnd) osc.frequency.linearRampToValueAtTime(freqEnd, start + dur)
  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, start)
  env.gain.exponentialRampToValueAtTime(peak, start + 0.015)
  env.gain.exponentialRampToValueAtTime(0.0008, start + dur)
  osc.connect(env)
  env.connect(dest)
  osc.start(start)
  osc.stop(start + dur + 0.03)
}

const FARCE_SOUNDS = {
  // 🕷️ petits claquements de pattes puis un « ssshh » aigu
  araignee(dest, t0) {
    for (let i = 0; i < 6; i++) {
      noiseBurst(dest, { start: t0 + i * 0.055, dur: 0.03, peak: 0.16, type: 'bandpass', freq: 1400 + i * 120, q: 4 })
    }
    noiseBurst(dest, { start: t0 + 0.38, dur: 0.5, peak: 0.14, type: 'highpass', freq: 3500, q: 0.7 })
  },
  // 👻 souffle grave qui monte, puis un « Bouh » grave
  fantome(dest, t0) {
    noiseBurst(dest, { start: t0, dur: 0.45, peak: 0.13, type: 'lowpass', freq: 260, q: 0.5 })
    tone(dest, { start: t0 + 0.35, dur: 0.55, freq: 140, freqEnd: 95, type: 'sine', peak: 0.24 })
  },
  // 🦇 battements d'ailes rapides + petits cris aigus doux
  chauves_souris(dest, t0) {
    for (let i = 0; i < 8; i++) {
      noiseBurst(dest, { start: t0 + i * 0.06, dur: 0.045, peak: 0.15, type: 'bandpass', freq: 220, q: 1.2 })
    }
    tone(dest, { start: t0 + 0.15, dur: 0.12, freq: 2200, type: 'triangle', peak: 0.1 })
    tone(dest, { start: t0 + 0.42, dur: 0.1, freq: 2600, type: 'triangle', peak: 0.09 })
  },
  // 🎃 rire grave et rigolo « hou hou hou »
  citrouille(dest, t0) {
    const notes = [180, 165, 150]
    notes.forEach((f, i) => {
      tone(dest, { start: t0 + i * 0.22, dur: 0.17, freq: f, freqEnd: f * 0.85, type: 'sawtooth', peak: 0.2 })
    })
  },
}

// Jamais de son si muet ou si Web Audio n'a pas encore démarré
// (ex. aucun geste utilisateur n'a encore eu lieu).
export function playFarceSound(type) {
  if (muted || !ctx || !sfxBus) return
  const fn = FARCE_SOUNDS[type] || FARCE_SOUNDS.citrouille
  const t0 = ctx.currentTime + 0.02
  fn(sfxBus, t0)
  duckMusicDuring(1.0)
}
