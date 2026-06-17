// ============================================================
//  Catalogue des épisodes de la Série Zigzam.
//  Pour ajouter un épisode : créer src/data/episodes/episodeN.js
//  (même format que episode1.js) puis l'ajouter à ce tableau.
//  Le lecteur (EpisodePlayer) et la liste (Serie) sont génériques.
// ============================================================

import episode1 from './episode1'
import episode2 from './episode2'

// Ordre d'affichage = ordre de ce tableau.
export const EPISODES = [episode1, episode2]

export function getEpisode(id) {
  return EPISODES.find((e) => e.id === id) ?? null
}

// Épisode visible ? `overrides` = map { episode_id: publie } venant du serveur
// (priorité au serveur, sinon valeur `publie` du fichier de données).
export function isPublished(episode, overrides = {}) {
  if (!episode) return false
  const o = overrides[episode.id]
  return o ?? episode.publie ?? false
}
