// ============================================================
//  Floor is Lava — MULTIJOUEUR (#6).
//  Le terrain, les zones et la lave sont DÉTERMINISTES : générés
//  uniquement à partir de (seed, taille) côté client → tous les
//  joueurs voient exactement le même plateau et la même lave au
//  même instant (synchronisé via `started_at` partagé en base).
//  La base ne stocke que l'état partagé (zones activées, joueurs).
// ============================================================
import { supabase } from './supabase'

export const FLOOR = 0
export const ROCK = 1
export const ZONE = 2
export const TICK_MS = 700 // cadence de la lave en multi

const ERR = 'Oups, une erreur est survenue. Réessaie !'

// PRNG déterministe (mulberry32).
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

// Nombre de zones / rochers selon la taille du plateau.
function counts(size) {
  return { zones: Math.max(4, size - 4), rocks: Math.max(4, size - 2) }
}

// Plateau (terrain + zones ordonnées) déterministe pour (taille, seed).
// L'index d'une zone = sa position dans le tableau `zones`.
export function buildBoard(size, seed) {
  const rand = rng(seed)
  const ri = (n) => Math.floor(rand() * n)
  const terrain = Array.from({ length: size }, () => Array.from({ length: size }, () => FLOOR))
  const center = size >> 1
  const near = (r, c) => Math.abs(r - center) <= 1 && Math.abs(c - center) <= 1
  const interior = (r, c) => r > 0 && r < size - 1 && c > 0 && c < size - 1
  const taken = new Set([`${center},${center}`])
  const { zones: nZones, rocks: nRocks } = counts(size)

  for (let placed = 0, t = 0; placed < nRocks && t < 700; t++) {
    const r = ri(size), c = ri(size), k = `${r},${c}`
    if (taken.has(k) || near(r, c)) continue
    terrain[r][c] = ROCK
    taken.add(k)
    placed++
  }
  const zones = []
  for (let placed = 0, t = 0; placed < nZones && t < 1000; t++) {
    const r = ri(size), c = ri(size), k = `${r},${c}`
    if (taken.has(k) || near(r, c) || !interior(r, c)) continue
    terrain[r][c] = ZONE
    zones.push({ r, c })
    taken.add(k)
    placed++
  }
  return { terrain, zones, center }
}

const WAVES = [
  { axis: 'col', dir: 1 }, { axis: 'col', dir: -1 },
  { axis: 'row', dir: 1 }, { axis: 'row', dir: -1 },
]
function waveSet(size, seed) {
  const rand = rng((seed ^ 0x9e3779b9) >>> 0)
  const n = size >= 11 ? 3 : 2
  const pool = [...WAVES]
  const out = []
  for (let i = 0; i < n && pool.length; i++) {
    const w = pool.splice(Math.floor(rand() * pool.length), 1)[0]
    out.push({ ...w, phase: Math.floor(rand() * (size + 4)) })
  }
  return out
}

// Tick courant de la lave à partir de l'horloge partagée.
export function multiTick(startedAt, now = Date.now()) {
  return Math.max(0, Math.floor((now - startedAt) / TICK_MS))
}

// Grille de lave déterministe au tick T (rochers/zones épargnés).
export function lavaAtTick(size, seed, terrain, T) {
  const period = size + 4 // bande qui balaye puis répit
  const width = 2
  const waves = waveSet(size, seed)
  const lava = Array.from({ length: size }, () => Array.from({ length: size }, () => false))
  for (const w of waves) {
    const lead = (T + w.phase) % period
    const idx = new Set()
    for (let k = 0; k < width; k++) {
      const base = lead - k
      const pos = w.dir === 1 ? base : size - 1 - base
      if (pos >= 0 && pos < size) idx.add(pos)
    }
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const on = w.axis === 'col' ? idx.has(c) : idx.has(r)
        if (on && terrain[r][c] === FLOOR) lava[r][c] = true
      }
    }
  }
  return lava
}
export function isLavaCell(lava, r, c) { return !!(lava[r] && lava[r][c]) }

// ---------------- RPC ----------------
async function rpc(fn, params) {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) return { error: ERR }
  if (data?.error) return { error: ERR }
  return { data }
}

export async function flavaJoin(userId) {
  const r = await rpc('flava_join', { p_user: userId })
  return r.error ? r : r.data
}
export async function flavaState(sessionId, userId) {
  const r = await rpc('flava_state', { p_session: sessionId, p_user: userId })
  return r.error ? r : r.data
}
export async function flavaMove(sessionId, userId, row, col) {
  return rpc('flava_move', { p_session: sessionId, p_user: userId, p_r: row, p_c: col })
}
export async function flavaActivate(sessionId, userId, zone, total) {
  const r = await rpc('flava_activate', {
    p_session: sessionId, p_user: userId, p_zone: zone, p_total: total,
  })
  return r.error ? r : r.data
}
export async function flavaEliminate(sessionId, userId) {
  const r = await rpc('flava_eliminate', { p_session: sessionId, p_user: userId })
  return r.error ? r : r.data
}
export async function flavaLeave(sessionId, userId) {
  return rpc('flava_leave', { p_session: sessionId, p_user: userId })
}

// Canal Realtime partagé : un client diffuse à chaque action, les autres
// rafraîchissent l'état (positions/avatars/zones) sans recharger.
export function subscribeFlava(sessionId, onPing) {
  const channel = supabase.channel(`flava:session:${sessionId}`, {
    config: { broadcast: { self: false } },
  })
  channel.on('broadcast', { event: 'sync' }, () => onPing()).subscribe()
  return channel
}
export function broadcastFlava(channel) {
  channel.send({ type: 'broadcast', event: 'sync', payload: {} })
}
