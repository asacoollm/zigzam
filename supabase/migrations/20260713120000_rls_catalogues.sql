-- ============================================================
--  SÉCURITÉ — Activation du Row Level Security sur les tables catalogue
--  ----------------------------------------------------------
--  Alerte Supabase (RLS désactivé = tables accessibles publiquement).
--  Trois tables « catalogue » avaient été créées SANS `enable row level
--  security`. Avec la clé anon (publique, embarquée dans le front), elles
--  étaient donc LISIBLES **et MODIFIABLES** directement via la Data API :
--    - accessoires_catalogue : prix de la boutique
--    - boites_templates      : contenu / probabilités des boîtes mystères
--    - saison_skins          : catalogue des skins de saison
--  Un attaquant pouvait p. ex. mettre tous les prix à 0 ou trafiquer les
--  probabilités de loot.
--
--  Correctif : on applique le MÊME patron que toutes les autres tables du
--  projet (users, transactions, saisons, …) :
--     enable row level security  +  AUCUNE policy
--  => plus aucun accès direct possible avec la clé anon/authenticated.
--
--  L'application continue de fonctionner : ces tables ne sont lues/écrites
--  QUE par des fonctions `security definer` (buy_accessory, open_boite,
--  admin_*, get_saison_active, …). Ces fonctions s'exécutent avec les droits
--  de leur propriétaire (postgres) et CONTOURNENT le RLS — elles ne sont donc
--  pas affectées. Le superadmin agit exclusivement via ces RPC `admin_*`.
--
--  Idempotent : `enable row level security` est sans effet si déjà actif.
-- ============================================================

alter table public.accessoires_catalogue enable row level security;
alter table public.boites_templates      enable row level security;
alter table public.saison_skins          enable row level security;

-- Ceinture + bretelles : on révoque aussi les GRANT directs sur les rôles API.
-- (Le RLS bloque déjà tout ; ceci retire en plus le privilège de table, de
--  sorte que la table n'apparaisse même plus dans la Data API.)
revoke all on public.accessoires_catalogue from anon, authenticated;
revoke all on public.boites_templates      from anon, authenticated;
revoke all on public.saison_skins          from anon, authenticated;
