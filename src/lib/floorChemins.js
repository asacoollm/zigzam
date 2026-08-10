// ============================================================
//  Floor is Lava — mode Chemins 🧠 (mémoire, 100% client, pur).
//  Un chemin aléatoire (marche auto-évitante) part d'un coin du
//  plateau. Il s'affiche brièvement puis disparaît : il faut le
//  reproduire de mémoire, une case à la fois, dans le bon ordre.
//  Pas de lave dans ce mode — juste le chemin à retenir.
// ============================================================

const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]]

// Interpolation par paliers pour coller aux repères du cahier des charges :
// niveau 1 → p1, niveau 5 → p5, niveau 9 → p9 (et au-delà, on continue
// légèrement sur la même pente pour rester progressif).
function tierInterp(level, p1, p5, p9) {
  if (level <= 1) return p1
  if (level <= 5) return p1 + (p5 - p1) * (level - 1) / 4
  if (level <= 9) return p5 + (p9 - p5) * (level - 5) / 4
  return p9 + (p9 - p5) / 4 * (level - 9)
}

// Durée d'affichage du chemin (ms) avant qu'il ne disparaisse.
export function chemHideMs(level) {
  if (level <= 1) return 5000
  if (level <= 3) return 4000
  if (level <= 5) return 3000
  if (level <= 7) return 2000
  return 1500
}

// Longueur du chemin (nb de cases), avec une part d'aléatoire.
export function chemPathLength(level) {
  const lo = Math.round(tierInterp(level, 5, 12, 25))
  const hi = Math.round(tierInterp(level, 6, 15, 30))
  return lo + Math.floor(Math.random() * (Math.max(1, hi - lo) + 1))
}

// Taille du plateau : assez grande pour loger le chemin sans trop de
// marche arrière (l'algorithme fait du backtracking sinon).
export function chemSize(length) {
  if (length <= 8) return 8
  if (length <= 14) return 9
  if (length <= 20) return 10
  if (length <= 26) return 11
  return 12
}

// Marche aléatoire auto-évitante, en partant du coin (0,0). Avec
// retour en arrière si elle se bloque, pour toujours atteindre `length`
// (ou s'arrêter avant si le plateau est vraiment trop petit).
export function generatePath(size, length) {
  let path = [{ r: 0, c: 0 }]
  const visited = new Set(['0,0'])
  let guard = 0

  while (path.length < length && guard < length * 60) {
    guard++
    const cur = path[path.length - 1]
    const options = DIRS
      .map(([dr, dc]) => ({ r: cur.r + dr, c: cur.c + dc }))
      .filter((o) => o.r >= 0 && o.r < size && o.c >= 0 && o.c < size && !visited.has(`${o.r},${o.c}`))

    if (options.length === 0) {
      if (path.length <= 1) break
      visited.delete(`${cur.r},${cur.c}`)
      path.pop()
      continue
    }
    const pick = options[Math.floor(Math.random() * options.length)]
    path.push(pick)
    visited.add(`${pick.r},${pick.c}`)
  }
  return path
}

// Génère un niveau complet jouable.
export function makeChemLevel(level = 1) {
  const length = chemPathLength(level)
  const size = chemSize(length)
  const path = generatePath(size, length)
  return {
    level, size, path,
    hideMs: chemHideMs(level),
    index: 0,       // prochaine case attendue dans `path`
    lives: 3,
    phase: 'showing', // 'showing' | 'playing' | 'won' | 'lost'
  }
}
