import { supabase } from './supabase'

// ============================================================
//  Helpers RPC pour tous les modules Zigzam.
//  Convention : chaque fonction renvoie les données, ou { error } en cas d'échec.
// ============================================================

const ERR = 'Oups, une erreur est survenue. Réessaie !'

async function rpc(fn, params) {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) return { error: ERR, _raw: error }
  return { data }
}

// ---------------- DISCUTER ----------------
export async function getDiscussions(userId) {
  const r = await rpc('get_discussions', { p_user: userId })
  return r.error ? [] : r.data
}
export async function getPublicDiscussions(userId) {
  const r = await rpc('get_public_discussions', { p_user: userId })
  return r.error ? [] : r.data
}
export async function createDiscussion(createurId, titre, type, numeros) {
  const r = await rpc('create_discussion', {
    p_createur: createurId, p_titre: titre, p_type: type, p_numeros: numeros,
  })
  return r.error ? r : { id: r.data }
}
export async function addParticipants(discussionId, numeros) {
  return rpc('add_participants', { p_discussion: discussionId, p_numeros: numeros })
}
export async function joinDiscussion(userId, discussionId) {
  return rpc('join_discussion', { p_user: userId, p_discussion: discussionId })
}
export async function leaveDiscussion(userId, discussionId) {
  return rpc('leave_discussion', { p_user: userId, p_discussion: discussionId })
}
export async function deleteDiscussion(discussionId, userId) {
  const r = await rpc('delete_discussion', { p_discussion: discussionId, p_user: userId })
  return r.error ? r : { status: r.data }
}
export async function markRead(userId, discussionId) {
  return rpc('mark_read', { p_user: userId, p_discussion: discussionId })
}
export async function getMessages(discussionId) {
  const r = await rpc('get_messages', { p_discussion: discussionId })
  return r.error ? [] : r.data
}
export async function sendMessage(discussionId, auteurId, contenu) {
  const r = await rpc('send_message', {
    p_discussion: discussionId, p_auteur: auteurId, p_contenu: contenu,
  })
  return r.error ? r : { message: r.data }
}

// Realtime via canal "broadcast" (pas besoin de policies RLS).
// Renvoie le canal ; appeler channel.unsubscribe() au démontage.
export function subscribeToDiscussion(discussionId, onMessage) {
  const channel = supabase.channel(`discussion:${discussionId}`, {
    config: { broadcast: { self: false } },
  })
  channel
    .on('broadcast', { event: 'message' }, (payload) => onMessage(payload.payload))
    .subscribe()
  return channel
}
export function broadcastMessage(channel, message) {
  channel.send({ type: 'broadcast', event: 'message', payload: message })
}

// ---------------- ACTUALITÉS ----------------
export async function getActus() {
  const r = await rpc('get_actus')
  return r.error ? [] : r.data
}
export async function createActu(auteurId, titre, contenu, image) {
  const r = await rpc('create_actu', {
    p_auteur: auteurId, p_titre: titre, p_contenu: contenu, p_image: image || '',
  })
  if (r.error) return r
  if (r.data?.error === 'not_enough_donuts') {
    return { error: 'Il te faut 10 🍩 donuts pour publier une nouvelle actu.' }
  }
  return { ok: true, donuts: r.data.donuts, id: r.data.id }
}
export async function viewActu(actuId, userId) {
  const r = await rpc('view_actu', { p_actu: actuId, p_user: userId })
  return r.error ? {} : r.data
}
export async function getComments(actuId) {
  const r = await rpc('get_comments', { p_actu: actuId })
  return r.error ? [] : r.data
}
export async function addComment(actuId, auteurId, contenu) {
  const r = await rpc('add_comment', { p_actu: actuId, p_auteur: auteurId, p_contenu: contenu })
  return r.error ? r : { comment: r.data }
}

// ---------------- ADMIN ----------------
export async function adminListUsers(adminId) {
  const r = await rpc('admin_list_users', { p_admin: adminId })
  return r.error ? [] : r.data
}
export async function adminCreateUser(adminId, pseudo, password) {
  const r = await rpc('admin_create_user', { p_admin: adminId, p_pseudo: pseudo, p_password: password })
  if (r.error) return r
  if (r.data?.error === 'pseudo_pris') return { error: 'Ce pseudo est déjà pris.' }
  if (r.data?.error) return { error: ERR }
  return { ok: true }
}
export async function adminSetBalance(adminId, userId, donuts, gemmes) {
  const r = await rpc('admin_set_balance', {
    p_admin: adminId, p_user: userId, p_donuts: donuts, p_gemmes: gemmes,
  })
  return r.error ? r : { status: r.data }
}
export async function adminDeleteUser(adminId, userId) {
  const r = await rpc('admin_delete_user', { p_admin: adminId, p_user: userId })
  return r.error ? r : { status: r.data }
}
export async function getPendingActus(adminId) {
  const r = await rpc('get_pending_actus', { p_admin: adminId })
  return r.error ? [] : r.data
}
export async function moderateActu(adminId, actuId, statut) {
  const r = await rpc('moderate_actu', { p_admin: adminId, p_actu: actuId, p_statut: statut })
  return r.error ? r : { status: r.data }
}

// ---------------- ÉCONOMIE ----------------
export async function exchange(userId, sens) {
  const r = await rpc('exchange', { p_user: userId, p_sens: sens })
  if (r.error) return r
  if (r.data?.error === 'not_enough') return { error: 'Solde insuffisant.' }
  if (r.data?.error) return { error: ERR }
  return { ok: true, donuts: r.data.donuts, gemmes: r.data.gemmes }
}
export async function sendValue(fromId, numero, devise, montant) {
  const r = await rpc('send_value', {
    p_from: fromId, p_numero: numero, p_devise: devise, p_montant: montant,
  })
  if (r.error) return r
  const e = r.data?.error
  if (e === 'numero_introuvable') return { error: 'Aucun élève avec ce numéro.' }
  if (e === 'soi_meme') return { error: 'Tu ne peux pas t’envoyer à toi-même 😅' }
  if (e === 'not_enough') return { error: 'Solde insuffisant.' }
  if (e) return { error: ERR }
  return { ok: true, donuts: r.data.donuts, gemmes: r.data.gemmes }
}
export async function getTransactions(userId) {
  const r = await rpc('get_transactions', { p_user: userId })
  return r.error ? [] : r.data
}

// ---------------- PARAMÈTRES ----------------
export async function changePassword(userId, oldPwd, newPwd) {
  const r = await rpc('change_password', { p_user: userId, p_old: oldPwd, p_new: newPwd })
  if (r.error) return r
  if (r.data === 'mauvais_mdp') return { error: 'Ton mot de passe actuel est incorrect.' }
  return { ok: true }
}
export async function changePseudo(userId, pseudo) {
  const r = await rpc('change_pseudo', { p_user: userId, p_pseudo: pseudo })
  if (r.error) return r
  if (r.data === 'pseudo_pris') return { error: 'Ce pseudo est déjà pris.' }
  return { ok: true }
}

// ---------------- CONTACTS ----------------
export async function getContacts(userId) {
  const r = await rpc('get_contacts', { p_user: userId })
  return r.error ? [] : r.data
}
export async function addContact(userId, numero) {
  const r = await rpc('add_contact', { p_user: userId, p_numero: numero })
  if (r.error) return r
  const e = r.data?.error
  if (e === 'numero_introuvable') return { error: 'Aucun élève avec ce numéro.' }
  if (e === 'soi_meme') return { error: 'C’est ton propre numéro 😄' }
  if (e) return { error: ERR }
  return { ok: true, contact: r.data.contact }
}
export async function removeContact(userId, contactId) {
  return rpc('remove_contact', { p_user: userId, p_contact: contactId })
}
export async function searchUsers(query) {
  const r = await rpc('search_users', { p_query: query })
  return r.error ? [] : r.data
}

// ---------------- DASHBOARD ----------------
export async function getBadges(userId) {
  const r = await rpc('get_badges', { p_user: userId })
  return r.error ? { discuter: 0, actus: 0 } : r.data
}
