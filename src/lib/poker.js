// ============================================================
//  Poker Donuts 🃏 — inspiré de « Skull ».
//  L'état partagé (etat) vit en base ; la logique de tour est calculée
//  côté client (fonctions pures ci-dessous) puis persistée via RPC.
//  Récompenses créditées côté serveur (poker_finish).
// ============================================================
import { supabase } from './supabase'

const ERR = 'Oups, une erreur est survenue. Réessaie !'

// ---------- Logique de jeu (pure) ----------
export function playerCardCount(p) {
  return (p.cards ? p.cards.flower + p.cards.skull : 0)
}
function placedFlowers(p) { return (p.stack || []).filter((c) => c === 'flower').length }
function placedSkulls(p) { return (p.stack || []).filter((c) => c === 'skull').length }
export function flowersLeft(p) { return p.cards.flower - placedFlowers(p) }
export function skullLeft(p) { return p.cards.skull - placedSkulls(p) }
export function totalPlaced(etat) { return etat.players.reduce((n, p) => n + (p.stack ? p.stack.length : 0), 0) }
const alive = (p) => !p.out && playerCardCount(p) > 0

// Normalise les joueurs au démarrage (le serveur envoie flowers/skull, on convertit).
export function normPlayers(etat) {
  if (!etat?.players) return etat
  const players = etat.players.map((p) => ({
    ...p,
    cards: p.cards || { flower: p.flowers ?? 3, skull: p.skull ?? 1 },
    stack: p.stack || [],
    roundsWon: p.roundsWon || 0,
    out: !!p.out,
  }))
  return { ...etat, players }
}

function nextAliveTurn(etat, from) {
  const n = etat.players.length
  for (let i = 1; i <= n; i++) {
    const idx = (from + i) % n
    if (alive(etat.players[idx])) return idx
  }
  return from
}

// Pose une carte ('flower' | 'skull') sur sa pile.
export function place(etat, idx, card) {
  const p = etat.players[idx]
  if (card === 'flower' && flowersLeft(p) <= 0) return etat
  if (card === 'skull' && skullLeft(p) <= 0) return etat
  const players = etat.players.map((pl, i) =>
    i === idx ? { ...pl, stack: [...pl.stack, card] } : pl)
  return { ...etat, players, turn: nextAliveTurn({ ...etat, players }, idx),
    log: `${p.pseudo} a posé une carte 🂠` }
}

// Lance un défi (mise initiale).
export function startBid(etat, idx, amount) {
  const max = totalPlaced(etat)
  const amt = Math.max(1, Math.min(amount, max))
  return { ...etat, phase: 'bidding', bid: { amount: amt, bidder: idx }, passed: [],
    turn: nextAliveTurn(etat, idx), log: `${etat.players[idx].pseudo} parie ${amt} carte(s) !` }
}

// Surenchère.
export function raise(etat, idx, amount) {
  const max = totalPlaced(etat)
  if (!etat.bid || amount <= etat.bid.amount || amount > max) return etat
  return { ...etat, bid: { amount, bidder: idx }, turn: nextAliveTurn(etat, idx),
    log: `${etat.players[idx].pseudo} monte à ${amount} !` }
}

// Passe. Quand il ne reste qu'un enchérisseur → phase de retournement.
export function pass(etat, idx) {
  const passed = [...(etat.passed || []), etat.players[idx].user_id]
  const remaining = etat.players.filter((p) => alive(p) && !passed.includes(p.user_id))
  if (remaining.length <= 1) {
    const flipper = etat.bid.bidder
    return { ...etat, phase: 'flipping', passed,
      flip: { flipper, target: etat.bid.amount, revealed: [] },
      log: `${etat.players[flipper].pseudo} doit retourner ${etat.bid.amount} carte(s) !` }
  }
  return { ...etat, passed, turn: nextAliveTurn(etat, idx),
    log: `${etat.players[idx].pseudo} passe.` }
}

// Retourne la carte du dessus de la pile du joueur `owner`.
export function flipCard(etat, owner) {
  const f = etat.flip
  const flipper = f.flipper
  const ownRevealed = f.revealed.filter((r) => r.owner === flipper).length
  const flipperStackLen = etat.players[flipper].stack.length
  // Règle : on retourne d'abord TOUTES ses propres cartes.
  if (ownRevealed < flipperStackLen && owner !== flipper) return etat
  const ownerRevealed = f.revealed.filter((r) => r.owner === owner).length
  const stack = etat.players[owner].stack
  if (ownerRevealed >= stack.length) return etat
  const card = stack[stack.length - 1 - ownerRevealed]
  const revealed = [...f.revealed, { owner, card }]

  if (card === 'skull') {
    return resolveLoss(etat, flipper, revealed)
  }
  if (revealed.length >= f.target) {
    return resolveWin(etat, flipper, revealed)
  }
  return { ...etat, flip: { ...f, revealed },
    log: `🌸 Fleur ! (${revealed.length}/${f.target})` }
}

function resetStacks(etat) {
  return etat.players.map((p) => ({ ...p, stack: [] }))
}

function resolveWin(etat, flipper, revealed) {
  const players = resetStacks(etat).map((p, i) =>
    i === flipper ? { ...p, roundsWon: p.roundsWon + 1 } : p)
  const won = players[flipper].roundsWon
  if (won >= 2) {
    return { ...etat, players, phase: 'game_over', winner: players[flipper].user_id,
      flip: { flipper, target: etat.flip.target, revealed, success: true },
      log: `🏆 ${players[flipper].pseudo} remporte la partie !` }
  }
  return { ...etat, players, phase: 'round_end', round: etat.round + 1, turn: flipper,
    bid: null, passed: [],
    flip: { flipper, target: etat.flip.target, revealed, success: true },
    log: `🎉 ${players[flipper].pseudo} réussit son défi ! (manche ${won}/2)` }
}

function resolveLoss(etat, flipper, revealed) {
  // Le joueur perd une carte au hasard (parmi ses cartes possédées).
  let players = etat.players.map((p, i) => {
    if (i !== flipper) return p
    const pool = []
    for (let k = 0; k < p.cards.flower; k++) pool.push('flower')
    for (let k = 0; k < p.cards.skull; k++) pool.push('skull')
    if (pool.length === 0) return p
    const lost = pool[Math.floor(Math.random() * pool.length)]
    const cards = { ...p.cards, [lost]: p.cards[lost] - 1 }
    const out = cards.flower + cards.skull <= 0
    return { ...p, cards, out }
  })
  players = players.map((p) => ({ ...p, stack: [] }))
  const f = players[flipper]
  // Plus qu'un joueur en vie → il gagne la partie.
  const survivors = players.filter(alive)
  if (survivors.length <= 1 && survivors.length > 0) {
    return { ...etat, players, phase: 'game_over', winner: survivors[0].user_id,
      flip: { flipper, target: etat.flip.target, revealed, success: false },
      log: `🏆 ${survivors[0].pseudo} est le dernier en jeu !` }
  }
  const nextTurn = f.out ? nextAliveTurn({ ...etat, players }, flipper) : flipper
  return { ...etat, players, phase: 'round_end', round: etat.round + 1, turn: nextTurn,
    bid: null, passed: [],
    flip: { flipper, target: etat.flip.target, revealed, success: false },
    log: `💀 Crâne ! ${etat.players[flipper].pseudo} perd une carte.` }
}

// Démarre la manche suivante (retour en pose).
export function nextRound(etat) {
  return { ...etat, phase: 'placing', flip: null, bid: null, passed: [] }
}

// ---------- Stratégie des bots 🤖 (simple) ----------
// Renvoie le prochain état après UNE action du bot `idx` (ou l'état inchangé).
export function botAction(etat, idx) {
  const p = etat.players[idx]
  if (etat.phase === 'placing') {
    const placed = totalPlaced(etat)
    if (placed >= 1 && Math.random() < 0.25) {
      return startBid(etat, idx, Math.max(1, Math.min(placed, 1 + Math.floor(Math.random() * 2))))
    }
    if (flowersLeft(p) > 0 && (skullLeft(p) <= 0 || Math.random() < 0.82)) return place(etat, idx, 'flower')
    if (skullLeft(p) > 0) return place(etat, idx, 'skull')
    return place(etat, idx, 'flower')
  }
  if (etat.phase === 'bidding') {
    const placed = totalPlaced(etat)
    if (etat.bid && etat.bid.amount < placed && Math.random() < 0.3) {
      return raise(etat, idx, etat.bid.amount + 1)
    }
    return pass(etat, idx)
  }
  if (etat.phase === 'flipping' && etat.flip && etat.flip.flipper === idx) {
    const f = etat.flip
    const ownRevealed = f.revealed.filter((r) => r.owner === idx).length
    if (ownRevealed < etat.players[idx].stack.length) return flipCard(etat, idx)
    const candidates = etat.players
      .map((pl, i) => ({ i, left: pl.stack.length - f.revealed.filter((r) => r.owner === i).length }))
      .filter((c) => c.i !== idx && c.left > 0)
    if (candidates.length === 0) return etat
    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    return flipCard(etat, pick.i)
  }
  if (etat.phase === 'round_end') return nextRound(etat)
  return etat
}

// ---------- RPC ----------
async function rpc(fn, params) {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) return { error: ERR }
  return { data }
}
export async function pokerJoin(userId) {
  const r = await rpc('poker_join', { p_user: userId })
  return r.error ? r : r.data
}
export async function pokerStart(sessionId, userId) {
  const r = await rpc('poker_start', { p_session: sessionId, p_user: userId })
  return r.error ? r : r.data
}
export async function pokerSave(sessionId, userId, etat, statut = '') {
  const r = await rpc('poker_save', { p_session: sessionId, p_user: userId, p_etat: etat, p_statut: statut })
  return r.error ? r : r.data
}
export async function pokerFinish(sessionId, winnerId) {
  const r = await rpc('poker_finish', { p_session: sessionId, p_winner: winnerId })
  return r.error ? r : r.data
}
export async function pokerState(sessionId) {
  const r = await rpc('poker_state', { p_session: sessionId })
  return r.error ? r : r.data
}
export async function pokerLeave(sessionId, userId) {
  return rpc('poker_leave', { p_session: sessionId, p_user: userId })
}
export async function pokerAddBot(sessionId) {
  const r = await rpc('poker_add_bot', { p_session: sessionId })
  return r.error ? r : r.data
}
export async function pokerRemoveBot(sessionId) {
  const r = await rpc('poker_remove_bot', { p_session: sessionId })
  return r.error ? r : r.data
}

export function subscribePoker(sessionId, onPing) {
  const channel = supabase.channel(`poker:${sessionId}`, { config: { broadcast: { self: false } } })
  channel.on('broadcast', { event: 'sync' }, () => onPing()).subscribe()
  return channel
}
export function broadcastPoker(channel) {
  channel.send({ type: 'broadcast', event: 'sync', payload: {} })
}
