// ============================================================
//  Décompte d'ouverture du module « Floor is Lava 🌋 ».
//  Le jeu se déverrouille exactement 2 semaines après le 15/06/2026
//  (date de mise en place du décompte) → 29/06/2026 16:30:00 UTC.
//  La fusion de la branche floor-is-lava → main est prévue à ce moment.
// ============================================================

// Timestamp d'ouverture (ms epoch). 2 semaines à partir du 15/06/2026 18:30 CEST.
export const FLAVA_UNLOCK_TS = Date.parse('2026-06-29T16:30:00Z')

// Le module est-il déverrouillé à l'instant `now` (ms epoch) ?
export function isFlavaUnlocked(now = Date.now()) {
  return now >= FLAVA_UNLOCK_TS
}

// Décompose le temps restant en { d, h, m, s, total }.
export function flavaCountdown(now = Date.now()) {
  const total = Math.max(0, FLAVA_UNLOCK_TS - now)
  const s = Math.floor(total / 1000)
  return {
    total,
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  }
}
