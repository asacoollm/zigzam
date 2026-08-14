import { supabase } from './supabase'

// ============================================================
//  Map Zigzam 🗺️ — helpers RPC : coffre du jour + boutique par pays.
// ============================================================

const ERR = 'Oups, une erreur est survenue. Réessaie !'

async function rpc(fn, params) {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) return { error: ERR, _raw: error }
  return { data }
}

// ---------------- Coffre du jour ----------------
export async function getMapCoffreState(userId, paysSlug) {
  const r = await rpc('get_map_coffre_state', { p_user: userId, p_pays_slug: paysSlug })
  return r.error ? { error: r.error } : r.data
}
export async function openMapCoffre(userId, paysSlug) {
  const r = await rpc('open_map_coffre', { p_user: userId, p_pays_slug: paysSlug })
  return r.error ? { error: r.error } : r.data
}

// ---------------- Boutique ----------------
export async function getMapBoutique(paysSlug) {
  const r = await rpc('get_map_boutique', { p_pays_slug: paysSlug })
  return r.error ? [] : r.data
}
export async function getMyMapAchats(userId) {
  const r = await rpc('get_my_map_achats', { p_user: userId })
  return r.error ? [] : r.data
}
export async function buyMapArticle(userId, articleId) {
  const r = await rpc('buy_map_article', { p_user: userId, p_article_id: articleId })
  return r.error ? { error: r.error } : r.data
}
