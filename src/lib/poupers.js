// ============================================================
//  Poupers Collectore 🪆 — constantes partagées (labels, positions).
//  Source de vérité côté DB : table public.poupers (voir migration
//  20260809120000_poupers.sql). Ce fichier ne fait que traduire les
//  record_type en libellés lisibles pour l'UI.
// ============================================================

export const POUPER_RECORD_LABELS = {
  nb_contacts: 'contacts 📞',
  nb_donuts: 'donuts 🍩',
  nb_gemmes: 'gemmes 💎',
  nb_actus: 'actus publiées 📰',
  nb_messages: 'messages envoyés 💬',
  niveau_lava: 'niveau à Floor is Lava 🌋',
  temps_connexion: 'temps de connexion ⏱️',
  nb_boites: 'boîtes mystères reçues 🎁',
  nb_accessoires: 'accessoires débloqués 🎨',
}

export function pouperRecordLabel(recordType) {
  return POUPER_RECORD_LABELS[recordType] || recordType
}

// Formatte la valeur d'un record selon son type (ex : secondes -> "2h30").
export function formatPouperValue(recordType, value) {
  const v = Number(value) || 0
  if (recordType === 'temps_connexion') {
    const h = Math.floor(v / 3600)
    const m = Math.floor((v % 3600) / 60)
    if (h > 0) return `${h}h${String(m).padStart(2, '0')}`
    return `${m} min`
  }
  return String(v)
}

export const POUPER_POSITIONS = [
  { id: 'tete', label: 'Sur la tête', emoji: '🎩' },
  { id: 'bras', label: 'Sur le bras', emoji: '💪' },
]
