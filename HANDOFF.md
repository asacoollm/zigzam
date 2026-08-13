# Zigzam — Handoff 🦓

État du projet **au 2026-08-13**, pour reprendre le travail sans perdre de
contexte. Complète **BLUEPRINT.md** (qui décrit le *quoi* et le *comment*) avec
le *où on en est* et le *qu'est-ce qui reste à faire*.

---

## 1. Où en sont les branches

| Branche | Dernier commit | Contenu par rapport à `main` |
|---------|-----------------|-------------------------------|
| **`main`** | `a1bd8ed` — Cartes Zigzam Collectore | Branche de référence, déployée sur Vercel. |
| `maj-monumentale` | `94b60dd` — Poupers, remplace placeholders | **Diverge fortement** : contient Burgers 🍔, Shop, Méga Boîtes, Pass VIP 👑, Impôts, et le système **Poupers Collectore** 🪆 (9 poupées liées à des records). Aucun de ces éléments n'est sur `main`. |
| `origin/appels`, `origin/floor-is-lava`, `origin/nouveaux-jeux`, `origin/saison-disney`, `origin/saison-jurassic` | — | Branches de feature historiques, déjà fusionnées ou explorées — probablement obsolètes/mergées. À vérifier avant de les supprimer (ne pas le faire sans confirmation explicite).

Un commit **`2213d02`** sur `main` (« Revert… ») a explicitement **annulé** deux
commits qui avaient introduit Burgers/Shop/Méga Boîtes/VIP/Impôts sur `main` —
c'est pourquoi ces fonctionnalités existent sur `maj-monumentale` mais pas ici.
Si on veut un jour les réintégrer sur `main`, il faudra un vrai travail de merge
(pas un simple `git merge`, le code a divergé depuis).

---

## 2. ⚠️ Particularité critique : une seule base de données pour toutes les branches

Il n'existe **qu'un seul projet Supabase** (`oawgvvtiyjjquhbyluwb`), utilisé par
**toutes** les branches. `supabase/migrations/` est un dossier **par branche**
(donc différent entre `main` et `maj-monumentale`), mais `npx supabase db push`
(ou `db query`) depuis n'importe quelle branche modifie la **même** base de
production.

Conséquence observée concrètement pendant cette session : `supabase migration
list` sur `main` affiche des entrées avec `"local": ""` pour plusieurs
migrations (ex. `20260726120000`, `20260731122000`) — ce sont des migrations
écrites sur `maj-monumentale` mais déjà appliquées à la base commune. Résultat :
la base contient aujourd'hui des tables/colonnes (`burgers`, `vip_expire_at`,
`mega_boites`, `poupers`, `pouper_notifications`…) que le code de `main` **ne
lit ni n'écrit jamais**. Ce n'est pas cassé, juste mort-code côté données.

**Procédure suivie sur `main` pour rester safe malgré ça** (à reproduire) :

1. Écrire la migration normalement dans `supabase/migrations/`.
2. L'appliquer directement avec `npx supabase db query --linked --file
   supabase/migrations/<fichier>.sql` (évite l'échec de `db push` dû au
   décalage d'historique avec les migrations `maj-monumentale`).
3. Marquer la migration comme appliquée dans l'historique CLI :
   `npx supabase migration repair --linked --status applied <timestamp>`.
4. Vérifier `node scripts/check-rls.mjs` après coup.

**Ne jamais** faire `supabase db reset` ni toute opération destructive sur cette
base — elle sert aussi (au moins en partie) à `maj-monumentale`.

**Si `maj-monumentale` est un jour repris en parallèle de `main`**, il faudra
décider d'un vrai découplage (deux projets Supabase séparés) ou accepter
consciemment le partage et documenter précisément quelles tables appartiennent
à quelle branche.

---

## 3. Fonctionnalités livrées récemment sur `main` (ordre chronologique)

1. **Skin sur mesure ⭐** (`104dc56`, `af45522`) — kimono exclusif pour un élève
   (Penpen), invisible tant que le superadmin ne l'a pas validé depuis
   `/admin`. Section admin dédiée avec aperçu + validation + demande de
   correction (réutilise `create_bug_report`).
2. **Floor is Lava — modes VS ⚔️ et Chemins 🧠** (`839549d`) — 1 contre 1
   chronométré (humain ou bot, 9 niveaux de difficulté) et mode mémoire solo.
   Testés de bout en bout (RPC + rendu réel navigateur) contre la base de
   production.
3. **Cartes Zigzam Collectore 🃏** (`a1bd8ed`) — roulette (5🍩/tour, 57 cartes,
   1 carte IMPOSSIBLE unique transférable), page collection, section admin +
   export PDF imprimable A6.

Un debug de la section « Skins Sur Mesure » (`91df0c1`) a été fait en amont pour
diagnostiquer une absence apparente de la section dans `/admin` — la cause
réelle n'a **jamais été confirmée comme un bug de code** : tous les tests RPC +
rendu réel montraient un fonctionnement correct pour le compte superadmin
`Asacool`. Les pistes les plus probables restées ouvertes : un déploiement
Vercel pas encore à jour, ou un test fait par erreur avec un compte `admin`
simple (Hugo) plutôt que `superadmin` — la section est strictement réservée à
`role === 'superadmin'` par design.

---

## 4. Bugs connus / dette à traiter en priorité

1. **`console.log()` de debug encore actifs en production**, dans
   `src/pages/Admin.jsx` :
   - ligne ~938 et ~943 (`SectionCustomSkins` — log de montage + réponse RPC brute)
   - ligne ~1678 (`Admin` — log pseudo/role/isSuperAdmin à chaque rendu du panel)

   Ajoutés volontairement pour le diagnostic du point 3 ci-dessus, jamais
   retirés puisque le diagnostic n'a jamais été conclu par l'utilisateur. **À
   supprimer** dès que la cause de « section absente » (si elle s'est
   reproduite) est confirmée ou classée sans suite.

2. **`npm run lint` échoue avec 3 erreurs** dans `src/pages/Admin.jsx`
   (`react-hooks/set-state-in-effect`, lignes ~149, ~545, ~619 — dans
   `SectionActus` et `SectionUtilisateurs`, code **pré-existant**, non introduit
   pendant cette session). `npm run build` réussit quand même (le lint n'est
   pas branché sur `prebuild`). À corriger un jour en déplaçant le
   `setLoading(true)` initial hors de l'effet ou en le rendant conditionnel.

3. **Bundle JS > 500 kB** (avertissement Vite au build, non bloquant). Pas de
   code-splitting configuré. À envisager si le temps de chargement initial
   devient un problème perçu.

4. **Aucun bug fonctionnel connu et confirmé** sur les 3 grosses features
   livrées cette session (skins sur mesure, Floor is Lava VS/Chemins, Cartes
   Zigzam) — toutes testées via RPC directes (`curl`/`supabase db query`) *et*
   rendu réel en navigateur (Playwright) contre la base de production avant
   chaque push.

---

## 5. Comment tester / déployer

- **Dev local** : `npm run dev` (http://localhost:5173). Nécessite `.env` avec
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- **Tester une RPC sans repasser par l'UI** :
  ```bash
  export SUPABASE_ACCESS_TOKEN=$(tr -d ' \n\r' < .supabase-token)
  npx supabase db query --linked "select … ;"
  # ou, pour appeler une RPC comme le ferait le front (clé anon) :
  curl -s -X POST "$VITE_SUPABASE_URL/rest/v1/rpc/<fonction>" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" -d '{"p_...":"..."}'
  ```
- **Tester le rendu réel** : lancer `npm run dev`, puis un script Playwright
  jetable qui pose directement `localStorage.setItem('zigzam.user', JSON.stringify(u))`
  avec un utilisateur réel (récupéré via `db query`) avant de naviguer — évite
  de rejouer tout le flux de login. Penser à `sessionStorage.setItem('zigzam:saison-annonce-vue','1')`
  pour éviter la modale de saison qui bloque le rendu des captures.
- **Déploiement** : push sur `main` → Vercel build automatiquement
  (`vercel.json`, build Vite → `dist/`). Le `prebuild` (`check-rls.mjs`) peut
  faire échouer un déploiement si une table publique perd son RLS.
- **Toujours nettoyer les données de test** créées via `db query` avant de
  terminer une session (comptes de test remis à leur solde d'origine,
  `roulette_history`/`card_collection`/sessions de jeu de test supprimées) —
  cette session l'a fait systématiquement, à poursuivre.

---

## 6. Prochaines étapes suggérées (non commencées)

- Retirer les `console.log` de debug listés en §4.1, une fois confirmé que la
  section Skins Sur Mesure s'affiche bien en production pour l'utilisateur.
- Corriger les 3 erreurs `react-hooks/set-state-in-effect` pré-existantes pour
  faire repasser `npm run lint` au vert.
- Décider du sort de `maj-monumentale` : merge complet vers `main` (gros
  chantier, code divergé), abandon, ou maintien en parallèle assumé — dans ce
  dernier cas, clarifier la stratégie base de données (§2).
- Envisager le nettoyage des branches distantes visiblement obsolètes
  (`appels`, `floor-is-lava`, `nouveaux-jeux`, `saison-disney`,
  `saison-jurassic`) après vérification qu'elles sont bien mergées ou
  abandonnées.
- Pas de demande fonctionnelle en attente au moment de la rédaction de ce
  document — la dernière tâche (Cartes Zigzam) est livrée et poussée.
