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
// Mes actus (tous statuts) — pour afficher le badge « en attente » à l'auteur.
export async function getMyActus(userId) {
  const r = await rpc('get_my_actus', { p_user: userId })
  return r.error ? [] : r.data
}
// Upload d'une photo vers le bucket Storage "actualites". Renvoie { url } public.
export async function uploadActuImage(userId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage
    .from('actualites')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) return { error: "Impossible d'envoyer la photo, réessaie 📷" }
  const { data } = supabase.storage.from('actualites').getPublicUrl(path)
  return { url: data.publicUrl }
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

// Achat du « Skin sur mesure » : débite 20 💎, ouvre une discussion avec Asacool
// et y poste un message « Achat vérifié ». Tout est fait côté serveur (anti-triche).
export async function buyCustomSkin(userId, description, reference) {
  const r = await rpc('buy_custom_skin', {
    p_user: userId, p_description: description || '', p_reference: reference || '',
  })
  if (r.error) return r
  const e = r.data?.error
  if (e === 'not_enough') return { error: 'Pas assez de gemmes 💎 (il en faut 20)' }
  if (e === 'asacool_introuvable') return { error: 'Asacool est introuvable, réessaie plus tard.' }
  if (e) return { error: ERR }
  return { ok: true, gemmes: r.data.gemmes, discussionId: r.data.discussion_id }
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
// Liste des actus d'un statut donné ('en_attente' | 'publie' | 'refuse') pour le panel admin.
export async function getAdminActus(adminId, statut) {
  const r = await rpc('get_admin_actus', { p_admin: adminId, p_statut: statut })
  return r.error ? [] : r.data
}
// Change le rôle d'un utilisateur (superadmin only). new_role : 'user' | 'admin'.
export async function setUserRole(adminId, targetId, newRole) {
  const r = await rpc('set_user_role', { p_admin: adminId, p_target: targetId, p_role: newRole })
  return r.error ? r : { status: r.data }
}
export async function moderateActu(adminId, actuId, statut) {
  const r = await rpc('moderate_actu', { p_admin: adminId, p_actu: actuId, p_statut: statut })
  return r.error ? r : { status: r.data }
}
// Superadmin : réinitialise le mot de passe d'un membre (→ premiere_connexion).
export async function resetUserPassword(adminId, targetId, newPassword) {
  const r = await rpc('reset_password', { p_admin: adminId, p_target: targetId, p_new: newPassword })
  if (r.error) return r
  const e = r.data?.error
  if (e === 'forbidden') return { error: 'Permission refusée.' }
  if (e === 'empty') return { error: 'Entre un nouveau mot de passe.' }
  if (e) return { error: ERR }
  return { ok: true }
}
// Superadmin : change le numéro d'un membre (4 chiffres, unique).
export async function resetUserNumero(adminId, targetId, numero) {
  const r = await rpc('reset_numero', { p_admin: adminId, p_target: targetId, p_numero: numero })
  if (r.error) return r
  const e = r.data?.error
  if (e === 'forbidden') return { error: 'Permission refusée.' }
  if (e === 'numero_invalide') return { error: 'Le numéro doit avoir exactement 4 chiffres.' }
  if (e === 'numero_pris') return { error: `Ce numéro est déjà utilisé par ${r.data.pseudo}.` }
  if (e) return { error: ERR }
  return { ok: true }
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

export async function deleteComment(adminId, commentId) {
  const r = await rpc('delete_comment', { p_admin: adminId, p_comment: commentId })
  return r.error ? r : { status: r.data }
}

// ---------------- CODES D'INVITATION ----------------
export async function validateInviteCode(code) {
  const r = await rpc('validate_invite_code', { p_code: code.trim().toUpperCase() })
  return r.error ? false : r.data === true
}
export async function signupWithCode(code, pseudo, password) {
  const r = await rpc('signup_with_code', {
    p_code: code.trim().toUpperCase(), p_pseudo: pseudo.trim(), p_password: password,
  })
  if (r.error) return r
  if (r.data?.error === 'code_invalide') return { error: "Ce code d'invitation n'est pas valide 😕" }
  if (r.data?.error === 'pseudo_pris') return { error: 'Ce pseudo est déjà pris, choisis-en un autre 🙂' }
  if (r.data?.error) return { error: ERR }
  return { ok: true }
}
export async function createInviteCode(adminId, code) {
  const r = await rpc('create_invite_code', { p_admin: adminId, p_code: code || '' })
  if (r.error) return r
  if (r.data?.error) return { error: r.data.error === 'code_existe' ? 'Ce code existe déjà.' : ERR }
  return { ok: true, code: r.data.code }
}
export async function listInviteCodes(adminId) {
  const r = await rpc('list_invite_codes', { p_admin: adminId })
  return r.error ? [] : r.data
}
export async function toggleInviteCode(adminId, id, actif) {
  return rpc('toggle_invite_code', { p_admin: adminId, p_id: id, p_actif: actif })
}

// ---------------- CONTRÔLE PARENTAL ----------------
export async function getParental(userId) {
  const r = await rpc('get_parental', { p_user: userId })
  return r.error ? { configured: false } : r.data
}
export async function setParental(userId, code) {
  const r = await rpc('set_parental', { p_user: userId, p_code: code })
  return r.error ? r : { status: r.data }
}
export async function verifyParentalCode(userId, code) {
  const r = await rpc('verify_parental_code', { p_user: userId, p_code: code })
  return r.error ? false : r.data === true
}
export async function updateParental(userId, code, duree, debut, fin, modules, actif) {
  const r = await rpc('update_parental', {
    p_user: userId, p_code: code, p_duree: duree,
    p_debut: debut || '', p_fin: fin || '', p_modules: modules, p_actif: actif,
  })
  if (r.error) return r
  if (r.data === 'mauvais_code') return { error: 'Code parental incorrect.' }
  return { ok: true }
}

// ---------------- PRÉSENCE « QUI EST EN LIGNE ? » ----------------
// Heartbeat : marque l'utilisateur comme actif maintenant.
export async function pingActivity(userId) {
  return rpc('ping_activity', { p_user: userId })
}
// Liste des utilisateurs actifs dans les 5 dernières minutes.
export async function getOnlineUsers() {
  const r = await rpc('get_online_users')
  return r.error ? [] : r.data
}
// Canal Realtime partagé : un client diffuse un "ping" à chaque heartbeat,
// les autres clients rafraîchissent alors leur liste sans recharger la page.
export function subscribeToPresence(onPing) {
  const channel = supabase.channel('zigzam:online', {
    config: { broadcast: { self: false } },
  })
  channel.on('broadcast', { event: 'ping' }, () => onPing()).subscribe()
  return channel
}
export function broadcastPresence(channel) {
  channel.send({ type: 'broadcast', event: 'ping', payload: {} })
}

// ---------------- FLOOR IS LAVA 🌋 ----------------
// Niveau sauvegardé (plus haut niveau atteint), défaut 1.
export async function getFlavaLevel(userId) {
  const r = await rpc('get_flava_level', { p_user: userId })
  return r.error ? 1 : (r.data || 1)
}
// Victoire d'un niveau : sauvegarde du niveau max atteint (plus de récompense).
export async function flavaWin(userId, level) {
  const r = await rpc('flava_win', { p_user: userId, p_level: level })
  if (r.error || r.data?.error) return { error: ERR }
  return { ok: true, niveau: r.data.niveau }
}

// ---------------- SÉRIE ZIGZAM 🎬 ----------------
// Map des overrides de publication { episode_id: publie } (vide si erreur/aucun).
export async function getSerieVisibility() {
  const r = await rpc('get_serie_visibility')
  return r.error ? {} : (r.data || {})
}
// Superadmin : publie/dépublie un épisode pour tout le monde.
export async function adminSetSeriePublie(adminId, episodeId, publie) {
  const r = await rpc('admin_set_serie_publie', {
    p_admin: adminId, p_episode: episodeId, p_publie: publie,
  })
  if (r.error) return r
  if (r.data === 'forbidden') return { error: 'Permission refusée.' }
  return { ok: true }
}
// Propose une idée d'épisode (depuis la page /serie).
export async function createSerieProposition(userId, titre, description) {
  const r = await rpc('create_serie_proposition', {
    p_user: userId, p_titre: titre, p_description: description,
  })
  if (r.error) return r
  if (r.data?.error === 'empty') return { error: 'Donne un titre et décris ton idée 🙂' }
  if (r.data?.error) return { error: ERR }
  return { ok: true }
}
// Liste de toutes les propositions d'épisodes (panel admin).
export async function adminListSeriePropositions(adminId) {
  const r = await rpc('admin_list_serie_propositions', { p_admin: adminId })
  return r.error ? [] : r.data
}
// Marque une proposition comme lue.
export async function adminMarkSeriePropositionLu(adminId, propId) {
  const r = await rpc('admin_mark_serie_proposition_lu', { p_admin: adminId, p_prop: propId })
  if (r.error || r.data?.error) return { error: ERR }
  return { ok: true }
}
// Refuse poliment une proposition (envoie un message à l'auteur dans Discuter).
export async function adminRefuseSerieProposition(adminId, propId) {
  const r = await rpc('admin_refuse_serie_proposition', { p_admin: adminId, p_prop: propId })
  if (r.error || r.data?.error) return { error: ERR }
  return { ok: true }
}

// ---------------- BOÎTES MYSTÈRES 🎁 ----------------
// Superadmin : crée une boîte aléatoire d'un niveau de rareté donné.
export async function adminCreateBoiteAleatoire(adminId, destId, niveau) {
  const r = await rpc('admin_create_boite_aleatoire', {
    p_admin: adminId, p_dest: destId, p_niveau: niveau,
  })
  if (r.error) return r
  if (r.data?.error) return { error: ERR }
  return { ok: true }
}
// Superadmin : crée une boîte personnalisée (donuts, gemmes, accessoire optionnel).
export async function adminCreateBoitePerso(adminId, destId, donuts, gemmes, skinCat, skinItem) {
  const r = await rpc('admin_create_boite_perso', {
    p_admin: adminId, p_dest: destId,
    p_donuts: donuts, p_gemmes: gemmes,
    p_skin_cat: skinCat || '', p_skin_item: skinItem || '',
  })
  if (r.error) return r
  if (r.data?.error) return { error: ERR }
  return { ok: true }
}
// Superadmin : historique de toutes les boîtes envoyées.
export async function adminListBoites(adminId) {
  const r = await rpc('admin_list_boites', { p_admin: adminId })
  return r.error ? [] : r.data
}
// Utilisateur : ses boîtes non ouvertes (dashboard + page d'ouverture).
export async function getMyBoites(userId) {
  const r = await rpc('get_my_boites', { p_user: userId })
  return r.error ? [] : r.data
}
// Utilisateur : ouvre une boîte (tirage + crédit côté serveur).
export async function openBoite(userId, boiteId) {
  const r = await rpc('open_boite', { p_user: userId, p_boite: boiteId })
  if (r.error) return r
  if (r.data?.error) return { error: ERR }
  return r.data
}

// ---------------- TUTORIEL ----------------
// Marque le tutoriel de bienvenue comme vu (ne se relance plus automatiquement).
export async function markTutorialDone(userId) {
  return rpc('mark_tutorial_done', { p_user: userId })
}

// ---------------- DASHBOARD ----------------
export async function getBadges(userId) {
  const r = await rpc('get_badges', { p_user: userId })
  return r.error ? { discuter: 0, actus: 0 } : r.data
}

// ---------------- SIGNALEMENTS DE BUG 🚨 ----------------
// Crée un signalement depuis n'importe quelle page.
export async function createBugReport(userId, message) {
  const r = await rpc('create_bug_report', { p_user: userId, p_message: message })
  if (r.error) return r
  if (r.data?.error === 'empty') return { error: 'Écris un petit message pour décrire le problème 🙂' }
  if (r.data?.error) return { error: ERR }
  return { ok: true }
}
// Liste de tous les signalements (panel admin).
export async function adminListBugReports(adminId) {
  const r = await rpc('admin_list_bug_reports', { p_admin: adminId })
  return r.error ? [] : r.data
}
// Met à jour le statut et/ou la note interne d'un signalement.
export async function adminUpdateBugReport(adminId, reportId, statut, note) {
  const r = await rpc('admin_update_bug_report', {
    p_admin: adminId, p_report: reportId, p_statut: statut || '', p_note: note ?? null,
  })
  if (r.error || r.data?.error) return { error: ERR }
  return { ok: true }
}

// ---------------- SAISONS 🦕 ----------------
// Lit la ligne de la saison active (publique, pour SaisonContext).
//  Renvoie l'objet { id, slug, nom, actif, date_debut, date_fin, theme } ou null.
export async function getSaisonActive(slug) {
  const r = await rpc('get_saison_active', { p_slug: slug })
  return r.error ? null : (r.data || null)
}
// Superadmin : liste toutes les saisons connues en base.
export async function adminListSaisons(adminId) {
  const r = await rpc('admin_list_saisons', { p_admin: adminId })
  return r.error ? [] : r.data
}
// Superadmin : met à jour le commutateur + les dates d'une saison.
//  actif: bool | null (null = inchangé), dates: ISO string | '' (vide = effacer) | null (inchangé).
export async function adminUpdateSaison(adminId, slug, { actif, debut, fin } = {}) {
  const r = await rpc('admin_update_saison', {
    p_admin: adminId,
    p_slug: slug,
    p_actif: typeof actif === 'boolean' ? actif : null,
    p_debut: debut === undefined ? null : debut,
    p_fin: fin === undefined ? null : fin,
  })
  if (r.error || r.data?.error) return { error: ERR }
  return { ok: true, saison: r.data?.saison ?? null }
}
// Superadmin : statistiques des skins de saison achetés (par item + total).
export async function adminSaisonStats(adminId, slug) {
  const r = await rpc('admin_saison_stats', { p_admin: adminId, p_slug: slug })
  return r.error ? null : r.data
}
