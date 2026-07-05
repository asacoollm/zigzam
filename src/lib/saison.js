// ============================================================
//  ZIGZAM — Système de saisons thématiques
//  ----------------------------------------------------------
//  Une « saison » transforme toute l'interface pendant une période donnée
//  (fond, décor, logo, skins exclusifs, modale d'annonce…).
//  Le système est GÉNÉRIQUE : pour lancer une future saison, il suffit
//  d'ajouter son objet dans SAISONS et de pointer SAISON_ACTIVE_ID dessus.
//
//  Les valeurs `actif` / `debut` / `fin` définies ici sont les valeurs par
//  défaut côté code. La table `saisons` en base peut les surcharger en
//  direct (toggle + dates par le superadmin) ; SaisonContext fusionne les
//  deux (la base est prioritaire si une ligne existe).
// ============================================================

// Catalogue de toutes les saisons connues (présentes et futures).
//  - id     : identifiant technique stable (= slug)
//  - nom    : nom affiché (peut contenir un emoji)
//  - actif  : valeur par défaut du commutateur
//  - debut  : ISO string ou null (null = pas de borne de début)
//  - fin    : ISO string ou null (null = pas de borne de fin / durée libre)
//  - theme  : couleurs & assets propres à la saison (jsonb en base)
export const SAISONS = {
  jurassic: {
    id: 'jurassic',
    slug: 'jurassic',
    nom: 'Jurassic Web 🦕',
    titre: 'Jurassic Web',
    numero: 1, // Saison 1
    // Inactive par défaut côté code : la saison est pilotée UNIQUEMENT depuis
    // le panel admin (/admin → Saisons). La ligne base surcharge cette valeur
    // (mergeSaison) et le canal temps réel « zigzam:saison » propage la
    // bascule à tous les clients connectés, sans rechargement.
    actif: false,
    debut: null,
    fin: null,
    theme: {
      couleurs: {
        fondSombre: '#0D3B0D',
        fondEmeraude: '#1A5C1A',
        fondJungle: '#2D8B2D',
        accent: '#3dd68c',
        accentClair: '#8ff196',
        eclair: '#aaffaa',
      },
      emoji: '🦕',
      assets: { decor: 'jurassic' },
    },
  },
}

// Saison actuellement branchée. Pour passer à une autre saison plus tard,
// il suffit de changer cet identifiant (ou de mettre la saison à actif=false).
export const SAISON_ACTIVE_ID = 'jurassic'

// La saison active « statique » (config code, avant surcharge base).
export const SAISON_ACTIVE = SAISONS[SAISON_ACTIVE_ID] ?? null

// Retourne true si la saison passée (ou la saison active par défaut) est
// en cours : commutateur activé ET (si bornes définies) date courante dans
// la fenêtre [debut, fin].
export function isSaisonActive(saison = SAISON_ACTIVE) {
  if (!saison || !saison.actif) return false
  const now = Date.now()
  if (saison.debut) {
    const d = Date.parse(saison.debut)
    if (!Number.isNaN(d) && now < d) return false
  }
  if (saison.fin) {
    const f = Date.parse(saison.fin)
    if (!Number.isNaN(f) && now > f) return false
  }
  return true
}

// Une saison est « terminée » si elle reste configurée/activée mais que sa
// date de fin est passée → on grise alors les skins (mention « Saison terminée »).
export function isSaisonTerminee(saison = SAISON_ACTIVE) {
  if (!saison || !saison.fin) return false
  const f = Date.parse(saison.fin)
  if (Number.isNaN(f)) return false
  return Date.now() > f
}

// Nombre de jours restants avant la fin (arrondi au supérieur), ou null si
// aucune date de fin n'est définie. 0 si la fin est déjà passée.
export function joursRestants(saison = SAISON_ACTIVE) {
  if (!saison || !saison.fin) return null
  const f = Date.parse(saison.fin)
  if (Number.isNaN(f)) return null
  const ms = f - Date.now()
  if (ms <= 0) return 0
  return Math.ceil(ms / 86400000)
}

// Fusionne la config statique d'une saison avec une éventuelle ligne base.
// La base est prioritaire pour actif / dates ; le thème reste celui du code
// (les assets/SVG vivent dans le code), sauf surcharge explicite.
export function mergeSaison(statique, ligneBase) {
  if (!ligneBase) return statique
  return {
    ...statique,
    nom: ligneBase.nom ?? statique.nom,
    actif: typeof ligneBase.actif === 'boolean' ? ligneBase.actif : statique.actif,
    debut: ligneBase.date_debut ?? statique.debut,
    fin: ligneBase.date_fin ?? statique.fin,
    theme: ligneBase.theme ?? statique.theme,
  }
}
