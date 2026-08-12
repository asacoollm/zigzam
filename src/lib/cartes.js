import { supabase } from './supabase'

const ERR = 'Oups, une erreur est survenue. Réessaie !'

async function rpc(fn, params) {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) return { error: ERR, _raw: error }
  return { data }
}

export const RARITE_INFO = {
  normale: { label: 'Normale', ordre: 1 },
  rare: { label: 'Rare', ordre: 2 },
  super_rare: { label: 'Super Rare', ordre: 3 },
  incroyable: { label: 'Incroyable', ordre: 4 },
  impossible: { label: 'IMPOSSIBLE', ordre: 5 },
}

export const TYPE_INFO = {
  donut: { emoji: '🍩', label: 'Donut' },
  gemme: { emoji: '💎', label: 'Gemme' },
  lave: { emoji: '🌋', label: 'Lave' },
}

// ---------------- ROULETTE 🎰 ----------------
export async function spinRoulette(userId) {
  const r = await rpc('spin_roulette', { p_user: userId })
  if (r.error) return r
  const e = r.data?.error
  if (e === 'not_enough') return { error: 'Il te faut 5 🍩 pour jouer !' }
  if (e === 'superadmin_exclu') return { error: 'Asacool ne peut pas gagner de cartes 😉' }
  if (e) return { error: ERR }
  return r.data
}

// ---------------- COLLECTION 🃏 ----------------
export async function getMyCards(userId) {
  const r = await rpc('get_my_cards', { p_user: userId })
  return r.error ? [] : r.data
}

// Notifs en attente (transfert de la carte IMPOSSIBLE).
export async function getPendingCardNotifications(userId) {
  const r = await rpc('get_pending_card_notifications', { p_user: userId })
  return r.error ? [] : r.data
}

// ---------------- ADMIN ----------------
export async function adminListBigCardWins(adminId) {
  const r = await rpc('admin_list_big_card_wins', { p_admin: adminId })
  return r.error ? [] : r.data
}
