// Logique du contrôle parental (côté client).

export const PAUSE_MESSAGE_HORAIRE =
  "Oups ! C'est l'heure de faire une pause 🌟 Tes parents ont réglé Zigzam pour s'arrêter maintenant. À tout à l'heure !"

export const PAUSE_MESSAGE_DUREE =
  "C'est l'heure de faire une pause 🌟 Tu as bien joué aujourd'hui — à tout à l'heure !"

// Heure actuelle (locale) hors de la tranche autorisée ?
export function isOutsideAllowedHours(parental) {
  if (!parental?.actif) return false
  const { heure_debut, heure_fin } = parental
  if (!heure_debut || !heure_fin) return false
  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  const [dh, dm] = String(heure_debut).split(':').map(Number)
  const [fh, fm] = String(heure_fin).split(':').map(Number)
  const start = dh * 60 + dm
  const end = fh * 60 + fm
  if (start <= end) return cur < start || cur >= end
  // tranche qui passe minuit (ex: 20h → 7h)
  return cur >= end && cur < start
}

// Un module est-il bloqué par le contrôle parental ?
export function isModuleBlocked(parental, key) {
  if (!parental?.actif || !key) return false
  return Array.isArray(parental.modules_bloques) && parental.modules_bloques.includes(key)
}
