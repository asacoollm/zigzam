import { supabase } from './supabase'

// ============================================================
//  Helpers RPC — Tenues d'avatar sauvegardées 👗 (« loadouts »).
//  Même convention que src/lib/modules.js : chaque fonction renvoie
//  les données, ou { error } en cas d'échec.
//  Backend : migration supabase/migrations/20260902201523_avatar_loadouts.sql
// ============================================================

const ERR = 'Oups, une erreur est survenue. Réessaie !'

async function rpc(fn, params) {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) return { error: ERR, _raw: error }
  return { data }
}

// Enregistre une nouvelle tenue (snapshot complet de l'objet avatar).
// Renvoie { ok: true, id } ou { error: 'trop_de_looks' | <message> }.
export async function saveAvatarLoadout(userId, nom, avatar) {
  const r = await rpc('save_avatar_loadout', {
    p_user: userId, p_nom: nom || '', p_avatar: avatar,
  })
  if (r.error) return r
  if (r.data?.error === 'trop_de_looks') return { error: 'trop_de_looks' }
  if (r.data?.error) return { error: ERR }
  return { ok: true, id: r.data.id }
}

// Toutes les tenues sauvegardées de l'élève (les plus récentes d'abord).
// Chaque entrée : { id, nom, avatar, date_creation }.
export async function getMyAvatarLoadouts(userId) {
  const r = await rpc('get_my_avatar_loadouts', { p_user: userId })
  return r.error ? [] : (r.data || [])
}

// Supprime une tenue de l'élève. Renvoie { ok: true } ou { error: 'introuvable' | <message> }.
export async function deleteAvatarLoadout(userId, loadoutId) {
  const r = await rpc('delete_avatar_loadout', { p_user: userId, p_id: loadoutId })
  if (r.error) return r
  if (r.data?.error === 'introuvable') return { error: 'introuvable' }
  if (r.data?.error) return { error: ERR }
  return { ok: true }
}
