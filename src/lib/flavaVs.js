// ============================================================
//  Floor is Lava — mode VS ⚔️ (1 contre 1, humain ou bot).
//  Même patron déterministe que le multijoueur (#6) : le plateau et
//  les équipes (bleu/rose) sont dérivés uniquement de (seed, taille)
//  côté client → les deux joueurs voient exactement le même plateau.
//  La base ne stocke que l'état partagé (cases activées, scores).
// ============================================================
import { supabase } from './supabase'
import { FLOOR, ROCK, TICK_MS, LAVA_DELAY_MS, lavaAtTick, isLavaCell, emptyLavaGrid } from './flavaMulti'

export { FLOOR, ROCK, TICK_MS, LAVA_DELAY_MS, lavaAtTick, isLavaCell, emptyLavaGrid }

const ERR = 'Oups, une erreur est survenue. Réessaie !'

// PRNG déterministe (mulberry32) — indépendant de flavaMulti pour ne pas
// dépendre d'un détail d'implémentation privé.
function rng(seed) {
  let a = (seed >>> 0) || 1
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Plateau déterministe : rochers (abris) + toutes les cases restantes
// réparties moitié/moitié entre équipe 'bleu' et équipe 'rose'.
// Les deux coins de départ sont toujours dégagés de rochers.
export function buildVsBoard(size, seed) {
  const rand = rng(seed)
  const ri = (n) => Math.floor(rand() * n)
  const terrain = Array.from({ length: size }, () => Array.from({ length: size }, () => FLOOR))
  const startBleu = { r: 1, c: 1 }
  const startRose = { r: size - 2, c: size - 2 }
  const near = (r, c, s) => Math.abs(r - s.r) <= 1 && Math.abs(c - s.c) <= 1
  const taken = new Set()
  const nRocks = Math.max(6, size - 2)

  for (let placed = 0, t = 0; placed < nRocks && t < 700; t++) {
    const r = ri(size), c = ri(size), k = `${r},${c}`
    if (taken.has(k) || near(r, c, startBleu) || near(r, c, startRose)) continue
    terrain[r][c] = ROCK
    taken.add(k)
    placed++
  }

  // Toutes les cases FLOOR restantes → équipe bleue ou rose, mélangées
  // (Fisher-Yates déterministe) puis coupées en deux moitiés égales.
  const floorCells = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (terrain[r][c] === FLOOR) floorCells.push({ r, c })
    }
  }
  for (let i = floorCells.length - 1; i > 0; i--) {
    const j = ri(i + 1)
    ;[floorCells[i], floorCells[j]] = [floorCells[j], floorCells[i]]
  }
  const teams = Array.from({ length: size }, () => Array.from({ length: size }, () => null))
  const half = Math.ceil(floorCells.length / 2)
  floorCells.forEach((cell, i) => { teams[cell.r][cell.c] = i < half ? 'bleu' : 'rose' })

  return { terrain, teams, startBleu, startRose }
}

export function cellIndex(size, r, c) { return r * size + c }

// Difficulté du bot (1 = lent et bête, 9 = rapide et optimal).
export function vsBotConfig(niveau) {
  const n = Math.max(1, Math.min(9, niveau || 5))
  const stepMs = Math.round(900 - (n - 1) * ((900 - 220) / 8))
  const jitter = Math.max(0, 3.5 - (n - 1) * (3.5 / 8))
  return { stepMs, jitter }
}

// IA du bot VS : avance vers la case inactive la plus proche de SA couleur,
// en évitant la lave. `jitter` ajoute du hasard (bot faible = trajectoire
// moins optimale).
export function vsBotStep(board, lava, bot, activatedSet, size, jitter) {
  let target = null
  let best = Infinity
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board.teams[r][c] !== bot.equipe) continue
      if (activatedSet.has(cellIndex(size, r, c))) continue
      const d = Math.abs(r - bot.r) + Math.abs(c - bot.c)
      if (d < best) { best = d; target = { r, c } }
    }
  }
  const opts = [
    { r: bot.r, c: bot.c },
    { r: bot.r - 1, c: bot.c }, { r: bot.r + 1, c: bot.c },
    { r: bot.r, c: bot.c - 1 }, { r: bot.r, c: bot.c + 1 },
  ].filter((o) => o.r >= 0 && o.r < size && o.c >= 0 && o.c < size && !isLavaCell(lava, o.r, o.c))
  if (opts.length === 0) return { r: bot.r, c: bot.c }

  let pick = opts[0]
  let pbest = Infinity
  for (const o of opts) {
    const d = target ? Math.abs(target.r - o.r) + Math.abs(target.c - o.c) : 0
    const score = d + Math.random() * jitter
    if (score < pbest) { pbest = score; pick = o }
  }
  return pick
}

// ---------------- RPC ----------------
async function rpc(fn, params) {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) return { error: ERR }
  if (data?.error) return { error: ERR }
  return { data }
}

export async function flavaVsJoinOrCreate(userId) {
  const r = await rpc('flava_vs_join_or_create', { p_user: userId })
  return r.error ? r : r.data
}
export async function flavaVsCreateBot(userId, niveau) {
  const r = await rpc('flava_vs_create_bot', { p_user: userId, p_niveau: niveau })
  return r.error ? r : r.data
}
export async function flavaVsState(sessionId, userId) {
  const r = await rpc('flava_vs_state', { p_session: sessionId, p_user: userId })
  return r.error ? r : r.data
}
export async function flavaVsMove(sessionId, userId, row, col) {
  return rpc('flava_vs_move', { p_session: sessionId, p_user: userId, p_r: row, p_c: col })
}
export async function flavaVsBotMove(sessionId, row, col) {
  return rpc('flava_vs_bot_move', { p_session: sessionId, p_r: row, p_c: col })
}
export async function flavaVsActivate(sessionId, userId, cell) {
  const r = await rpc('flava_vs_activate', { p_session: sessionId, p_user: userId, p_cell: cell })
  return r.error ? r : r.data
}
export async function flavaVsBotActivate(sessionId, cell) {
  const r = await rpc('flava_vs_bot_activate', { p_session: sessionId, p_cell: cell })
  return r.error ? r : r.data
}
export async function flavaVsLeave(sessionId, userId) {
  return rpc('flava_vs_leave', { p_session: sessionId, p_user: userId })
}

// Canal Realtime dédié (préfixe distinct du multijoueur commun).
export function subscribeFlavaVs(sessionId, onPing) {
  const channel = supabase.channel(`flava-vs:session:${sessionId}`, {
    config: { broadcast: { self: false } },
  })
  channel.on('broadcast', { event: 'sync' }, () => onPing()).subscribe()
  return channel
}
export function broadcastFlavaVs(channel) {
  channel.send({ type: 'broadcast', event: 'sync', payload: {} })
}
