import { supabase } from './supabase'

// ============================================================
//  Farces d'Halloween 🎃 — helpers RPC + temps réel.
//  Même convention que src/lib/modules.js : chaque fonction renvoie les
//  données, ou { error } en cas d'échec.
// ============================================================

const ERR = 'Oups, une erreur est survenue. Réessaie !'

async function rpc(fn, params) {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) return { error: ERR, _raw: error }
  return { data }
}

// Les 4 farces prédéfinies — aucun texte libre, jamais effrayantes.
export const TYPES_FARCES = [
  { id: 'araignee', emoji: '🕷️', label: 'Araignée mignonne' },
  { id: 'fantome', emoji: '👻', label: 'Fantôme qui dit Bouh !' },
  { id: 'chauves_souris', emoji: '🦇', label: 'Nuée de chauves-souris' },
  { id: 'citrouille', emoji: '🎃', label: 'Citrouille rigolote' },
]

const MESSAGES_ERREUR = {
  type_invalide: 'Farce inconnue.',
  soi_meme: 'Tu ne peux pas te faire une farce à toi-même 😅',
  saison_inactive: 'Les farces d’Halloween ne sont possibles que pendant la saison.',
  farces_coupees: 'Les farces sont désactivées pour le moment.',
  expediteur_introuvable: ERR,
  dest_introuvable: 'Cet élève est introuvable.',
  destinataire_refuse: 'Cet élève ne veut pas recevoir de farces.',
  limite_quotidienne: 'Tu as déjà envoyé 5 farces aujourd’hui, reviens demain !',
  limite_destinataire: 'Tu as déjà envoyé 2 farces à cette personne aujourd’hui.',
  not_enough_donuts: 'Tu n’as pas assez de donuts 🍩 pour cette farce.',
}

// ---------------- Réglages ----------------
export async function getFarcesReglages() {
  const r = await rpc('get_farces_reglages', {})
  return r.error ? { prix: 10, actives: true } : r.data
}

// ---------------- Envoi ----------------
export async function sendFarce(expediteurId, destinataireId, type) {
  const r = await rpc('send_farce', {
    p_expediteur: expediteurId, p_destinataire: destinataireId, p_type: type,
  })
  if (r.error) return r
  if (r.data?.error) return { error: MESSAGES_ERREUR[r.data.error] || ERR }
  return r.data // { ok, donuts, prix, destinataire_pseudo, expediteur_pseudo }
}

// ---------------- Réception ----------------
export async function getMyFarcesNonVues(userId) {
  const r = await rpc('get_my_farces_non_vues', { p_user: userId })
  return r.error ? [] : r.data
}
export async function markFarceVue(userId, farceId) {
  return rpc('mark_farce_vue', { p_user: userId, p_id: farceId })
}

// ---------------- Opt-out ----------------
export async function getFarcesDesactivees(userId) {
  const r = await rpc('get_farces_desactivees', { p_user: userId })
  return r.error ? false : !!r.data?.desactivees
}
export async function setFarcesDesactivees(userId, valeur) {
  const r = await rpc('set_farces_desactivees', { p_user: userId, p_valeur: valeur })
  return r.error ? r : { ok: true, desactivees: !!r.data?.desactivees }
}

// ---------------- Superadmin ----------------
export async function adminListFarces(adminId) {
  const r = await rpc('admin_list_farces', { p_admin: adminId })
  return r.error ? [] : r.data
}
export async function adminSetFarcesActives(adminId, actif) {
  const r = await rpc('admin_set_farces_actives', { p_admin: adminId, p_actif: actif })
  return r.error ? r : { ok: true, actives: !!r.data?.actives }
}

// ============================================================
//  Realtime — canal broadcast partagé « zigzam:farce », même modèle que
//  « zigzam:saison » dans modules.js : un seul canal réutilisé à la fois
//  pour l'écoute (FarceOverlay) et l'émission (après un send_farce réussi).
//  Chaque client filtre lui-même les payloads qui le concernent
//  (self: false → l'émetteur ne se re-notifie pas lui-même).
// ============================================================
let farceChannel = null
let onFarceReceived = null
function getFarceChannel() {
  if (!farceChannel) {
    farceChannel = supabase.channel('zigzam:farce', {
      config: { broadcast: { self: false } },
    })
    farceChannel.on('broadcast', { event: 'farce' }, (payload) => {
      if (onFarceReceived) onFarceReceived(payload.payload)
    })
    farceChannel.subscribe()
  }
  return farceChannel
}
// FarceOverlay : écoute les farces diffusées en direct. `onReceived` reçoit
// { destinataire_id, id, type, expediteur_pseudo, created_at }.
// Renvoie une fonction de désabonnement.
export function subscribeToFarce(onReceived) {
  getFarceChannel()
  onFarceReceived = onReceived
  return () => { onFarceReceived = null }
}
// Après un envoi réussi : prévient les autres clients connectés (le serveur
// ne pousse rien tout seul, c'est l'émetteur qui diffuse — même logique que
// broadcastMessage / broadcastSaison).
export function broadcastFarce(farce) {
  if (!farce) return
  getFarceChannel().send({ type: 'broadcast', event: 'farce', payload: farce })
}
