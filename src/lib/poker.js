// ============================================================
//  Poker Donuts 🃏 — implémentation fidèle de « Skull ».
//  L'état partagé (etat) vit en base ; la logique de tour est calculée
//  côté client (fonctions PURES ci-dessous) puis persistée via RPC.
//  Récompenses créditées côté serveur (poker_finish).
//
//  État d'un joueur :
//   { user_id, pseudo, avatar, role, is_bot,
//     disks:{flower,skull},  // disques POSSÉDÉS (persistent)
//     bonus:0|1,             // disque « Dernière chance » 🍀 actif cette manche
//     bonusPending:false,    // 🍀 accordé pour la PROCHAINE manche
//     lastChanceUsed:false,
//     stack:[],              // disques posés cette manche ('flower'|'skull')
//     mat:'blank'|'flower',  // tapis (face fleur = a déjà gagné une manche)
//     out:false, passed:false }
// ============================================================
import { supabase } from './supabase'

const ERR = 'Oups, une erreur est survenue. Réessaie !'

// ---------- Helpers ----------
export const alive = (p) => !p.out
export function ownedTotal(p) { return p.disks.flower + p.disks.skull }
function placedFlowers(p) { return p.stack.filter((d) => d === 'flower').length }
function placedSkulls(p) { return p.stack.filter((d) => d === 'skull').length }
export function flowersLeft(p) { return p.disks.flower + (p.bonus || 0) - placedFlowers(p) }
export function skullLeft(p) { return p.disks.skull - placedSkulls(p) }
export function totalPlaced(etat) {
  return etat.players.reduce((n, p) => n + p.stack.length, 0)
}

function aliveOrderFrom(players, start) {
  const n = players.length
  const out = []
  for (let i = 1; i < n; i++) {
    const idx = (start + i) % n
    if (alive(players[idx])) out.push(idx)
  }
  return out // joueurs vivants APRÈS `start` (n'inclut pas `start`)
}
function nextAlive(players, from) {
  const o = aliveOrderFrom(players, from)
  return o.length ? o[0] : from
}
function nextActiveBidder(players, from) {
  const n = players.length
  for (let i = 1; i <= n; i++) {
    const idx = (from + i) % n
    if (alive(players[idx]) && !players[idx].passed) return idx
  }
  return from
}

// ---------- Démarrage ----------
export function initGame(joueurs, firstPlayer = 0) {
  const players = joueurs.map((j) => ({
    user_id: j.user_id, pseudo: j.pseudo, avatar: j.avatar, role: j.role, is_bot: !!j.is_bot,
    disks: { flower: 3, skull: 1 }, bonus: 0, bonusPending: false, lastChanceUsed: false,
    stack: [], mat: 'blank', out: false, passed: false,
  }))
  return startRound({ players, round: 1, firstPlayer }, firstPlayer)
}

// Nouvelle manche : récupère les disques, applique la « Dernière chance »,
// lance la PRÉPARATION (chacun pose 1 disque, le 1er joueur en dernier).
export function startRound(state, firstPlayer) {
  let fp = firstPlayer
  if (state.players[fp].out) fp = nextAlive(state.players, fp)
  const players = state.players.map((p) => ({
    ...p,
    stack: [],
    passed: false,
    bonus: p.bonusPending ? 1 : 0,   // le 🍀 en attente devient actif cette manche
    bonusPending: false,
  }))
  // Ordre de préparation : tous les vivants après le 1er joueur, puis le 1er joueur.
  const prepOrder = [...aliveOrderFrom(players, fp), fp].filter((idx) => alive(players[idx]))
  return {
    ...state, players, firstPlayer: fp,
    phase: 'placing', prep: true, prepOrder, prepIndex: 0, turn: prepOrder[0],
    bid: null, resolve: null, winner: null,
    log: `Manche ${state.round} — préparation : chacun pose un disque.`,
  }
}

// ---------- Actions ----------
export function placeDisk(etat, idx, kind) {
  const p = etat.players[idx]
  if (kind === 'flower' && flowersLeft(p) <= 0) return etat
  if (kind === 'skull' && skullLeft(p) <= 0) return etat
  const players = etat.players.map((pl, i) => (i === idx ? { ...pl, stack: [...pl.stack, kind] } : pl))
  if (etat.prep) {
    const prepIndex = etat.prepIndex + 1
    if (prepIndex < etat.prepOrder.length) {
      return { ...etat, players, prepIndex, turn: etat.prepOrder[prepIndex],
        log: `${p.pseudo} a posé son disque.` }
    }
    return { ...etat, players, prep: false, prepIndex, turn: etat.firstPlayer,
      log: `À ${players[etat.firstPlayer].pseudo} de poser ou lancer un défi.` }
  }
  return { ...etat, players, turn: nextAlive(players, idx),
    log: `${p.pseudo} a posé un disque.` }
}

export function launchChallenge(etat, idx, amount) {
  if (etat.prep) return etat
  const max = totalPlaced(etat)
  const amt = Math.max(1, Math.min(amount, max))
  const players = etat.players.map((p) => ({ ...p, passed: false }))
  return { ...etat, players, phase: 'bidding', bid: { amount: amt, bidder: idx },
    turn: nextActiveBidder(players, idx),
    log: `${etat.players[idx].pseudo} parie ${amt} disque(s) !` }
}

export function raise(etat, idx, amount) {
  const max = totalPlaced(etat)
  if (!etat.bid || amount <= etat.bid.amount || amount > max) return etat
  return { ...etat, bid: { amount, bidder: idx }, turn: nextActiveBidder(etat.players, idx),
    log: `${etat.players[idx].pseudo} surenchérit à ${amount} !` }
}

export function pass(etat, idx) {
  const players = etat.players.map((p, i) => (i === idx ? { ...p, passed: true } : p))
  const remaining = players.filter((p) => alive(p) && !p.passed)
  if (remaining.length <= 1) {
    const challenger = etat.bid.bidder
    return { ...etat, players, phase: 'resolving',
      resolve: { challenger, target: etat.bid.amount, revealed: [] }, turn: challenger,
      log: `${players[challenger].pseudo} doit retourner ${etat.bid.amount} disque(s) — en commençant par les siens.` }
  }
  return { ...etat, players, turn: nextActiveBidder(players, idx),
    log: `${etat.players[idx].pseudo} passe.` }
}

// Retourne le disque du dessus de la pile du joueur `owner`.
export function flipDisk(etat, owner) {
  const r = etat.resolve
  const ch = r.challenger
  const ownRevealed = r.revealed.filter((x) => x.owner === ch).length
  // Règle : on retourne d'abord TOUS ses propres disques.
  if (ownRevealed < etat.players[ch].stack.length && owner !== ch) return etat
  const ownerRevealed = r.revealed.filter((x) => x.owner === owner).length
  const stack = etat.players[owner].stack
  if (ownerRevealed >= stack.length) return etat
  const disk = stack[stack.length - 1 - ownerRevealed]
  const revealed = [...r.revealed, { owner, disk }]

  if (disk === 'skull') return resolveFail(etat, ch, revealed)
  if (revealed.length >= r.target) return resolveWin(etat, ch, revealed)
  return { ...etat, resolve: { ...r, revealed }, log: `🌸 Fleur ! (${revealed.length}/${r.target})` }
}

function resolveWin(etat, ch, revealed) {
  const players = etat.players.map((p) => ({ ...p }))
  const challenger = players[ch]
  // Tapis déjà côté fleur → victoire de la partie.
  if (challenger.mat === 'flower') {
    return { ...etat, players, phase: 'game_over', winner: challenger.user_id,
      resolve: { ...etat.resolve, revealed, success: true },
      log: `🏆 ${challenger.pseudo} remporte la partie !` }
  }
  challenger.mat = 'flower'
  return { ...etat, players, phase: 'round_end', pendingFirst: ch,
    resolve: { ...etat.resolve, revealed, success: true },
    log: `🎉 ${challenger.pseudo} réussit son défi et retourne son tapis !` }
}

function resolveFail(etat, ch, revealed) {
  const players = etat.players.map((p) => ({ ...p, disks: { ...p.disks } }))
  const c = players[ch]
  // Le challenger perd un disque (au hasard parmi ceux qu'il possède).
  const pool = []
  for (let i = 0; i < c.disks.flower; i++) pool.push('flower')
  for (let i = 0; i < c.disks.skull; i++) pool.push('skull')
  if (pool.length > 0) {
    const lost = pool[Math.floor(Math.random() * pool.length)]
    c.disks[lost] -= 1
  }
  // S'il jouait avec la « Dernière chance », un échec l'élimine.
  if (c.bonus > 0) { c.out = true; c.bonus = 0 }
  if (ownedTotal(c) <= 0) {
    c.out = true
  } else if (ownedTotal(c) === 1 && !c.lastChanceUsed) {
    // Avant-dernier disque perdu → reçoit le 🍀 pour la prochaine manche.
    c.lastChanceUsed = true
    c.bonusPending = true
  }

  const survivors = players.filter(alive)
  if (survivors.length <= 1) {
    return { ...etat, players, phase: 'game_over', winner: survivors[0]?.user_id,
      resolve: { ...etat.resolve, revealed, success: false },
      log: `🏆 ${survivors[0]?.pseudo} est le dernier en jeu !` }
  }
  return { ...etat, players, phase: 'round_end', pendingFirst: ch,
    resolve: { ...etat.resolve, revealed, success: false },
    log: `💀 Crâne ! ${c.pseudo} perd un disque${c.out ? ' et est éliminé' : ''}.` }
}

// Lance la manche suivante (l'ancien challenger devient 1er joueur).
export function nextRound(etat) {
  let first = etat.pendingFirst
  if (etat.players[first]?.out) first = nextAlive(etat.players, first)
  return startRound({ ...etat, round: etat.round + 1 }, first)
}

// ---------- Bots 🤖 ----------
export function botAction(etat, idx) {
  const p = etat.players[idx]
  if (etat.phase === 'placing') {
    const canFlower = flowersLeft(p) > 0
    const canSkull = skullLeft(p) > 0
    const max = totalPlaced(etat)
    // En décision : on DOIT lancer un défi si on ne peut plus poser (règle Skull),
    // ou on en lance un de temps en temps.
    const mustChallenge = !etat.prep && !canFlower && !canSkull
    const wantsChallenge = !etat.prep && max >= 1 && Math.random() < 0.25
    if ((mustChallenge || wantsChallenge) && max >= 1) {
      return launchChallenge(etat, idx, Math.max(1, Math.min(max, 1 + Math.floor(Math.random() * 2))))
    }
    if (canFlower && (!canSkull || Math.random() < 0.8)) return placeDisk(etat, idx, 'flower')
    if (canSkull) return placeDisk(etat, idx, 'skull')
    return etat // ne devrait plus arriver (défi forcé ci-dessus)
  }
  if (etat.phase === 'bidding') {
    const max = totalPlaced(etat)
    if (etat.bid && etat.bid.amount < max && Math.random() < 0.25) {
      return raise(etat, idx, etat.bid.amount + 1)
    }
    return pass(etat, idx)
  }
  if (etat.phase === 'resolving' && etat.resolve && etat.resolve.challenger === idx) {
    const r = etat.resolve
    const ownRevealed = r.revealed.filter((x) => x.owner === idx).length
    if (ownRevealed < etat.players[idx].stack.length) return flipDisk(etat, idx)
    const cands = etat.players
      .map((pl, i) => ({ i, left: pl.stack.length - r.revealed.filter((x) => x.owner === i).length }))
      .filter((c) => c.i !== idx && c.left > 0)
    if (cands.length === 0) return etat
    return flipDisk(etat, cands[Math.floor(Math.random() * cands.length)].i)
  }
  if (etat.phase === 'round_end') return nextRound(etat)
  return etat
}

// Index de l'acteur dont c'est le tour (pour piloter les bots côté hôte).
export function actorIndex(etat) {
  if (!etat) return -1
  if (etat.phase === 'placing' || etat.phase === 'bidding') return etat.turn
  if (etat.phase === 'resolving' && etat.resolve) return etat.resolve.challenger
  if (etat.phase === 'round_end') {
    let f = etat.pendingFirst
    if (etat.players[f]?.out) f = nextAlive(etat.players, f)
    return f
  }
  return -1
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
