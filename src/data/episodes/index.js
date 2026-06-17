// ============================================================
//  Catalogue des épisodes de la Série Zigzam.
//  Pour ajouter un épisode : créer src/data/episodes/episodeN.js
//  (même format que episode1.js) puis l'ajouter à ce tableau.
//  Le lecteur (EpisodePlayer) et la liste (Serie) sont génériques.
// ============================================================

import episode1 from './episode1'

// Ordre d'affichage = ordre de ce tableau.
export const EPISODES = [episode1]

export function getEpisode(id) {
  return EPISODES.find((e) => e.id === id) ?? null
}
