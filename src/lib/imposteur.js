// ============================================================
//  L'Imposteur 🕵️ — RPC + Realtime.
//  L'imposteur, le pseudo usurpé, les positions, le chat et les votes
//  sont gérés en base (sécurisé). Synchro temps réel via broadcast.
// ============================================================
import { supabase } from './supabase'

const ERR = 'Oups, une erreur est survenue. Réessaie !'
export const GAME_DURATION_MS = 2 * 60 * 1000 // 2 minutes de balade + chat

async function rpc(fn, params) {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) return { error: ERR }
  return { data }
}

export async function imposteurJoin(userId) {
  const r = await rpc('imposteur_join', { p_user: userId })
  return r.error ? r : r.data
}
export async function imposteurState(sessionId, userId) {
  const r = await rpc('imposteur_state', { p_session: sessionId, p_user: userId })
  return r.error ? r : r.data
}
export async function imposteurMove(sessionId, userId, x, y) {
  return rpc('imposteur_move', { p_session: sessionId, p_user: userId, p_x: x, p_y: y })
}
export async function imposteurChat(sessionId, userId, text) {
  const r = await rpc('imposteur_chat', { p_session: sessionId, p_user: userId, p_text: text })
  return r.error ? r : r.data
}
export async function imposteurSetVoting(sessionId) {
  return rpc('imposteur_set_voting', { p_session: sessionId })
}
export async function imposteurVote(sessionId, userId, targetId) {
  const r = await rpc('imposteur_vote', { p_session: sessionId, p_user: userId, p_target: targetId })
  return r.error ? r : r.data
}
export async function imposteurResolve(sessionId) {
  const r = await rpc('imposteur_resolve', { p_session: sessionId })
  return r.error ? r : r.data
}
export async function imposteurLeave(sessionId, userId) {
  return rpc('imposteur_leave', { p_session: sessionId, p_user: userId })
}

export function subscribeImposteur(sessionId, onPing) {
  const channel = supabase.channel(`imposteur:${sessionId}`, { config: { broadcast: { self: false } } })
  channel.on('broadcast', { event: 'sync' }, () => onPing()).subscribe()
  return channel
}
export function broadcastImposteur(channel) {
  channel.send({ type: 'broadcast', event: 'sync', payload: {} })
}
