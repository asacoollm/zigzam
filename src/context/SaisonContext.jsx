import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  SAISON_ACTIVE, SAISON_ACTIVE_ID, isSaisonActive, isSaisonTerminee,
  joursRestants, mergeSaison,
} from '../lib/saison'
import { getSaisonActive, subscribeToSaison } from '../lib/modules'

// ============================================================
//  SaisonContext — sait, partout dans l'appli, si une saison est active.
//  - Part de la config statique (src/lib/saison.js).
//  - Surcharge avec la ligne base (toggle + dates du superadmin) si présente.
//  - Applique/retire la classe body `saison-<slug>` qui pilote tout le thème
//    CSS. Quand la classe est absente, l'appli revient à son état normal.
// ============================================================

const SaisonContext = createContext(null)

export function SaisonProvider({ children }) {
  // On démarre sur la config code (rendu immédiat sans attendre le réseau),
  // puis on fusionne la ligne base dès qu'elle arrive.
  const [saison, setSaison] = useState(SAISON_ACTIVE)
  // Re-tic quotidien léger pour réévaluer le décompte / la fin de saison.
  const [, setTick] = useState(0)

  useEffect(() => {
    let on = true
    if (!SAISON_ACTIVE) return
    getSaisonActive(SAISON_ACTIVE_ID).then((ligne) => {
      if (on && ligne) setSaison(mergeSaison(SAISON_ACTIVE, ligne))
    })
    return () => { on = false }
  }, [])

  // Réévalue une fois par heure (bascule auto à debut/fin sans recharger).
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3600000)
    return () => clearInterval(id)
  }, [])

  // Temps réel : écoute le canal broadcast « zigzam:saison ». Quand le
  // superadmin active/désactive la saison, tous les clients connectés
  // basculent leur thème immédiatement, sans recharger la page.
  useEffect(() => {
    if (!SAISON_ACTIVE) return
    const unsub = subscribeToSaison((ligne) => {
      setSaison(ligne ? mergeSaison(SAISON_ACTIVE, ligne) : SAISON_ACTIVE)
    })
    return unsub
  }, [])

  const value = useMemo(() => {
    const active = isSaisonActive(saison)
    return {
      saison,
      active,
      terminee: isSaisonTerminee(saison),
      joursRestants: joursRestants(saison),
      slug: saison?.slug ?? null,
      refresh: (ligne) => setSaison(ligne ? mergeSaison(SAISON_ACTIVE, ligne) : SAISON_ACTIVE),
    }
  }, [saison])

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
      saison: SAISON_ACTIVE,
      active: isSaisonActive(SAISON_ACTIVE),
      terminee: isSaisonTerminee(SAISON_ACTIVE),
      joursRestants: joursRestants(SAISON_ACTIVE),
      slug: SAISON_ACTIVE?.slug ?? null,
      refresh: () => {},
    }
  }
  return ctx
}
