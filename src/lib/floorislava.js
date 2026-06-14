// ============================================================
//  Logique du mini-jeu « Floor is Lava 🌋 » (100% client, pur).
//  Monde en grille de cubes arrondis. La lave est faite de VAGUES
//  (1 à 4 selon le niveau) qui traversent le plateau d'un côté à
//  l'autre puis s'en vont, avant qu'une nouvelle salve n'arrive.
//  Les rochers et les zones ne sont jamais recouverts → il reste
//  toujours des abris. Activer toutes les zones = victoire.
//  Difficulté progressive selon le niveau.
// ============================================================

export const SIZE = 8
export const FLOOR = 0
export const ROCK = 1
export const ZONE = 2

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

// Palier de difficulté d'un niveau (1-3, 4-6, 7-9, 10+).
export function levelTier(level) {
  if (level <= 3) return 1
  if (level <= 6) return 2
  if (level <= 9) return 3
  return 4 // expert
}

// Configuration de jeu selon le niveau.
export function levelConfig(level) {
  switch (levelTier(level)) {
    case 1: return { tickMs: 900, waveCount: 1, zones: 4, rocks: 8, width: 2, cooldown: 8, reward: 3 }
    case 2: return { tickMs: 750, waveCount: 2, zones: 5, rocks: 7, width: 2, cooldown: 6, reward: 5 }
    case 3: return { tickMs: 600, waveCount: 2, zones: 6, rocks: 5, width: 2, cooldown: 5, reward: 8 }
    default: return { tickMs: 450, waveCount: 4, zones: 6, rocks: 3, width: 2, cooldown: 4, reward: 12 } // expert
  }
}

// Crée `count` vagues venant de côtés distincts.
function spawnWaves(config) {
  if (config.waveCount >= 4) return WAVES.map((w) => ({ ...w, width: config.width, lead: 0 }))
  const pool = [...WAVES]
  const out = []
  for (let i = 0; i < config.waveCount && pool.length; i++) {
    const w = pool.splice(randInt(pool.length), 1)[0]
    out.push({ ...w, width: config.width, lead: 0 })
  }
  return out
}

// Colonnes (ou lignes) actuellement couvertes par une bande de lave.
export function bandIndices(wave) {
  const out = []
  for (let k = 0; k < wave.width; k++) {
    const pos = wave.dir === 1 ? wave.lead - k : (SIZE - 1) - (wave.lead - k)
    if (pos >= 0 && pos < SIZE) out.push(pos)
  }
  return out
}

export function waveExited(wave) { return bandIndices(wave).length === 0 }

// Grille de lave booléenne pour un ensemble de vagues (rochers/zones épargnés).
export function lavaFromWaves(waves, terrain) {
  const lava = grid(false)
  for (const w of waves) {
    const idx = new Set(bandIndices(w))
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const onBand = w.axis === 'col' ? idx.has(c) : idx.has(r)
        if (onBand && terrain[r][c] === FLOOR) lava[r][c] = true
      }
    }
  }
  return lava
}

// Avance d'un tick : déplace toutes les vagues, gère le répit entre deux salves.
// Renvoie { waves, cooldown, lava }.
export function stepLava(state) {
  let { waves, cooldown } = state
  const { terrain, config } = state

  if (cooldown > 0) {
    cooldown -= 1
    if (cooldown === 0) {
      const w = spawnWaves(config)
      return { waves: w, cooldown: 0, lava: lavaFromWaves(w, terrain) }
    }
    return { waves, cooldown, lava: emptyLava() }
  }

  const advanced = waves.map((w) => ({ ...w, lead: w.lead + 1 }))
  if (advanced.every(waveExited)) {
    // Toutes les vagues sont passées → répit, puis une nouvelle salve arrivera.
    return { waves, cooldown: config.cooldown, lava: emptyLava() }
  }
  return { waves: advanced, cooldown: 0, lava: lavaFromWaves(advanced, terrain) }
}

// Génère un niveau jouable, avec une part d'aléatoire pour la rejouabilité.
export function makeLevel(level = 1) {
  const config = levelConfig(level)
  const terrain = grid(FLOOR)
  const start = { r: SIZE >> 1, c: SIZE >> 1 } // centre du plateau

  const taken = new Set([`${start.r},${start.c}`])
  const nearStart = (r, c) => Math.abs(r - start.r) <= 1 && Math.abs(c - start.c) <= 1
  const interior = (r, c) => r > 0 && r < SIZE - 1 && c > 0 && c < SIZE - 1

  // Rochers (abris) : répartis, jamais au centre.
  for (let placed = 0, tries = 0; placed < config.rocks && tries < 500; tries++) {
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
  for (let placed = 0, tries = 0; placed < config.zones && tries < 800; tries++) {
    const r = randInt(SIZE)
    const c = randInt(SIZE)
    const k = `${r},${c}`
    if (taken.has(k) || nearStart(r, c) || !interior(r, c)) continue
    terrain[r][c] = ZONE
    zones.push({ r, c, active: false })
    taken.add(k)
    placed++
  }

  // On démarre par un répit d'environ 5 s (le temps de comprendre), puis la 1re salve.
  return {
    level, config, terrain, zones, player: { ...start },
    waves: spawnWaves(config), cooldown: 6, lava: emptyLava(),
    status: 'playing', ticks: 0,
  }
}

export function isLava(lava, r, c) { return !!(lava[r] && lava[r][c]) }
