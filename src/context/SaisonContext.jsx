import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  SAISONS, TOUTES_SAISONS, SAISON_COURANTE, isSaisonTerminee,
  joursRestants, mergeSaison, trouverSaisonActive,
} from '../lib/saison'
import { getSaisonActive, subscribeToSaison } from '../lib/modules'

// ============================================================
//  SaisonContext — sait, partout dans l'appli, quelle saison est en cours.
//  - Part de la config statique (src/lib/saison.js), pour un rendu immédiat.
//  - Interroge la base pour CHAQUE saison enregistrée (toggle + dates du
//    superadmin) et retient celle qui est réellement activée.
//  - Si aucune n'est active, on retombe sur la saison « courante » (la
//    dernière sortie) : l'appli reste dans son thème normal, mais l'onglet
//    de skins sait encore de quelle saison il parle (« Saison terminée »).
//  - Applique/retire la classe body `saison-<slug>` qui pilote tout le thème
//    CSS. Quand la classe est absente, l'appli revient à son état normal.
// ============================================================

const SaisonContext = createContext(null)

// Fusionne le catalogue code avec les lignes base reçues (indexées par slug).
function fusionner(lignes) {
  return TOUTES_SAISONS.map((s) => mergeSaison(s, lignes[s.slug] ?? null))
}

export function SaisonProvider({ children }) {
  // Toutes les saisons connues, fusionnées avec la base au fur et à mesure.
  const [saisons, setSaisons] = useState(() => fusionner({}))
  // Re-tic horaire léger pour réévaluer le décompte / la fin de saison.
  const [, setTick] = useState(0)

  // Chargement initial : une lecture par saison enregistrée (elles sont peu
  // nombreuses, et le RPC public `get_saison_active` prend un slug).
  useEffect(() => {
    let on = true
    Promise.all(
      TOUTES_SAISONS.map((s) => getSaisonActive(s.slug).then((l) => [s.slug, l])),
    ).then((paires) => {
      if (!on) return
      const lignes = {}
      for (const [slug, ligne] of paires) if (ligne) lignes[slug] = ligne
      setSaisons(fusionner(lignes))
    })
    return () => { on = false }
  }, [])

  // Réévalue une fois par heure (bascule auto à debut/fin sans recharger).
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3600000)
    return () => clearInterval(id)
  }, [])

  // Temps réel : écoute le canal broadcast « zigzam:saison ». Quand le
  // superadmin active/désactive une saison, tous les clients connectés
  // basculent leur thème immédiatement, sans recharger la page.
  useEffect(() => {
    const unsub = subscribeToSaison((ligne) => {
      if (!ligne?.slug || !SAISONS[ligne.slug]) return
      setSaisons((prev) => prev.map((s) => (
        s.slug === ligne.slug ? mergeSaison(SAISONS[s.slug], ligne) : s
      )))
    })
    return unsub
  }, [])

  const value = useMemo(() => {
    const enCours = trouverSaisonActive(saisons)
    // Aucune saison active → on expose quand même la saison courante (pour
    // l'onglet de skins « Saison terminée »), mais `active` reste false.
    const saison = enCours
      ?? saisons.find((s) => s.slug === SAISON_COURANTE?.slug)
      ?? SAISON_COURANTE
    return {
      saison,
      saisons,
      // 🎨 Refonte « Gaming Pop » (maj-monumentale) : les thèmes de saison sont
      // temporairement désactivés pour voir le nouveau design de base sans
      // habillage de saison par-dessus. Remettre `!!enCours` pour réactiver
      // le système normal (piloté par la base / le panel admin).
      active: false,
      terminee: isSaisonTerminee(saison),
      joursRestants: joursRestants(saison),
      slug: saison?.slug ?? null,
      // Le panel admin pousse la ligne mise à jour pour un basculement instantané.
      refresh: (ligne) => {
        if (!ligne?.slug || !SAISONS[ligne.slug]) return
        setSaisons((prev) => prev.map((s) => (
          s.slug === ligne.slug ? mergeSaison(SAISONS[s.slug], ligne) : s
        )))
      },
    }
  }, [saisons])

  // Pilote le thème global : classe body `saison-<slug>` (+ `saison-active`).
  useEffect(() => {
    const body = document.body
    const cls = `saison-${value.slug || 'none'}`
    if (value.active && value.slug) {
      body.classList.add('saison-active', cls)
    } else {
      body.classList.remove('saison-active', cls)
    }
    return () => body.classList.remove('saison-active', cls)
  }, [value.active, value.slug])

  return <SaisonContext.Provider value={value}>{children}</SaisonContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSaison() {
  const ctx = useContext(SaisonContext)
  // Tolérant : hors provider (tests, rendus isolés), on retombe sur la config code.
  if (!ctx) {
    return {
      saison: SAISON_COURANTE,
      saisons: TOUTES_SAISONS,
      // 🎨 Refonte « Gaming Pop » (maj-monumentale) : saisons désactivées, cf. provider ci-dessus.
      active: false,
      terminee: isSaisonTerminee(SAISON_COURANTE),
      joursRestants: joursRestants(SAISON_COURANTE),
      slug: SAISON_COURANTE?.slug ?? null,
      refresh: () => {},
    }
  }
  return ctx
}
