Tu reprends le projet **Zigzam** (app web ludique pour une classe d'élèves —
React 19 + Vite + Supabase, auth maison par pseudo/mdp, pas de TypeScript).

**Lis d'abord `BLUEPRINT.md`** (architecture, modèle de données, conventions)
**puis `HANDOFF.md`** (état des branches, bugs connus, prochaines étapes) à la
racine du repo — ne redécouvre pas ce qui y est déjà écrit.

Points critiques à ne jamais oublier :

- ⚠️ **Une seule base Supabase pour toutes les branches git.** `main` et
  `maj-monumentale` ont des dossiers `supabase/migrations/` différents mais
  poussent sur la **même** base de prod. Avant toute migration : lire
  HANDOFF.md §2 et suivre la procédure `db query --file` + `migration repair`
  (pas `db push` seul, il échoue à cause du décalage d'historique entre
  branches).
- Accès aux données **toujours** via RPC `SECURITY DEFINER` (jamais de table
  en lecture/écriture directe côté client) — RLS activé sans policy sur
  chaque table (`scripts/check-rls.mjs` bloque le build sinon).
- `Asacool` est l'unique superadmin — toujours exclu des systèmes de
  récompense compétitifs, vérifié côté RPC (`role <> 'superadmin'`).
- `FallGuy.jsx` est le seul point de rendu de bonhomme personnalisé — le
  réutiliser pour toute nouvelle feature qui affiche un avatar (ne pas
  redessiner un SVG à la main).
- `.supabase-token` (racine du repo, ignoré par git) contient un jeton
  d'accès personnel : `export SUPABASE_ACCESS_TOKEN=$(tr -d ' \n\r' <
  .supabase-token)` avant toute commande `supabase …`.
- Avant de considérer une feature terminée : tester les RPC directement
  (`curl` ou `supabase db query`) **et** le rendu réel (Playwright ponctuel
  avec un `localStorage.setItem('zigzam.user', …)` d'un compte réel) contre
  la base de production — c'est la méthode suivie tout au long du projet.
- Nettoyer toute donnée de test créée en base avant de terminer.
- Convention de commit/push : uniquement sur demande explicite de
  l'utilisateur, jamais spontanément.

Réponds en français, ton simple et direct, code commenté uniquement quand le
*pourquoi* n'est pas évident.
