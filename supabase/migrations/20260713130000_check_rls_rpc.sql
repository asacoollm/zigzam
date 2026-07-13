-- ============================================================
--  SÉCURITÉ — RPC d'audit RLS (garde-fou anti-régression)
--  ----------------------------------------------------------
--  Renvoie la liste des tables du schéma `public` dont le Row Level
--  Security est DÉSACTIVÉ (donc potentiellement accessibles publiquement
--  via la clé anon). En fonctionnement normal, la liste est VIDE.
--
--  Utilisée par `scripts/check-rls.mjs`, exécuté automatiquement avant
--  chaque build (`prebuild`) donc à chaque déploiement Vercel : si une
--  table oublie le RLS, le déploiement échoue.
--
--  Ne renvoie que des NOMS de tables (aucune donnée applicative). Lit
--  pg_catalog en `security definer` — la clé anon ne peut pas y accéder
--  directement, d'où le passage par cette fonction.
-- ============================================================

create or replace function public.check_rls_disabled()
returns table (table_name text)
language sql
security definer
set search_path = pg_catalog, public
as $$
  select c.relname::text
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'            -- tables ordinaires uniquement
    and c.relrowsecurity = false   -- RLS désactivé
  order by c.relname;
$$;

grant execute on function public.check_rls_disabled() to anon, authenticated;
