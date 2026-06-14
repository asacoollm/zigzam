// ============================================================
//  Logique du mini-jeu « Floor is Lava 🌋 » (100% client, pur).
//  Monde en grille de cubes arrondis. La lave arrive de certains
//  bords et se propage. Les rochers sont des abris (jamais de lave,
//  on peut s'y tenir). Activer toutes les zones colorées = victoire.
// ============================================================

export const SIZE = 8
export const FLOOR = 0
export const ROCK = 1
export const ZONE = 2

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]]
const inBounds = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE

const ZONE_COLORS = ['#ff4d8d', '#00bfff', '#3dd68c', '#ffcf3f', '#7c3aff']

const grid = (v) => Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => v))
const randInt = (n) => Math.floor(Math.random() * n)

// Génère un niveau jouable, avec une part d'aléatoire pour la rejouabilité.
export function makeLevel() {
  const terrain = grid(FLOOR)
  const start = { r: SIZE >> 1, c: SIZE >> 1 } // centre du plateau

  const taken = new Set([`${start.r},${start.c}`])
  const nearStart = (r, c) => Math.abs(r - start.r) <= 1 && Math.abs(c - start.c) <= 1
  const interior = (r, c) => r > 0 && r < SIZE - 1 && c > 0 && c < SIZE - 1

  // Bords d'où arrive la lave : 1 ou 2 côtés au hasard.
  const pool = ['top', 'bottom', 'left', 'right']
  const lavaEdges = []
  const nEdges = 1 + randInt(2)
  for (let i = 0; i < nEdges; i++) lavaEdges.push(pool.splice(randInt(pool.length), 1)[0])

  // Rochers (abris) : répartis, jamais au centre.
  const nRocks = SIZE
  for (let placed = 0, tries = 0; placed < nRocks && tries < 500; tries++) {
    const r = randInt(SIZE)
    const c = randInt(SIZE)
    const k = `${r},${c}`
    if (taken.has(k) || nearStart(r, c)) continue
    terrain[r][c] = ROCK
    taken.add(k)
    placed++
  }

  // Zones colorées à activer : en intérieur pour rester atteignables tôt.
  const zones = []
  const nZones = 4
  for (let placed = 0, tries = 0; placed < nZones && tries < 500; tries++) {
    const r = randInt(SIZE)
    const c = randInt(SIZE)
    const k = `${r},${c}`
    if (taken.has(k) || nearStart(r, c) || !interior(r, c)) continue
    terrain[r][c] = ZONE
    zones.push({ r, c, color: ZONE_COLORS[placed % ZONE_COLORS.length], active: false })
    taken.add(k)
    placed++
  }

  // Lave initiale : les cases FLOOR des bords choisis.
  const lava = grid(false)
  const seed = (r, c) => { if (terrain[r][c] === FLOOR) lava[r][c] = true }
  if (lavaEdges.includes('top')) for (let c = 0; c < SIZE; c++) seed(0, c)
  if (lavaEdges.includes('bottom')) for (let c = 0; c < SIZE; c++) seed(SIZE - 1, c)
  if (lavaEdges.includes('left')) for (let r = 0; r < SIZE; r++) seed(r, 0)
  if (lavaEdges.includes('right')) for (let r = 0; r < SIZE; r++) seed(r, SIZE - 1)

  return { terrain, lava, zones, player: { ...start }, lavaEdges, status: 'playing', ticks: 0 }
}

// Propagation d'un anneau : la lave gagne les cases FLOOR voisines
// (jamais les rochers ni les zones).
export function spread(lava, terrain) {
  const next = lava.map((row) => row.slice())
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!lava[r][c]) continue
      for (const [dr, dc] of DIRS) {
        const nr = r + dr
        const nc = c + dc
        if (inBounds(nr, nc) && terrain[nr][nc] === FLOOR && !next[nr][nc]) next[nr][nc] = true
      }
    }
  }
  return next
}

export function isLava(lava, r, c) { return !!(lava[r] && lava[r][c]) }
export const inBoard = inBounds
