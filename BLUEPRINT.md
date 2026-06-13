# Zigzam — Blueprint du projet 🦓

Document de référence décrivant **l'état actuel** du projet Zigzam : une application
web ludique destinée à une classe d'élèves (réseau social + jeux + récompenses),
construite par et pour un usage pédagogique.

> Ce blueprint est descriptif : il documente ce qui existe réellement dans le code
> à ce jour, ainsi que les conventions à respecter pour les évolutions.

---

## 1. Vision

Zigzam est un mini « univers » pour les élèves d'une classe : ils se connectent avec
un pseudo, personnalisent leur bonhomme (style _Fall Guys_), gagnent des **donuts** 🍩
et des **gemmes** 💎, et accèdent à différents modules (discussion, jeux, agenda…).
L'esthétique est volontairement colorée, douce et joueuse.

---

## 2. Stack technique

| Couche | Technologie |
|--------|-------------|
| Front | **React 19** + **Vite 8** (JSX, pas de TypeScript) |
| Routing | **react-router-dom 7** (`BrowserRouter`) |
| Back / BDD | **Supabase** (PostgreSQL + PostgREST + RPC) |
| Auth | **Maison** (pseudo + mot de passe), via fonctions SQL `SECURITY DEFINER` |
| Styles | CSS par composant/page + variables CSS globales (pas de framework UI) |
| Police | **Fredoka** (Google Fonts) |

### Scripts npm

| Commande | Effet |
|----------|-------|
| `npm run dev` | Serveur de dev (HMR) — http://localhost:5173 |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualise le build |
| `npm run lint` | ESLint |

### Variables d'environnement

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (anon) |

`.env` réel ignoré par git ; modèle dans `.env.example`. Redémarrer `npm run dev`
après toute modification du `.env` (Vite ne lit `VITE_*` qu'au démarrage).

---

## 3. Architecture & arborescence

```
src/
├── main.jsx                 # Point d'entrée : BrowserRouter > AuthProvider > App
├── App.jsx                  # Définition des routes + gardes d'accès
├── index.css                # Reset, palette (variables CSS), fond dégradé global
├── App.css                  # (legacy template Vite, NON importé)
├── context/
│   └── AuthContext.jsx       # Contexte d'auth : user, signIn/signOut/updateUser
├── lib/
│   ├── supabase.js           # Client Supabase (createClient)
│   ├── auth.js               # Appels RPC : login, complete_onboarding, save_avatar, buy_accessory
│   └── avatar.js             # Catalogue de personnalisation (couleurs + accessoires)
├── components/
│   ├── Backdrop.jsx/.css      # Décor de fond partagé (anneaux 3D, boules, bonhommes)
│   ├── FallGuy.jsx           # Bonhomme SVG personnalisable (couleur + accessoires)
│   └── ZigzamLogo.jsx/.css    # Logo « Zigzam » multicolore lettre par lettre
└── pages/
    ├── Login.jsx/.css        # Connexion (pseudo + mot de passe)
    ├── Onboarding.jsx/.css   # 1re connexion : nouveau mdp + numéro à 4 chiffres
    ├── Dashboard.jsx/.css    # Accueil : en-tête utilisateur + grille de modules
    └── Avatar.jsx/.css       # Module de personnalisation du bonhomme

supabase/
└── schema.sql               # Table users + fonctions SQL (à exécuter dans Supabase)
```

### Routes (`App.jsx`)

| Route | Accès | Composant |
|-------|-------|-----------|
| `/login` | non connecté | `Login` |
| `/onboarding` | connecté **et** `premiere_connexion = true` | `Onboarding` |
| `/dashboard` | connecté **et** onboarding terminé | `Dashboard` |
| `/avatar` | connecté **et** onboarding terminé | `Avatar` |
| `/discuter` | connecté + onboarding | `Discuter` (messagerie temps réel) |
| `/actualites` | connecté + onboarding | `Actualites` |
| `/contacts` | connecté + onboarding | `Contacts` |
| `/economie` | connecté + onboarding | `Economie` (donuts/gemmes) |
| `/parametres` | connecté + onboarding | `Parametres` |
| `/admin` | connecté + onboarding + **`role === 'admin'`** | `Admin` |
| `*` | — | redirige selon l'état (`home`) |

La destination « maison » est calculée dans `App.jsx` :
non connecté → `/login` ; `premiere_connexion` → `/onboarding` ; sinon → `/dashboard`.

---

## 4. Authentification & session

- **Pas de Supabase Auth.** Auth maison : un pseudo + un mot de passe haché en
  **bcrypt** (`pgcrypto`) côté base. La table `users` est en **RLS sans aucune policy**,
  donc inaccessible directement avec la clé anon : tout passe par des fonctions
  `SECURITY DEFINER`.
- **Session locale** : l'utilisateur connecté est stocké dans `localStorage`
  (`zigzam.user`) et exposé via `AuthContext`.
  - `signIn(user)` : stocke + met en contexte.
  - `signOut()` : efface.
  - `updateUser(patch)` : fusionne un patch (ex. `{ avatar, gemmes }`) et re-stocke.
- **Onboarding** : à la 1re connexion, l'élève choisit un nouveau mot de passe et un
  **numéro à 4 chiffres unique** (sert d'identifiant « façon téléphone » entre élèves).

---

## 5. Modèle de données

### Table `public.users`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid (PK) | `gen_random_uuid()` |
| `pseudo` | text unique | identifiant de connexion |
| `mot_de_passe` | text | **haché bcrypt**, jamais en clair |
| `numero` | char(4) unique | choisi à l'onboarding, regex `^[0-9]{4}$` |
| `role` | text | `'user'` \| `'admin'` |
| `donuts` | integer | défaut `10` |
| `gemmes` | integer | défaut `1` |
| `avatar` | jsonb | défaut `{}` — personnalisation (voir §7) |
| `premiere_connexion` | boolean | défaut `true` |
| `date_creation` | timestamptz | `now()` |

### Fonctions SQL (RPC)

| Fonction | Rôle | Retour |
|----------|------|--------|
| `login(p_pseudo, p_password)` | Vérifie les identifiants | ligne user (sans le hash) ou vide |
| `complete_onboarding(p_user_id, p_new_password, p_numero)` | Change mdp + fixe le numéro | `'ok'` \| `'numero_pris'` \| `'numero_invalide'` |
| `save_avatar(p_user_id, p_avatar)` | Enregistre l'avatar (changements gratuits) | l'avatar enregistré (jsonb) |
| `buy_accessory(p_user_id, p_category, p_item_id, p_price)` | Achète/équipe un accessoire payant | `{ ok, gemmes, avatar }` \| `{ error, gemmes }` |

Toutes sont `security definer` avec `set search_path` (incluant `extensions` quand
`pgcrypto` est utilisé) et `grant execute … to anon, authenticated`.

### Tables des modules (migration `…_modules.sql`)

Toutes en RLS sans policy ; accès via RPC `SECURITY DEFINER` uniquement.

| Table | Rôle |
|-------|------|
| `discussions` | fil de discussion (titre, type `prive`/`public`, créateur) |
| `participants` | membres d'une discussion (+ `lu_le` pour le non-lu) |
| `messages` | messages persistants |
| `actualites` | actus (statut `en_attente`/`publie`/`refuse`) |
| `vues_actualites` | 1 vue par (actu, user) — anti-double-comptage |
| `commentaires` | commentaires d'actus |
| `transactions` | historique donuts/gemmes (échanges, dons, gains) |
| `contacts` | carnet de contacts (user → contact) |

~30 fonctions RPC associées (cf. `src/lib/modules.js` côté client). Les fonctions
admin (`admin_*`, `moderate_actu`, `get_pending_actus`) **vérifient `role='admin'`
côté serveur** via l'`p_admin` passé. **Temps réel du chat** : Supabase Realtime en
mode **broadcast** (canal `discussion:<id>`) — ne nécessite pas de policy RLS ;
l'historique vient de `get_messages`.

> **Pour appliquer une évolution du schéma** : Supabase → SQL Editor → coller
> `supabase/schema.sql` → Run. Les `create or replace function` sont idempotents.

### Comptes de test (mdp `zigzam`)

`lucas` (user), `emma` (user), `maitre` (admin).

---

## 6. Système visuel (charte Zigzam)

Signature appliquée à **toutes** les pages.

### Palette (`src/index.css`)

| Variable | Couleur |
|----------|---------|
| `--rose` | `#ff4d8d` |
| `--orange` | `#ff8c42` |
| `--violet` | `#7c3aff` |
| `--bleu` | `#00bfff` |
| `--vert` | `#3dd68c` |
| `--degrade-zigzam` | `linear-gradient(90deg, #ff4d8d, #7c3aff, #00bfff)` |

Neutres : `--texte #2b2350`, `--texte-doux #6b6191`, `--blanc`.

### Ingrédients récurrents

- **Fond** : dégradé pastel rose → violet → bleu + halos radiaux (`body`).
- **Glassmorphism** : cartes `rgba(255,255,255,.5–.55)` + `backdrop-filter: blur(20px)`
  + bordure claire + ombre violette.
- **Boutons d'action** : fond `--degrade-zigzam`, animation de `background-position` au survol.
- **`<Backdrop />`** : décor partagé — anneaux colorés 3D (conic-gradient masqué +
  transforms perspective), boules radiales (sphères), bonhommes Fall Guys flottants.
  Allégé en dessous de 640px et désactivé sous `prefers-reduced-motion`.
- **`<ZigzamLogo size="sm|md|lg" />`** : « Zigzam » coloré lettre par lettre (animation rebond).
- **`<FallGuy color avatar className />`** : le bonhomme (voir §7).

Toutes les animations respectent `prefers-reduced-motion: reduce`.

---

## 7. Module Avatar (personnalisation du bonhomme)

Page `/avatar`, accessible depuis la tuile **Avatar** du dashboard.

### Forme du JSON `avatar` (colonne `users.avatar`)

```jsonc
{
  "color": "violet",       // id de couleur (uni, dégradé, motif ou effet) ou hex legacy
  "hat": "crown" | null,
  "glasses": "sun" | null,
  "hair": "spiky" | null,
  "sport": "foot" | null,
  "animal": "dragon" | null,
  "face": "vampire" | null,
  "owned": ["hat:crown", "color:gold"]  // items PAYANTS achetés ("catégorie:id")
}
```

**7 catégories** (`src/lib/avatar.js`), prix **1 à 5 💎** : **Couleur** (unies gratuites
rose/violet/bleu/vert + premium : dégradés rainbow/sunset/galaxy/ocean, motifs
stars/dots/stripes/camo, effets gold/silver/holo — rendus via `<defs>` gradients/patterns
dans `FallGuy`), **Chapeau**, **Lunettes**, **Cheveux** (dessinés sous les chapeaux),
**Sport**, **Animaux** (compagnon au sol ou sur l'épaule), **Visage** (bouches). Tous
**dessinés en SVG** dans `src/components/avatarParts.jsx` ; le sélecteur montre un
mini-`FallGuy` réel. `viewBox="0 -24 120 192"`.

**Animations** (`FallGuy` prop `anim` + `FallGuy.css`) : `idle` (oscillation), `jump`
(saut de joie), `walk` (dandinement). Le composant **`Buddy`** = le bonhomme de l'élève
animé, qui saute quand son solde augmente et se dandine à chaque navigation — utilisé
comme « compagnon » dans le dashboard (≥88px) et les pages.

`normalizeAvatar()` (dans `src/lib/avatar.js`) fusionne toujours avec `DEFAULT_AVATAR`
(corps violet, aucun accessoire) pour tolérer un `{}` venant de la base.

### Catalogue (`src/lib/avatar.js` — source de vérité)

- **8 couleurs de corps** : rose, orange, jaune, vert, bleu, violet, rouge, blanc.
- **4 catégories**, chacune **3 gratuits + 4 payants** (gemmes) :

| Catégorie | Gratuits | Payants (prix 💎) |
|-----------|----------|-------------------|
| **Chapeau** | Casquette, Cotillon, Diplôme | Haut-de-forme (10), Chapeau de paille (12), Couronne (15), Auréole (20) |
| **Lunettes** | Rondes, Carrées, Soleil | Étoiles (10), Cœurs (12), Masque de ski (15), Lunettes 3D (18) |
| **Cheveux** | Piquants, Mèche, Au bol | Crête (12), Afro (15), Cheveux longs (18), Arc-en-ciel (25) |
| **Sport** | Football, Basket, Tennis | Ping-pong (8), Skate (10), Boxe (12), Médaille (20) |

Chaque item = `{ id, label, glyph, price }`. `glyph` = icône (emoji) du sélecteur.

### Rendu sur le bonhomme (`FallGuy.jsx`)

`FallGuy` accepte soit `color` (usage décoratif simple, rétro-compatible), soit `avatar`
(objet complet, prioritaire). Couches rendues, dans l'ordre :

- **Cheveux** : dessinés en SVG, **derrière** le visage (`<Hair id />`).
- **Lunettes** : dessinées en SVG, **devant** les yeux (`<Glasses id />`).
- **Chapeau** & **Sport** : rendus en **emoji** (`<text>`), respectivement posé sur la
  tête et tenu près de la main droite — le glyph vient du catalogue.

`viewBox="0 0 120 168"`, corps en haricot centré x=60, yeux à `cy=60`.

### Logique d'interaction (`Avatar.jsx`)

1. **Couleur** ou **accessoire gratuit/déjà acquis** ou **retrait** (re-clic) →
   mise à jour locale optimiste + `saveAvatar()` (pas de débit).
2. **Accessoire payant non possédé** :
   - gemmes insuffisantes → l'accessoire est **grisé + désactivé** (toast d'info).
   - gemmes suffisantes → **popup de confirmation** (coût + solde restant) →
     `buyAccessory()` qui **débite les gemmes**, ajoute à `owned`, équipe, et renvoie
     `{ gemmes, avatar }`. Le contexte est mis à jour (`updateUser`).
3. Tout changement met à jour `user` (contexte + localStorage), donc le bonhomme se
   reflète **immédiatement** sur le Dashboard ; sur le **Login**, le bonhomme reprend
   l'avatar du dernier élève connu sur l'appareil (`getStoredUser()?.avatar`).

---

## 8. Dashboard

En-tête glassmorphism : **compagnon `Buddy`** (bonhomme animé de l'élève),
pseudo, numéro, compteurs 🍩/💎, déconnexion. Puis une grille de **tuiles-modules**
(liseré coloré par module) avec **pastilles de notification** (rouge) sur Discuter et
Actualités, alimentées par `get_badges` (messages non lus / actus non vues).

Tuiles : Discuter 💬 → `/discuter`, Actualités 📰 → `/actualites`, Contacts 👥 →
`/contacts`, Avatar 🎨 → `/avatar`, Donuts & Gemmes 🍩 → `/economie`, Paramètres ⚙️ →
`/parametres`, Floor is Lava 🌋 (placeholder), et **Admin 🛡️ → `/admin`** (uniquement
si `role === 'admin'`).

---

## 9. Conventions de code

- **JS/JSX uniquement** (pas de TypeScript). Composants fonctionnels + hooks.
- **CSS par fichier** à côté du composant/page ; classes en **BEM léger**
  (`bloc__element--modifier`). Variables CSS globales dans `index.css`.
- **Langue** : UI et commentaires en **français**, ton enfantin/positif (emojis ok).
- **Accès données** : toujours via une fonction RPC (jamais de table en direct,
  RLS oblige). Les helpers vivent dans `src/lib/auth.js`.
- **Source de vérité métier partagée** : dans `src/lib/*` (ex. catalogue avatar),
  importée à la fois par les pages et les composants de rendu.

---

## 10. Limites connues / dettes

- **Confiance au client** : `p_user_id` et `p_price` sont fournis par le client
  (cohérent avec le modèle d'auth maison existant). Un client malveillant pourrait
  passer un prix erroné ou un autre `user_id`. À durcir si le projet sort du cadre
  scolaire (prix côté serveur, vérification d'identité par session signée).
- `src/App.css` est un reliquat du template Vite, **non importé** — peut être supprimé.
- Pas de tests automatisés.
- Sauvegardes d'avatar « gratuites » optimistes : en cas d'échec réseau, l'UI affiche
  un toast mais conserve l'état local (best-effort).

---

## 11. Modules implémentés & roadmap

Implémentés (pages `src/pages/`, helpers `src/lib/modules.js`) :

- 💬 **Discuter** — discussions privées/groupe/publiques, temps réel (broadcast),
  messages persistants, suppression par le créateur, on ne peut que quitter.
- 📰 **Actualités** — post (2 gratuites puis 10 🍩), validation admin, +2 🍩/vue
  unique à l'auteur, commentaires.
- 👥 **Contacts** — ajout par numéro (récupère pseudo+avatar), recherche, lancer une
  discussion (`navigate('/discuter', { state: { startNumero } })`).
- 🍩 **Économie** — solde, échange 5🍩↔1💎, dons par numéro, historique (`transactions`).
- ⚙️ **Paramètres** — mot de passe, pseudo, numéro (lecture seule), contrôle parental (placeholder).
- 🛡️ **Admin** — création de comptes, liste users, modération d'actus, édition soldes, suppression.

À venir : 🌋 **Floor is Lava** (mini-jeu, placeholder), section **contrôle parental**.

À chaque nouveau module : route gardée dans `App.jsx`, tuile dans `Dashboard.jsx`,
helpers RPC dans `src/lib/modules.js`, charte visuelle (§6).
