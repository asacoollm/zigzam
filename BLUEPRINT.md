# Zigzam — Blueprint du projet 🦓

Document de référence décrivant **l'état actuel** du projet Zigzam (branche `main`) :
une application web ludique destinée à une classe d'élèves (réseau social + jeux +
récompenses), construite par et pour un usage pédagogique.

> Ce blueprint est descriptif : il documente ce qui existe réellement dans le code
> à ce jour sur `main`, ainsi que les conventions à respecter pour les évolutions.
> Pour l'état des branches, les chantiers en cours et les prochaines étapes, voir
> **HANDOFF.md**.

---

## 1. Vision

Zigzam est un mini « univers » pour les élèves d'une classe : ils se connectent avec
un pseudo, personnalisent leur bonhomme (style _Fall Guys_), gagnent des **donuts** 🍩
et des **gemmes** 💎, et accèdent à différents modules (discussion, appels, actus,
mini-jeux, collection de cartes…). L'esthétique — surnommée **« Gaming Pop »** —
est volontairement colorée, arrondie et ludique (façon Fortnite/Brawl Stars adouci).

---

## 2. Stack technique

| Couche | Technologie |
|--------|-------------|
| Front | **React 19** + **Vite 8** (JSX, pas de TypeScript) |
| Routing | **react-router-dom 7** (`BrowserRouter`, routes déclaratives dans `App.jsx`) |
| Back / BDD | **Supabase** (PostgreSQL + PostgREST + RPC + Realtime + Storage) |
| Auth | **Maison** (pseudo + mot de passe bcrypt), via fonctions SQL `SECURITY DEFINER` — **pas** de Supabase Auth |
| Styles | CSS par composant/page + variables CSS globales (pas de framework UI, pas de Tailwind) |
| Police | **Fredoka** / **Fredoka One** (Google Fonts) |
| Déploiement | Vercel (`vercel.json` : build Vite → `dist/`) |

### Scripts npm

| Commande | Effet |
|----------|-------|
| `npm run dev` | Serveur de dev (HMR) — http://localhost:5173 |
| `npm run build` | `prebuild` (garde-fou RLS) puis build de production dans `dist/` |
| `npm run preview` | Prévisualise le build |
| `npm run lint` | ESLint (`eslint .`) |
| `npm run check:rls` | Vérifie qu'aucune table publique n'a le RLS désactivé |
| `npm run db:new <nom>` | Crée un fichier de migration timestampé |
| `npm run db:push` | Pousse les migrations locales vers la base **liée** (`supabase db push`) |
| `npm run db:pull` / `db:diff` / `db:status` | Utilitaires Supabase CLI |

### Variables d'environnement

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (anon) |

`.env` réel ignoré par git ; modèle dans `.env.example`. Redémarrer `npm run dev`
après toute modification du `.env` (Vite ne lit `VITE_*` qu'au démarrage).

Un fichier **`.supabase-token`** (jeton d'accès personnel Supabase, `sbp_…`, ignoré
par git) permet d'utiliser le Supabase CLI sans login interactif :
`export SUPABASE_ACCESS_TOKEN=$(tr -d ' \n\r' < .supabase-token)` avant toute
commande `supabase …`.

---

## 3. Architecture & arborescence (branche `main`)

```
src/
├── main.jsx                  # BrowserRouter > AuthProvider > SaisonProvider > CallProvider > App
├── App.jsx                   # Toutes les routes + gardes d'accès (voir §3.1)
├── index.css                 # Reset, palette (variables CSS), fond dégradé global « Gaming Pop »
├── saison-jurassic.css       # Thème visuel de la saison Jurassic Web (importé globalement)
├── saison-disney.css         # Thème visuel de la saison Zigzamland Paris (importé globalement)
├── context/
│   ├── AuthContext.jsx        # user, signIn/signOut/updateUser (session dans localStorage)
│   ├── SaisonContext.jsx      # saison active courante, diffusée en Realtime (broadcast)
│   └── CallContext.jsx        # état des appels audio/vidéo en cours (WebRTC)
├── lib/                       # TOUTE la logique métier + appels RPC (jamais de table en direct)
│   ├── supabase.js            # Client Supabase (persistSession: false — pas de Supabase Auth)
│   ├── auth.js                # login, complete_onboarding, save_avatar, buy_accessory
│   ├── avatar.js              # Catalogue de personnalisation (couleurs + accessoires + saisons)
│   ├── modules.js              # ~40 helpers RPC : Discuter, Actus, Contacts, Économie, Admin,
│   │                           #   Parental, Présence, Floor solo, Série, Boîtes, Bug reports,
│   │                           #   Saisons, Skins sur mesure…
│   ├── cartes.js               # Roulette + collection de Cartes Zigzam
│   ├── floorislava.js          # Moteur PUR (sans I/O) du mode Solo de Floor is Lava
│   ├── flavaMulti.js           # Moteur + RPC du mode Multijoueur (parties communes + bots)
│   ├── flavaVs.js              # Moteur + RPC du mode VS (1 contre 1, humain ou bot)
│   ├── floorChemins.js         # Générateur PUR de chemins pour le mode Chemins (mémoire)
│   ├── saison.js               # Aide au calcul « saison active / terminée »
│   ├── parental.js             # Contrôle parental côté client (blocage horaire/modules)
│   └── appels.js               # Signalisation WebRTC (appels audio/vidéo)
├── components/
│   ├── Backdrop.jsx            # Décor de fond partagé (anneaux 3D, boules, bonhommes flottants)
│   ├── FallGuy.jsx             # Bonhomme SVG personnalisable — LE composant d'avatar central
│   ├── Buddy.jsx                # FallGuy de l'utilisateur courant, animé (compagnon)
│   ├── avatarParts.jsx          # Dessins SVG de tous les accessoires (chapeaux, cheveux…)
│   ├── disneyHats.jsx / disneyFaces.jsx / disneyAnimals.jsx / disneyFull.jsx
│   │                            # Catalogue SVG exclusif de la saison Zigzamland Paris
│   ├── ZigzamCard.jsx           # Carte façon Pokémon (Cartes Zigzam Collectore)
│   ├── ZigzamLogo.jsx           # Logo « Zigzam » multicolore lettre par lettre
│   ├── OnlineWidget.jsx         # Widget « qui est en ligne » (coin de l'écran)
│   ├── Tutorial.jsx             # Tutoriel de bienvenue pas-à-pas (1re connexion)
│   ├── ParentalGuard.jsx / InactivityGuard.jsx / BirthdayModal.jsx / SaisonAnnounce.jsx
│   ├── ReportButton.jsx         # Bouton flottant « signaler un bug » (partout)
│   ├── CallView.jsx / IncomingCallModal.jsx / VoiceMessage.jsx
│   │                            # UI des appels et messages vocaux
│   ├── JurassicDecor.jsx / DisneyDecor.jsx
│   │                            # Décors de fond spécifiques aux saisons
│   └── Patator.jsx              # Élément décoratif/jeu annexe
└── pages/                      # 1 page = 1 route (sauf FloorMulti/FloorVs/FloorChemins,
                                 #   rendus à l'intérieur de FloorIsLava selon le mode choisi)
    ├── Login.jsx / Onboarding.jsx / Dashboard.jsx / Avatar.jsx
    ├── Discuter.jsx / Actualites.jsx / Contacts.jsx / Economie.jsx / Parametres.jsx
    ├── FloorIsLava.jsx          # Écran de sélection de mode + moteur Solo
    ├── FloorMulti.jsx           # Mode Multijoueur (partie commune, bots pilotés par l'hôte)
    ├── FloorVs.jsx              # Mode VS (1 contre 1, humain ou bot, plateau bleu/rose)
    ├── FloorChemins.jsx         # Mode Chemins (mémoire, solo, sans lave)
    ├── Roulette.jsx             # Roulette de Cartes Zigzam (5 🍩/tour)
    ├── Collection.jsx           # Grille des 57 Cartes Zigzam (possédées en couleur)
    ├── Serie.jsx / EpisodePlayer.jsx
    │                            # Série Zigzam (épisodes vidéo + propositions d'idées)
    ├── BoiteMystere.jsx         # Ouverture des boîtes mystères reçues
    └── Admin.jsx                # Panel admin (sections empilées, cf. §8.13)

supabase/
├── migrations/                 # ~40 fichiers timestampés, SOURCE DE VÉRITÉ du schéma
├── config.toml
└── schema.sql                  # Pointeur de doc — PAS la source de vérité (voir §6)

scripts/
└── check-rls.mjs               # Appelé par `prebuild` : échoue le build si une table
                                 #   publique n'a pas le RLS activé
```

### 3.1 Routes (`App.jsx`)

Toutes les routes protégées suivent le même garde : `!user || user.premiere_connexion`
→ redirection. `/admin` ajoute une vérification de rôle.

| Route | Accès | Composant |
|-------|-------|-----------|
| `/login` | non connecté | `Login` |
| `/onboarding` | connecté **et** `premiere_connexion = true` | `Onboarding` |
| `/dashboard` | connecté + onboarding terminé | `Dashboard` |
| `/avatar` | idem | `Avatar` |
| `/discuter` | idem | `Discuter` |
| `/actualites` | idem | `Actualites` |
| `/contacts` | idem | `Contacts` |
| `/economie` | idem | `Economie` |
| `/parametres` | idem | `Parametres` |
| `/floor-is-lava` | idem | `FloorIsLava` (sélecteur : Solo / Multijoueur / VS / Chemins) |
| `/serie`, `/serie/:episodeId` | idem | `Serie`, `EpisodePlayer` |
| `/boites` | idem | `BoiteMystere` |
| `/roulette` | idem | `Roulette` |
| `/collection` | idem | `Collection` |
| `/admin` | idem + `role ∈ {admin, superadmin}` | `Admin` |
| `*` | — | redirige vers `home` (calculé selon l'état) |

`home` = `/login` si déconnecté, `/onboarding` si `premiere_connexion`, sinon
`/dashboard`.

**Composants globaux montés en permanence** (hors `<Routes>`, dans `App.jsx`) :
`ParentalGuard`, `InactivityGuard`, `BirthdayModal` (si pas de `date_naissance`),
`OnlineWidget`, `ReportButton`, `SaisonAnnounce`.

---

## 4. Authentification & session

- **Pas de Supabase Auth.** Auth maison : un pseudo + un mot de passe haché en
  **bcrypt** (`pgcrypto`) côté base. La table `users` est en **RLS sans aucune
  policy**, donc inaccessible directement avec la clé anon : tout passe par des
  fonctions `SECURITY DEFINER`.
- **Session locale** : l'utilisateur connecté est stocké dans `localStorage`
  (clé `zigzam.user`) et exposé via `AuthContext` (`src/context/AuthContext.jsx`).
  - `signIn(user)` : stocke + met en contexte.
  - `signOut(message?)` : efface (message optionnel = déconnexion « pause » contrôle parental).
  - `updateUser(patch)` : fusionne un patch (ex. `{ avatar, donuts }`) et re-stocke.
- **Client Supabase** (`src/lib/supabase.js`) : `persistSession: false`,
  `autoRefreshToken: false`, `detectSessionInUrl: false` — évite toute machinerie
  GoTrue qui pourrait faire échouer la 1re requête sur certains appareils.
- **Onboarding** : à la 1re connexion, l'élève choisit un nouveau mot de passe et un
  **numéro à 4 chiffres unique** (identifiant « façon téléphone » entre élèves).
- **Inscription** : `/login` → code d'invitation (`validate_invite_code` →
  `signup_with_code`).

---

## 5. Rôles

Trois niveaux, colonne `users.role` (texte, pas de table séparée) :

- **`user`** — élève normal.
- **`admin`** — modère les actus, gère les signalements de bug.
- **`superadmin`** — un seul compte, **`Asacool`** (numéro `6767`) : tout ce que
  fait `admin`, plus la gestion des comptes/soldes, les codes d'invitation, les
  saisons, les boîtes mystères, la validation des skins sur mesure. **Toujours
  exclu** des systèmes de récompense compétitifs (Poupers sur `maj-monumentale`,
  Cartes Zigzam sur `main`) — jamais de « victoire » possible pour lui.

Le pattern de garde côté RPC, répété dans chaque fonction sensible (pas de helper
partagé) :

```sql
if (select role from public.users where id = p_admin) <> 'superadmin' then
  return jsonb_build_object('error', 'forbidden');
end if;
```

---

## 6. Modèle de données

> ⚠️ **La base de données est PARTAGÉE entre toutes les branches git.** Une seule
> instance Supabase existe ; `db push`/`db query` depuis n'importe quelle branche
> modifie la **même** base de production. Le schéma ci-dessous reflète donc l'état
> réel de la base, qui peut contenir des tables/colonnes issues de migrations
> écrites sur `maj-monumentale` même quand le code de `main` ne les utilise pas.
> Voir **HANDOFF.md §2** pour le détail de cette situation et comment l'éviter.

`supabase/schema.sql` est un simple pointeur de documentation — **les fichiers de
`supabase/migrations/*.sql` sont la seule source de vérité**, appliqués par ordre
chronologique (nom = `YYYYMMDDHHMMSS_description.sql`).

### 6.1 Table centrale `public.users`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid (PK) | `gen_random_uuid()` |
| `pseudo` | text unique | identifiant de connexion |
| `mot_de_passe` | text | haché bcrypt |
| `numero` | char(4) unique | choisi à l'onboarding |
| `role` | text | `user` \| `admin` \| `superadmin` |
| `donuts`, `gemmes` | integer | monnaies principales |
| `avatar` | jsonb | personnalisation (voir §8.1) |
| `premiere_connexion`, `tutoriel_vu` | boolean | |
| `date_naissance` | date | rappel via `BirthdayModal` si absent |
| `derniere_activite` | timestamptz | heartbeat « en ligne » |
| `flava_niveau` | int | niveau max atteint en Floor is Lava solo |
| `date_creation` | timestamptz | |

Colonnes présentes en base mais **non utilisées par le code de `main`**
(héritées de migrations `maj-monumentale`, voir avertissement ci-dessus) :
`burgers`, `vip_expire_at`, `last_tax_date`, `temps_connexion_secondes`.

### 6.2 Tables par domaine fonctionnel (actives sur `main`)

| Domaine | Tables |
|---------|--------|
| Discuter | `discussions`, `participants`, `messages`, `vocal_ecoutes` |
| Appels | `appels`, `appel_participants` |
| Actualités | `actualites`, `vues_actualites`, `commentaires` |
| Économie | `transactions` (historique de tous les gains/dépenses) |
| Contacts | `contacts` |
| Invitations & parental | `codes_invitation`, `controle_parental` |
| Série Zigzam | `serie_episodes`, `serie_propositions` |
| Boîtes mystères | `boites_mysteres`, `boites_templates`, `accessoires_catalogue` |
| Signalements | `bug_reports` |
| Saisons | `saisons`, `saison_skins` |
| Floor is Lava — Solo | *(aucune table — moteur 100 % client, seul `users.flava_niveau` persiste)* |
| Floor is Lava — Multi | `flava_sessions`, `flava_players` |
| Floor is Lava — VS | `flava_vs_sessions`, `flava_vs_players` |
| Floor is Lava — Chemins | *(aucune table — 100 % client, pas de sauvegarde)* |
| Skins sur mesure | `skins_sur_mesure` |
| Cartes Zigzam Collectore | `zigzam_cards`, `card_collection`, `roulette_history`, `card_notifications` |

**Convention systématique** pour toute nouvelle table : `enable row level security`
**sans aucune policy** → accès exclusivement via des fonctions `SECURITY DEFINER`
avec `grant execute on function … to anon, authenticated;`. Le script
`scripts/check-rls.mjs` (exécuté au `prebuild`) fait échouer le build Vercel si une
table publique n'a pas le RLS activé.

### 6.3 Fonctions RPC — inventaire par domaine

Toutes `language plpgsql security definer set search_path = public` (sauf
mention contraire), idempotentes (`create or replace function`). Liste complète
et à jour dans `src/lib/modules.js`, `src/lib/cartes.js`, `src/lib/flavaMulti.js`,
`src/lib/flavaVs.js` (chaque export JS correspond 1:1 à une RPC).

- **Auth/onboarding** : `login`, `complete_onboarding`, `save_avatar`, `buy_accessory`.
- **Discuter** : `create_discussion`, `join_discussion`, `leave_discussion`,
  `delete_discussion`, `add_participants`, `mark_read`, `get_discussions`,
  `get_public_discussions`, `get_messages`, `send_message`, `send_vocal_message`,
  `mark_vocal_ecoute`, `cleanup_vocaux`.
- **Actualités** : `get_actus`, `get_my_actus`, `create_actu`, `view_actu`,
  `get_comments`, `add_comment`, `delete_comment`.
- **Contacts** : `get_contacts`, `add_contact`, `remove_contact`, `search_users`.
- **Économie** : `exchange` (5🍩↔1💎), `send_value`, `get_transactions`.
- **Paramètres** : `change_password`, `change_pseudo`.
- **Présence** : `ping_activity`, `get_online_users`.
- **Contrôle parental** : `get_parental`, `set_parental`, `verify_parental_code`,
  `update_parental`.
- **Codes d'invitation** : `validate_invite_code`, `signup_with_code`,
  `create_invite_code`, `list_invite_codes`, `toggle_invite_code`.
- **Anniversaire** : `set_date_naissance`, `admin_birthdays_today`.
- **Admin (users/actus)** : `admin_list_users`, `admin_create_user`,
  `admin_set_balance`, `admin_delete_user`, `get_pending_actus`, `get_admin_actus`,
  `moderate_actu`, `set_user_role`, `reset_password`, `reset_numero`.
- **Signalements de bug** : `create_bug_report`, `admin_list_bug_reports`,
  `admin_update_bug_report`.
- **Série Zigzam** : `get_serie_visibility`, `admin_set_serie_publie`,
  `create_serie_proposition`, `admin_list_serie_propositions`,
  `admin_mark_serie_proposition_lu`, `admin_refuse_serie_proposition`.
- **Boîtes mystères** : `admin_create_boite_aleatoire`, `admin_create_boite_perso`,
  `admin_list_boites`, `get_my_boites`, `open_boite`.
- **Tutoriel / dashboard** : `mark_tutorial_done`, `get_badges`.
- **Saisons** : `get_saison_active`, `admin_list_saisons`, `admin_update_saison`,
  `admin_saison_stats`.
- **Skins sur mesure** : `get_my_custom_skins`, `admin_list_custom_skins`,
  `admin_create_custom_skin`, `admin_validate_custom_skin`.
- **Floor is Lava solo** : `get_flava_level`, `flava_win` (pas de donuts —
  retirés par une migration ultérieure, ne fait que persister le niveau max).
- **Floor is Lava multi** : `flava_join`, `flava_state`, `flava_move`,
  `flava_activate`, `flava_eliminate`, `flava_burn` (résurrection), `flava_leave`,
  `flava_start`, `flava_add_bot`, `flava_remove_bot`, `flava_set_bots`.
- **Floor is Lava VS** : `flava_vs_join_or_create` (matchmaking humain),
  `flava_vs_create_bot`, `flava_vs_state`, `flava_vs_move`, `flava_vs_bot_move`,
  `flava_vs_activate`, `flava_vs_bot_activate`, `flava_vs_leave`.
- **Cartes Zigzam** : `spin_roulette` (SECURITY DEFINER, anti-triche complet :
  débit, tirage, transfert de la carte IMPOSSIBLE, compensation), `get_my_cards`,
  `get_pending_card_notifications`, `admin_list_big_card_wins`.

### 6.4 Temps réel (Supabase Realtime)

Deux usages, tous deux en mode **broadcast** (pas besoin de policy RLS) :

1. **Chat** — canal `discussion:<id>`, événement `message`.
2. **Jeux synchronisés** — chaque session Floor is Lava (Multi/VS) a son canal
   dédié (`flava:session:<id>` / `flava-vs:session:<id>`), événement `sync`
   **sans payload** : c'est un simple signal « va rafraîchir ton état », le
   client authoritatif reste toujours la RPC `*_state`. Le plateau et la
   position de la lave sont **dérivés déterministement** d'un `seed` partagé
   (PRNG mulberry32) plutôt que transmis — évite tout problème de dérive.
3. **Saisons** — canal `zigzam:saison`, diffusion en direct des bascules
   activé/désactivé faites par le superadmin (`SaisonContext`).
4. **Présence en ligne** — canal `zigzam:online`, ping léger pour rafraîchir
   `OnlineWidget` sans recharger.

---

## 7. Système visuel « Gaming Pop »

Signature appliquée à **toutes** les pages.

### Palette (`src/index.css`)

| Variable | Couleur | Variante foncée | Variante claire |
|----------|---------|------------------|-------------------|
| `--rose` | `#ff4d8d` | `--rose-fonce #d6276b` | `--rose-clair #ffb3d6` |
| `--orange` | `#ff8c42` | `--orange-fonce #d9640f` | `--orange-clair #ffcb9e` |
| `--violet` | `#7c3aff` | `--violet-fonce #5a1fd4` | `--violet-clair #d6c2ff` |
| `--bleu` | `#00bfff` | `--bleu-fonce #009fe0` | `--bleu-clair #a8e8ff` |
| `--vert` | `#3dd68c` | `--vert-fonce #1f9d63` | `--vert-clair #b0f5cf` |

Neutres : `--texte #2b2350`, `--texte-doux #6b6191`, `--blanc`, `--erreur #ef4444`.
Dégradés : `--degrade-zigzam` (rose→violet→bleu, boutons), `--degrade-pop`
(rose→orange→violet→bleu, fonds).

### Ingrédients récurrents

- **Fond** : dégradé pastel + halos radiaux + trame de points (halftone) fixe.
- **Glassmorphism** : cartes `rgba(255,255,255,.5–.6)` + `backdrop-filter: blur(20px)
  saturate(160%)` + bordure claire + ombre violette diffuse.
- **`.stroke-title`** : titres avec contour blanc épais (`-webkit-text-stroke`) +
  ombre portée — police `Fredoka One`.
- **Boutons « pressables »** : ombre pleine décalée (`box-shadow: 0 6px 0 …`),
  qui se réduit au clic (`:active`) pour simuler l'enfoncement.
- **`<Backdrop />`** : décor partagé, allégé sous 640px, désactivé sous
  `prefers-reduced-motion`.
- Toutes les animations CSS respectent `prefers-reduced-motion: reduce`.

---

## 8. Modules détaillés

### 8.1 Avatar (`/avatar`, `src/lib/avatar.js`, `src/components/avatarParts.jsx`)

Forme du JSON `users.avatar` :

```jsonc
{
  "color": "violet",        // couleur du corps : unie, dégradé, motif, effet, ou saisonnière
  "hat": "crown" | null, "glasses": "sun" | null, "hair": "spiky" | null,
  "sport": "foot" | null, "animal": "dragon" | null, "face": "vampire" | null,
  "full": "fmickey" | "penpenkimono" | null,   // skin COMPLET, remplace tout le bonhomme
  "owned": ["hat:crown", "color:gold", "full:penpenkimono"]  // items payants/accordés acquis
}
```

- **Catégories** : Couleur, Chapeau, Lunettes, Cheveux, Sport, Animaux, Visage,
  Skins complets (`full`, remplace intégralement le rendu — ex. skins Disney,
  skins sur mesure). Tout dessiné en SVG, `viewBox="0 -24 120 192"`.
- **Onglets virtuels** dans `Avatar.jsx` : un par saison possédée (skins exclusifs
  gardés à vie même après la fin de la saison), un « ⭐ Skin Sur Mesure » si
  l'utilisateur a au moins un skin validé.
- **`FallGuy.jsx`** est LE point de rendu unique : accepte `avatar` (objet complet,
  prioritaire) ou `color` (usage décoratif simple). `role` affiche un badge
  admin/superadmin, `costume` ajoute des tenues décoratives pour les bonhommes du
  décor (`Backdrop`), `anim` pilote les animations (`idle`, `jump`, `walk`…).
- **Skins sur mesure** (`skins_sur_mesure`) : un skin créé à la demande pour un
  élève précis (SVG écrit dans `avatarParts.jsx`, registre `CUSTOM_FULL`) reste
  **invisible** pour son bénéficiaire tant que le superadmin ne l'a pas validé
  depuis `/admin` (`get_my_custom_skins` ne renvoie jamais les skins
  `en_attente`). La validation ajoute l'item à `avatar.owned` et prévient
  l'élève dans Discuter.

### 8.2 Dashboard (`/dashboard`)

En-tête glassmorphism (compagnon `Buddy` animé, pseudo, numéro, compteurs
🍩/💎), tuiles-modules avec pastilles de notification (`get_badges`), bannière
« boîte mystère reçue » conditionnelle, section règles de bonne conduite
rétractable, tutoriel de bienvenue à la 1re connexion (`Tutorial.jsx`).

Tuiles actuelles : Discuter, Actualités, Contacts, Avatar, Donuts & Gemmes,
**Roulette Zigzam**, Paramètres, Floor is Lava, Série Zigzam, + Admin (si rôle
admin/superadmin). *(La page Collection n'a pas de tuile dédiée — accessible
depuis un lien sur la page Roulette.)*

### 8.3 Discuter — messagerie temps réel

Discussions privées/groupe/publiques, messages persistants + **messages vocaux**
(upload Storage bucket `vocaux`, écoute trackée par `vocal_ecoutes`), suppression
par le créateur. Temps réel via broadcast (§6.4).

### 8.4 Appels — audio/vidéo WebRTC

`CallContext.jsx` + `lib/appels.js` : signalisation via tables `appels` /
`appel_participants`, UI dans `CallView.jsx` / `IncomingCallModal.jsx`.

### 8.5 Actualités

Fil type réseau social, post payant (10 🍩) avec photo (Storage bucket
`actualites`), modération admin (`en_attente`/`publie`/`refuse`), +2 🍩/vue
unique à l'auteur, commentaires.

### 8.6 Contacts / Économie / Paramètres

Contacts : ajout par numéro à 4 chiffres, recherche, lien direct vers Discuter.
Économie : solde, échange 5🍩↔1💎, dons par numéro, historique (`transactions`).
Paramètres : mot de passe, pseudo, contrôle parental, lien « revoir le tutoriel ».

### 8.7 Contrôle parental

Code parent à 4 chiffres (haché), durée max de session (alerte puis déconnexion
douce via `InactivityGuard`), tranche horaire, modules bloqués (tuiles grisées
🔒). Appliqué côté client (`lib/parental.js`, `ParentalGuard.jsx`) — jamais de
donnée sensible exposée sans RPC.

### 8.8 Série Zigzam

Épisodes vidéo (`serie_episodes`, publication togglable par le superadmin) +
propositions d'idées d'épisode par les élèves (`serie_propositions`, modérées
par l'admin, refus poli via message auto dans Discuter).

### 8.9 Boîtes mystères

Récompenses envoyées par le superadmin (aléatoires par niveau de rareté, ou
personnalisées) : donuts + gemmes + skin optionnel. Bannière dashboard tant que
non ouvertes.

### 8.10 Saisons

Système d'événements temporaires (`saisons`, `saison_skins`) : Jurassic Web 🦕 et
Zigzamland Paris 🏰 existent en base et en CSS (`saison-jurassic.css`,
`saison-disney.css`) mais **sont actuellement inactives** côté commutateur (état
`actif`/dates gérées par le superadmin dans `/admin`). Quand active, une saison
change le thème visuel en direct pour tout le monde (broadcast) et débloque des
skins/couleurs exclusifs achetables avec des gemmes, conservés à vie même après
la fin.

### 8.11 Floor is Lava 🌋 — 4 modes

Écran de sélection dans `FloorIsLava.jsx` (`mode: null|'solo'|'multi'|'vs'|'chemins'`).
Grille SVG-free (CSS Grid à deux couches superposées : `.flava__board` pour les
cases, `.flava__grid-overlay` pour les joueurs, jamais de décalage entre les
deux). Contrôles clavier (flèches/ZQSD + espace = saut) et tactile (glisser +
bouton SAUT).

- **🎮 Solo** (`floorislava.js`, 100 % client) : niveaux progressifs, vagues de
  lave (1 à 4 selon le palier de difficulté), zones à activer, sauvegarde du
  meilleur niveau (`flava_win`, plus de récompense en donuts).
- **👥 Multijoueur** (`flavaMulti.js` + `FloorMulti.jsx`) : une seule partie
  commune active à la fois, plateau déterministe (seed partagé), bots pilotables
  ajoutés en salle d'attente, résurrection (« brûlé » 5 s au lieu de mort
  définitive), victoire commune récompensée en donuts.
- **⚔️ VS** (`flavaVs.js` + `FloorVs.jsx`) : 1 contre 1 chronométré (60 s),
  plateau divisé en cases bleues/roses réparties aléatoirement, chacun active
  ses cases, contre un bot (niveaux de difficulté 1–9, vitesse et précision
  scalées) ou contre un humain (matchmaking automatique), +2🍩 au gagnant/+1
  chacun en cas d'égalité.
- **🧠 Chemins** (`floorChemins.js` + `FloorChemins.jsx`, 100 % client, aucune
  table) : chemin lumineux affiché puis masqué (délai décroissant selon le
  niveau), à reproduire de mémoire ; 3 vies ; pas de lave, pas de donuts.

### 8.12 Cartes Zigzam Collectore 🃏

- **57 cartes** (`zigzam_cards`) : 30 normales, 15 rares, 8 super rares, 3
  incroyables, **1 IMPOSSIBLE unique** (`unique_owner_id`, ne peut appartenir
  qu'à une seule personne à la fois). Skins générés à partir du catalogue
  d'avatar existant (couleur + chapeau + lunettes, tous distincts) — rendu
  direct par `FallGuy`, pas de nouveaux dessins.
- **`/roulette`** : 5 🍩/tour, `spin_roulette()` (SECURITY DEFINER, tout le
  calcul anti-triche côté serveur) — carte déjà possédée → 2 🍩 de compensation ;
  carte IMPOSSIBLE déjà détenue → transfert complet (retrait à l'ancien
  propriétaire, notifs des deux côtés via `card_notifications`, remises au
  prochain passage sur le dashboard) ; superadmin toujours exclu.
- **`/collection`** : grille des 57 cartes, badge ✓ sur les possédées, grisées
  sinon.
- **`ZigzamCard.jsx`** : cadre coloré par rareté (gris/bleu/violet/orange doré),
  effet holographique CSS sur Incroyable et IMPOSSIBLE (shine qui balaie +
  dégradé arc-en-ciel animé pour IMPOSSIBLE).
- **Admin** : section « Cartes Incroyable/IMPOSSIBLE gagnées » + génération
  d'une carte imprimable au format A6 (`window.print()` + `@media print`).

### 8.13 Admin (`/admin`)

Sections empilées dans `Admin.jsx`, chacune un composant dédié :
`SectionAnniversaires`, `SectionActus`, `SectionBugReports` (visibles par
`admin` et `superadmin`) ; puis, **superadmin uniquement** :
`SectionCustomSkins`, `SectionCartes`, `SectionCreerCompte`,
`SectionUtilisateurs`, `SectionCodes`, `SectionSerie`, `SectionPropositions`,
`SectionBoites`, `SectionSaisons`.

---

## 9. Conventions de code

- **JS/JSX uniquement** (pas de TypeScript). Composants fonctionnels + hooks.
  React Compiler actif — éviter de casser la mémoïsation manuelle existante
  (`useMemo`/`useCallback` avec des deps précises plutôt qu'un objet entier).
- **CSS par fichier** à côté du composant/page ; classes en **BEM léger**
  (`bloc__element--modifier`). Variables CSS globales dans `index.css`.
- **Langue** : UI et commentaires en **français**, ton enfantin/positif (emojis
  ok, sobrement).
- **Accès données** : toujours via une fonction RPC (jamais de table en direct,
  RLS oblige). Un helper JS par RPC dans `src/lib/*.js`, jamais d'appel
  `supabase.rpc()` direct depuis un composant de page.
- **Migrations** : un fichier par changement logique, nommé
  `YYYYMMDDHHMMSS_description.sql`, toujours idempotent (`create or replace
  function`, `create table if not exists`, `add column if not exists`).
  Toujours `grant execute … to anon, authenticated;` en fin de fichier pour
  chaque nouvelle fonction appelée depuis le client.
- **Superadmin** : jamais éligible aux systèmes de récompense compétitifs
  (roulette de cartes, Poupers sur `maj-monumentale`…) — vérifier `role <>
  'superadmin'` côté RPC, pas seulement côté client.
- **`FallGuy`** est la source de rendu unique de l'avatar : tout nouveau système
  qui a besoin d'afficher un bonhomme personnalisé (cartes, poupers…) doit le
  réutiliser plutôt que redessiner un SVG à la main.

---

## 10. Limites connues / dettes

Voir **HANDOFF.md** pour la liste vivante et datée des bugs connus et prochaines
étapes. Dettes structurelles stables :

- **Confiance au client** limitée par nature du modèle d'auth maison : `p_user`
  est fourni par le client sur presque toutes les RPC. Les calculs sensibles
  (prix, tirages, scores) sont bien faits côté serveur ; ce qui reste
  vulnérable est l'usurpation d'identité (`p_user` d'un autre) par un client
  qui aurait l'UUID de la victime — acceptable dans le cadre scolaire actuel.
- **Pas de tests automatisés** — toute vérification se fait manuellement
  (RPC via `curl`/`supabase db query`, rendu via Playwright ponctuel).
- **Bundle JS unique** > 500 kB (avertissement Vite au build) — pas de
  code-splitting mis en place.
- **Base de données partagée entre branches** (§6, HANDOFF.md §2) — le risque
  structurel le plus important actuellement.
