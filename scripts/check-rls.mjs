#!/usr/bin/env node
// ============================================================
//  ZIGZAM — Garde-fou sécurité : aucune table publique sans RLS
//  ----------------------------------------------------------
//  Appelle la RPC `check_rls_disabled()` (SECURITY DEFINER) avec la clé
//  anon — exactement le point d'entrée qu'aurait un attaquant. Si une
//  table du schéma `public` n'a pas le Row Level Security activé, on
//  affiche la liste et on sort en erreur (code 1) pour bloquer le build /
//  déploiement.
//
//  Lancé automatiquement par le hook npm `prebuild` (donc à chaque
//  `npm run build`, c.-à-d. à chaque déploiement Vercel) et dispo à la
//  main via `npm run check:rls`.
//
//  Politique de sortie :
//    - table(s) sans RLS trouvée(s)      -> exit 1 (bloque le déploiement)
//    - réponse HTTP d'erreur du serveur  -> exit 1 (problème réel à voir)
//    - variables Supabase absentes       -> exit 0 (rien à vérifier ici)
//    - Supabase injoignable (réseau)     -> exit 0 (ne bloque pas sur l'infra)
// ============================================================

import { readFileSync } from 'node:fs'

// Charge .env s'il existe (pratique en local) sans dépendance externe.
// Sur Vercel, les variables viennent déjà de l'environnement du build.
function loadDotEnv() {
  try {
    const txt = readFileSync(new URL('../.env', import.meta.url), 'utf8')
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (m && !(m[1] in process.env)) {
        process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
      }
    }
  } catch {
    /* pas de .env : on se rabat sur process.env */
  }
}
loadDotEnv()

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!url || !key) {
  console.warn('[check-rls] Variables Supabase absentes — vérification RLS ignorée.')
  process.exit(0)
}

let res
try {
  res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/check_rls_disabled`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })
} catch (err) {
  console.warn(`[check-rls] Supabase injoignable (${err.message}) — vérification ignorée.`)
  process.exit(0)
}

if (!res.ok) {
  const body = await res.text()
  console.error(`[check-rls] Échec de l'appel RPC check_rls_disabled (HTTP ${res.status}) : ${body}`)
  console.error("[check-rls] La migration 20260713130000_check_rls_rpc.sql a-t-elle été poussée ?")
  process.exit(1)
}

const rows = await res.json()
const tables = Array.isArray(rows) ? rows.map((r) => r.table_name) : []

if (tables.length > 0) {
  console.error('\n🚨 [check-rls] TABLES SANS ROW LEVEL SECURITY (accessibles publiquement) :')
  for (const t of tables) console.error(`   - public.${t}`)
  console.error('\nActive le RLS via une migration avant de déployer, par ex. :')
  console.error('   alter table public.<table> enable row level security;')
  console.error('   revoke all on public.<table> from anon, authenticated;\n')
  process.exit(1)
}

console.log('[check-rls] ✅ Toutes les tables du schéma public ont le RLS activé.')
