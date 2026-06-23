import { supabase } from './supabase'

const STORAGE_KEY = 'zigzam.user'
// Clé dédiée « Se souvenir de moi » : on n'y stocke QUE le pseudo, jamais le mot de passe.
const REMEMBER_KEY = 'zigzam.remember'

// --- Session locale (pas de Supabase Auth : auth maison par pseudo) ---
export function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function storeUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY)
}

// --- « Se souvenir de moi » : mémorise le pseudo (jamais le mot de passe) ---
export function rememberPseudo(pseudo) {
  try {
    localStorage.setItem(REMEMBER_KEY, pseudo)
  } catch {
    /* stockage indisponible : on ignore */
  }
}

export function getRememberedPseudo() {
  try {
    return localStorage.getItem(REMEMBER_KEY) || null
  } catch {
    return null
  }
}

// Efface les données « se souvenir de moi » de cet appareil.
export function forgetDevice() {
  try {
    localStorage.removeItem(REMEMBER_KEY)
  } catch {
    /* rien à faire */
  }
}

// --- Connexion : appelle la fonction SQL login() ---
// Renvoie { user } si ok, ou { error } sinon.
export async function login(pseudo, password) {
  try {
    const { data, error } = await supabase.rpc('login', {
      p_pseudo: pseudo.trim(),
      p_password: password,
    })

    if (error) {
      // On journalise l'erreur réelle pour pouvoir déboguer (réseau, RPC, droits…).
      console.error('[login] erreur RPC Supabase :', error)
      return { error: 'Oups, une erreur est survenue. Réessaie !' }
    }
    if (!data || data.length === 0) {
      return { error: 'Pseudo ou mot de passe incorrect 🙈' }
    }

    return { user: data[0] }
  } catch (e) {
    // Exception réseau / client (ex : appareil hors-ligne) : on ne casse pas l'UI.
    console.error('[login] exception réseau/client :', e)
    return { error: 'Oups, une erreur est survenue. Réessaie !' }
  }
}

// --- Onboarding : change le mot de passe + enregistre le numéro ---
// Renvoie { ok: true } ou { error }.
export async function completeOnboarding(userId, newPassword, numero) {
  const { data, error } = await supabase.rpc('complete_onboarding', {
    p_user_id: userId,
    p_new_password: newPassword,
    p_numero: numero,
  })

  if (error) return { error: 'Oups, une erreur est survenue. Réessaie !' }
  if (data === 'numero_pris') {
    return { error: 'Ce numéro est déjà pris, choisis-en un autre 🔢' }
  }
  if (data === 'numero_invalide') {
    return { error: 'Le numéro doit avoir exactement 4 chiffres.' }
  }

  return { ok: true }
}

// --- Avatar : sauvegarde (couleur / accessoires gratuits / retrait) ---
// Renvoie { avatar } enregistré, ou { error }.
export async function saveAvatar(userId, avatar) {
  const { data, error } = await supabase.rpc('save_avatar', {
    p_user_id: userId,
    p_avatar: avatar,
  })

  if (error) return { error: 'Impossible de sauvegarder, réessaie !' }
  return { avatar: data }
}

// --- Avatar : achat + équipement d'un accessoire payant ---
// Renvoie { gemmes, avatar } si ok, ou { error }.
export async function buyAccessory(userId, category, itemId, price) {
  const { data, error } = await supabase.rpc('buy_accessory', {
    p_user_id: userId,
    p_category: category,
    p_item_id: itemId,
    p_price: price,
  })

  if (error) return { error: 'Oups, une erreur est survenue. Réessaie !' }
  if (data?.error === 'not_enough_gems') {
    return { error: "Tu n'as pas assez de gemmes 💎" }
  }
  if (data?.error) return { error: 'Oups, une erreur est survenue. Réessaie !' }

  return { gemmes: data.gemmes, avatar: data.avatar }
}
