# Zigzam

Application React + Vite avec authentification maison (par pseudo) propulsée par Supabase.

## Stack

- **Front** : React 19 + Vite
- **Back / DB** : Supabase (PostgreSQL + PostgREST)
- **Auth** : maison, via des fonctions SQL `SECURITY DEFINER` (`login`, `complete_onboarding`) — les mots de passe sont hachés en bcrypt (`pgcrypto`), jamais stockés en clair.

## Prérequis

- Node.js 18+
- Un projet Supabase

## Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# puis remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
# (Supabase → Project Settings → API)

# 3. Lancer en développement
npm run dev
```

> ℹ️ Vite ne lit les variables `VITE_*` qu'au démarrage : **redémarre `npm run dev`** après toute modification du `.env`.

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase (`https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (anon / publishable), utilisée côté client |

Voir [`.env.example`](./.env.example). Le fichier `.env` réel est ignoré par git.

## Base de données

Le schéma (table `users` + fonctions d'auth) est dans [`supabase/schema.sql`](./supabase/schema.sql).
Pour l'initialiser : **Supabase → SQL Editor → New query**, colle le contenu du fichier puis **Run**.

Il crée aussi trois comptes de test (mot de passe : `zigzam`) :

| Pseudo | Rôle |
|--------|------|
| `lucas` | user |
| `emma` | user |
| `maitre` | admin |

> ⚠️ `pgcrypto` (`crypt`/`gen_salt`) est installé dans le schéma `extensions` sur Supabase : les fonctions d'auth doivent donc déclarer `set search_path = public, extensions`.

## Scripts

| Commande | Effet |
|----------|-------|
| `npm run dev` | Serveur de développement (HMR) |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualise le build |
| `npm run lint` | ESLint |
