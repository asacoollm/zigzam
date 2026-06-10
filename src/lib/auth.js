import { supabase } from './supabase'

const STORAGE_KEY = 'zigzam.user'

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

// --- Connexion : appelle la fonction SQL login() ---
// Renvoie { user } si ok, ou { error } sinon.
export async function login(pseudo, password) {
  const { data, error } = await supabase.rpc('login', {
    p_pseudo: pseudo.trim(),
    p_password: password,
  })

  if (error) return { error: 'Oups, une erreur est survenue. Réessaie !' }
  if (!data || data.length === 0) {
    return { error: 'Pseudo ou mot de passe incorrect 🙈' }
  }

  return { user: data[0] }
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
