// ============================================================
//  Logique du mini-jeu « Floor is Lava 🌋 » (100% client, pur).
//  Monde en grille de cubes arrondis. La lave est une VAGUE qui
//  traverse le plateau d'un côté à l'autre puis s'en va, avant
//  qu'une nouvelle vague n'arrive d'un autre côté. Les rochers et
//  les zones ne sont jamais recouverts → le joueur n'est jamais
//  encerclé définitivement. Activer toutes les zones = victoire.
// ============================================================

export const SIZE = 8
export const FLOOR = 0
export const ROCK = 1
export const ZONE = 2
export const WAVE_WIDTH = 3      // largeur de la bande de lave (en cases)
export const WAVE_COOLDOWN = 4   // ticks de répit entre deux vagues

const inBounds = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE
export const inBoard = inBounds
const randInt = (n) => Math.floor(Math.random() * n)
const grid = (v) => Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => v))

export function emptyLava() { return grid(false) }

// Les 4 vagues possibles (côté d'arrivée + sens de déplacement).
const WAVES = [
  { axis: 'col', dir: 1 },   // de la gauche vers la droite
  { axis: 'col', dir: -1 },  // de la droite vers la gauche
  { axis: 'row', dir: 1 },   // du haut vers le bas
  { axis: 'row', dir: -1 },  // du bas vers le haut
]

// Nouvelle vague, d'un côté différent de la précédente.
export function newWave(prev) {
  let pick
  do {
    pick = WAVES[randInt(WAVES.length)]
  } while (prev && pick.axis === prev.axis && pick.dir === prev.dir)
  return { axis: pick.axis, dir: pick.dir, width: WAVE_WIDTH, lead: 0 }
}

// Colonnes (ou lignes) actuellement couvertes par la bande de lave.
export function bandIndices(wave) {
  const out = []
  for (let k = 0; k < wave.width; k++) {
    const pos = wave.dir === 1 ? wave.lead - k : (SIZE - 1) - (wave.lead - k)
    if (pos >= 0 && pos < SIZE) out.push(pos)
  }
  return out
}

// La vague est-elle entièrement sortie du plateau ?
export function waveExited(wave) { return bandIndices(wave).length === 0 }

// Grille de lave booléenne pour une vague (rochers et zones épargnés).
export function lavaFromWave(wave, terrain) {
  const lava = grid(false)
  const idx = new Set(bandIndices(wave))
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const onBand = wave.axis === 'col' ? idx.has(c) : idx.has(r)
      if (onBand && terrain[r][c] === FLOOR) lava[r][c] = true
    }
  }
  return lava
}

// Avance d'un tick : déplace la vague, gère le répit entre deux vagues.
// Renvoie { wave, cooldown, lava }.
export function stepLava(state) {
  let { wave, cooldown } = state
  const { terrain } = state

  if (cooldown > 0) {
    cooldown -= 1
    if (cooldown === 0) {
      const w = newWave(wave)
      return { wave: w, cooldown: 0, lava: lavaFromWave(w, terrain) }
    }
    return { wave, cooldown, lava: emptyLava() }
  }

  const candidate = { ...wave, lead: wave.lead + 1 }
  if (waveExited(candidate)) {
    // La vague est passée → répit, puis une nouvelle vague arrivera d'un autre côté.
    return { wave, cooldown: WAVE_COOLDOWN, lava: emptyLava() }
  }
  return { wave: candidate, cooldown: 0, lava: lavaFromWave(candidate, terrain) }
}

// Génère un niveau jouable, avec une part d'aléatoire pour la rejouabilité.
export function makeLevel() {
  const terrain = grid(FLOOR)
  const start = { r: SIZE >> 1, c: SIZE >> 1 } // centre du plateau

  const taken = new Set([`${start.r},${start.c}`])
  const nearStart = (r, c) => Math.abs(r - start.r) <= 1 && Math.abs(c - start.c) <= 1
  const interior = (r, c) => r > 0 && r < SIZE - 1 && c > 0 && c < SIZE - 1

  // Rochers (abris) : répartis, jamais au centre.
  for (let placed = 0, tries = 0; placed < SIZE && tries < 500; tries++) {
    const r = randInt(SIZE)
    const c = randInt(SIZE)
    const k = `${r},${c}`
    if (taken.has(k) || nearStart(r, c)) continue
    terrain[r][c] = ROCK
    taken.add(k)
    placed++
  }

  // Zones à activer : en intérieur, atteignables.
  const zones = []
  for (let placed = 0, tries = 0; placed < 4 && tries < 500; tries++) {
    const r = randInt(SIZE)
    const c = randInt(SIZE)
    const k = `${r},${c}`
    if (taken.has(k) || nearStart(r, c) || !interior(r, c)) continue
    terrain[r][c] = ZONE
    zones.push({ r, c, active: false })
    taken.add(k)
    placed++
  }

  // On démarre par un court répit (le temps de s'orienter), puis la 1re vague.
  return {
    terrain, zones, player: { ...start },
    wave: newWave(null), cooldown: 2, lava: emptyLava(),
    status: 'playing', ticks: 0,
  }
}

export function isLava(lava, r, c) { return !!(lava[r] && lava[r][c]) }
