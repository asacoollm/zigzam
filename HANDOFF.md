# Zigzam — Handoff 🦓 (branche `maj-monumentale`)

État de la branche **au 2026-08-14**, pour reprendre le travail sans perdre de
contexte. Complète **BLUEPRINT.md** (qui décrit le *quoi* et le *comment*) avec
le *où on en est* et le *qu'est-ce qui reste à faire*. Un `HANDOFF.md`
équivalent existe sur `main` (contenu différent — décrit l'état de `main`, pas
celui-ci) : les deux fichiers ne sont volontairement pas synchronisés, chaque
branche documente son propre état.

---

## 1. Où en sont les branches

| Branche | Dernier commit | Contenu par rapport à `main` |
|---------|-----------------|-------------------------------|
| `main` | `a1bd8ed` — Cartes Zigzam Collectore | Branche de référence, déployée sur Vercel. Ne contient ni Burgers/Shop/Méga Boîtes/VIP/Impôts, ni Poupers, ni Map Zigzam. |
| **`maj-monumentale`** (ici) | Map Zigzam 🗺️ (carte + coffre + visiteurs + boutique) | **Diverge fortement de `main`** : refonte visuelle « Gaming Pop » (sans saisons dans le thème global), Burgers 🍔, Shop, Méga Boîtes, Pass VIP 👑, Impôts, **Poupers Collectore** 🪆 (9 poupées liées à des records), et maintenant **Map Zigzam** 🗺️ (voir §3). |
| `origin/appels`, `origin/floor-is-lava`, `origin/nouveaux-jeux`, `origin/saison-disney`, `origin/saison-jurassic` | — | Branches de feature historiques, déjà fusionnées ou explorées — probablement obsolètes/mergées. À vérifier avant de les supprimer (ne pas le faire sans confirmation explicite). |

Un commit `2213d02` sur `main` (« Revert… ») a explicitement **annulé** deux
commits qui avaient introduit Burgers/Shop/Méga Boîtes/VIP/Impôts sur `main` —
c'est pourquoi ces fonctionnalités vivent sur `maj-monumentale` mais pas sur
`main`. Réintégrer cette branche dans `main` demandera un vrai travail de merge
(le code a divergé depuis), pas un simple `git merge`.

---

## 2. ⚠️ Particularité critique : une seule base de données pour toutes les branches

Il n'existe **qu'un seul projet Supabase** (`oawgvvtiyjjquhbyluwb`), utilisé par
**toutes** les branches, `maj-monumentale` incluse. `supabase/migrations/` est
un dossier **par branche** (différent entre `main` et `maj-monumentale`), mais
`npx supabase db push` (ou `db query`) depuis n'importe quelle branche modifie
la **même** base de production.

Conséquence concrète observée pendant cette session : `supabase db push` a
échoué avec *« Remote migration versions not found in local migrations
directory »* pour des migrations écrites sur `main`
(`20260809130000_skins_sur_mesure`, `20260810120000_flava_vs`,
`20260811120000_cartes_zigzam`) déjà appliquées à la base commune mais absentes
des fichiers locaux de `maj-monumentale`. Corrigé avec `supabase migration
repair --status reverted <versions>` (touche uniquement la table de suivi
`supabase_migrations`, pas le schéma réel).

**Procédure sûre utilisée dans cette session pour chaque nouvelle migration**
(à reproduire, ne PAS utiliser `db push` seul sur cette branche) :

1. Écrire la migration normalement dans `supabase/migrations/` (`npm run
   db:new <nom>`).
2. L'appliquer directement avec `npx supabase db query --linked --file
   supabase/migrations/<fichier>.sql` (évite l'échec de `db push` dû au
   décalage d'historique avec les migrations `main`). Si l'appel échoue avec
   une erreur de **transport réseau** (pas une erreur SQL), la migration est
   idempotente : on peut simplement réessayer sans risque.
3. Marquer la migration comme appliquée dans l'historique CLI :
   `npx supabase migration repair --linked --status applied <timestamp>`.
4. Vérifier `node scripts/check-rls.mjs` après coup.

Le token d'accès Supabase CLI est mis en cache dans `.supabase-token`
(gitignored) : `export SUPABASE_ACCESS_TOKEN=$(tr -d '[:space:]' <
.supabase-token)` avant toute commande `supabase`.

**Ne jamais** faire `supabase db reset` ni toute opération destructive sur
cette base — elle sert aussi (au moins en partie) à `main` et aux autres
branches.

---

## 3. Fonctionnalités livrées récemment sur `maj-monumentale` (ordre chronologique)

1. **Refonte visuelle « Gaming Pop »** (Fortnite/Brawl Stars) — le thème de
   saison global est désactivé en dur dans `SaisonContext` (`active: false`
   forcé) pendant cette refonte ; les saisons individuelles restent pilotables
   côté données (voir §3.4 ci-dessous, la Map en dépend).
2. **Saison 2** : Burgers 🍔, Shop, Méga Boîtes (avec évolution), Pass VIP 👑,
   Impôts. Plusieurs correctifs de suivi (crash méga boîtes, retrait de
   l'échange burgers, notif Discuter, VIP live).
3. **Poupers Collectore 🪆** — 9 poupées vaudou liées aux 9 records du site
   (contacts, donuts, gemmes, actus, messages, niveau Floor is Lava, temps de
   connexion, boîtes reçues, accessoires débloqués). Transfert automatique du
   détenteur, notifications de gain/perte, superadmin toujours exclu.
4. **Map Zigzam 🗺️** (cette session, en 2 étapes) :
   - **Base de données** : `users.map_pieces`, catalogue `zigzam_map_pays` (6
     pays permanents + 2 saisonniers, seedés), `map_mini_pieces`,
     `map_coffres`, RPC `earn_map_pieces()`.
   - **Page `/map`** : grande carte SVG (ciel/mer/nuages/vagues animés), une
     île illustrée par pays, halo lumineux au survol, clic → `/map/:slug`. Les
     2 pays saisonniers (Jurassic Web, Zigzamland Paris) n'apparaissent que si
     `isSaisonActive()` est vrai pour leur saison — **indépendamment** du
     thème global désactivé au §3.1 (la Map lit l'état réel par saison via
     `useSaison().saisons`, pas le flag `active` forcé à `false`).
   - **Page `/map/:slug`** — trois fonctionnalités complètes, testées via RPC
     directes *et* rendu réel Playwright contre la base de production :
     - **Coffre du jour** : `get_map_coffre_state` / `open_map_coffre`, gain
       aléatoire 3-8 mini pièces 💜 par pays, cooldown 24h, compte à rebours
       recalculé chaque minute côté client **+ revalidé auprès du serveur
       toutes les ~5 min** (corrige toute dérive d'horloge sans spammer le
       serveur).
     - **Visiteurs en ligne** : Presence Realtime Supabase (`.track()`, canal
       `zigzam:map:<slug>`, un canal par pays), liste de `FallGuy` empilés,
       pas de nouvelle table.
     - **Boutique par pays** : 24 articles seedés (3 par pays, y compris les 2
       saisonniers), `get_map_boutique` / `get_my_map_achats` /
       `buy_map_article`, achat en mini pièces du **bon** pays uniquement
       (isolation vérifiée explicitement — débiter `jurassic-web` ne touche
       jamais les mini pièces d'un autre pays).
   - Testé pour les 6 pays permanents **et** pour un pays saisonnier
     (Jurassic Web, activé temporairement en base via `update saisons set
     actif = true, date_fin = null`, puis restauré à l'identique après test) :
     comportement strictement identique aux pays permanents, aucune différence
     observée.
   - Testé le cas presence multi-onglets (même compte, deux contextes
     Playwright, même pays) : chaque onglet s'exclut lui-même (la clé Presence
     est `user.id`), donc les deux affichent « seul(e) ici » l'un pour
     l'autre — comportement attendu, **pas un bug**, rien à corriger.

---

## 4. Bugs connus / dette à traiter en priorité

1. **13 erreurs + 4 warnings `react-hooks/set-state-in-effect`** au
   `npm run lint`, **pré-existantes** (non introduites par le travail Map
   Zigzam — aucun fichier `src/pages/Map*.jsx` / `src/lib/map.js` n'apparaît
   dans la liste), réparties dans : `Buddy.jsx`, `ParentalGuard.jsx`,
   `CallContext.jsx`, `Actualites.jsx`, `Admin.jsx`, `Contacts.jsx`,
   `Discuter.jsx`, `Economie.jsx`, `FloorMulti.jsx`, `MegaBoite.jsx`.
   `npm run build` réussit quand même (le lint n'est pas branché sur
   `prebuild`, seul `check-rls.mjs` l'est). À corriger un jour en sortant les
   `setState()` synchrones hors du corps des effets.
2. **Bundle JS ~933 kB** (avertissement Vite au build, non bloquant). Pas de
   code-splitting configuré.
3. **Aucun bug fonctionnel connu et confirmé sur Map Zigzam** — coffre,
   visiteurs, boutique, pays saisonniers et multi-onglet tous testés en
   conditions réelles (RPC directes + rendu Playwright) contre la base de
   production, données de test systématiquement nettoyées après coup.
4. Le compte à rebours du coffre reste une approximation **côté client** juste
   après ouverture (`now() + 24h` local, avant le premier re-fetch serveur à
   ~5 min) — dérive potentielle négligeable si l'horloge du client est fausse,
   pas un problème pour l'usage réel.
5. Pas de vue « collection » globale des articles de boutique achetés (visible
   uniquement pays par pays sur `/map/:slug`) — pas demandé, juste noté comme
   piste d'amélioration possible.

---

## 5. Comment tester / déployer

- **Dev local** : `npm run dev` (http://localhost:5173). Nécessite `.env` avec
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- **Nouvelle migration** : voir la procédure sûre en §2 (`db:new` → `db query
  --file` → `migration repair --status applied`). Ne pas utiliser `db push`
  seul sur cette branche.
- **Tester une RPC sans repasser par l'UI** :
  ```bash
  export SUPABASE_ACCESS_TOKEN=$(tr -d '[:space:]' < .supabase-token)
  npx supabase db query --linked "select … ;"
  ```
- **Tester le rendu réel** : lancer `npm run dev`, puis un script Playwright
  jetable qui pose directement `localStorage.setItem('zigzam.user',
  JSON.stringify(u))` avec un utilisateur réel (récupéré via `db query`) avant
  de naviguer — évite de rejouer tout le flux de login. Penser à
  `sessionStorage.setItem('zigzam:saison-annonce-vue','1')` pour éviter la
  modale de saison qui bloque le rendu des captures.
- **Playwright n'est pas une dépendance du projet** : installé à la volée dans
  le scratchpad de session (`npm install playwright` dans un dossier
  temporaire hors du repo), jamais ajouté à `package.json`.
- **Déploiement** : push sur `main` → Vercel build automatiquement
  (`vercel.json`, build Vite → `dist/`). `maj-monumentale` n'est pas déployée
  en l'état (branche de travail). Le `prebuild` (`check-rls.mjs`) fait
  échouer un déploiement si une table publique perd son RLS.
- **Toujours nettoyer les données de test** créées via `db query` ou via l'UI
  de test avant de terminer une session (comptes de test remis à leur état
  d'origine — `map_mini_pieces` / `map_coffres` / `map_achats` vidés pour
  cette session, saisons remises à leur état initial si togglées pour un
  test).

---

## 6. Prochaines étapes suggérées (non commencées)

- Décider du sort de `maj-monumentale` : merge complet vers `main` (gros
  chantier, code très divergé — Burgers/Shop/Méga Boîtes/VIP/Impôts/Poupers/Map
  n'existent que sur cette branche), abandon, ou maintien en parallèle assumé
  — dans ce dernier cas, clarifier la stratégie base de données (§2).
- Corriger les 13 erreurs lint pré-existantes (§4.1) pour faire repasser
  `npm run lint` au vert.
- Map Zigzam : envisager une vue « collection » globale (tous pays confondus)
  des articles de boutique déjà débloqués, si le besoin se confirme.
- Envisager le nettoyage des branches distantes visiblement obsolètes
  (`appels`, `floor-is-lava`, `nouveaux-jeux`, `saison-disney`,
  `saison-jurassic`) après vérification qu'elles sont bien mergées ou
  abandonnées.
- Pas de demande fonctionnelle en attente au moment de la rédaction de ce
  document — Map Zigzam (carte + coffre + visiteurs + boutique) est livrée et
  testée, en attente de revue avant tout commit/push.
